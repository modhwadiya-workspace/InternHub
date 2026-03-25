-- Create users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department_id INTEGER,
    gender VARCHAR(10),
    college VARCHAR(255)
);

-- Insert a test user (password: 'password123')
INSERT INTO users (name, email, password, role, department_id, gender, college)
VALUES ('Test User', 'test@example.com', 'password123', 'student', 1, 'male', 'Test College');