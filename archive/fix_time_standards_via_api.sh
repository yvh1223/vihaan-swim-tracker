#!/bin/bash

# Fix reversed time standards by swapping columns
# This uses the REST API to update all records

SUPABASE_URL="https://gwqwpicbtkamojwwlmlp.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXdwaWNidGthbW9qd3dsbWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4OTczMCwiZXhwIjoyMDc1ODY1NzMwfQ.yeogkX6imUHwudhlaIDpsAZzhwEXO8uuegTdrFKEZoA"

echo "Fetching all time standards..."

# Get all records
RECORDS=$(curl -s "${SUPABASE_URL}/rest/v1/time_standards?select=*" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

# Parse and update each record
echo "$RECORDS" | python3 -c "
import json
import sys
import subprocess

records = json.load(sys.stdin)
total = len(records)
print(f'Processing {total} records...')

for i, record in enumerate(records, 1):
    record_id = record['id']

    # Swap the standards
    new_data = {
        'b_standard': record['aaaa_standard'],
        'bb_standard': record['aaa_standard'],
        'a_standard': record['aa_standard'],
        'aa_standard': record['a_standard'],
        'aaa_standard': record['bb_standard'],
        'aaaa_standard': record['b_standard']
    }

    # Update via API
    cmd = [
        'curl', '-s', '-X', 'PATCH',
        f'${SUPABASE_URL}/rest/v1/time_standards?id=eq.{record_id}',
        '-H', f'apikey: ${SERVICE_KEY}',
        '-H', f'Authorization: Bearer ${SERVICE_KEY}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps(new_data)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if i % 50 == 0:
        print(f'Progress: {i}/{total}')

print('Done!')
"

echo "Verifying fix for 50 FL Boys 10U..."
curl -s "${SUPABASE_URL}/rest/v1/time_standards?event_name=eq.50%20FL&age_group=eq.10%20%26%20under&gender=eq.Boys&course_type=eq.SCY&select=event_name,b_standard,bb_standard,a_standard,aa_standard,aaa_standard,aaaa_standard" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | python3 -m json.tool

echo ""
echo "Expected: B=46.49, BB=41.29, A=35.99, AA=34.29, AAA=32.59, AAAA=30.79"
