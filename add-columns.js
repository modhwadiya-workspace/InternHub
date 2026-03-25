const payload = {
  type: "run_sql",
  args: {
    source: "internhub",
    sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender text; ALTER TABLE users ADD COLUMN IF NOT EXISTS college text;",
    cascade: false
  }
};

fetch("http://localhost:8080/v2/query", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": "myadminsecretkey",
  },
  body: JSON.stringify(payload),
})
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
