#!/bin/bash

# Execute the complete fix using curl and SQL via Supabase REST API
# This uses the direct PostgreSQL connection to execute DDL/DML statements

SUPABASE_URL="https://gwqwpicbtkamojwwlmlp.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXdwaWNidGthbW9qd3dsbWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4OTczMCwiZXhwIjoyMDc1ODY1NzMwfQ.yeogkX6imUHwudhlaIDpsAZzhwEXO8uuegTdrFKEZoA"
PSQL_URL="postgresql://postgres.gwqwpicbtkamojwwlmlp:Vihaan@123@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "=== FIXING TIME STANDARDS CALCULATION SYSTEM ==="
echo ""

# Check if psql is available
if command -v psql &> /dev/null; then
    echo "✓ psql found, using direct connection"
    echo ""

    # Execute the complete script
    echo "Executing complete_fix_all_calculations.sql..."
    psql "$PSQL_URL" < /Users/yhuchchannavar/Documents/vihaan-swim-tracker/scripts/complete_fix_all_calculations.sql

    echo ""
    echo "=== DONE ==="
else
    echo "✗ psql not found"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  brew install postgresql@16"
    echo ""
    echo "Or execute manually in Supabase Dashboard:"
    echo "  https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp"
    exit 1
fi
