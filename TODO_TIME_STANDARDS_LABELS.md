# TODO: Time Standards Labels - Remaining Issues

## Date: 2025-01-14

## What Was Implemented ✅

Successfully implemented time standard achievement labels on the progress chart:
- Labels (B, BB, A, AA, etc.) now appear on chart points where standards were FIRST achieved
- Labels are colored to match the event line color
- Only shows labels when a NEW BEST standard is achieved (B → BB → A progression)
- Fixed age calculation bug (was using null date_of_birth, now uses result.age field)
- Fixed gender mapping for database queries (Boys/Girls instead of M/F)

## Current Status

The feature is working correctly:
- **50 BR SCY**: B at 10/17/2024 (50.45s), BB at 2/21/2025 (46.91s)
- **50 FR SCY**: B at 2/21/2025 (37.88s)
- **50 FL SCY**: B at 7/10/2025 (42.34s)
- **50 BK SCY**: B at 2/21/2025 (44.65s), BB at 4/17/2025 (42.89s)

## Reported Issues to Fix Later 🔧

### 1. BB Label Position Issue
**User Report**: "BB plotting is not correct"
**Need to Investigate**:
- Which specific BB label is incorrect?
- Is it the position, color, or the label itself?
- Check: 50 BR SCY BB at 2/21/2025 and 50 BK SCY BB at 4/17/2025

**Potential Causes**:
- Badge position calculation might be off
- Label might be showing on wrong data point
- Time standard calculation might be wrong for specific case

### 2. A Standard Visualization Missing
**User Report**: "A which is next time standard to track in projection is missing in graph"
**Current Behavior**:
- A labels only show when swimmer actually achieves A standard in competition
- No swimmer has achieved A standard yet (need 4-6 seconds improvement)

**What User Might Want**:
1. Visual indicator on projection line showing WHERE A standard target is
2. A marker/star on the projection showing predicted A achievement date
3. Different visualization to show the A target time as a reference line

**To Implement**:
- Add visual markers on projection lines at target standard times
- Could show stars or different badges for "projected achievements"
- Distinguish actual achievements (solid labels) from projected targets (outlined labels or stars)

## Technical Details

### Files Modified
- `js/app-new.js`: Lines 620-695 (standard achievement calculation and plugin)
- `index.html`: Lines 37-54 (stat card reordering: B, BB, A, Events)

### Key Code Sections
- **Standard Achievement Calculation**: Lines 620-695 in app-new.js
- **Badge Drawing Plugin**: Lines 697-745 (standardLabelsPlugin)
- **Age Calculation Fix**: Line 648 (uses result.age instead of date_of_birth)
- **Gender Mapping**: Line 627 (Maps to Boys/Girls for database queries)

### Database Schema Notes
- `competition_results.age`: Stores swimmer's age at time of competition (should be used)
- `swimmers.date_of_birth`: Currently null (don't use this)
- `swimmers.current_age`: Current age (fallback if result.age is missing)
- `time_standards.gender`: Uses 'Boys' or 'Girls' (not 'M'/'F')

## Next Steps

1. **Debug BB Label Issue**:
   - Add console logging to show exact badge placement coordinates
   - Verify the correct achievement date is being used
   - Check if multiple labels are overlapping

2. **Add Projection Target Visualization**:
   - Design: How to show future target standards on projection lines?
   - Options: Stars, outlined badges, reference lines, tooltips
   - Make it clear difference between achieved vs. projected

3. **Testing**:
   - Verify all time standards are being calculated correctly
   - Check label positions at different zoom levels
   - Test with different age groups (10 & under, 11-12, 13-14)

## Reference

Current time standards needed for A:
- 50 FR: 31.09s (current: 35.15s) - need 4.06s improvement
- 50 BK: 37.59s (current: 41.6s) - need 4.01s improvement
- 50 BR: 42.09s (current: 44.1s) - need 2.01s improvement
- 50 FL: 35.99s (current: 41.63s) - need 5.64s improvement

All times are for Boys 10 & under age group, SCY (Short Course Yards).
