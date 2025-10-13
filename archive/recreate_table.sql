-- Drop existing time_standards table if it exists
-- WARNING: This will delete all existing data in the table
DROP TABLE IF EXISTS time_standards CASCADE;

-- Create new time_standards table with correct schema
CREATE TABLE time_standards (
    id SERIAL PRIMARY KEY,
    age_group VARCHAR(20) NOT NULL,
    age_group_code VARCHAR(10) NOT NULL,
    course_type VARCHAR(3) NOT NULL CHECK (course_type IN ('SCY', 'SCM', 'LCM')),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Girls', 'Boys')),
    event_name VARCHAR(50) NOT NULL,

    -- Time standards in seconds (decimal format)
    b_standard DECIMAL(10,2),
    bb_standard DECIMAL(10,2),
    a_standard DECIMAL(10,2),
    aa_standard DECIMAL(10,2),
    aaa_standard DECIMAL(10,2),
    aaaa_standard DECIMAL(10,2),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint to prevent duplicates
    CONSTRAINT unique_time_standard UNIQUE (age_group_code, course_type, gender, event_name)
);

-- Create indexes for efficient queries
CREATE INDEX idx_time_standards_age_course_gender
    ON time_standards(age_group_code, course_type, gender);

CREATE INDEX idx_time_standards_event
    ON time_standards(event_name);

CREATE INDEX idx_time_standards_lookup
    ON time_standards(age_group_code, course_type, gender, event_name);

-- Add comment for documentation
COMMENT ON TABLE time_standards IS 'USA Swimming Motivational Time Standards 2024-2028. Time values are stored in seconds as decimal numbers for consistent comparison. Includes gender-specific standards for all age groups and course types.';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_standards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_time_standards_timestamp
    BEFORE UPDATE ON time_standards
    FOR EACH ROW
    EXECUTE FUNCTION update_time_standards_updated_at();
