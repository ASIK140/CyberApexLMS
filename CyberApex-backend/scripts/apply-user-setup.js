const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // Connect as superuser first
  });

  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, 'setup-db-user.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Restricted user sa_lms_app created and permissions granted.');
  } catch (err) {
    console.error('❌ Failed to setup DB user:', err.message);
  } finally {
    await client.end();
  }
}

run();
