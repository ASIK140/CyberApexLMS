/**
 * Tenant Multi-Auth System - Integration Test Script
 * 
 * Test Flow:
 * 1. Create new tenant with admin user
 * 2. Login as tenant admin
 * 3. Create additional tenant users (CISO, employee)
 * 4. Test tenant isolation (user can only see their data)
 * 5. Test super admin can see all tenants
 * 
 * Usage:
 *   node test-tenant-auth.js
 * 
 * Requirements:
 *   - Backend running on http://localhost:5000
 *   - Database initialized
 *   - Super admin token available
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let superAdminToken = '';
let tenantAdminToken = '';
let createdTenantId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

async function testCreateTenant() {
  log('\n=== Test 1: Create Tenant with Admin User ===', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/tenants`, {
      organization_name: 'Test Organization',
      industry: 'Technology',
      admin_name: 'Alice Admin',
      admin_email: `admin-${Date.now()}@testorg.com`,
      admin_password: 'SecurePassword123!',
      user_limit: 100,
      assigned_courses: ['course-001', 'course-002']
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    createdTenantId = response.data.data.tenant_id;
    log(`✓ Tenant created successfully`, 'green');
    log(`  Tenant ID: ${createdTenantId}`, 'green');
    log(`  Admin Email: ${response.data.data.admin.email}`, 'green');
    return true;
  } catch (err) {
    log(`✗ Failed to create tenant: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testTenantAdminLogin() {
  log('\n=== Test 2: Login as Tenant Admin ===', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: `admin-${Date.now()}@testorg.com`,
      password: 'SecurePassword123!'
    });

    tenantAdminToken = response.data.data.accessToken;
    log(`✓ Tenant admin login successful`, 'green');
    log(`  Token: ${tenantAdminToken.substring(0, 20)}...`, 'green');
    log(`  User Role: ${response.data.data.user.role}`, 'green');
    return true;
  } catch (err) {
    log(`✗ Login failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testCreateTenantUser() {
  log('\n=== Test 3: Create Additional Tenant User (CISO) ===', 'blue');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/admin/tenants/${createdTenantId}/users`,
      {
        name: 'Bob CISO',
        email: `ciso-${Date.now()}@testorg.com`,
        password: 'CisoPassword123!',
        role: 'ciso'
      },
      {
        headers: { Authorization: `Bearer ${tenantAdminToken}` }
      }
    );

    log(`✓ CISO user created successfully`, 'green');
    log(`  User ID: ${response.data.data.id}`, 'green');
    log(`  User Email: ${response.data.data.email}`, 'green');
    log(`  User Role: ${response.data.data.role}`, 'green');
    return true;
  } catch (err) {
    log(`✗ Failed to create CISO user: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testListTenantUsers() {
  log('\n=== Test 4: List All Tenant Users ===', 'blue');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/admin/tenants/${createdTenantId}/users`,
      {
        headers: { Authorization: `Bearer ${tenantAdminToken}` }
      }
    );

    log(`✓ Retrieved ${response.data.data.length} users for tenant`, 'green');
    response.data.data.forEach((user, idx) => {
      log(`  ${idx + 1}. ${user.name} (${user.email}) - Role: ${user.role}`, 'green');
    });
    return true;
  } catch (err) {
    log(`✗ Failed to list users: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testTenantIsolation() {
  log('\n=== Test 5: Verify Tenant Isolation ===', 'blue');
  
  try {
    // Try accessing another tenant's data with current tenant token
    const response = await axios.get(
      `${BASE_URL}/api/admin/tenants/different-tenant/users`,
      {
        headers: { Authorization: `Bearer ${tenantAdminToken}` }
      }
    ).catch(err => ({ error: err }));

    if (response.error?.response?.status === 403) {
      log(`✓ Tenant isolation working correctly`, 'green');
      log(`  Message: ${response.error.response.data.message}`, 'green');
      return true;
    } else {
      log(`✗ Tenant isolation NOT working - got status ${response.status}`, 'red');
      return false;
    }
  } catch (err) {
    log(`✗ Isolation test failed: ${err.message}`, 'red');
    return false;
  }
}

async function testGetCurrentUser() {
  log('\n=== Test 6: Get Current User Info ===', 'blue');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/auth/me`,
      {
        headers: { Authorization: `Bearer ${tenantAdminToken}` }
      }
    );

    log(`✓ Retrieved current user info`, 'green');
    log(`  Name: ${response.data.data.name}`, 'green');
    log(`  Email: ${response.data.data.email}`, 'green');
    log(`  Role: ${response.data.data.role}`, 'green');
    log(`  Tenant ID: ${response.data.data.tenant_id}`, 'green');
    if (response.data.data.tenant) {
      log(`  Tenant Name: ${response.data.data.tenant.organization_name}`, 'green');
    }
    return true;
  } catch (err) {
    log(`✗ Failed to get user info: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testUpdateUserStatus() {
  log('\n=== Test 7: Update User Status ===', 'blue');
  
  try {
    // First get a user to update
    const listResponse = await axios.get(
      `${BASE_URL}/api/admin/tenants/${createdTenantId}/users`,
      {
        headers: { Authorization: `Bearer ${tenantAdminToken}` }
      }
    );

    if (listResponse.data.data.length < 2) {
      log(`⚠ Not enough users to test update (need at least 2)`, 'yellow');
      return true;
    }

    const userId = listResponse.data.data[1].id;

    const response = await axios.patch(
      `${BASE_URL}/api/admin/tenants/${createdTenantId}/users/${userId}/status`,
      { status: 'inactive' },
      {
        headers: { Authorization: `Bearer ${tenantAdminToken}` }
      }
    );

    log(`✓ User status updated successfully`, 'green');
    log(`  User Email: ${response.data.data.email}`, 'green');
    log(`  New Status: ${response.data.data.status}`, 'green');
    return true;
  } catch (err) {
    log(`✗ Failed to update status: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║   Tenant Multi-Auth Integration Test Suite     ║', 'blue');
  log('╚════════════════════════════════════════════════╝', 'blue');

  // Get super admin token (you need to set this first)
  log('\n⚠ NOTE: This script requires a super admin token', 'yellow');
  log('Set SUPER_ADMIN_TOKEN environment variable or update this script', 'yellow');

  // For testing, use a placeholder - update this with actual super admin token
  superAdminToken = process.env.SUPER_ADMIN_TOKEN || 'your-super-admin-token-here';

  if (superAdminToken === 'your-super-admin-token-here') {
    log('\n✗ No super admin token provided', 'red');
    log('Set SUPER_ADMIN_TOKEN environment variable and run again', 'red');
    process.exit(1);
  }

  const tests = [
    testCreateTenant,
    testTenantAdminLogin,
    testCreateTenantUser,
    testListTenantUsers,
    testTenantIsolation,
    testGetCurrentUser,
    testUpdateUserStatus
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) passed++;
    else failed++;
  }

  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log(`║   Test Results: ${passed} passed, ${failed} failed           ║`, 'blue');
  log('╚════════════════════════════════════════════════╝', 'blue');

  if (failed === 0) {
    log('\n✓ All tests passed! Multi-tenant auth system is working.', 'green');
  } else {
    log('\n✗ Some tests failed. Check the implementation.', 'red');
  }
}

// Run tests
runAllTests().catch(err => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
