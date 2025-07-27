// Enhanced chart initialization and management functions

// Initialize enhanced overview chart
function initializeOverviewChart() {
    const ctx = document.getElementById('overviewChart');
    if (!ctx) {
        console.log('Overview chart canvas not found');
        return;
    }

    try {
        if (overviewChart) {
            overviewChart.destroy();
            overviewChart = null;
        }

        // Calculate enhanced summary statistics
        const totalMeets = [...new Set(eventData.map(e => e.meet))].length;
        const totalEvents = eventData.length;
        const startDate = new Date('2021-07-01');
        const currentDate = new Date();
        const journeyYears = ((currentDate - startDate) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
        
        // Calculate time standards
        const bbTimes = eventData.filter(e => e.timeStandard === 'BB').length;
        const bTimes = eventData.filter(e => e.timeStandard === 'B').length;
        
        // Calculate personal records
        const prs = calculatePersonalRecords();
        const personalRecordsCount = Object.keys(prs).length;
        
        // Get current age (from most recent event)
        const recentEvent = eventData.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const currentAge = recentEvent ? recentEvent.age : 10;

        // Update summary cards
        document.getElementById('currentAge').textContent = currentAge;
        document.getElementById('totalMeets').textContent = totalMeets;
        document.getElementById('totalEvents').textContent = totalEvents;
        document.getElementById('journeyDuration').textContent = journeyYears;
        document.getElementById('totalBBTimes').textContent = bbTimes;
        document.getElementById('totalBTimes').textContent = bTimes;
        document.getElementById('personalRecords').textContent = personalRecordsCount;

        // Generate recent achievements
        generateRecentAchievements();

        // Create enhanced timeline with time standards
        const monthlyProgress = {};
        const monthlyBB = {};
        const monthlyB = {};
        
        eventData.forEach(event => {
            const month = event.date.substring(0, 7);
            if (!monthlyProgress[month]) {
                monthlyProgress[month] = 0;
                monthlyBB[month] = 0;
                monthlyB[month] = 0;
            }
            monthlyProgress[month]++;
            
            if (event.timeStandard === 'BB') monthlyBB[month]++;
            if (event.timeStandard === 'B') monthlyB[month]++;
        });

        const labels = Object.keys(monthlyProgress).sort();
        const totalData = labels.map(label => monthlyProgress[label]);
        const bbData = labels.map(label => monthlyBB[label] || 0);
        const bData = labels.map(label => monthlyB[label] || 0);

        overviewChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Events',
                        data: totalData,
                        borderColor: '#2a5298',
                        backgroundColor: 'rgba(42, 82, 152, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'BB Times',
                        data: bbData,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'B Times',
                        data: bData,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Swimming Activity & Achievement Timeline',
                        font: { size: 16 }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Events'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing overview chart:', error);
    }
}

// Toggle Gantt chart view
function toggleGanttView() {
    ganttViewMode = ganttViewMode === 'duration' ? 'timeline' : 'duration';
    const button = document.getElementById('ganttToggle');
    if (button) {
        button.textContent = ganttViewMode === 'duration' ? 'Switch to Timeline View' : 'Switch to Duration View';
    }
    initializeGanttChart();
}

// Initialize Gantt chart
function initializeGanttChart() {
    const ctx = document.getElementById('ganttChart');
    if (!ctx) {
        console.log('Gantt chart canvas not found');
        return;
    }

    try {
        // Properly destroy existing chart
        if (ganttChart && typeof ganttChart.destroy === 'function') {
            ganttChart.destroy();
            ganttChart = null;
        }

        console.log('Initializing gantt chart in mode:', ganttViewMode);
        
        if (ganttViewMode === 'timeline') {
            initializeTimelineChart();
        } else {
            initializeDurationChart();
        }
    } catch (error) {
        console.error('Error initializing gantt chart:', error);
    }
}

