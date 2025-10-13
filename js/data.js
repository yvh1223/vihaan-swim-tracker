// Global data storage for Vihaan's swim tracker
let teamData = [
    { team: "CORE – Beginner", startDate: "2021-07-01", endDate: "2021-08-01" },
    { team: "CORE – Advanced Beginner", startDate: "2022-06-01", endDate: "2022-06-30" },
    { team: "CORE – Intermediate", startDate: "2022-07-01", endDate: "2022-07-31" },
    { team: "CA – Level 3", startDate: "2023-06-01", endDate: "2023-06-30" },
    { team: "CA – Level 5", startDate: "2023-07-01", endDate: "2023-07-31" },
    { team: "CORE – Advanced", startDate: "2024-06-01", endDate: "2024-07-31" },
    { team: "YMCA – White", startDate: "2024-08-01", endDate: "2024-08-31" },
    { team: "YMCA – Gray", startDate: "2024-09-01", endDate: "2024-10-31" },
    { team: "YMCA – Navy", startDate: "2024-11-01", endDate: "2025-03-20" },
    { team: "LAC – Bronze-2", startDate: "2025-03-21", endDate: "2025-07-31" },
    { team: "LAC – Gold I", startDate: "2025-08-01", endDate: "2025-12-31" }
];

// Complete event data from CSV
let eventData = [
    { event: "100 FR SCY", date: "2025-07-13", time: "1:20.11", timeStandard: "B", meet: "2025 NT IRON BB/B/C Jumping Into July", points: 216, age: 10 },
    { event: "200 FR SCY", date: "2025-07-13", time: "2:52.97", timeStandard: "B", meet: "2025 NT IRON BB/B/C Jumping Into July", points: 195, age: 10 },
    { event: "50 FR SCY", date: "2025-07-11", time: "35.15", timeStandard: "B", meet: "2025 NT IRON BB/B/C Jumping Into July", points: 336, age: 10 },
    { event: "50 FL SCY", date: "2025-07-11", time: "42.34", timeStandard: "B", meet: "2025 NT IRON BB/B/C Jumping Into July", points: 127, age: 10 },
    { event: "100 IM SCY", date: "2025-07-11", time: "1:31.26", timeStandard: "B", meet: "2025 NT IRON BB/B/C Jumping Into July", points: 209, age: 10 },
    { event: "100 FR SCY", date: "2025-06-15", time: "1:27.33", timeStandard: "B", meet: "2025 NT STAR We Love Flip Turns Meet", points: 80, age: 10 },
    { event: "100 BK SCY", date: "2025-06-15", time: "1:33.57", timeStandard: "B", meet: "2025 NT STAR We Love Flip Turns Meet", points: 187, age: 10 },
    { event: "50 FL SCY", date: "2025-06-15", time: "47.20", timeStandard: "Slower than B", meet: "2025 NT STAR We Love Flip Turns Meet", points: 4, age: 10 },
    { event: "100 IM SCY", date: "2025-06-15", time: "1:42.33", timeStandard: "Slower than B", meet: "2025 NT STAR We Love Flip Turns Meet", points: 46, age: 10 },
    { event: "50 FR SCY", date: "2025-06-14", time: "35.81", timeStandard: "B", meet: "2025 NT STAR We Love Flip Turns Meet", points: 302, age: 10 },
    { event: "200 FR SCY", date: "2025-06-14", time: "2:57.44", timeStandard: "B", meet: "2025 NT STAR We Love Flip Turns Meet", points: 153, age: 10 },
    { event: "50 BK SCY", date: "2025-06-14", time: "41.60", timeStandard: "BB", meet: "2025 NT STAR We Love Flip Turns Meet", points: 271, age: 10 },
    { event: "100 BR SCY", date: "2025-06-14", time: "1:52.87", timeStandard: "B", meet: "2025 NT STAR We Love Flip Turns Meet", points: 90, age: 10 },
    { event: "50 FR SCY", date: "2025-05-04", time: "36.33", timeStandard: "B", meet: "2025 NT Metroplex Aquatics May B/C Short Course Meet", points: 276, age: 10 },
    { event: "50 BR SCY", date: "2025-05-04", time: "46.43", timeStandard: "BB", meet: "2025 NT Metroplex Aquatics May B/C Short Course Meet", points: 270, age: 10 },
    { event: "100 IM SCY", date: "2025-05-04", time: "1:33.83", timeStandard: "B", meet: "2025 NT Metroplex Aquatics May B/C Short Course Meet", points: 163, age: 10 },
    { event: "100 FR SCY", date: "2025-05-03", time: "1:22.82", timeStandard: "B", meet: "2025 NT Metroplex Aquatics May B/C Short Course Meet", points: 160, age: 10 },
    { event: "50 FL SCY", date: "2025-05-03", time: "47.11", timeStandard: "Slower than B", meet: "2025 NT Metroplex Aquatics May B/C Short Course Meet", points: 5, age: 10 },
    { event: "100 FR SCY", date: "2025-04-18", time: "1:24.57", timeStandard: "B", meet: "2025 April JSL", points: 127, age: 10 },
    { event: "50 BK SCY", date: "2025-04-18", time: "42.89", timeStandard: "BB", meet: "2025 April JSL", points: 216, age: 10 },
    { event: "50 BR SCY", date: "2025-04-18", time: "46.44", timeStandard: "BB", meet: "2025 April JSL", points: 269, age: 10 },
    { event: "50 FR SCY", date: "2024-09-22", time: "43.50", timeStandard: "9-10", meet: "YMCA Dallas Fall Sprint Meet 2024", points: 0, age: 9 },
    { event: "50 BR SCY", date: "2024-09-22", time: "54.01", timeStandard: "10&U", meet: "YMCA Dallas Fall Sprint Meet 2024", points: 0, age: 9 },
    { event: "100 FR Relay", date: "2024-10-18", time: "1:29.69", timeStandard: "0-10", meet: "Coppell Intersquad Meet", points: 0, age: 9 },
    { event: "50 FL SCY", date: "2024-10-18", time: "52.15", timeStandard: "0-10", meet: "Coppell Intersquad Meet", points: 0, age: 9 },
    { event: "100 IM SCY", date: "2024-10-18", time: "1:43.26", timeStandard: "0-10", meet: "Coppell Intersquad Meet", points: 0, age: 9 },
    { event: "50 BR SCY", date: "2024-10-18", time: "50.45", timeStandard: "0-10", meet: "Coppell Intersquad Meet", points: 0, age: 9 },
    { event: "100 FR SCY", date: "2024-10-26", time: "1:24.16", timeStandard: "9-10", meet: "YMCA Dallas League Meet October 2023", points: 0, age: 9 },
    { event: "50 FL SCY", date: "2024-10-26", time: "DQ", timeStandard: "0-10", meet: "YMCA Dallas League Meet October 2023", points: 0, age: 9 },
    { event: "50 BR SCY", date: "2024-10-26", time: "49.01", timeStandard: "0-10", meet: "YMCA Dallas League Meet October 2023", points: 0, age: 9 },
    { event: "100 BR SCY", date: "2024-11-09", time: "1:44.38", timeStandard: "Mixed", meet: "2024 YMCA Texas North-South Meet", points: 0, age: 9 },
    { event: "50 FL SCY", date: "2024-11-09", time: "50.79", timeStandard: "Mixed", meet: "2024 YMCA Texas North-South Meet", points: 0, age: 9 },
    { event: "100 FR SCY", date: "2024-11-09", time: "1:26.54", timeStandard: "Mixed", meet: "2024 YMCA Texas North-South Meet", points: 0, age: 9 },
    { event: "200 Medley Relay", date: "2024-11-09", time: "3:12.93", timeStandard: "Mixed", meet: "2024 YMCA Texas North-South Meet", points: 0, age: 9 },
    { event: "200 Medley Relay", date: "2024-12-07", time: "2:51.95", timeStandard: "0-10", meet: "YMCA Dallas Winter Champs 2024", points: 0, age: 9 },
    { event: "100 IM SCY", date: "2024-12-07", time: "1:40.48", timeStandard: "9-10", meet: "YMCA Dallas Winter Champs 2024", points: 0, age: 9 },
    { event: "100 FR SCY", date: "2024-12-08", time: "1:30.85", timeStandard: "9-10", meet: "YMCA Dallas Winter Champs 2024", points: 0, age: 9 },
    { event: "100 FL SCY", date: "2024-12-08", time: "2:02.70", timeStandard: "9-10", meet: "YMCA Dallas Winter Champs 2024", points: 0, age: 9 },
    { event: "200 FR Relay", date: "2024-12-08", time: "2:15.68", timeStandard: "0-14", meet: "YMCA Dallas Winter Champs 2024", points: 0, age: 9 },
    { event: "200 FR SCY", date: "2024-12-08", time: "3:14.32", timeStandard: "9-10", meet: "YMCA Dallas Winter Champs 2024", points: 0, age: 9 },
    { event: "100 BK SCY", date: "2024-12-08", time: "1:39.39", timeStandard: "9-10", meet: "YMCA Dallas Winter Champs 2024", points: 0, age: 9 },
    { event: "100 BR SCY", date: "2024-12-08", time: "1:46.36", timeStandard: "9-10", meet: "YMCA Dallas Winter Champs 2024", points: 0, age: 9 },
    { event: "50 FR SCY", date: "2025-02-22", time: "37.88", timeStandard: "0-10", meet: "YMCA Dallas League Meet @ Coppell", points: 0, age: 10 },
    { event: "50 BK SCY", date: "2025-02-22", time: "44.65", timeStandard: "0-10", meet: "YMCA Dallas League Meet @ Coppell", points: 0, age: 10 },
    { event: "50 BR SCY", date: "2025-02-22", time: "46.91", timeStandard: "0-10", meet: "YMCA Dallas League Meet @ Coppell", points: 0, age: 10 },
    { event: "200 FR SCY", date: "2025-10-04", time: "2:45.08", timeStandard: "BB", meet: "2025 NT LAC Splashing Pumpkins", points: 278, age: 10 },
    { event: "100 BK SCY", date: "2025-10-05", time: "1:24.00", timeStandard: "BB", meet: "2025 NT LAC Splashing Pumpkins", points: 384, age: 10 },
    { event: "50 BR SCY", date: "2025-10-04", time: "44.10", timeStandard: "BB", meet: "2025 NT LAC Splashing Pumpkins", points: 366, age: 10 },
    { event: "100 BR SCY", date: "2025-10-05", time: "1:38.29", timeStandard: "BB", meet: "2025 NT LAC Splashing Pumpkins", points: 326, age: 10 },
    { event: "100 FL SCY", date: "2025-10-04", time: "1:40.26", timeStandard: "B", meet: "2025 NT LAC Splashing Pumpkins", points: 98, age: 10 },
    { event: "100 IM SCY", date: "2025-10-05", time: "1:26.52", timeStandard: "BB", meet: "2025 NT LAC Splashing Pumpkins", points: 307, age: 10 },
    { event: "200 IM SCY", date: "2025-10-03", time: "3:06.13", timeStandard: "BB", meet: "2025 NT LAC Splashing Pumpkins", points: 307, age: 10 }
];

