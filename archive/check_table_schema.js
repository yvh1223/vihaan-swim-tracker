#!/usr/bin/env node

/**
 * Check current time_standards table schema
 */

const SUPABASE_URL = 'https://gwqwpicbtkamojwwlmlp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXdwaWNidGthbW9qd3dsbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODk3MzAsImV4cCI6MjA3NTg2NTczMH0.5KiCESGV2zzSmhpwDmJ3TsCwdqyCQXntgTGhWkuV27s';

async function checkSchema() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/time_standards?limit=1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Current table data (first record):');
            console.log(JSON.stringify(data, null, 2));

            if (data.length > 0) {
                console.log('\nColumns in table:');
                console.log(Object.keys(data[0]).join(', '));
            } else {
                console.log('\nTable is empty, checking OPTIONS for schema...');

                const optionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/time_standards`, {
                    method: 'OPTIONS',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY
                    }
                });

                console.log('Response headers:');
                for (const [key, value] of optionsResponse.headers.entries()) {
                    console.log(`${key}: ${value}`);
                }
            }
        } else {
            console.error('Error response:', await response.text());
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
