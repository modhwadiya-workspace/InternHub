-- Enable UUID extension in internhub database
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- NOTE FOR AI/analytics integrations:
-- `public.users.password` stores a password hash and must never be exposed.
-- `public.password_reset_otps` is operational security data and must never be queried by chat/reporting features.

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- stores hashed password values only
    role TEXT NOT NULL,
    department_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    gender TEXT,
    contact_number TEXT UNIQUE,
    CONSTRAINT users_department_fk FOREIGN KEY (department_id)
        REFERENCES public.departments(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- 3. Interns Table
CREATE TABLE IF NOT EXISTS public.interns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    college TEXT NOT NULL,
    joining_date DATE,
    status TEXT NOT NULL,
    date_of_birth DATE,
    degree TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT interns_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE
);

-- 4. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_by_role TEXT NOT NULL,
    department_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT announcements_user_fk FOREIGN KEY (created_by)
        REFERENCES public.users(id)
        ON DELETE CASCADE,
    CONSTRAINT announcements_department_fk FOREIGN KEY (department_id)
        REFERENCES public.departments(id)
        ON DELETE SET NULL
);

-- 5. Password Reset OTPs Table
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL,
    otp VARCHAR NOT NULL,
    expiry TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    leave_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT leaves_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- 7. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL,
    created_by UUID NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    group_id UUID,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT tasks_assigned_to_fk FOREIGN KEY (assigned_to)
        REFERENCES public.users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT tasks_created_by_fk FOREIGN KEY (created_by)
        REFERENCES public.users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Normalize schema: contact number should only live in users table
ALTER TABLE public.interns
DROP COLUMN IF EXISTS contact_number;