// Time Standards from USA Swimming Motivational Times (SCY)
const timeStandards = {
    "10&U": {
        "50 FR SCY": { "A": 34.19, "B": 41.99, "BB": 38.09 },
        "100 FR SCY": { "A": 76.99, "B": 96.99, "BB": 86.99 },
        "200 FR SCY": { "A": 164.99, "B": 206.29, "BB": 185.69 },
        "50 BK SCY": { "A": 40.99, "B": 52.69, "BB": 46.79 },
        "100 BK SCY": { "A": 87.49, "B": 110.69, "BB": 99.09 },
        "50 BR SCY": { "A": 45.29, "B": 57.59, "BB": 51.39 },
        "100 BR SCY": { "A": 99.59, "B": 125.59, "BB": 112.59 },
        "50 FL SCY": { "A": 39.09, "B": 50.49, "BB": 44.79 },
        "100 FL SCY": { "A": 92.29, "B": 124.19, "BB": 108.29 },
        "100 IM SCY": { "A": 87.89, "B": 109.79, "BB": 98.79 },
        "200 IM SCY": { "A": 188.89, "B": 238.09, "BB": 213.49 }
    },
    "11-12": {
        "50 FR SCY": { "A": 30.89, "B": 35.99, "BB": 33.39 },
        "100 FR SCY": { "A": 67.29, "B": 78.49, "BB": 72.89 },
        "200 FR SCY": { "A": 147.49, "B": 172.09, "BB": 159.79 },
        "50 BK SCY": { "A": 35.69, "B": 42.19, "BB": 38.99 },
        "100 BK SCY": { "A": 76.59, "B": 90.89, "BB": 83.69 },
        "50 BR SCY": { "A": 39.99, "B": 47.39, "BB": 43.69 },
        "100 BR SCY": { "A": 86.69, "B": 102.29, "BB": 94.39 },
        "50 FL SCY": { "A": 34.49, "B": 40.99, "BB": 37.79 },
        "100 FL SCY": { "A": 76.89, "B": 92.09, "BB": 84.49 },
        "100 IM SCY": { "A": 76.39, "B": 89.39, "BB": 82.89 },
        "200 IM SCY": { "A": 166.69, "B": 196.19, "BB": 181.49 }
    }
};

