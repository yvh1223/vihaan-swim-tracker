#!/usr/bin/env python3
"""
ABOUTME: Loads scraped JSON to Supabase in small batches
Generates SQL statements that can be executed via Supabase MCP
"""

import json
import sys
from pathlib import Path

def parse_event_name(event_name):
    parts = event_name.strip().split()
    if len(parts) < 3:
        return None, None, None
    return int(parts[0]), parts[1], parts[2]

def time_to_seconds(time_str):
    if not time_str:
        return None
    # Remove 'r' suffix (relay leadoff indicator)
    time_str = time_str.rstrip('r')
    parts = time_str.split(':')
    if len(parts) == 1:
        return float(parts[0])
    elif len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    return None

def parse_date(date_str):
    if not date_str:
        return None
    month, day, year = date_str.split('/')
    return f"{year}-{month.zfill(2)}-{day.zfill(2)}"

def escape_sql(s):
    if not s:
        return 'NULL'
    return f"'{s.replace(chr(39), chr(39)+chr(39))}'"

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 load_batch_python.py <json-file> <swimmer-id>")
        sys.exit(1)

    json_file = sys.argv[1]
    swimmer_id = int(sys.argv[2])

    with open(json_file) as f:
        records = json.load(f)

    print(f"Processing {len(records)} records for swimmer ID {swimmer_id}...")

    batch_size = 25
    batches = []
    current_batch = []

    for record in records:
        distance, stroke, course = parse_event_name(record['event'])
        time_seconds = time_to_seconds(record.get('swimTime'))
        event_date = parse_date(record.get('swimDate'))

        if not time_seconds or not event_date:
            continue

        meet = escape_sql(record.get('meet'))
        event = escape_sql(record['event'])
        time_fmt = escape_sql(record.get('swimTime'))
        time_std = escape_sql(record.get('timeStandard'))
        lsc = escape_sql(record.get('lsc'))
        team = escape_sql(record.get('team'))

        course_val = f"'{course}'" if course else 'NULL'
        dist_val = f"'{distance}'" if distance else 'NULL'
        stroke_val = f"'{stroke}'" if stroke else 'NULL'
        points_val = record.get('points') or 'NULL'
        age_val = record.get('age') or 'NULL'

        value = f"({swimmer_id}, {event}, {meet}, '{event_date}', {time_fmt}, {time_seconds}, {course_val}, {dist_val}, {stroke_val}, {time_std}, {points_val}, {lsc}, {team}, {age_val}, NOW(), NOW())"

        current_batch.append(value)

        if len(current_batch) >= batch_size:
            batches.append(current_batch)
            current_batch = []

    if current_batch:
        batches.append(current_batch)

    print(f"\nGenerated {len(batches)} batches of {batch_size} records each\n")
    print("Execute these SQL statements:\n")

    for idx, batch in enumerate(batches, 1):
        sql = f"INSERT INTO competition_results (swimmer_id, event_name, meet_name, event_date, time_formatted, time_seconds, course_type, distance, stroke, time_standard, points, lsc, team, age, created_at, updated_at) VALUES\n"
        sql += ",\n".join(batch)
        sql += "\nON CONFLICT (swimmer_id, event_name, event_date, COALESCE(meet_name, '')) DO NOTHING;\n"

        print(f"-- Batch {idx}/{len(batches)}")
        print(sql)
        print()

if __name__ == '__main__':
    main()
