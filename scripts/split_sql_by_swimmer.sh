#!/bin/bash
# ABOUTME: Split large SQL file into individual swimmer files

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INPUT_FILE="$SCRIPT_DIR/load_all_swimmers.sql"
OUTPUT_DIR="$SCRIPT_DIR/sql_by_swimmer"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Splitting SQL file by swimmer..."
echo ""

# Use awk to split on swimmer comments
awk '
  /^-- [A-Z].*\([0-9]+ records\)/ {
    if (out) close(out)
    # Extract swimmer name and sanitize for filename
    match($0, /^-- ([^(]+)/, arr)
    swimmer = arr[1]
    gsub(/^[ \t]+|[ \t]+$/, "", swimmer)  # trim whitespace
    gsub(/[ ]/, "_", swimmer)             # replace spaces with underscores
    out = "'"$OUTPUT_DIR"'/" swimmer ".sql"
    print "Processing: " swimmer
  }
  out { print > out }
' "$INPUT_FILE"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ SQL files split into: $OUTPUT_DIR"
echo "   Total files: $(ls -1 "$OUTPUT_DIR"/*.sql 2>/dev/null | wc -l)"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "To load each swimmer:"
echo "  1. Open Supabase SQL Editor"
echo "  2. Copy contents of each file in $OUTPUT_DIR"
echo "  3. Execute one at a time"
echo ""
echo "Files are small enough to execute individually."