// Chart instances
let ganttChart, overviewChart, unifiedEventChart;
let eventCharts = {};
let ganttViewMode = 'timeline'; // 'duration' or 'timeline' - default to timeline

// Filter state for unified chart - default to ALL for comprehensive view
let chartFilters = {
    courseType: 'SCY',
    distance: 'ALL',
    stroke: 'ALL',
    timePeriod: 'ALL'
};

// Helper functions for data parsing and analysis
function parseEventName(eventName) {
    const parts = eventName.split(' ');
    
    // Handle different event formats
    if (parts.length >= 3) {
        const distance = parts[0];
        const stroke = parts[1];
        const courseType = parts[2] || 'SCY';
        return { distance, stroke, courseType };
    } else if (parts.length === 2) {
        // Handle cases like "100 FR" without course type
        const distance = parts[0];
        const stroke = parts[1];
        const courseType = 'SCY'; // Default
        return { distance, stroke, courseType };
    } else {
        // Fallback for malformed event names
        return { distance: 'Unknown', stroke: 'Unknown', courseType: 'SCY' };
    }
}

function timeToSeconds(timeString) {
    if (timeString === 'DQ' || timeString === 'Pending' || !timeString) {
        return null;
    }
    
    const parts = timeString.split(':');
    if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(timeString);
}

