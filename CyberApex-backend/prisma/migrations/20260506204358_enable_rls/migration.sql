-- Enable Row Level Security
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- Create Policies for "users"
CREATE POLICY tenant_isolation_users ON "users"
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Create Policies for "enrollments"
CREATE POLICY tenant_isolation_enrollments ON "enrollments"
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Create Policies for "lesson_progress"
CREATE POLICY tenant_isolation_lesson_progress ON "lesson_progress"
  FOR ALL
  USING (
    current_setting('app.current_role', true) = 'super_admin'
    OR enrollment_id IN (
      SELECT id FROM "enrollments" WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID
    )
  );

-- Create Policies for "certificates"
CREATE POLICY tenant_isolation_certificates ON "certificates"
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Create Policies for "audit_logs"
CREATE POLICY tenant_isolation_audit_logs ON "audit_logs"
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Create dedicated app database user (Optional but recommended in SKILL)
-- We'll just ensure the policies are applied for now as per the Task 1.1 scope.
