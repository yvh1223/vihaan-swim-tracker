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
  - 🟢 **BB** (Green): Best time standard
  - 🔵 **B** (Blue): Good time standard  
  - 🔴 **Below B** (Red): Needs improvement
- Automatic filtering of invalid times (DQ, Pending)

### 📋 **Data Management**
- CSV file upload for team progression data
- CSV file upload for event times data
- Download template files
- Automatic chart updates when new data is uploaded
- Data summary statistics

## File Structure

```
vihaan-swim-tracker/
├── index.html              # Main HTML file
├── js/
│   ├── data.js             # Data storage and initial datasets
│   ├── charts.js           # Chart initialization functions
│   └── app.js              # Main application logic
└── data/
    ├── team_progression.csv # Team progression raw data
    └── event_times.csv     # Event times raw data
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
- **Time Standard**: Performance standard (BB, B, or "Slower than B")
- **Meet**: Name of the swimming meet
- **Points**: Points scored (optional, can be 0)
- **Age**: Vihaan's age at the time of the event

## Technical Features

### Chart Types
- **Line Charts**: For timeline and event progression
- **Bar Charts**: For duration analysis
- **Interactive Tooltips**: Detailed information on hover
- **Responsive Design**: Works on desktop and mobile

### Data Processing
- Automatic time conversion (MM:SS to seconds)
- Invalid time filtering (DQ, Pending)
- Inclusive month calculations
- Chronological sorting

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

## Future Enhancements

- [ ] GitHub Pages hosting
- [ ] Integration with USA Swimming database
- [ ] Goal setting and tracking
- [ ] Performance predictions
- [ ] Export reports to PDF
- [ ] Mobile app version

## Support

For issues or questions, please check the browser console for error messages and ensure all CSV files follow the exact format specified in the templates.

---

**Created for tracking Vihaan's swimming journey from beginner to champion! 🏊‍♂️🏆**