function secondsToTimeString(seconds) {
    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(2);
        return `${minutes}:${secs.padStart(5, '0')}`;
    }
    return seconds.toFixed(2);
}

function calculatePersonalRecords() {
    const prs = {};
    
    eventData.forEach(event => {
        const time = timeToSeconds(event.time);
        if (time === null) return;
        
        if (!prs[event.event] || time < prs[event.event].time) {
            prs[event.event] = {
                time: time,
                timeString: event.time,
                date: event.date,
                meet: event.meet,
                timeStandard: event.timeStandard
            };
        }
    });
    
    return prs;
}

function calculateImprovements() {
    const improvements = {};
    const eventGroups = {};
    
    // Group events by event type
    eventData.forEach(event => {
        if (!eventGroups[event.event]) {
            eventGroups[event.event] = [];
        }
        eventGroups[event.event].push(event);
    });
    
    // Calculate improvements for each event
    Object.keys(eventGroups).forEach(eventType => {
        const events = eventGroups[eventType]
            .filter(e => timeToSeconds(e.time) !== null)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            
        if (events.length >= 2) {
            const firstTime = timeToSeconds(events[0].time);
            const lastTime = timeToSeconds(events[events.length - 1].time);
            const improvement = firstTime - lastTime;
            const improvementPercent = ((improvement / firstTime) * 100).toFixed(2);
            
            improvements[eventType] = {
                improvement: improvement,
                improvementPercent: improvementPercent,
                firstTime: events[0].time,
                lastTime: events[events.length - 1].time,
                firstDate: events[0].date,
                lastDate: events[events.length - 1].date
            };
        }
    });
    
    return improvements;
}

