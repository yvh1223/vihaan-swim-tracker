// Main application functions and event handlers

// Tab functionality
function showTab(tabName) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab pane
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Initialize charts when tabs are shown with delay to ensure DOM is ready
    setTimeout(() => {
        if (tabName === 'gantt') {
            initializeGanttChart();
        } else if (tabName === 'events') {
            initializeFilterValues();
            initializeUnifiedEventChart();
            initializeTimeStandardsGapChart();
            initializeATimeGapChart();
            initializeAITrendAnalysis();
        } else if (tabName === 'overview') {
            initializeOverviewChart();
        } else if (tabName === 'records') {
            initializePersonalRecordsTable();
            initializeImprovementAnalytics();
        }
    }, 150);
}

// File upload handlers
function handleTeamDataUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',');
                
                teamData = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',');
                        teamData.push({
                            team: values[0]?.trim(),
                            startDate: values[1]?.trim(),
                            endDate: values[2]?.trim()
                        });
                    }
                }
                
                refreshAllCharts();
                alert('Team data uploaded successfully!');
            } catch (error) {
                alert('Error parsing CSV file: ' + error.message);
                console.error('CSV parsing error:', error);
            }
        };
        reader.readAsText(file);
    }
}

function handleEventDataUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',');
                
                eventData = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',');
                        eventData.push({
                            event: values[0]?.trim(),
                            date: values[1]?.trim(),
                            time: values[2]?.trim(),
                            timeStandard: values[3]?.trim(),
                            meet: values[4]?.trim(),
                            points: parseInt(values[5]?.trim()) || 0,
                            age: parseInt(values[6]?.trim()) || 0
                        });
                    }
                }
                
                refreshAllCharts();
                alert('Event data uploaded successfully!');
            } catch (error) {
                alert('Error parsing CSV file: ' + error.message);
                console.error('CSV parsing error:', error);
            }
        };
        reader.readAsText(file);
    }
}

// Template downloads
function downloadTeamTemplate() {
    const csvContent = "Team,Start Date,End Date\nCORE – Beginner,2021-07-01,2021-08-01\nCORE – Advanced Beginner,2022-06-01,2022-06-30";
    downloadCSV(csvContent, 'team_data_template.csv');
}

function downloadEventTemplate() {
    const csvContent = "Event,Date,Time,Time Standard,Meet,Points,Age\n50 FR SCY,2025-07-13,35.15,B,2025 NT IRON BB/B/C Jumping Into July,336,10";
    downloadCSV(csvContent, 'event_data_template.csv');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Refresh all charts
function refreshAllCharts() {
    try {
        initializeOverviewChart();
        initializeGanttChart();
        initializeUnifiedEventChart();
        initializeTimeStandardsGapChart();
        initializeATimeGapChart();
        initializePersonalRecordsTable();
        initializeImprovementAnalytics();
        updateDataSummary();
    } catch (error) {
        console.error('Error refreshing charts:', error);
    }
}

// Update data summary
function updateDataSummary() {
    const summary = document.getElementById('dataSummary');
    if (summary) {
        summary.innerHTML = `
            <p><strong>Team Records:</strong> ${teamData.length}</p>
            <p><strong>Event Records:</strong> ${eventData.length}</p>
            <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
        `;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Initializing application...');

        // Initialize Supabase connection or fallback to local data
        await initializeApp();

        // Initialize the overview chart after data is loaded
        initializeOverviewChart();
        updateDataSummary();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
        updateDataIndicator('error', '❌ Initialization failed');
    }
});

// Add error handling for global errors
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});