-- ──────────────────────────────────────────────────────────
-- InternHub Database Schema
-- One-click initialization script for PostgreSQL
-- only for development and testing purposes. Not for production use.
-- ──────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables to ensure a clean slate (in reverse dependency order)
DROP TABLE IF EXISTS public.password_reset_otps CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.interns CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- ──────────────────────────────────────────────────────────
-- 1. Departments Table
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ──────────────────────────────────────────────────────────
-- 2. Users Table
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin', 'manager', 'intern'
    department_id INTEGER,
    gender TEXT,
    contact_number TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) 
        REFERENCES public.departments (id) ON DELETE SET NULL
);

-- ──────────────────────────────────────────────────────────
-- 3. Interns Table
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.interns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    college TEXT NOT NULL,
    joining_date DATE,
    status TEXT NOT NULL, -- 'active', 'onboarding', 'completed'
    date_of_birth DATE,
    degree TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT interns_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users (id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- 4. Announcements Table
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_by_role TEXT NOT NULL,
    department_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) 
        REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT announcements_department_id_fkey FOREIGN KEY (department_id) 
        REFERENCES public.departments (id) ON DELETE SET NULL
);

-- ──────────────────────────────────────────────────────────
-- 5. Leaves Table
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    leave_type TEXT NOT NULL, -- 'sick', 'casual', 'other'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users (id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- 6. Tasks Table
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL,
    created_by UUID NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'completed'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    group_id UUID,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT tasks_assigned_to_fk FOREIGN KEY (assigned_to) 
        REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT tasks_created_by_fk FOREIGN KEY (created_by) 
        REFERENCES public.users (id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- 7. Password Reset OTPs Table
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.password_reset_otps (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ──────────────────────────────────────────────────────────
-- Initial Seed Data
-- ──────────────────────────────────────────────────────────

-- Insert Default Departments
INSERT INTO public.departments (name) VALUES 
('JAVA'), 
('PYTHON'), 
('HR'), 
('MARKETING');

-- Insert Default Admin User
-- Password is 'Admin@123' (hashed using bcrypt)
INSERT INTO public.users (name, email, password, role, contact_number) VALUES 
('Administrator', 'admin@internhub.com', '$2a$12$6/hD7601V7mR/p98W86NLuU8R4P8O1/Y.fG6/jK3zRjO1O1r/H6W.', 'admin', '0000000000');
