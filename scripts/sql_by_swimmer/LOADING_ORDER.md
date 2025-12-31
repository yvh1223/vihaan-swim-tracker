# SQL Loading Order

The large consolidated SQL file was too big for Supabase SQL Editor.
These files are split by swimmer and can be loaded individually.

## Loading Instructions

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy/paste contents of each file below (one at a time)
3. Click "Run" to execute
4. Duplicates will be automatically skipped (ON CONFLICT DO NOTHING)

## Recommended Loading Order (Smallest to Largest)

| File | Records | Size | Swimmer |
|------|---------|------|---------|
| Jason_Ma.sql | 108 | 29K | Jason Ma |
| Vihaan_Huchchannavar.sql | 110 | 29K | Vihaan Huchchannavar |
| Eileen_Zheng.sql | 136 | 36K | Eileen Zheng |
| Kiaan_Patel.sql | 140 | 38K | Kiaan Patel |
| Emie_Dibrito.sql | 146 | 39K | Emie Dibrito |
| Jeremy_Ting.sql | 172 | 46K | Jeremy Ting |
| Scarlett_Mann.sql | 190 | 51K | Scarlett Mann |
| Vivian_Habern.sql | 202 | 54K | Vivian Habern |
| Finley_Payne.sql | 208 | 55K | Finley Payne |
| Serena_Tsao.sql | 210 | 56K | Serena Tsao |
| Austin_Deng.sql | 224 | 59K | Austin Deng |
| William_Power.sql | 222 | 59K | William Power |
| Vivienne_Suhor.sql | 230 | 61K | Vivienne Suhor |
| Darren_Xu.sql | 238 | 64K | Darren Xu |
| Brooke_Long.sql | 240 | 64K | Brooke Long |
| Mia_Abareta.sql | 240 | 64K | Mia Abareta |
| Audrey_Gerard.sql | 252 | 66K | Audrey Gerard |
| Parker_Li.sql | 258 | 69K | Parker Li |
| Asa_Davidson.sql | 280 | 74K | Asa Davidson |
| Parker_Sprawls.sql | 304 | 81K | Parker Sprawls |
| Nathanel_Gelbman.sql | 318 | 85K | Nathanel Gelbman |
| Swara_Chitre.sql | 416 | 110K | Swara Chitre |

**Total**: 22 swimmers, 4,844 records

## Quick Load (Small Swimmers First)

Start with the smallest files to verify everything works:

```bash
# Test with smallest file first
cat Jason_Ma.sql
# Copy output and paste into Supabase SQL Editor
```

## Verify Loading Progress

After loading each file, check progress with:

```sql
SELECT
  s.full_name,
  COUNT(cr.id) as loaded_records,
  MAX(cr.event_date) as latest_event
FROM swimmers s
LEFT JOIN competition_results cr ON s.id = cr.swimmer_id
WHERE s.full_name IN (
  'Jason Ma',
  'Vihaan Huchchannavar',
  -- Add more as you load them
)
GROUP BY s.id, s.full_name
ORDER BY s.full_name;
```

## Troubleshooting

- **Still too large**: Try loading in smaller batches (split VALUES into chunks)
- **Timeout**: Refresh page and try again
- **Duplicate key error**: Safe to ignore, means record already exists
- **RLS policy error**: Contact admin for service role key access
