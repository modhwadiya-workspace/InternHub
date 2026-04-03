from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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
SCHEMA_CONTEXT = """You are a SQL expert for an internship management system.

Database Tables:
1. departments - id (SERIAL PK), name (TEXT), created_at (TIMESTAMP)
2. users - id (UUID PK), name (TEXT), email (TEXT), password (TEXT), role (TEXT like 'admin','manager','user'), department_id (INT FK), created_at (TIMESTAMP), gender (TEXT), contact_number (TEXT)
3. interns - id (UUID PK), user_id (UUID FK to users), college (TEXT), joining_date (DATE), status (TEXT), date_of_birth (DATE), degree (TEXT), created_at (TIMESTAMP)
4. announcements - id (UUID PK), title (TEXT), message (TEXT), created_by (UUID FK to users), created_by_role (TEXT), department_id (INT FK to departments), created_at (TIMESTAMP)

Rules:
- Use public schema prefix
- Return only valid SQL, no markdown
- Use JOINs for related data
- Add LIMIT when appropriate
- Filter by active status where relevant

⚠️ IMPORTANT - Sensitive Fields Handling:

DO USE IN WHERE/JOIN CLAUSES (filtering and relationships):
  - users.id (join with interns, announcements)
  - interns.user_id (join interns with users)
  - announcements.created_by (join to get creator info)
  - departments.id (join for department names)

NEVER SELECT IN RESULTS:
  - users.password (security - never expose)
  - interns.date_of_birth (privacy)
  - id columns: users.id, interns.id, departments.id, announcements.id
  - interns.user_id (redundant if user info shown)
  - announcements.created_by (show creator name instead via JOIN)

EXAMPLES OF CORRECT USAGE:
- Show interns with departments: Use JOIN on departments.id but don't SELECT it
- Get announcement creators: JOIN to users table and SELECT u.name, not a.created_by"""

# Training examples
TRAINING_EXAMPLES = """Examples of CORRECT queries (no sensitive fields in SELECT):

Q: "List all departments" 
A: SELECT name FROM public.departments ORDER BY name;

Q: "Show active interns"
A: SELECT u.name, u.email, u.contact_number, i.college, i.joining_date, i.status 
   FROM public.interns i 
   JOIN public.users u ON i.user_id = u.id 
   WHERE i.status = 'active';

Q: "Interns with their department"
A: SELECT u.name, u.email, i.college, i.status, d.name as department 
   FROM public.interns i 
   JOIN public.users u ON i.user_id = u.id 
   LEFT JOIN public.departments d ON u.department_id = d.id;

Q: "Count interns by college"
A: SELECT college, COUNT(*) as intern_count 
   FROM public.interns 
   GROUP BY college;

Q: "Show managers"
A: SELECT name, email, gender, contact_number 
   FROM public.users 
   WHERE role = 'manager';

Q: "Recent announcements"
A: SELECT a.title, a.message, u.name as creator, u.email, a.created_at 
   FROM public.announcements a 
   JOIN public.users u ON a.created_by = u.id 
   ORDER BY a.created_at DESC LIMIT 10;

IMPORTANT RULES:
- ONLY generate SQL if the question is clear and about: departments, users, interns, announcements, managers, admins, or employees
- If the question is gibberish, random characters, or unclear: return "INVALID_QUERY"
- If you cannot understand the question or it doesn't relate to the data: return "INVALID_QUERY"
- Do NOT guess or make up interpretations for unclear questions"""

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
                "department", "intern", "user", "announcement", "manager", "active", 
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

def generate_sql_from_question(question: str) -> str:
    """Use Groq to generate SQL from natural language"""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured")
    
    try:
        prompt = f"""{SCHEMA_CONTEXT}

{TRAINING_EXAMPLES}

Generate SQL for: {question}
Return ONLY the SQL query, nothing else."""

        # Call Groq API directly via httpx
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 500,
            "temperature": 0.3  # Lower temperature for stricter responses
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
            error_msg = "Please ask a question about departments, interns, users, or announcements."
            query_logger.info(f"[REJECTED] Empty question")
            return QueryResponse(
                question=question,
                sql=None,
                results=None,
                error="❌ Please ask a question about departments, interns, users, or announcements."
            )

        # Check for gibberish input
        if is_gibberish(question):
            error_msg = "❌ Please refine your query. Ask about: departments, interns, users, or announcements. Example: 'Show all active interns' or 'List departments'"
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
            error_msg = f"❌ Error executing query. Please try a different question."
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
