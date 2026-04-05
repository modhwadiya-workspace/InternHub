from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Tuple
import os
from dotenv import load_dotenv
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import httpx
import json
from datetime import datetime

load_dotenv()

# Logging setup - include timestamps and full details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create a query logger for debugging
query_logger = logging.getLogger("query_debug")

# Environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "internhub")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

# Validate API key
if not GROQ_API_KEY:
    logger.warning("⚠️ GROQ_API_KEY not set - backend will have limited functionality")
else:
    logger.info("✅ GROQ_API_KEY loaded")

# Database schema information
SCHEMA_CONTEXT = """You are a SQL expert for InternHub. This chat interface is ADMIN-ONLY.

Use this PostgreSQL schema in public:

1) departments
- id SERIAL PRIMARY KEY
- name TEXT NOT NULL
- created_at TIMESTAMP

2) users
- id UUID PRIMARY KEY
- name TEXT NOT NULL
- email TEXT UNIQUE NOT NULL
- password TEXT NOT NULL (hashed; never expose)
- role TEXT NOT NULL ('admin', 'manager', 'intern')
- department_id INTEGER FK -> departments.id
- created_at TIMESTAMPTZ
- gender TEXT
- contact_number TEXT UNIQUE

3) interns
- id UUID PRIMARY KEY
- user_id UUID UNIQUE FK -> users.id
- college TEXT NOT NULL
- joining_date DATE
- status TEXT NOT NULL
- date_of_birth DATE (private; never expose)
- degree TEXT
- created_at TIMESTAMPTZ

4) announcements
- id UUID PRIMARY KEY
- title TEXT NOT NULL
- message TEXT NOT NULL
- created_by UUID FK -> users.id
- created_by_role TEXT NOT NULL
- department_id INTEGER FK -> departments.id
- created_at TIMESTAMPTZ

5) leaves
- id UUID PRIMARY KEY
- user_id UUID FK -> users.id
- start_date DATE NOT NULL
- end_date DATE NOT NULL
- reason TEXT NOT NULL
- leave_type TEXT NOT NULL
- status TEXT NOT NULL DEFAULT 'pending'
- created_at TIMESTAMPTZ

6) tasks
- id UUID PRIMARY KEY
- title TEXT NOT NULL
- description TEXT
- assigned_to UUID FK -> users.id
- created_by UUID FK -> users.id
- due_date DATE
- status TEXT NOT NULL DEFAULT 'todo'
- priority TEXT NOT NULL DEFAULT 'medium'
- group_id UUID
- completed_at TIMESTAMPTZ
- created_at TIMESTAMPTZ

7) password_reset_otps
- security table, forbidden for this chat

Strict generation rules:
- Return exactly one valid PostgreSQL SELECT query, or INVALID_QUERY.
- Use public.<table> names.
- Use JOINs to show human-friendly values (names, emails, department names).
- You may use IDs in JOIN/WHERE, but never select IDs in output.
- Never select: password, date_of_birth, id, user_id, department_id, created_by, assigned_to, group_id, otp, expiry.
- Never query password_reset_otps.
- If the question is unclear/off-topic/security-related, return INVALID_QUERY.
"""

TRAINING_EXAMPLES = """Examples:

Q: List all departments
A: SELECT d.name
    FROM public.departments d
    ORDER BY d.name;

Q: Show active interns with department
A: SELECT u.name, u.email, u.contact_number, i.college, i.joining_date, i.status, i.degree, d.name AS department
    FROM public.interns i
    JOIN public.users u ON i.user_id = u.id
    LEFT JOIN public.departments d ON u.department_id = d.id
    WHERE LOWER(i.status) = 'active'
    ORDER BY u.name;

Q: Show all managers
A: SELECT u.name, u.email, u.gender, u.contact_number, d.name AS department
    FROM public.users u
    LEFT JOIN public.departments d ON u.department_id = d.id
    WHERE LOWER(u.role) = 'manager'
    ORDER BY u.name;

Q: Recent announcements
A: SELECT a.title, a.message, u.name AS creator_name, a.created_by_role, d.name AS department, a.created_at
    FROM public.announcements a
    JOIN public.users u ON a.created_by = u.id
    LEFT JOIN public.departments d ON a.department_id = d.id
    ORDER BY a.created_at DESC
    LIMIT 20;

Q: Pending leave requests
A: SELECT u.name, u.email, l.start_date, l.end_date, l.leave_type, l.reason, l.status, l.created_at
    FROM public.leaves l
    JOIN public.users u ON l.user_id = u.id
    WHERE LOWER(l.status) = 'pending'
    ORDER BY l.created_at DESC;

Q: Overdue high priority tasks
A: SELECT t.title, t.description, assignee.name AS assigned_to_name, creator.name AS created_by_name, t.due_date, t.status, t.priority
    FROM public.tasks t
    JOIN public.users assignee ON t.assigned_to = assignee.id
    JOIN public.users creator ON t.created_by = creator.id
    WHERE LOWER(t.priority) = 'high'
      AND t.due_date < CURRENT_DATE
      AND LOWER(t.status) <> 'done'
    ORDER BY t.due_date ASC;

Q: Count interns by college
A: SELECT i.college, COUNT(*) AS intern_count
    FROM public.interns i
    GROUP BY i.college
    ORDER BY intern_count DESC;

If question is unclear, unrelated, or asks for secret/security data: INVALID_QUERY
"""

