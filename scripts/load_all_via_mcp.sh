#!/bin/bash
# ABOUTME: Generates individual SQL files for each swimmer for MCP loading

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DATA_DIR="$SCRIPT_DIR/scraped_data"
SQL_DIR="$SCRIPT_DIR/sql_by_swimmer"

# Create SQL directory
mkdir -p "$SQL_DIR"

echo "Generating individual SQL files for all swimmers..."
echo ""

# Swimmer ID mapping
declare -A SWIMMER_IDS
SWIMMER_IDS["Asa_Davidson"]=9
SWIMMER_IDS["Audrey_Gerard"]=12
SWIMMER_IDS["Austin_Deng"]=10
SWIMMER_IDS["Brooke_Long"]=24
SWIMMER_IDS["Darren_Xu"]=20
SWIMMER_IDS["Eileen_Zheng"]=15
SWIMMER_IDS["Emie_Dibrito"]=17
SWIMMER_IDS["Finley_Payne"]=13
SWIMMER_IDS["Jason_Ma"]=25
SWIMMER_IDS["Jeremy_Ting"]=19
SWIMMER_IDS["Kiaan_Patel"]=23
SWIMMER_IDS["Mia_Abareta"]=8
SWIMMER_IDS["Nathanel_Gelbman"]=11
SWIMMER_IDS["Parker_Li"]=21
SWIMMER_IDS["Parker_Sprawls"]=14
SWIMMER_IDS["Scarlett_Mann"]=22
SWIMMER_IDS["Serena_Tsao"]=7
SWIMMER_IDS["Swara_Chitre"]=3
SWIMMER_IDS["Vihaan_Huchchannavar"]=1
SWIMMER_IDS["Vivian_Habern"]=16
SWIMMER_IDS["Vivienne_Suhor"]=18
SWIMMER_IDS["William_Power"]=26

# Find all Dec 30 scraped files
for file in "$DATA_DIR"/*_1767*.json; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    swimmer_key="${filename%_*}"
    swimmer_id="${SWIMMER_IDS[$swimmer_key]}"

    if [ -n "$swimmer_id" ]; then
      swimmer_name=$(echo "$swimmer_key" | tr '_' ' ')
      output_file="$SQL_DIR/${swimmer_key}.sql"

      echo "Processing $swimmer_name..."
      node "$SCRIPT_DIR/load_via_mcp.js" "$file" "$swimmer_id" 2>&1 | \
        sed -n '/^INSERT/,/^ON CONFLICT/p' > "$output_file"

      echo "  ✓ Generated $output_file"
    fi
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ All SQL files generated in: $SQL_DIR"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next: Execute each SQL file via Supabase MCP"
