-- Enable UUID extension
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
-- older one
CREATE TABLE IF NOT EXISTS public.interns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    college TEXT NOT NULL,
    contact_number TEXT UNIQUE NOT NULL,
    joining_date DATE,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
 
    CONSTRAINT interns_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE
);
 
-- 4. Announcements Table
-- older one
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


-- new schema 

CREATE EXTENSION IF NOT EXISTS pgcrypto;
 
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 
    title text NOT NULL,
    message text NOT NULL,
 
    created_by uuid NOT NULL,
    created_by_role text NOT NULL,
 
    department_id uuid,
 
    created_at timestamptz NOT NULL DEFAULT now(),
 
    CONSTRAINT fk_created_by
    FOREIGN KEY (created_by)
    REFERENCES public.users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
 
-- Table: public.interns
 
-- DROP TABLE IF EXISTS public.interns;
 
CREATE TABLE IF NOT EXISTS public.interns
(
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    college text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    contact_number text COLLATE pg_catalog."default" NOT NULL,
    joining_date date,
    status text COLLATE pg_catalog."default" NOT NULL,
    date_of_birth date,
    degree text COLLATE pg_catalog."default",
    CONSTRAINT interns_pkey PRIMARY KEY (id),
    CONSTRAINT interns_contact_number_key UNIQUE (contact_number),
    CONSTRAINT interns_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
)
 
TABLESPACE pg_default;
 
ALTER TABLE IF EXISTS public.interns
    OWNER to postgres;

-- forget password table

CREATE TABLE password_reset_otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL,
    otp VARCHAR NOT NULL,
    expiry TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);