app = FastAPI(title="Vanna AI Backend", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection helper
def get_db_connection():
    """Get PostgreSQL connection"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

# Validation helpers
def is_gibberish(question: str) -> bool:
    """Check if input looks like gibberish (random characters without clear intent)"""
    question_lower = question.lower()
    
    # Too short random strings
    if len(question) < 3:
        return True
    
    # Strings with no vowels (very likely gibberish)
    vowels = "aeiouAEIOU"
    vowel_count = sum(1 for char in question if char in vowels)
    if vowel_count == 0 and len(question) > 4:
        return True
    
    # Check for common SQL/data keywords
    keywords = ["select", "show", "list", "get", "find", "where", "count", "total", 
                "department", "intern", "user", "announcement", "manager", "active", "leave", "task",
                "all", "recent", "by", "total", "many", "how many", "who", "what",
                "when", "which", "top", "最新", "部", "用户", "实习"]
    
    has_keyword = any(keyword in question_lower for keyword in keywords)
    return not has_keyword

def results_is_valid(results: List[Dict[str, Any]]) -> bool:
    """Check if we got meaningful results"""
    return isinstance(results, list) and len(results) >= 0

# Pydantic models
class QueryRequest(BaseModel):
    question: str
    max_results: Optional[int] = 100

class QueryResponse(BaseModel):
    question: str
    sql: Optional[str] = None
    results: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

def validate_sql_safety(sql: str) -> Tuple[bool, str]:
    """Validate SQL doesn't access forbidden tables or columns"""
    sql_upper = sql.upper()
    
    # Check for forbidden tables
    forbidden_tables = ["password_reset_otps", "password_reset_otp"]
    for table in forbidden_tables:
        if table.upper() in sql_upper:
            return False, f"Cannot query {table} - this is forbidden for security reasons"
    
    # Check for password column selection
    if "PASSWORD" in sql_upper and "SELECT" in sql_upper:
        # Allow password in WHERE clauses but not in SELECT
        parts = sql_upper.split("SELECT")
        if len(parts) > 1:
            select_part = parts[1].split("FROM")[0] if "FROM" in parts[1] else parts[1]
            if "PASSWORD" in select_part:
                return False, "Cannot select password field - security policy"
    
    return True, ""

def generate_sql_from_question(question: str) -> str:
    """Use Groq to generate SQL from natural language"""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured")
    
    try:
        system_prompt = """You generate safe PostgreSQL SELECT queries for InternHub admin analytics.

    Output policy:
    - Output only SQL or INVALID_QUERY.
    - No markdown and no explanation.

    Security policy:
    - Never query password_reset_otps.
    - Never select: password, date_of_birth, id, user_id, department_id, created_by, assigned_to, group_id, otp, expiry.
    - IDs are allowed only for joins and filters.
    - Prefer human-readable output columns (name, email, department, status, date).
    """
        
        user_message = f"""{SCHEMA_CONTEXT}

{TRAINING_EXAMPLES}

User Question: {question}

GENERATE ONLY the SQL query. No markdown, no explanation, no additional text.
If you cannot safely answer or the question is unclear: return "INVALID_QUERY" """

        # Call Groq API directly via httpx
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 500,
            "temperature": 0.1  # Very low temperature for strict adherence to rules
        }
        
        with httpx.Client() as client:
            response = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_msg = response.text
                logger.error(f"Groq error ({response.status_code}): {error_msg}")
                response.raise_for_status()
            
            result = response.json()
        
        # Log full LLM response for debugging
        llm_response = result["choices"][0]["message"]["content"].strip()
        query_logger.info(f"[USER QUERY] {question}")
        query_logger.info(f"[LLM RESPONSE - FULL] {llm_response}")
        
        sql = llm_response
        
        # Clean markdown if present
        if "```" in sql:
            parts = sql.split("```")
            sql = parts[1] if len(parts) > 1 else sql
            if sql.startswith("sql"):
                sql = sql[3:]
            sql = sql.strip()
        
        query_logger.info(f"[SQL GENERATED] {sql}")
        logger.info(f"Generated SQL: {sql}")
        
        # Validate SQL safety
        is_safe, safety_msg = validate_sql_safety(sql)
        if not is_safe:
            logger.warning(f"SQL validation failed: {safety_msg}")
            query_logger.warning(f"[SECURITY_VIOLATION] {safety_msg}")
            query_logger.warning(f"[REJECTED_SQL] {sql}")
            return "INVALID_QUERY"
        
        return sql
    except httpx.HTTPError as e:
        logger.error(f"Groq API error: {e}")
        raise Exception(f"Failed to generate SQL: {str(e)}")
    except Exception as e:
        logger.error(f"Error generating SQL: {e}")
        raise

