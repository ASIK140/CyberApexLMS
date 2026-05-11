/**
 * Database Seeding Script - Creates Constant Test Users
 * 
 * This script creates:
 * - Super Admin (role: super_admin)
 * - Tenant Admin (role: tenant_admin with tenant)
 * - CISO (role: ciso within tenant)
 * - Employee (role: employee within tenant)
 * - Individual Student (role: student)
 * 
 * All credentials are CONSTANT and will persist across database resets
 * 
 * Usage:
 *   node seed-test-users.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { connectDB } = require('./dist/config/database');
const { User, Tenant, IndividualStudent } = require('./dist/models');

const testUsers = {
  superAdmin: {
    id: 'user-super-admin-001',
    name: 'Super Administrator',
    email: 'admin@cyberapex-lms.com',
    password: 'SuperAdmin@123',
    role: 'super_admin',
    tenant_id: null,
    status: 'active'
  },
  tenantAdmin: {
    id: 'user-tenant-admin-001',
    name: 'Tenant Administrator',
    email: 'tenant-admin@company.com',
    password: 'TenantAdmin@123',
    role: 'tenant_admin',
    tenant_id: 'tenant-company-001',
    status: 'active'
  },
  ciso: {
    id: 'user-ciso-001',
    name: 'Chief Information Security Officer',
    email: 'ciso@company.com',
    password: 'Ciso@123',
    role: 'ciso',
    tenant_id: 'tenant-company-001',
    status: 'active'
  },
  employee: {
    id: 'user-employee-001',
    name: 'Employee User',
    email: 'employee@company.com',
    password: 'Employee@123',
    role: 'employee',
    tenant_id: 'tenant-company-001',
    status: 'active'
  }
};

const testTenant = {
  tenant_id: 'tenant-company-001',
  organization_name: 'Test Company Inc.',
  industry: 'Technology',
  admin_email: 'tenant-admin@company.com',
  secondary_email: 'support@company.com',
  plan_type: 'Professional',
  user_limit: 100,
  subscription_status: 'active',
  status: 'active',
  assigned_courses: ['course-001', 'course-002', 'course-003']
};

const testStudent = {
  student_id: 'student-individual-001',
  login_id: 'student@cyberapex-lms.com',
  name: 'Individual Student',
  email: 'student@cyberapex-lms.com',
  password_hash: null, // Will be hashed
  service_status: 'running',
  created_at: new Date(),
  updated_at: new Date()
};

async function seedDatabase() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║    CyberApex LMS - Test User Seeding Script        ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    // Connect to database
    console.log('📱 Connecting to database...');
    await connectDB();
    console.log('✓ Database connected\n');

    // Clear existing test data (optional - uncomment to reset)
    // console.log('🗑️  Clearing existing test users...');
    // await User.destroy({ where: {} });
    // await Tenant.destroy({ where: {} });
    // await IndividualStudent.destroy({ where: {} });
    // console.log('✓ Existing data cleared\n');

    // 1. Create Tenant
    console.log('Creating Test Tenant...');
    const [tenant, created] = await Tenant.findOrCreate({
      where: { tenant_id: testTenant.tenant_id },
      defaults: testTenant
    });

    if (created) {
      console.log(`✓ Tenant created: ${tenant.organization_name} (ID: ${tenant.tenant_id})`);
    } else {
      console.log(`✓ Tenant already exists: ${tenant.organization_name}`);
    }

    // 2. Create Test Users
    console.log('\nCreating Test Users...');
    const users = Object.entries(testUsers);
    
    for (const [key, userData] of users) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const [user, created] = await User.findOrCreate({
          where: { email: userData.email.toLowerCase() },
          defaults: {
            ...userData,
            password: hashedPassword,
            email: userData.email.toLowerCase()
          }
        });

        if (created) {
          console.log(`✓ ${key.toUpperCase()} created:`);
          console.log(`  Email: ${userData.email}`);
          console.log(`  Password: ${userData.password}`);
          console.log(`  Role: ${userData.role}`);
          if (userData.tenant_id) {
            console.log(`  Tenant ID: ${userData.tenant_id}`);
          }
        } else {
          console.log(`✓ ${key.toUpperCase()} already exists: ${userData.email}`);
          
          // Update password if needed (in case seed is run multiple times)
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await user.update({ password: hashedPassword });
        }
      } catch (err) {
        console.error(`✗ Error creating ${key}:`, err.message);
      }
    }

    // 3. Create Individual Student
    console.log('\nCreating Individual Student...');
    try {
      const hashedStudentPassword = await bcrypt.hash('Student@123', 10);
      
      const [student, created] = await IndividualStudent.findOrCreate({
        where: { email: testStudent.email.toLowerCase() },
        defaults: {
          ...testStudent,
          email: testStudent.email.toLowerCase(),
          password_hash: hashedStudentPassword
        }
      });

      if (created) {
        console.log(`✓ STUDENT created:`);
        console.log(`  Email: ${testStudent.email}`);
        console.log(`  Login ID: ${testStudent.login_id}`);
        console.log(`  Password: Student@123`);
      } else {
        console.log(`✓ STUDENT already exists: ${testStudent.email}`);
        
        // Update password if needed
        const hashedStudentPassword = await bcrypt.hash('Student@123', 10);
        await student.update({ password_hash: hashedStudentPassword });
      }
    } catch (err) {
      console.error('✗ Error creating student:', err.message);
    }

    // Print Summary
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║              TEST CREDENTIALS SUMMARY              ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log('📧 SUPER ADMIN:');
    console.log(`   Email:    admin@cyberapex-lms.com`);
    console.log(`   Password: SuperAdmin@123\n`);

    console.log('🏢 TENANT ADMIN:');
    console.log(`   Email:    tenant-admin@company.com`);
    console.log(`   Password: TenantAdmin@123`);
    console.log(`   Tenant:   Test Company Inc. (tenant-company-001)\n`);

    console.log('🔒 CISO (Chief Information Security Officer):');
    console.log(`   Email:    ciso@company.com`);
    console.log(`   Password: Ciso@123`);
    console.log(`   Tenant:   Test Company Inc.\n`);

    console.log('👤 EMPLOYEE:');
    console.log(`   Email:    employee@company.com`);
    console.log(`   Password: Employee@123`);
    console.log(`   Tenant:   Test Company Inc.\n`);

    console.log('🎓 STUDENT:');
    console.log(`   Email:    student@cyberapex-lms.com`);
    console.log(`   Password: Student@123\n`);

    console.log('✓ Database seeding completed successfully!\n');
    process.exit(0);

  } catch (err) {
    console.error('✗ Seeding failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