// AI-powered trend analysis and target prediction
function analyzeSwimmingTrends() {
    const analysis = {
        eventAnalysis: {},
        monthlyTargets: {},
        recommendations: []
    };
    
    // Group events by type for trend analysis
    const eventGroups = {};
    eventData.forEach(event => {
        if (!eventGroups[event.event]) {
            eventGroups[event.event] = [];
        }
        eventGroups[event.event].push(event);
    });
    
    // Analyze each event type
    Object.keys(eventGroups).forEach(eventType => {
        const events = eventGroups[eventType]
            .filter(e => timeToSeconds(e.time) !== null)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            
        if (events.length >= 2) {
            const firstTime = timeToSeconds(events[0].time);
            const lastTime = timeToSeconds(events[events.length - 1].time);
            const improvement = firstTime - lastTime;
            const timeSpan = (new Date(events[events.length - 1].date) - new Date(events[0].date)) / (1000 * 60 * 60 * 24 * 30); // months
            
            // Calculate improvement rate per month
            const monthlyImprovementRate = improvement / timeSpan;
            
            // Predict future targets (next 6 months)
            const currentTime = lastTime;
            const targets = [];
            
            for (let month = 1; month <= 6; month++) {
                const targetTime = Math.max(currentTime - (monthlyImprovementRate * month * 0.8), currentTime * 0.85); // Conservative estimate
                targets.push({
                    month: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 7),
                    targetTime: secondsToTimeString(targetTime),
                    improvementNeeded: secondsToTimeString(currentTime - targetTime)
                });
            }
            
            // Generate event-specific recommendations
            const recentImprovement = improvement > 0;
            const improvementPercent = (improvement / firstTime) * 100;
            
            analysis.eventAnalysis[eventType] = {
                totalImprovement: secondsToTimeString(improvement),
                improvementPercent: improvementPercent.toFixed(1),
                monthlyRate: secondsToTimeString(Math.abs(monthlyImprovementRate)),
                trend: recentImprovement ? 'improving' : 'stable',
                confidence: events.length >= 4 ? 'high' : 'medium'
            };
            
            analysis.monthlyTargets[eventType] = targets;
            
            // Generate recommendations based on performance
            if (improvementPercent > 5) {
                analysis.recommendations.push({
                    event: eventType,
                    type: 'maintain',
                    message: `Excellent progress in ${eventType}! Focus on technique refinement and consistency.`
                });
            } else if (improvementPercent < 2 && events.length >= 3) {
                analysis.recommendations.push({
                    event: eventType,
                    type: 'focus',
                    message: `${eventType} needs attention. Consider targeted drills and stroke technique work.`
                });
            }
        }
    });
    
    // General recommendations based on overall performance
    const totalEvents = Object.keys(eventGroups).length;
    const improvingEvents = Object.keys(analysis.eventAnalysis).filter(
        event => analysis.eventAnalysis[event].trend === 'improving'
    ).length;
    
    if (improvingEvents / totalEvents > 0.7) {
        analysis.recommendations.push({
            event: 'Overall',
            type: 'excellent',
            message: 'Outstanding overall improvement! Continue current training regimen and consider advancing to more competitive events.'
        });
    } else if (improvingEvents / totalEvents < 0.3) {
        analysis.recommendations.push({
            event: 'Overall',
            type: 'review',
            message: 'Consider reviewing training approach. Focus on fundamental techniques and gradual progression.'
        });
    }
    
    return analysis;
}

