#!/usr/bin/env node

/**
 * Setup Supabase database schema for time standards
 * This script creates the time_standards table and related indexes
 */

const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://gwqwpicbtkamojwwlmlp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXdwaWNidGthbW9qd3dsbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODk3MzAsImV4cCI6MjA3NTg2NTczMH0.5KiCESGV2zzSmhpwDmJ3TsCwdqyCQXntgTGhWkuV27s';

/**
 * Execute SQL via Supabase REST API
 */
async function executeSQL(sql) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ query: sql })
        });

        if (response.ok) {
            return { success: true, data: await response.json() };
        } else {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Create time_standards table
 */
async function createTimeStandardsTable() {
    console.log('=== Setting up time_standards table ===\n');

    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS time_standards (
            id SERIAL PRIMARY KEY,
            age_group VARCHAR(20) NOT NULL,
            age_group_code VARCHAR(10) NOT NULL,
            course_type VARCHAR(3) NOT NULL,
            gender VARCHAR(10) NOT NULL,
            event_name VARCHAR(50) NOT NULL,
            b_standard DECIMAL(10,2),
            bb_standard DECIMAL(10,2),
            a_standard DECIMAL(10,2),
            aa_standard DECIMAL(10,2),
            aaa_standard DECIMAL(10,2),
            aaaa_standard DECIMAL(10,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_time_standard UNIQUE (age_group_code, course_type, gender, event_name)
        );
    `;

    console.log('Creating time_standards table...');
    const result = await executeSQL(createTableSQL);

    if (!result.success) {
        console.error('Failed to create table. This is expected - we need to use SQL editor in Supabase.\n');
        console.log('=== MANUAL SETUP REQUIRED ===');
        console.log('Please run the SQL in: scripts/create_time_standards_table.sql');
        console.log('Using the Supabase SQL Editor at:');
        console.log('https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql\n');
        return false;
    }

    console.log('✓ Table created successfully\n');
    return true;
}

/**
 * Check if table exists by trying to query it
 */
async function checkTableExists() {
    console.log('Checking if time_standards table exists...');

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/time_standards?limit=1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (response.ok) {
            console.log('✓ Table exists and is accessible\n');
            return true;
        } else {
            console.log('✗ Table does not exist or is not accessible\n');
            return false;
        }
    } catch (error) {
        console.error('Error checking table:', error.message);
        return false;
    }
}

/**
 * Main function
 */
async function main() {
    console.log('=== Supabase Database Setup ===\n');

    // Check if table already exists
    const exists = await checkTableExists();

    if (exists) {
        console.log('✓ Database is ready!\n');
        console.log('You can now run: node scripts/load_time_standards.js');
        return;
    }

    // Try to create table (will likely fail due to permissions)
    const created = await createTimeStandardsTable();

    if (!created) {
        console.log('\n=== INSTRUCTIONS ===');
        console.log('1. Go to Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql');
        console.log('2. Copy and paste the SQL from:');
        console.log('   scripts/create_time_standards_table.sql');
        console.log('3. Execute the SQL');
        console.log('4. Run this script again to verify: node scripts/setup_database.js');
        console.log('5. Load the data: node scripts/load_time_standards.js\n');
        process.exit(1);
    }

    console.log('✓ Setup complete!\n');
    console.log('You can now run: node scripts/load_time_standards.js');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