# Endpoints
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Vanna backend is running",
        "has_vanna": True
    }

@app.post("/chat", response_model=QueryResponse)
async def chat(request: QueryRequest):
    """Handle natural language questions and return SQL + results"""
    try:
        question = request.question.strip()
        timestamp = datetime.now().isoformat()
        
        query_logger.info(f"\n{'='*80}")
        query_logger.info(f"[{timestamp}] NEW QUERY REQUEST")
        query_logger.info(f"[QUESTION] {question}")
        
        if not question:
            error_msg = "Please ask a question about departments, users, interns, announcements, leaves, or tasks."
            query_logger.info(f"[REJECTED] Empty question")
            return QueryResponse(
                question=question,
                sql=None,
                results=None,
                error="❌ Please ask a question about departments, users, interns, announcements, leaves, or tasks."
            )

        # Check for gibberish input
        if is_gibberish(question):
            error_msg = "❌ Please refine your query. Ask about: departments, users, interns, announcements, leaves, or tasks. Example: 'Show pending leaves' or 'List overdue tasks'."
            query_logger.warning(f"[GIBBERISH] {question}")
            query_logger.info(f"[RESPONSE] ERROR: {error_msg}\n")
            return QueryResponse(
                question=question,
                sql=None,
                results=None,
                error=error_msg
            )

        logger.info(f"Processing question: {question}")

        # Generate SQL from natural language using Groq
        try:
            sql = generate_sql_from_question(question)
            query_logger.info(f"[SQL_CLEAN] {sql}")
        except Exception as e:
            error_msg = "❌ Could not understand your question. Please refine your query."
            logger.error(f"SQL generation error: {e}")
            query_logger.error(f"[ERROR] SQL generation failed: {str(e)}")
            query_logger.info(f"[RESPONSE] ERROR: {error_msg}\n")
            return QueryResponse(
                question=question,
                sql=None,
                results=None,
                error=error_msg
            )
        
        if not sql or sql.strip() == "" or "INVALID_QUERY" in sql:
            error_msg = "❌ Could not understand your question. Try asking: 'Show all departments', 'List active interns', 'How many users', etc."
            query_logger.warning(f"[INVALID_SQL] {sql}")
            query_logger.info(f"[RESPONSE] ERROR: {error_msg}\n")
            return QueryResponse(
                question=question,
                sql=None,
                results=None,
                error=error_msg
            )

        # Execute SQL
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Execute with limit - remove trailing semicolon first
            exec_sql = sql.rstrip(';').strip()
            if "LIMIT" not in exec_sql.upper():
                exec_sql = f"{exec_sql} LIMIT {request.max_results}"
            
            query_logger.info(f"[EXECUTING] {exec_sql}")
            cursor.execute(exec_sql)
            
            # Fetch results
            results = []
            if cursor.description:
                rows = cursor.fetchall()
                results = [dict(row) for row in rows]
            
            cursor.close()
            conn.close()
            
            logger.info(f"Query returned {len(results)} rows")
            query_logger.info(f"[ROWS_RETURNED] {len(results)}")
            
            # Check if results are empty
            if results_is_valid(results):
                if len(results) == 0:
                    msg = "ℹ️ No data found for your query. Try a different question."
                    query_logger.info(f"[RESPONSE] NO DATA: {msg}")
                    query_logger.info(f"{'='*80}\n")
                    return QueryResponse(
                        question=question,
                        sql=sql,
                        results=[],
                        error=msg
                    )
                else:
                    query_logger.info(f"[RESPONSE] SUCCESS: {len(results)} rows returned")
                    query_logger.info(f"[DATA_PREVIEW] {json.dumps(results[0], default=str)}")
                    query_logger.info(f"{'='*80}\n")
                    return QueryResponse(
                        question=question,
                        sql=sql,
                        results=results,
                        error=None
                    )
            
        except Exception as e:
            error_msg = f"❌Error executing query. Please try a different question."
            logger.error(f"SQL execution error: {e}")
            query_logger.error(f"[EXECUTION_ERROR] {str(e)}")
            query_logger.info(f"[RESPONSE] ERROR: {error_msg}")
            query_logger.info(f"{'='*80}\n")
            return QueryResponse(
                question=question,
                sql=sql,
                results=None,
                error=error_msg
            )
    
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"❌ Unexpected error. Please try again."
        logger.error(f"Unexpected error: {e}")
        query_logger.error(f"[UNEXPECTED_ERROR] {str(e)}")
        query_logger.info(f"[RESPONSE] UNEXPECTED: {error_msg}\n")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Vanna AI Backend",
        "version": "1.0",
        "endpoints": [
            "/health - Health check",
            "POST /chat - Chat with natural language questions",
            "/docs - API documentation"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
