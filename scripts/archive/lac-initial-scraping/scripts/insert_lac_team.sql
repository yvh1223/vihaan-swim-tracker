-- Get date ranges and insert team progression records
WITH date_ranges AS (
  SELECT 
    swimmer_id,
    MIN(event_date) as start_date,
    MAX(event_date) as end_date
  FROM competition_results
  WHERE swimmer_id IN (21, 22, 23, 24, 25, 26)
  GROUP BY swimmer_id
)
INSERT INTO team_progression (swimmer_id, team_name, start_date, end_date)
SELECT 
  swimmer_id,
  'LAC - Gold I Swim Team' as team_name,
  start_date,
  NULL as end_date
FROM date_ranges
ON CONFLICT (swimmer_id, team_name, start_date) DO NOTHING
RETURNING *;
