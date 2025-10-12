# Vihaan's Swim Journey Tracker

A comprehensive web application to track Vihaan's swimming journey, team progression, and event-specific performance with interactive charts and data management.

## Features

### 📊 **Overview Dashboard**
- Total meets participated
- Total events swum
- Years of swimming journey
- Monthly activity timeline

### 🏊‍♂️ **Team Progression**
- **Duration View**: Horizontal bar chart showing months spent at each team level
- **Timeline View**: Visual timeline of team progression over time
- Toggle between views with a single click
- Inclusive month calculations with annotations

### 📈 **Event Progress Charts**
- Individual charts for each swimming event (50 FR, 100 FR, 200 FR, etc.)
- Time progression tracking with color-coded time standards:
  - 🟢 **BB** (Green): Competitive level standard
  - 🔵 **B** (Blue): Intermediate level standard
  - 🟡 **A** (Yellow): Elite level standard
  - 🔴 **Below B** (Red): Needs improvement
- Automatic filtering of invalid times (DQ, Pending)

### 🎯 **Gap Analysis Charts**
Two specialized charts to track progress toward achievement goals:

#### **BB Standards Gap Analysis**
- **Purpose**: Track competitive level achievements and identify improvement targets
- **Display**: Horizontal bars showing seconds needed to achieve BB standard for each event
- **Achievement Badges**: Shows ✓BB, ✓B, or ✓A based on actual awards received at meets
- **Color**: Green gradient indicating current competitive focus
- **Logic**:
  - Displays gap bars only for events where BB has not been awarded
  - Uses absolute values to show distance regardless of current time
  - Awards based on meet results, not mathematical calculations

#### **A Standards Gap Analysis**
- **Purpose**: Track elite performance goals and long-term aspirations
- **Display**: Horizontal bars showing seconds needed to achieve A standard for each event
- **Achievement Badges**: Shows ✓A for achieved elite standards
- **Color**: Yellow/orange gradient indicating elite aspirational goals
- **Logic**:
  - Displays gap bars for all events where A has not been awarded
  - Helps visualize the path from competitive (BB) to elite (A) levels
  - Separate tracking allows focus on current achievements vs future goals

### 📋 **Data Management**
- CSV file upload for team progression data
- CSV file upload for event times data
- Download template files
- Automatic chart updates when new data is uploaded
- Data summary statistics

## File Structure

```
vihaan-swim-tracker/
├── index.html                        # Main HTML file (website)
├── css/                              # Stylesheets
├── js/
│   ├── data.js                       # Data storage and initial datasets
│   ├── charts.js                     # Chart initialization functions
│   └── app.js                        # Main application logic
├── data/
│   ├── team_progression.csv          # Team progression raw data
│   └── event_times.csv               # Event times raw data
├── supabase-schema-normalized.sql    # Database schema (PostgreSQL)
├── supabaseSetup-normalized.js       # Database import script
├── timeStandards.js                  # USA Swimming standards calculator
├── .env                              # Supabase credentials (not in git)
└── package.json                      # Node dependencies
```

## Getting Started

### 1. Open the Application
Simply open `index.html` in any modern web browser.

### 2. Navigate Through Tabs
- **Overview**: See summary statistics and activity timeline
- **Team Progress**: View team progression with toggle between duration and timeline views
- **Event Progress**: Individual charts for each swimming event
- **Data Management**: Upload new data and manage existing data

### 3. Upload New Data

#### Team Progression Data Format:
```csv
Team,Start Date,End Date
CORE – Beginner,2021-07-01,2021-08-01
YMCA – White,2024-08-01,2024-08-31
```

#### Event Times Data Format:
```csv
Event,Date,Time,Time Standard,Meet,Points,Age
50 FR SCY,2025-07-13,35.15,B,2025 NT IRON BB/B/C Jumping Into July,336,10
100 FR SCY,2025-06-15,1:27.33,B,2025 NT STAR We Love Flip Turns Meet,80,10
```

