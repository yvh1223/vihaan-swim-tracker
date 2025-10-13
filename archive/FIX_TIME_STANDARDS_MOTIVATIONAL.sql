-- ========================================
-- FIX TIME STANDARDS - MOTIVATIONAL STANDARDS
-- ========================================
-- Recalculate time_standard for ALL competition results using
-- MOTIVATIONAL standards (easier targets for age-group swimmers)
--
-- Execute in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
-- ========================================

DO $$
DECLARE
    v_row RECORD;
    v_standard TEXT;
    v_update_count INT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FIXING TIME STANDARDS - MOTIVATIONAL';
    RAISE NOTICE '========================================';

    -- Loop through all competition results for swimmer_id = 1
    FOR v_row IN
        SELECT id, event_name, time_seconds, event_date
        FROM competition_results
        WHERE swimmer_id = 1
          AND time_seconds IS NOT NULL
          AND event_date < '2026-01-01'  -- 10&U age group
        ORDER BY event_name, event_date
    LOOP
        v_standard := NULL;

        -- Calculate standard based on event and time
        -- Logic: if (time <= standard) return standard
        -- Check A first (fastest), then BB, then B (slowest)

        CASE v_row.event_name
            WHEN '50 FR SCY' THEN
                IF v_row.time_seconds <= 34.19 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 38.09 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 41.99 THEN v_standard := 'B';
                END IF;

            WHEN '100 FR SCY' THEN
                IF v_row.time_seconds <= 76.99 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 86.99 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 96.99 THEN v_standard := 'B';
                END IF;

            WHEN '200 FR SCY' THEN
                IF v_row.time_seconds <= 164.99 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 185.69 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 206.29 THEN v_standard := 'B';
                END IF;

            WHEN '500 FR SCY' THEN
                IF v_row.time_seconds <= 433.89 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 488.29 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 542.79 THEN v_standard := 'B';
                END IF;

            WHEN '50 BK SCY' THEN
                IF v_row.time_seconds <= 40.99 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 46.79 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 52.59 THEN v_standard := 'B';
                END IF;

            WHEN '100 BK SCY' THEN
                IF v_row.time_seconds <= 87.49 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 99.09 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 110.69 THEN v_standard := 'B';
                END IF;

            WHEN '50 BR SCY' THEN
                IF v_row.time_seconds <= 45.29 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 51.39 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 57.49 THEN v_standard := 'B';
                END IF;

            WHEN '100 BR SCY' THEN
                IF v_row.time_seconds <= 99.59 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 112.59 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 125.59 THEN v_standard := 'B';
                END IF;

            WHEN '50 FL SCY' THEN
                IF v_row.time_seconds <= 39.09 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 44.79 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 50.49 THEN v_standard := 'B';
                END IF;

            WHEN '100 FL SCY' THEN
                IF v_row.time_seconds <= 92.29 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 108.29 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 124.19 THEN v_standard := 'B';
                END IF;

            WHEN '100 IM SCY' THEN
                IF v_row.time_seconds <= 87.89 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 98.79 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 109.69 THEN v_standard := 'B';
                END IF;

            WHEN '200 IM SCY' THEN
                IF v_row.time_seconds <= 188.89 THEN v_standard := 'A';
                ELSIF v_row.time_seconds <= 213.49 THEN v_standard := 'BB';
                ELSIF v_row.time_seconds <= 238.09 THEN v_standard := 'B';
                END IF;

            -- Relay events - no individual standards
            ELSE
                v_standard := NULL;
        END CASE;

        -- Update the record
        UPDATE competition_results
        SET time_standard = v_standard
        WHERE id = v_row.id;

        v_update_count := v_update_count + 1;
    END LOOP;

    RAISE NOTICE 'Updated % records', v_update_count;
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- VERIFICATION
-- ========================================
SELECT
    '📊 TIME STANDARDS VERIFICATION' as check_type;

SELECT
    event_name,
    COUNT(*) as total_swims,
    COUNT(CASE WHEN time_standard = 'A' THEN 1 END) as a_times,
    COUNT(CASE WHEN time_standard = 'BB' THEN 1 END) as bb_times,
    COUNT(CASE WHEN time_standard = 'B' THEN 1 END) as b_times,
    COUNT(CASE WHEN time_standard IS NULL THEN 1 END) as no_standard
FROM competition_results
WHERE swimmer_id = 1
  AND event_name LIKE '% SCY'
GROUP BY event_name
ORDER BY event_name;

-- Show Personal Records with correct standards
SELECT
    '🏊 PERSONAL RECORDS' as title;

WITH personal_records AS (
    SELECT DISTINCT ON (event_name)
        event_name,
        time_formatted,
        time_seconds,
        time_standard,
        event_date,
        meet_name
    FROM competition_results
    WHERE swimmer_id = 1
      AND event_name LIKE '% SCY'
    ORDER BY event_name, time_seconds ASC, event_date DESC
)
SELECT
    event_name,
    time_formatted as best_time,
    time_standard,
    event_date,
    CASE
        WHEN time_standard = 'A' THEN '🏆 A Standard'
        WHEN time_standard = 'BB' THEN '🥇 BB Standard'
        WHEN time_standard = 'B' THEN '🥈 B Standard'
        ELSE '⚠️ No Standard Yet'
    END as achievement
FROM personal_records
ORDER BY event_name;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ TIME STANDARDS FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)';
    RAISE NOTICE '========================================';
END $$;
