-- ========================================
-- Vihaan Swim Tracker - Database Schema
-- ========================================
--
-- Run this SQL in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
--

-- Drop existing table if it exists
DROP TABLE IF EXISTS time_standards CASCADE;

-- Create time_standards table with normalized structure
-- This allows for flexible querying and supports multiple standards per event
CREATE TABLE time_standards (
  id SERIAL PRIMARY KEY,
  event VARCHAR(50) NOT NULL,
  age_group VARCHAR(10) NOT NULL,
  gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
  course VARCHAR(3) NOT NULL CHECK (course IN ('SCY', 'SCM', 'LCM')),
  time_standard VARCHAR(5) NOT NULL CHECK (time_standard IN ('B', 'BB', 'A', 'AA', 'AAA', 'AAAA')),
  time_seconds DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique combinations
  UNIQUE(event, age_group, gender, course, time_standard)
);

-- Create indexes for common query patterns
CREATE INDEX idx_time_standards_lookup ON time_standards(event, age_group, gender, course);
CREATE INDEX idx_time_standards_event ON time_standards(event);
CREATE INDEX idx_time_standards_age ON time_standards(age_group);
CREATE INDEX idx_time_standards_gender ON time_standards(gender);
CREATE INDEX idx_time_standards_course ON time_standards(course);
CREATE INDEX idx_time_standards_standard ON time_standards(time_standard);

-- Add table comment
COMMENT ON TABLE time_standards IS 'USA Swimming motivational time standards for different events, age groups, and courses';

-- Add column comments
COMMENT ON COLUMN time_standards.event IS 'Event name (e.g., 50 FR, 100 BK)';
COMMENT ON COLUMN time_standards.age_group IS 'Age group (e.g., 10 & under, 11-12, 13-14)';
COMMENT ON COLUMN time_standards.gender IS 'Gender: M (Male) or F (Female)';
COMMENT ON COLUMN time_standards.course IS 'Course type: SCY (Short Course Yards), SCM (Short Course Meters), or LCM (Long Course Meters)';
COMMENT ON COLUMN time_standards.time_standard IS 'Standard level: B, BB, A, AA, AAA, or AAAA';
COMMENT ON COLUMN time_standards.time_seconds IS 'Time in seconds';

-- Enable Row Level Security (optional, for future multi-user support)
-- ALTER TABLE time_standards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (optional)
-- CREATE POLICY "Allow public read access" ON time_standards FOR SELECT USING (true);