// Timeline-based Gantt chart - simplified approach
function initializeTimelineChart() {
    const ctx = document.getElementById('ganttChart');
    if (!ctx) {
        console.error('Timeline chart canvas not found');
        return;
    }

    console.log('Creating timeline chart with team data:', teamData);

    try {
        // Create unique dates for timeline
        const allDates = [];
        teamData.forEach(item => {
            allDates.push(item.startDate);
            allDates.push(item.endDate);
        });
        const uniqueDates = [...new Set(allDates)].sort();
        
        ganttChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: uniqueDates,
                datasets: teamData.map((item, index) => {
                    // Create data points for start and end dates
                    const dataPoints = uniqueDates.map(date => {
                        if (date >= item.startDate && date <= item.endDate) {
                            return index;
                        }
                        return null;
                    });
                    
                    return {
                        label: item.team.length > 25 ? item.team.substring(0, 22) + '...' : item.team,
                        data: dataPoints,
                        borderColor: `hsl(${index * 360 / teamData.length}, 70%, 60%)`,
                        backgroundColor: `hsl(${index * 360 / teamData.length}, 70%, 60%)`,
                        borderWidth: 8,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        showLine: true,
                        tension: 0,
                        fill: false,
                        spanGaps: false,
                        teamInfo: item
                    };
                })
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Vihaan's Swimming Team Timeline",
                        font: { size: 16 }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const datasetIndex = context[0].datasetIndex;
                                return teamData[datasetIndex].team;
                            },
                            label: function(context) {
                                const datasetIndex = context.datasetIndex;
                                const item = teamData[datasetIndex];
                                const start = new Date(item.startDate);
                                const end = new Date(item.endDate);
                                const startMonth = start.getFullYear() * 12 + start.getMonth();
                                const endMonth = end.getFullYear() * 12 + end.getMonth();
                                const duration = endMonth - startMonth + 1;
                                
                                return [
                                    `Period: ${item.startDate} to ${item.endDate}`,
                                    `Duration: ${duration} months`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Timeline'
                        },
                        ticks: {
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        ticks: {
                            callback: function(value, index) {
                                const teamName = teamData[value]?.team || '';
                                return teamName.length > 20 ? teamName.substring(0, 17) + '...' : teamName;
                            },
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Team Level'
                        },
                        min: -0.5,
                        max: teamData.length - 0.5
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                },
                animation: {
                    onComplete: function(animation) {
                        // Add team names on the timeline
                        const chart = animation.chart;
                        const ctx = chart.ctx;
                        
                        try {
                            ctx.save();
                            ctx.font = 'bold 11px Arial';
                            ctx.strokeStyle = 'white';
                            ctx.lineWidth = 3;
                            ctx.textAlign = 'left';
                            
                            // Create a grid-based positioning system to prevent overlaps
                            const usedPositions = [];
                            const labelHeight = 20;
                            const minSpacing = 25;
                            
                            // Sort datasets by their Y position (team level) to process them in order
                            const sortedDatasets = chart.data.datasets.map((dataset, index) => ({
                                dataset,
                                index,
                                item: teamData[index],
                                meta: chart.getDatasetMeta(index)
                            })).sort((a, b) => {
                                // Sort by the team level (Y position)
                                return a.index - b.index;
                            });
                            
                            sortedDatasets.forEach(({dataset, index, item, meta}) => {
                                // Find the actual visible line segment for this team
                                const validPoints = meta.data.filter(point => point && point.x !== undefined && point.y !== undefined && point.skip !== true);
                                
                                if (validPoints.length > 0) {
                                    // Find the middle of the actual visible line segment
                                    const midIndex = Math.floor(validPoints.length / 2);
                                    const midPoint = validPoints[midIndex];
                                    
                                    // Calculate duration in months
                                    const start = new Date(item.startDate);
                                    const end = new Date(item.endDate);
                                    const startMonth = start.getFullYear() * 12 + start.getMonth();
                                    const endMonth = end.getFullYear() * 12 + end.getMonth();
                                    const duration = endMonth - startMonth + 1;
                                    
                                    // Create label with team name and duration
                                    const labelText = `${item.team} (${duration}m)`;
                                    
                                    // Calculate ideal position - above the middle of the line segment
                                    const textWidth = ctx.measureText(labelText).width;
                                    let idealX = midPoint.x - (textWidth / 2); // Center the text over the line
                                    let idealY = midPoint.y - 25; // Position above the line
                                    
                                    // Ensure label stays within chart bounds
                                    idealX = Math.min(idealX, chart.width - textWidth - 20);
                                    idealX = Math.max(idealX, 10);
                                    idealY = Math.max(idealY, 25);
                                    idealY = Math.min(idealY, chart.height - 25);
                                    
                                    // Find the best available position using a grid approach
                                    let bestX = idealX;
                                    let bestY = idealY;
                                    let foundPosition = false;
                                    
                                    // Try positions in a spiral pattern around the ideal position
                                    for (let yOffset = 0; yOffset <= 200 && !foundPosition; yOffset += minSpacing) {
                                        for (let direction of [0, 1]) { // 0 = above, 1 = below
                                            let testY = direction === 0 ? idealY - yOffset : idealY + yOffset;
                                            
                                            // Keep within chart bounds
                                            if (testY < 25 || testY > chart.height - 25) continue;
                                            
                                            for (let xOffset = 0; xOffset <= 150 && !foundPosition; xOffset += 20) {
                                                for (let xDir of [0, 1]) { // 0 = left, 1 = right
                                                    let testX = xDir === 0 ? idealX - xOffset : idealX + xOffset;
                                                    
                                                    // Keep within chart bounds
                                                    if (testX < 10 || testX + textWidth > chart.width - 10) continue;
                                                    
                                                    // Check if this position overlaps with existing labels
                                                    let hasOverlap = false;
                                                    for (let pos of usedPositions) {
                                                        if (Math.abs(pos.x - testX) < textWidth + 10 && 
                                                            Math.abs(pos.y - testY) < labelHeight) {
                                                            hasOverlap = true;
                                                            break;
                                                        }
                                                    }
                                                    
                                                    if (!hasOverlap) {
                                                        bestX = testX;
                                                        bestY = testY;
                                                        foundPosition = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    
                                    // Record this position as used
                                    usedPositions.push({ x: bestX, y: bestY, width: textWidth, height: labelHeight });
                                    
                                    // Create a background rectangle for better readability
                                    const padding = 4;
                                    
                                    // Draw semi-transparent background
                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                                    ctx.fillRect(bestX - padding, bestY - 12, textWidth + (padding * 2), 16);
                                    
                                    // Draw border around background
                                    ctx.strokeStyle = dataset.borderColor;
                                    ctx.lineWidth = 1.5;
                                    ctx.strokeRect(bestX - padding, bestY - 12, textWidth + (padding * 2), 16);
                                    
                                    // Draw the text
                                    ctx.fillStyle = dataset.borderColor;
                                    ctx.font = 'bold 11px Arial';
                                    ctx.fillText(labelText, bestX, bestY);
                                    
                                    // Draw a connecting line from the label to the middle of the timeline segment
                                    ctx.strokeStyle = dataset.borderColor;
                                    ctx.lineWidth = 1;
                                    ctx.setLineDash([2, 2]);
                                    ctx.beginPath();
                                    ctx.moveTo(bestX + textWidth/2, bestY + 4);
                                    ctx.lineTo(midPoint.x, midPoint.y);
                                    ctx.stroke();
                                    ctx.setLineDash([]);
                                }
                            });
                            ctx.restore();
                        } catch (e) {
                            console.log('Timeline label error (non-critical):', e);
                        }
                    }
                }
            }
        });
        
        console.log('Timeline chart created successfully');
    } catch (error) {
        console.error('Error creating timeline chart:', error);
        // Fallback to duration chart
        initializeDurationChart();
    }
}

// Duration-based chart
function initializeDurationChart() {
    const ctx = document.getElementById('ganttChart');
    if (!ctx) return;

    try {
        console.log('Creating duration chart with team data:', teamData);

        const labels = teamData.map(item => {
            const name = item.team;
            return name.length > 25 ? name.substring(0, 22) + '...' : name;
        });

        const durations = teamData.map((item) => {
            const start = new Date(item.startDate);
            const end = new Date(item.endDate);
            const startMonth = start.getFullYear() * 12 + start.getMonth();
            const endMonth = end.getFullYear() * 12 + end.getMonth();
            return endMonth - startMonth + 1;
        });

        ganttChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Duration (Months)',
                    data: durations,
                    backgroundColor: teamData.map((item, index) => `hsl(${index * 360 / teamData.length}, 70%, 60%)`),
                    borderColor: teamData.map((item, index) => `hsl(${index * 360 / teamData.length}, 70%, 50%)`),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: "Vihaan's Swim Journey Duration Chart\n(Inclusive Months per Team Level)",
                        font: { size: 16 }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const item = teamData[context.dataIndex];
                                const duration = durations[context.dataIndex];
                                return [
                                    `Team: ${item.team}`,
                                    `Period: ${item.startDate} to ${item.endDate}`,
                                    `Duration: ${duration} months`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Duration (Months)'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Team Level'
                        }
                    }
                },
                // Add month duration annotations on bars
                onHover: function(event, elements) {
                    // Simple hover effect without complex canvas drawing
                },
                animation: {
                    onComplete: function(animation) {
                        // Simplified annotation without complex canvas operations
                        const chart = animation.chart;
                        const ctx = chart.ctx;
                        
                        try {
                            ctx.save();
                            ctx.textAlign = 'center';
                            ctx.fillStyle = 'white';
                            ctx.font = 'bold 14px Arial';
                            ctx.strokeStyle = 'black';
                            ctx.lineWidth = 1;
                            
                            chart.data.datasets[0].data.forEach((value, index) => {
                                const meta = chart.getDatasetMeta(0);
                                const bar = meta.data[index];
                                
                                if (bar && bar.x && bar.y) {
                                    // Position text in the middle of the bar
                                    const x = bar.x - bar.width / 2 + 30;
                                    const y = bar.y + 5;
                                    
                                    // Draw text with stroke for better visibility
                                    ctx.strokeText(value.toString(), x, y);
                                    ctx.fillText(value.toString(), x, y);
                                }
                            });
                            ctx.restore();
                        } catch (e) {
                            console.log('Annotation error (non-critical):', e);
                        }
                    }
                }
            }
        });
        
        console.log('Duration chart created successfully');
    } catch (error) {
        console.error('Error creating duration chart:', error);
    }
}

