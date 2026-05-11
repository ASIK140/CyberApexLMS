-- This script creates a restricted database user for the application
-- Run this as a superuser (e.g., postgres)

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'sa_lms_app') THEN
        CREATE USER sa_lms_app WITH PASSWORD 'sa_lms_password';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE cyberapex_lms_db TO sa_lms_app;
GRANT USAGE ON SCHEMA public TO sa_lms_app;

-- Grant permissions for existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sa_lms_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sa_lms_app;

-- Ensure future tables also have correct permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sa_lms_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO sa_lms_app;

-- Note: To fully test RLS, the application should connect as sa_lms_app.
-- Owners and Superusers bypass RLS by default.
