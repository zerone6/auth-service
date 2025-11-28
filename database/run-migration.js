#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection from environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'auth_user',
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  const migrationFile = path.join(__dirname, 'migrations', '002_add_excluded_schools.sql');

  console.log('Reading migration file:', migrationFile);
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('Connecting to database...');
  const client = await pool.connect();

  try {
    console.log('Running migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