// Initialize event-specific charts
function initializeEventCharts() {
    const container = document.getElementById('eventChartsContainer');
    if (!container) {
        console.log('Event charts container not found');
        return;
    }

    try {
        // Group events by type
        const eventGroups = {};
        eventData.forEach(event => {
            if (!eventGroups[event.event]) {
                eventGroups[event.event] = [];
            }
            eventGroups[event.event].push(event);
        });

        // Clear existing charts
        container.innerHTML = '';
        Object.values(eventCharts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        eventCharts = {};

        // Create chart for each event type
        Object.keys(eventGroups).forEach(eventType => {
            try {
                const eventContainer = document.createElement('div');
                eventContainer.className = 'chart-container';
                
                const title = document.createElement('div');
                title.className = 'event-title';
                title.textContent = eventType;
                
                const canvas = document.createElement('canvas');
                canvas.id = `chart-${eventType.replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
                
                eventContainer.appendChild(title);
                eventContainer.appendChild(canvas);
                container.appendChild(eventContainer);

                // Sort events by date
                const sortedEvents = eventGroups[eventType].sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Convert time strings to seconds for comparison, handle DQ and special cases
                const times = sortedEvents.map(event => {
                    if (event.time === 'DQ' || event.time === 'Pending') {
                        return null; // Will be filtered out
                    }
                    const timeParts = event.time.split(':');
                    if (timeParts.length === 2) {
                        return parseFloat(timeParts[0]) * 60 + parseFloat(timeParts[1]);
                    }
                    return parseFloat(event.time);
                });

                // Filter out null values and corresponding events
                const validIndices = times.map((time, index) => time !== null ? index : null).filter(index => index !== null);
                const validTimes = validIndices.map(index => times[index]);
                const validEvents = validIndices.map(index => sortedEvents[index]);

                if (validTimes.length === 0) {
                    // No valid times for this event
                    const noDataMsg = document.createElement('div');
                    noDataMsg.textContent = 'No valid time data available';
                    noDataMsg.style.textAlign = 'center';
                    noDataMsg.style.padding = '50px';
                    noDataMsg.style.color = '#666';
                    eventContainer.appendChild(noDataMsg);
                    return;
                }

                const chart = new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: validEvents.map(e => e.date),
                        datasets: [{
                            label: 'Time (seconds)',
                            data: validTimes,
                            borderColor: '#2a5298',
                            backgroundColor: 'rgba(42, 82, 152, 0.1)',
                            borderWidth: 3,
                            fill: false,
                            tension: 0.4,
                            pointBackgroundColor: validEvents.map(e => {
                                switch(e.timeStandard) {
                                    case 'BB': return '#28a745';
                                    case 'B': return '#007bff';
                                    default: return '#dc3545';
                                }
                            }),
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: `${eventType} Progress`
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const event = validEvents[context.dataIndex];
                                        return [
                                            `Time: ${event.time}`,
                                            `Standard: ${event.timeStandard}`,
                                            `Points: ${event.points}`,
                                            `Meet: ${event.meet}`
                                        ];
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                reverse: true, // Lower times are better
                                title: {
                                    display: true,
                                    text: 'Time (seconds)'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Date'
                                }
                            }
                        }
                    }
                });

                eventCharts[eventType] = chart;
            } catch (error) {
                console.error(`Error creating chart for ${eventType}:`, error);
            }
        });
    } catch (error) {
        console.error('Error initializing event charts:', error);
    }
}

// Initialize unified event progress chart with filters
function initializeUnifiedEventChart() {
    const ctx = document.getElementById('unifiedEventChart');
    if (!ctx) {
        console.log('Unified event chart canvas not found');
        return;
    }

    try {
        if (unifiedEventChart) {
            unifiedEventChart.destroy();
            unifiedEventChart = null;
        }

        // Debug: Show available events
        console.log('Available events:', eventData.map(e => e.event));
        
        // Filter data based on current filter settings
        const filteredData = getFilteredEventData();
        console.log('Filtered data:', filteredData.length, 'events');
        
        if (filteredData.length === 0) {
            // Show "no data" message by creating a simple chart
            unifiedEventChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['No Data'],
                    datasets: [{
                        label: 'No data available',
                        data: [0],
                        borderColor: '#666',
                        backgroundColor: '#f0f0f0'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'No data matches the current filters',
                            font: { size: 16 }
                        }
                    }
                }
            });
            return;
        }

        // Group filtered events by event type
        const eventGroups = {};
        filteredData.forEach(event => {
            if (!eventGroups[event.event]) {
                eventGroups[event.event] = [];
            }
            eventGroups[event.event].push(event);
        });

        // Create datasets for each event type
        const datasets = [];
        const eventTypes = Object.keys(eventGroups);
        const colors = [
            '#2a5298', '#28a745', '#dc3545', '#fd7e14', '#6f42c1',
            '#20c997', '#e83e8c', '#6c757d', '#17a2b8', '#ffc107'
        ];

        console.log('Event types found:', eventTypes);

        eventTypes.forEach((eventType, index) => {
            const events = eventGroups[eventType]
                .filter(e => timeToSeconds(e.time) !== null)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            if (events.length === 0) return;

            console.log(`Processing ${eventType}: ${events.length} events`);

            datasets.push({
                label: eventType,
                data: events.map(e => ({
                    x: e.date,
                    y: timeToSeconds(e.time)
                })),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '33',
                borderWidth: 3,
                pointRadius: events.map(e => {
                    // Larger points for B and BB achievements
                    return (e.timeStandard === 'BB' || e.timeStandard === 'B') ? 8 : 4;
                }),
                pointBackgroundColor: events.map(e => {
                    switch(e.timeStandard) {
                        case 'BB': return '#28a745';
                        case 'B': return '#007bff';
                        default: return colors[index % colors.length]; // Use line color for non-achievements
                    }
                }),
                pointBorderColor: events.map(e => {
                    // White border for achievements, transparent for others
                    return (e.timeStandard === 'BB' || e.timeStandard === 'B') ? '#fff' : 'transparent';
                }),
                pointBorderWidth: events.map(e => {
                    // Thicker border for achievements
                    return (e.timeStandard === 'BB' || e.timeStandard === 'B') ? 3 : 1;
                }),
                fill: false,
                tension: 0.4,
                eventData: events, // Store original event data for tooltips
                // Fix legend color by setting it explicitly
                legendColor: colors[index % colors.length]
            });
        });

        console.log('Creating chart with', datasets.length, 'datasets');

        // Use simpler date handling - no time scale
        unifiedEventChart = new Chart(ctx, {
            type: 'line',
            data: { 
                labels: [...new Set(filteredData.map(e => e.date))].sort(),
                datasets 
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Swimming Progress - All Events',
                        font: { size: 18 }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: false,
                            padding: 15,
                            generateLabels: function(chart) {
                                return chart.data.datasets.map((dataset, index) => ({
                                    text: dataset.label,
                                    fillStyle: dataset.borderColor,
                                    strokeStyle: dataset.borderColor,
                                    lineWidth: 3,
                                    hidden: false,
                                    datasetIndex: index
                                }));
                            }
                        }
                    },
                    tooltip: {
                        mode: 'point',
                        intersect: true,
                        callbacks: {
                            title: function(context) {
                                if (context.length > 0) {
                                    const point = context[0];
                                    const dataset = point.dataset;
                                    const eventIndex = point.dataIndex;
                                    if (dataset.eventData && dataset.eventData[eventIndex]) {
                                        const event = dataset.eventData[eventIndex];
                                        return `${event.event} - ${event.date}`;
                                    }
                                }
                                return '';
                            },
                            label: function(context) {
                                const dataset = context.dataset;
                                const eventIndex = context.dataIndex;
                                if (dataset.eventData && dataset.eventData[eventIndex]) {
                                    const event = dataset.eventData[eventIndex];
                                    return [
                                        `Time: ${event.time}`,
                                        `Standard: ${event.timeStandard}`,
                                        `Meet: ${event.meet}`,
                                        `Points: ${event.points}`
                                    ];
                                }
                                return [`Value: ${context.parsed.y.toFixed(2)}s`];
                            },
                            filter: function(tooltipItem) {
                                // Only show tooltip for the specific point being hovered
                                return true;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        ticks: {
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        reverse: false, // FIXED: Keep normal direction so improvements go downward (inward)
                        title: {
                            display: true,
                            text: 'Time (seconds) - Lower is Better'
                        },
                        ticks: {
                            callback: function(value) {
                                return secondsToTimeString(value);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    onComplete: function(animation) {
                        // Add inline legends on the lines
                        const chart = animation.chart;
                        const ctx = chart.ctx;
                        
                        try {
                            ctx.save();
                            ctx.font = 'bold 12px Arial';
                            ctx.fillStyle = '#333';
                            ctx.strokeStyle = 'white';
                            ctx.lineWidth = 3;
                            
                            chart.data.datasets.forEach((dataset, index) => {
                                const meta = chart.getDatasetMeta(index);
                                if (meta.data.length > 0) {
                                    // Find the highest point (best time) for each dataset to place label above
                                    let bestPoint = meta.data[0];
                                    let bestY = bestPoint ? bestPoint.y : 0;
                                    
                                    meta.data.forEach(point => {
                                        if (point && point.y < bestY) {  // Lower Y = better time
                                            bestY = point.y;
                                            bestPoint = point;
                                        }
                                    });
                                    
                                    if (bestPoint && bestPoint.x && bestPoint.y) {
                                        // Position label above the best point
                                        const x = bestPoint.x;
                                        const y = bestPoint.y - 20; // 20px above the point
                                        
                                        // Ensure label doesn't go off the top of the chart
                                        const finalY = Math.max(y, 15);
                                        
                                        // Draw background stroke for better readability
                                        ctx.strokeText(dataset.label, x, finalY);
                                        // Draw the text
                                        ctx.fillStyle = dataset.borderColor;
                                        ctx.fillText(dataset.label, x, finalY);
                                    }
                                    
                                    // Draw achievement markers for B and BB times
                                    meta.data.forEach((point, pointIndex) => {
                                        if (point && dataset.eventData && dataset.eventData[pointIndex]) {
                                            const event = dataset.eventData[pointIndex];
                                            if (event.timeStandard === 'BB' || event.timeStandard === 'B') {
                                                const x = point.x;
                                                const y = point.y;
                                                
                                                // Draw a star or special marker
                                                ctx.save();
                                                ctx.fillStyle = event.timeStandard === 'BB' ? '#28a745' : '#007bff';
                                                ctx.strokeStyle = '#fff';
                                                ctx.lineWidth = 2;
                                                
                                                // Draw a small achievement badge
                                                ctx.beginPath();
                                                ctx.arc(x, y - 12, 6, 0, 2 * Math.PI);
                                                ctx.fill();
                                                ctx.stroke();
                                                
                                                // Draw achievement text
                                                ctx.fillStyle = '#fff';
                                                ctx.font = 'bold 8px Arial';
                                                ctx.textAlign = 'center';
                                                ctx.fillText(event.timeStandard, x, y - 9);
                                                ctx.restore();
                                            }
                                        }
                                    });
                                }
                            });
                            ctx.restore();
                        } catch (e) {
                            console.log('Inline legend error (non-critical):', e);
                        }
                    }
                }
            }
        });

        console.log('Chart created successfully');
    } catch (error) {
        console.error('Error initializing unified event chart:', error);
        // Create a simple error chart
        unifiedEventChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Error'],
                datasets: [{
                    label: 'Chart Error',
                    data: [0],
                    borderColor: '#dc3545',
                    backgroundColor: '#f8d7da'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Error loading chart. Check console for details.',
                        font: { size: 16 }
                    }
                }
            }
        });
    }
}

// Filter event data based on current filter settings
function getFilteredEventData() {
    console.log('Current filters:', chartFilters);
    console.log('Total events:', eventData.length);
    
    // If all filters are "ALL", return all valid events
    if (chartFilters.courseType === 'ALL' && 
        chartFilters.distance === 'ALL' && 
        chartFilters.stroke === 'ALL' && 
        chartFilters.timePeriod === 'ALL') {
        const validEvents = eventData.filter(event => timeToSeconds(event.time) !== null);
        console.log('All filters are ALL, returning', validEvents.length, 'valid events');
        return validEvents;
    }
    
    const filtered = eventData.filter(event => {
        // Skip events with invalid times
        if (timeToSeconds(event.time) === null) {
            return false;
        }
        
        const eventInfo = parseEventName(event.event);
        
        // Course type filter
        if (chartFilters.courseType !== 'ALL' && eventInfo.courseType !== chartFilters.courseType) {
            return false;
        }
        
        // Distance filter
        if (chartFilters.distance !== 'ALL' && eventInfo.distance !== chartFilters.distance) {
            return false;
        }
        
        // Stroke filter (handle relay events)
        if (chartFilters.stroke !== 'ALL') {
            if (eventInfo.stroke.includes('Relay') || eventInfo.stroke.includes('Medley')) {
                // For relay/medley events, only show if "ALL" is selected
                return false;
            } else if (eventInfo.stroke !== chartFilters.stroke) {
                return false;
            }
        }
        
        // Time period filter
        if (chartFilters.timePeriod !== 'ALL') {
            const eventDate = new Date(event.date);
            const now = new Date();
            
            switch (chartFilters.timePeriod) {
                case 'LAST_6_MONTHS':
                    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                    if (eventDate < sixMonthsAgo) return false;
                    break;
                case 'LAST_YEAR':
                    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    if (eventDate < oneYearAgo) return false;
                    break;
                case 'CURRENT_YEAR':
                    if (eventDate.getFullYear() !== now.getFullYear()) return false;
                    break;
            }
        }
        
        return true;
    });
    
    console.log('Filtered events:', filtered.length);
    return filtered;
}

// Update chart filters and refresh unified chart
function updateChartFilters() {
    const courseTypeFilter = document.getElementById('courseTypeFilter');
    const distanceFilter = document.getElementById('distanceFilter');
    const strokeFilter = document.getElementById('strokeFilter');
    const timePeriodFilter = document.getElementById('timePeriodFilter');
    
    if (courseTypeFilter) chartFilters.courseType = courseTypeFilter.value;
    if (distanceFilter) chartFilters.distance = distanceFilter.value;
    if (strokeFilter) chartFilters.stroke = strokeFilter.value;
    if (timePeriodFilter) chartFilters.timePeriod = timePeriodFilter.value;
    
    console.log('Updated filters:', chartFilters);
    initializeUnifiedEventChart();
}

// Initialize filter values
function initializeFilterValues() {
    const courseTypeFilter = document.getElementById('courseTypeFilter');
    const distanceFilter = document.getElementById('distanceFilter');
    const strokeFilter = document.getElementById('strokeFilter');
    const timePeriodFilter = document.getElementById('timePeriodFilter');
    
    if (courseTypeFilter) {
        courseTypeFilter.value = chartFilters.courseType;
        chartFilters.courseType = courseTypeFilter.value;
    }
    if (distanceFilter) {
        distanceFilter.value = chartFilters.distance;
        chartFilters.distance = distanceFilter.value;
    }
    if (strokeFilter) {
        strokeFilter.value = chartFilters.stroke;
        chartFilters.stroke = strokeFilter.value;
    }
    if (timePeriodFilter) {
        timePeriodFilter.value = chartFilters.timePeriod;
        chartFilters.timePeriod = timePeriodFilter.value;
    }
    
    console.log('Initialized filters:', chartFilters);
}

// Generate recent achievements section
function generateRecentAchievements() {
    const container = document.getElementById('recentAchievements');
    if (!container) return;
    
    // Get recent events (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentEvents = eventData
        .filter(e => new Date(e.date) >= threeMonthsAgo)
        .filter(e => e.timeStandard === 'BB' || e.timeStandard === 'B')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);
    
    container.innerHTML = '';
    
    if (recentEvents.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No recent achievements in the last 3 months</p>';
        return;
    }
    
    recentEvents.forEach(event => {
        const achievementCard = document.createElement('div');
        achievementCard.style.cssText = `
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid ${event.timeStandard === 'BB' ? '#28a745' : '#007bff'};
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        achievementCard.innerHTML = `
            <div style="font-weight: bold; color: #2a5298;">${event.event}</div>
            <div style="font-size: 1.2em; margin: 5px 0;">${event.time}</div>
            <div style="color: ${event.timeStandard === 'BB' ? '#28a745' : '#007bff'}; font-weight: bold;">
                ${event.timeStandard} Time Standard
            </div>
            <div style="font-size: 0.9em; color: #666; margin-top: 5px;">${event.date}</div>
        `;
        
        container.appendChild(achievementCard);
    });
}

// Initialize personal records table
function initializePersonalRecordsTable() {
    const container = document.getElementById('personalRecordsTable');
    if (!container) return;
    
    const prs = calculatePersonalRecords();
    const improvements = calculateImprovements();
    
    if (Object.keys(prs).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No personal records available</p>';
        return;
    }
    
    let tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #2a5298; color: white;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Event</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Best Time</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Standard</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Date</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Improvement</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Sort by date (most recent first)
    const sortedEvents = Object.keys(prs).sort((a, b) => {
        return new Date(prs[b].date) - new Date(prs[a].date);
    });
    
    sortedEvents.forEach(event => {
        const pr = prs[event];
        const improvement = improvements[event];
        
        const standardColor = pr.timeStandard === 'BB' ? '#28a745' : 
                             pr.timeStandard === 'B' ? '#007bff' : '#dc3545';
        
        tableHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${event}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${pr.timeString}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: ${standardColor}; font-weight: bold;">${pr.timeStandard}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${pr.date}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">
                    ${improvement ? 
                        `<span style="color: #28a745;">-${improvement.improvement.toFixed(2)}s (${improvement.improvementPercent}%)</span>` :
                        '<span style="color: #666;">-</span>'
                    }
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

// Initialize improvement analytics
function initializeImprovementAnalytics() {
    const container = document.getElementById('improvementAnalytics');
    if (!container) return;
    
    const improvements = calculateImprovements();
    
    if (Object.keys(improvements).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No improvement data available</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // Sort by most recent last date
    const sortedEvents = Object.keys(improvements).sort((a, b) => {
        return new Date(improvements[b].lastDate) - new Date(improvements[a].lastDate);
    });
    
    sortedEvents.forEach(event => {
        const improvement = improvements[event];
        
        const card = document.createElement('div');
        card.style.cssText = `
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        card.innerHTML = `
            <div style="font-weight: bold; color: #2a5298; margin-bottom: 10px;">${event}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <div style="font-size: 0.9em; color: #666;">First Time</div>
                    <div style="font-weight: bold;">${improvement.firstTime} (${improvement.firstDate})</div>
                </div>
                <div>
                    <div style="font-size: 0.9em; color: #666;">Latest Time</div>
                    <div style="font-weight: bold;">${improvement.lastTime} (${improvement.lastDate})</div>
                </div>
            </div>
            <div style="margin-top: 10px; padding: 10px; background: #e8f5e8; border-radius: 5px;">
                <span style="color: #28a745; font-weight: bold; font-size: 1.1em;">
                    Improved by ${improvement.improvement.toFixed(2)} seconds (${improvement.improvementPercent}%)
                </span>
            </div>
        `;
        
        container.appendChild(card);
    });
}