### 4. Update Data
- Click on "Data Management" tab
- Use "Download Template" buttons to get the correct CSV format
- Upload your updated CSV files
- Charts will automatically refresh with new data

## Data Fields Explanation

### Team Progression Data
- **Team**: Name of the swim team/level
- **Start Date**: When Vihaan started at this level (YYYY-MM-DD)
- **End Date**: When Vihaan finished at this level (YYYY-MM-DD)

### Event Times Data
- **Event**: Swimming event name (e.g., "50 FR SCY", "100 IM SCY")
- **Date**: Date of the swim meet (YYYY-MM-DD)
- **Time**: Swimming time (MM:SS.SS format or SS.SS for events under 1 minute)
- **Time Standard**: Performance standard awarded at the meet (BB, B, A, or "Slower than B")
  - **Important**: Awards are NOT cumulative - receiving a B award does not mean BB was achieved
  - Standards are based on USA Swimming motivational time standards for age groups
  - Gap analysis uses these actual awards, not mathematical time comparisons
- **Meet**: Name of the swimming meet
- **Points**: Points scored (optional, can be 0)
- **Age**: Vihaan's age at the time of the event

## Technical Features

### Chart Types
- **Line Charts**: For timeline and event progression
- **Horizontal Bar Charts**: For gap analysis and duration analysis
- **Interactive Tooltips**: Detailed information on hover
- **Responsive Design**: Works on desktop and mobile

### Gap Analysis System
The application uses a sophisticated achievement tracking system:

#### **Achievement Detection**
- **Award-Based Logic**: Uses actual meet awards, not mathematical time comparisons
- **Non-Cumulative**: Each standard (BB, B, A) is tracked independently
  - Example: A swimmer with 40.00s time might receive B award, but not BB
  - The faster time doesn't automatically mean all lower standards are achieved
- **Personal Records**: Tracks best time per event and the award received for that performance

#### **Gap Calculation**
```
Gap = Current Best Time - Standard Time
- Negative gap: Swimmer's time is faster than standard
- Positive gap: Swimmer needs to improve to reach standard
```

#### **Display Logic**
- **Show Gaps**: For any standard NOT yet awarded, display `Math.abs(gap)` as a positive value
- **Hide Gaps**: For awarded standards, show no bar (achievement complete)
- **Achievement Badges**: Display ✓BB, ✓B, or ✓A next to event names based on exact awards
- **Color Coding**:
  - Green: BB competitive level
  - Yellow: A elite level

### Data Processing
- Automatic time conversion (MM:SS to seconds)
- Invalid time filtering (DQ, Pending)
- Inclusive month calculations
- Chronological sorting
- Personal record calculation per event
- Age group determination (10&U, 11-12) for standard lookups

### Error Handling
- Comprehensive error logging
- Graceful fallbacks for chart failures
- CSV parsing validation
- User-friendly error messages

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Deployment

This application is deployed on GitHub Pages and automatically updates when changes are pushed to the main branch via GitHub Actions.

**Live URL**: Check your GitHub repository settings for the deployed URL (typically `https://[username].github.io/vihaan-swim-tracker/`)

## Future Enhancements

- [ ] Integration with USA Swimming database for automatic time standards updates
- [ ] Goal setting and tracking with projected improvement timelines
- [ ] Performance predictions based on historical improvement trends
- [ ] Export charts and reports to PDF for meet preparation and reviews
- [ ] Enhanced mobile app experience with offline support
- [ ] Coach and parent sharing capabilities with custom views
- [ ] Comparison with age group averages and peer performance
- [ ] Training log integration to correlate practice with performance

## Support

For issues or questions, please check the browser console for error messages and ensure all CSV files follow the exact format specified in the templates.

---

**Created for tracking Vihaan's swimming journey from beginner to champion! 🏊‍♂️🏆**