// Predict future times based on recent performance (July 2025 to October 2025)
function predictFutureTimes(eventType, targetDate) {
    // Get all times for this event, sorted by date
    const eventTimes = eventData
        .filter(e => e.event === eventType && timeToSeconds(e.time) !== null)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (eventTimes.length < 2) return null;

    // Focus on recent performances (July 2025 onwards for better accuracy)
    const recentTimes = eventTimes.filter(e => new Date(e.date) >= new Date('2025-07-01'));
    const timesToAnalyze = recentTimes.length >= 2 ? recentTimes : eventTimes.slice(-3);

    if (timesToAnalyze.length < 2) return null;

    // Calculate linear regression for time improvement
    const dataPoints = timesToAnalyze.map(e => ({
        date: new Date(e.date).getTime(),
        time: timeToSeconds(e.time)
    }));

    // Linear regression calculation
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.date, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.time, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + (p.date * p.time), 0);
    const sumXX = dataPoints.reduce((sum, p) => sum + (p.date * p.date), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict time at target date
    const targetTime = slope * new Date(targetDate).getTime() + intercept;

    // Calculate confidence based on improvement consistency
    const currentBest = Math.min(...dataPoints.map(p => p.time));
    const improvementRate = Math.abs(slope) * (30 * 24 * 60 * 60 * 1000); // per month in seconds

    return {
        predictedTime: Math.max(targetTime, currentBest * 0.85), // Don't predict impossibly fast times
        currentBest: currentBest,
        improvementRate: improvementRate,
        confidence: timesToAnalyze.length >= 3 ? 'high' : 'medium',
        dataPoints: dataPoints.length
    };
}

