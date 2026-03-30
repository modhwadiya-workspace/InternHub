-- Enable UUID extension in internhub database
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    password TEXT NOT NULL,
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
    contact_number TEXT UNIQUE NOT NULL,
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