// Generate timeline data with predictions extending to March 2026
function generateTimelineWithPredictions(eventType) {
    const historicalData = eventData
        .filter(e => e.event === eventType && timeToSeconds(e.time) !== null)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(e => ({
            date: e.date,
            time: timeToSeconds(e.time),
            meet: e.meet,
            isPrediction: false
        }));

    if (historicalData.length === 0) return { historical: [], predictions: [] };

    // Generate monthly predictions from now until March 2026
    const predictions = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    const targetDate = new Date('2026-03-31');

    let currentDate = new Date(lastDate);
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1); // First of next month

    while (currentDate <= targetDate) {
        const prediction = predictFutureTimes(eventType, currentDate.toISOString().split('T')[0]);
        if (prediction) {
            predictions.push({
                date: currentDate.toISOString().split('T')[0],
                time: prediction.predictedTime,
                isPrediction: true,
                confidence: prediction.confidence
            });
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return { historical: historicalData, predictions };
}

// Get appropriate time standard for Vihaan based on date (turns 11 in January 2026)
function getTimeStandardForDate(eventType, date) {
    const checkDate = new Date(date);
    const birthdayMonth = new Date('2026-01-01'); // Approximation - turns 11 in January 2026

    const ageGroup = checkDate >= birthdayMonth ? '11-12' : '10&U';
    return timeStandards[ageGroup][eventType] || null;
}

// Calculate goal time needed for 11-12 BB standard by March 2026
function getGoalAnalysis(eventType) {
    const currentPR = eventData
        .filter(e => e.event === eventType && timeToSeconds(e.time) !== null)
        .map(e => timeToSeconds(e.time))
        .reduce((min, time) => Math.min(min, time), Infinity);

    if (!isFinite(currentPR)) return null;

    const marchPrediction = predictFutureTimes(eventType, '2026-03-31');
    const targetStandard = timeStandards['11-12'][eventType];

    if (!targetStandard || !marchPrediction) return null;

    const targetBB = targetStandard.BB;
    const predictedTime = marchPrediction.predictedTime;
    const gap = predictedTime - targetBB;

    return {
        currentPR: currentPR,
        currentPRFormatted: secondsToTimeString(currentPR),
        predictedMarch2026: predictedTime,
        predictedFormatted: secondsToTimeString(predictedTime),
        targetBB: targetBB,
        targetBBFormatted: secondsToTimeString(targetBB),
        gap: gap,
        gapFormatted: secondsToTimeString(Math.abs(gap)),
        onTrack: gap <= 0,
        improvementNeeded: gap > 0 ? secondsToTimeString(gap) : null,
        monthlyImprovementNeeded: gap > 0 ? secondsToTimeString(gap / 5) : null // 5 months till March
    };
}

// ===================================
// SUPABASE INTEGRATION
// ===================================

// Global state for Supabase integration
let currentSwimmerId = null;
let swimmers = [];
let usingSupabase = false;

/**
 * Initialize the application - try Supabase first, fallback to hardcoded data
 */
async function initializeApp() {
    updateDataIndicator('loading', '📊 Loading data...');

    try {
        // Initialize Supabase client
        await window.SupabaseClient.init();

        // Try to load swimmers from Supabase
        swimmers = await window.SupabaseClient.getAllSwimmers();

        if (swimmers && swimmers.length > 0) {
            usingSupabase = true;
            console.log('✅ Connected to Supabase database');

            // Populate swimmer dropdown
            populateSwimmerDropdown(swimmers);

            // Load data for first swimmer
            if (swimmers.length > 0) {
                await loadSwimmerData(swimmers[0].id);
            }

            updateDataIndicator('success', `🗄️ Database (${swimmers[0].full_name})`);
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Supabase not available, using local data:', error);
    }

    // Fallback to hardcoded data
    usingSupabase = false;
    populateSwimmerDropdown([{
        id: 'local',
        full_name: 'Vihaan H Huchchannavar (Local Data)',
        current_age: 10
    }]);

    updateDataIndicator('success', '📁 Local Data Mode');
    return false;
}

/**
 * Load data for a specific swimmer from Supabase
 */
async function loadSwimmerData(swimmerId) {
    try {
        updateDataIndicator('loading', '🔄 Loading swimmer data...');
        currentSwimmerId = swimmerId;

        if (!usingSupabase || swimmerId === 'local') {
            // Use hardcoded local data
            updateDataIndicator('success', '📁 Local Data Mode');
            refreshAllCharts();
            return;
        }

        // Fetch from Supabase
        const [competitionResults, teamProgression] = await Promise.all([
            window.SupabaseClient.getCompetitionResults(swimmerId),
            window.SupabaseClient.getTeamProgression(swimmerId)
        ]);

        // Transform and update global data
        eventData = window.SupabaseClient.transformToEventData(competitionResults);
        teamData = window.SupabaseClient.transformToTeamData(teamProgression);

        console.log(`✅ Loaded ${eventData.length} events and ${teamData.length} teams`);

        // Get swimmer name for indicator
        const swimmer = swimmers.find(s => s.id === swimmerId);
        updateDataIndicator('success', `🗄️ Database (${swimmer?.full_name || 'Unknown'})`);

        // Refresh all charts with new data
        refreshAllCharts();

    } catch (error) {
        console.error('Error loading swimmer data:', error);
        updateDataIndicator('error', '❌ Error loading data');
    }
}

/**
 * Populate the swimmer dropdown
 */
function populateSwimmerDropdown(swimmerList) {
    const select = document.getElementById('swimmerSelect');
    if (!select) return;

    select.innerHTML = '';

    swimmerList.forEach(swimmer => {
        const option = document.createElement('option');
        option.value = swimmer.id;
        option.textContent = swimmer.full_name;
        select.appendChild(option);
    });

    // Set initial selection
    if (swimmerList.length > 0) {
        select.value = swimmerList[0].id;
        currentSwimmerId = swimmerList[0].id;
    }
}

/**
 * Update data source indicator
 */
function updateDataIndicator(status, text) {
    const indicator = document.getElementById('dataSourceIndicator');
    if (!indicator) return;

    indicator.className = 'data-source-indicator';
    if (status === 'loading') {
        indicator.classList.add('loading');
    } else if (status === 'error') {
        indicator.classList.add('error');
    }

    indicator.textContent = text;
}

/**
 * Handle swimmer selection change
 */
async function onSwimmerChange() {
    const select = document.getElementById('swimmerSelect');
    if (!select) return;

    const swimmerId = select.value;
    await loadSwimmerData(swimmerId);
}