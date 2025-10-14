/**
 * Swim Tracker - Clean, Minimal Application
 * No tabs, no clutter, just progress
 */

class SwimTracker {
    constructor() {
        this.currentSwimmer = null;
        this.swimmers = [];
        this.results = [];
        this.teams = [];
        this.charts = {};
        this.supabase = null;
        this.filters = {
            stroke: 'all',
            distance: '50',
            course: 'SCY',
            exclude: ''
        };
        this.insightsSortConfig = {
            column: 'timeline', // default sort by timeline
            direction: 'asc'
        };
        this.cachedInsights = [];
        this.priorityFilter = 'all'; // For Meet Strategy filtering
        this.timeStandardsCache = {}; // Cache for time standards lookups
        this.init();
    }

    async init() {
        try {
            this.updateStatus('Loading data...');
            await this.loadData();
            await this.loadSwimmers();
            this.setupEventListeners();
            this.updateStatus('Ready');
        } catch (error) {
            console.error('Initialization error:', error);
            this.updateStatus('Error loading data');
        }
    }

    async loadSwimmers() {
        try {
            // Initialize Supabase if not already done
            if (!this.supabase && typeof window.supabase !== 'undefined') {
                this.supabase = window.supabase.createClient(
                    'https://gwqwpicbtkamojwwlmlp.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXdwaWNidGthbW9qd3dsbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODk3MzAsImV4cCI6MjA3NTg2NTczMH0.5KiCESGV2zzSmhpwDmJ3TsCwdqyCQXntgTGhWkuV27s'
                );
                console.log('Supabase client initialized');
            }

            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('swimmers')
                    .select('*')
                    .eq('active', true)
                    .order('first_name');

                if (error) throw error;
                this.swimmers = data || [];
                console.log(`Loaded ${this.swimmers.length} swimmers`);
            }

            this.populateSwimmerSelect();

            if (this.swimmers.length > 0) {
                this.selectSwimmer(this.swimmers[0].id);
            }
        } catch (error) {
            console.error('Error loading swimmers:', error);
        }
    }

    async loadData() {
        if (!this.supabase || !this.currentSwimmer) {
            console.log('Supabase not available or no swimmer selected');
            return;
        }

        try {
            const swimmerId = this.currentSwimmer.id;

            // Load competition results for current swimmer
            const { data: results, error: resultsError } = await this.supabase
                .from('competition_results')
                .select('*')
                .eq('swimmer_id', swimmerId)
                .order('event_date', { ascending: true });

            if (resultsError) throw resultsError;
            this.results = results || [];

            // Load team progression for current swimmer
            const { data: teams, error: teamsError } = await this.supabase
                .from('team_progression')
                .select('*')
                .eq('swimmer_id', swimmerId)
                .order('start_date', { ascending: true });

            if (teamsError) throw teamsError;
            this.teams = teams || [];

            console.log(`Loaded ${this.results.length} results and ${this.teams.length} teams`);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    populateSwimmerSelect() {
        const select = document.getElementById('swimmerSelect');
        if (!select) return;

        select.innerHTML = this.swimmers.map(swimmer =>
            `<option value="${swimmer.id}">${swimmer.full_name}</option>`
        ).join('');
    }

    setupEventListeners() {
        const select = document.getElementById('swimmerSelect');
        if (select) {
            select.addEventListener('change', (e) => {
                this.selectSwimmer(parseInt(e.target.value));
            });
        }

        // Filter event listeners
        const strokeFilter = document.getElementById('strokeFilter');
        const distanceFilter = document.getElementById('distanceFilter');
        const courseFilter = document.getElementById('courseFilter');

        if (strokeFilter) {
            strokeFilter.addEventListener('change', (e) => {
                this.filters.stroke = e.target.value;
                this.renderProgressChart();
            });
        }

        if (distanceFilter) {
            distanceFilter.addEventListener('change', (e) => {
                this.filters.distance = e.target.value;
                this.renderProgressChart();
            });
        }

        if (courseFilter) {
            courseFilter.addEventListener('change', (e) => {
                this.filters.course = e.target.value;
                this.renderProgressChart();
            });
        }

        // Exclude filter event listener
        const excludeFilter = document.getElementById('excludeFilter');
        if (excludeFilter) {
            excludeFilter.addEventListener('change', (e) => {
                this.filters.exclude = e.target.value;
                this.renderProgressChart();
            });
        }

        // Priority filter event listeners
        const priorityButtons = document.querySelectorAll('.priority-filter-btn');
        priorityButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                priorityButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                // Update filter and re-render
                this.priorityFilter = e.target.dataset.priority;
                this.filterMeetStrategy();
            });
        });

        // Expand All / Collapse All button event listeners
        const expandAllBtn = document.getElementById('expandAll');
        const collapseAllBtn = document.getElementById('collapseAll');

        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.section-content, .practice-event-content, .phase-content').forEach(el => {
                    el.classList.remove('collapsed');
                    const header = document.querySelector(`[data-target="${el.id}"]`);
                    const icon = header?.querySelector('.collapse-icon');
                    if (icon) icon.textContent = '▲';
                });
            });
        }

        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.section-content, .practice-event-content, .phase-content').forEach(el => {
                    if (!el.classList.contains('collapsed')) {
                        el.classList.add('collapsed');
                        const header = document.querySelector(`[data-target="${el.id}"]`);
                        const icon = header?.querySelector('.collapse-icon');
                        if (icon) icon.textContent = '▼';
                    }
                });
            });
        }
    }

    async selectSwimmer(swimmerId) {
        this.currentSwimmer = this.swimmers.find(s => s.id === swimmerId);
        if (!this.currentSwimmer) return;

        this.updateStatus('Loading swimmer data...');

        // Load data for this swimmer
        await this.loadData();

        // Update UI with loaded data
        this.updateUI();
        await this.renderCharts();

        this.updateStatus('Ready');
    }

    updateUI() {
        if (!this.currentSwimmer) return;

        // Update team logo
        const logoEl = document.getElementById('teamLogo');
        if (logoEl) {
            const currentTeam = this.teams
                .filter(t => t.swimmer_id === this.currentSwimmer.id)
                .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
            const teamName = currentTeam ? currentTeam.team_name : this.currentSwimmer.club || 'Swim';
            logoEl.textContent = `${teamName} Swim Team`;
        }

        // Update stats - COUNT ONLY BEST TIME PER EVENT
        const swimmerResults = this.results.filter(r => r.swimmer_id === this.currentSwimmer.id);

        // Get best time per event (fastest time only)
        const eventBests = {};
        swimmerResults.forEach(result => {
            const key = result.event_name;
            if (!eventBests[key] || result.time_seconds < eventBests[key].time_seconds) {
                eventBests[key] = result;
            }
        });

        // Count distinct events by their BEST standard achieved
        const bestTimes = Object.values(eventBests);
        const aCount = bestTimes.filter(r => r.time_standard === 'A' || r.time_standard === 'AA' || r.time_standard === 'AAA' || r.time_standard === 'AAAA').length;
        const bbCount = bestTimes.filter(r => r.time_standard === 'BB').length;
        const bCount = bestTimes.filter(r => r.time_standard === 'B').length;
        const uniqueEvents = bestTimes.length;

        this.updateStat('aCount', aCount);
        this.updateStat('bbCount', bbCount);
        this.updateStat('bCount', bCount);
        this.updateStat('totalEvents', uniqueEvents);

        // Update records table with best times
        this.renderRecordsTable(bestTimes);
    }

    updateStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    renderRecordsTable(results) {
        const container = document.getElementById('recordsTable');
        if (!container) return;

        // Get best time for each event (exclude relays)
        const eventBests = {};
        results.forEach(result => {
            const key = result.event_name;
            // Skip relay events
            if (key && key.toLowerCase().includes('relay')) return;

            if (!eventBests[key] || result.time_seconds < eventBests[key].time_seconds) {
                eventBests[key] = result;
            }
        });

        const records = Object.values(eventBests)
            .sort((a, b) => {
                // Sort by standard (best first), then by event name
                const standardOrder = { 'AAAA': 0, 'AAA': 1, 'AA': 2, 'A': 3, 'BB': 4, 'B': 5 };
                const aOrder = standardOrder[a.time_standard] ?? 99;
                const bOrder = standardOrder[b.time_standard] ?? 99;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return a.event_name.localeCompare(b.event_name);
            });

        // Compact grid layout - CSS grid applied to container
        let html = '';

        records.forEach(record => {
            const std = record.time_standard || 'Other';
            html += `
                <div class="best-time-row">
                    <span class="best-time-event">${record.event_name}</span>
                    <span class="best-time-value">${record.time_formatted}</span>
                    <span class="record-standard ${std.toLowerCase()}">${std}</span>
                </div>
            `;
        });

        container.innerHTML = html;
        container.className = 'best-times-table';
    }

    async renderCharts() {
        if (!this.currentSwimmer) return;

        this.renderProgressChart();
        await this.renderGapChart();
        await this.renderMeetStrategy();
        await this.renderPracticeStrategy();
        this.renderTimelineChart();
    }

    // Helper method to get time standard with caching
    async getTimeStandard(baseEvent, ageGroup, gender, standardColumn) {
        const cacheKey = `${baseEvent}|${ageGroup}|${gender}|${standardColumn}`;

        // Check cache first
        if (this.timeStandardsCache[cacheKey] !== undefined) {
            return this.timeStandardsCache[cacheKey];
        }

        try {
            const { data: standards } = await this.supabase
                .from('time_standards')
                .select(standardColumn)
                .eq('event_name', baseEvent)
                .eq('age_group', ageGroup)
                .eq('gender', gender)
                .limit(1);

            const value = (standards && standards.length > 0 && standards[0][standardColumn])
                ? parseFloat(standards[0][standardColumn])
                : null;

            // Cache the result
            this.timeStandardsCache[cacheKey] = value;
            return value;
        } catch (err) {
            console.warn(`Could not fetch standard for ${baseEvent}:`, err);
            return null;
        }
    }

    // Filter meet strategy by priority
    filterMeetStrategy() {
        const rows = document.querySelectorAll('.strategy-row');
        rows.forEach(row => {
            const priority = row.dataset.priority;
            if (this.priorityFilter === 'all' || priority === this.priorityFilter) {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        });
    }

    // Calculate linear regression for trend projection
    calculateTrend(data) {
        if (data.length < 2) return null;

        const n = data.length;
        const timestamps = data.map(d => d.x.getTime());
        const values = data.map(d => d.y);

        const sumX = timestamps.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumX2 = timestamps.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    }

    // Project future value based on trend
    projectValue(trend, futureDate) {
        if (!trend) return null;
        const timestamp = futureDate.getTime();
        return trend.slope * timestamp + trend.intercept;
    }

    renderProgressChart() {
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        // Get swimmer's results with filters applied
        let results = this.results
            .filter(r => r.swimmer_id === this.currentSwimmer.id)
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

        // Apply filters
        results = results.filter(result => {
            const eventName = result.event_name || '';

            // Stroke filter (e.g., "100 FR SCY" contains "FR")
            if (this.filters.stroke !== 'all' && !eventName.includes(this.filters.stroke)) {
                return false;
            }

            // Distance filter (e.g., "100 FR SCY" starts with "100")
            if (this.filters.distance !== 'all' && !eventName.startsWith(this.filters.distance + ' ')) {
                return false;
            }

            // Course filter (e.g., "100 FR SCY" ends with "SCY")
            if (this.filters.course !== 'all' && !eventName.endsWith(this.filters.course)) {
                return false;
            }

            // Exclude filter - hide specific event if selected
            if (this.filters.exclude && this.filters.exclude !== '' && eventName === this.filters.exclude) {
                return false;
            }

            return true;
        });

        // Group by event
        const eventGroups = {};
        results.forEach(result => {
            if (!eventGroups[result.event_name]) {
                eventGroups[result.event_name] = [];
            }
            eventGroups[result.event_name].push({
                x: new Date(result.event_date),
                y: result.time_seconds
            });
        });

        const datasets = [];
        const projectionMonths = 3; // Project 3 months ahead

        Object.entries(eventGroups).forEach(([event, data], index) => {
            // Main data line
            datasets.push({
                label: event,
                data,
                borderColor: this.getColor(index),
                backgroundColor: this.getColor(index, 0.1),
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.3
            });

            // Add monthly projections extending to March 2026
            if (data.length >= 3) {
                const trend = this.calculateTrend(data);
                if (trend && trend.slope < 0) { // Only show if improving (negative slope)
                    const lastDate = data[data.length - 1].x;
                    const targetDate = new Date(2026, 2, 31); // March 2026
                    const monthsToProject = Math.ceil((targetDate - lastDate) / (1000 * 60 * 60 * 24 * 30));

                    if (monthsToProject > 0 && monthsToProject <= 12) {
                        const projectionData = [{ x: lastDate, y: data[data.length - 1].y }];

                        // Generate monthly projection points
                        for (let month = 1; month <= monthsToProject; month++) {
                            const futureDate = new Date(lastDate);
                            futureDate.setMonth(futureDate.getMonth() + month);

                            const projectedTime = this.projectValue(trend, futureDate);

                            if (projectedTime > 0) {
                                projectionData.push({
                                    x: futureDate,
                                    y: projectedTime
                                });
                            }
                        }

                        datasets.push({
                            label: `${event} (projected)`,
                            data: projectionData,
                            borderColor: this.getColor(index, 0.5),
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            pointRadius: 4,
                            pointStyle: 'circle',
                            pointBackgroundColor: this.getColor(index, 0.3),
                            pointBorderColor: this.getColor(index, 0.7),
                            pointBorderWidth: 1,
                            tension: 0,
                            hidden: false
                        });
                    }
                }
            }
        });

        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'nearest',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 12, family: 'Inter' },
                            filter: (item) => !item.text.includes('(projected)') // Hide projection from legend
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        bodyFont: { size: 14 },
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                // Format date without time
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                });
                            },
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = this.formatTime(context.parsed.y);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'month' },
                        grid: { display: false },
                        ticks: { font: { size: 12 } }
                    },
                    y: {
                        reverse: false,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 12 },
                            callback: value => this.formatTime(value)
                        },
                        title: {
                            display: true,
                            text: 'Time (lower is better)',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });

        // Populate exclude filter dropdown with available events
        this.populateExcludeFilter(eventGroups);

        // Generate insights
        this.generateProgressInsights(eventGroups);
    }

    populateExcludeFilter(eventGroups) {
        const excludeFilter = document.getElementById('excludeFilter');
        if (!excludeFilter) return;

        // Get all unique event names
        const eventNames = Object.keys(eventGroups).sort();

        // Store current selection
        const currentSelection = this.filters.exclude;

        // Build options HTML
        let optionsHTML = '<option value="">No Exclusions</option>';
        eventNames.forEach(event => {
            const selected = event === currentSelection ? 'selected' : '';
            optionsHTML += `<option value="${event}" ${selected}>${event}</option>`;
        });

        excludeFilter.innerHTML = optionsHTML;
    }

    async generateProgressInsights(eventGroups) {
        const container = document.getElementById('progressInsights');
        const contentContainer = document.getElementById('progressInsightsContent');
        if (!container || !contentContainer) return;

        const insights = [];

        for (const [event, data] of Object.entries(eventGroups)) {
            if (data.length < 2) continue;

            const trend = this.calculateTrend(data);
            if (!trend || trend.slope >= 0) continue; // Skip if not improving

            // Calculate average improvement per month
            const firstDate = data[0].x;
            const lastDate = data[data.length - 1].x;
            const monthsDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30);
            const totalImprovement = data[0].y - data[data.length - 1].y;
            const improvementPerMonth = totalImprovement / monthsDiff;

            // Lower threshold to include more events (was 0.1, now 0.01)
            if (improvementPerMonth < 0.01) continue;

            // Get target standard info
            const currentTime = data[data.length - 1].y;
            const lastEventDate = data[data.length - 1].x; // Get the date of last swim
            const currentResult = this.results.find(r =>
                r.event_name === event &&
                r.time_seconds === currentTime
            );

            let targetStandard = null;
            if (!currentResult?.time_standard || currentResult.time_standard === 'B') {
                targetStandard = 'BB';
            } else if (currentResult.time_standard === 'BB') {
                targetStandard = 'A';
            }

            if (targetStandard) {
                // Get target time from database
                const baseEvent = event.replace(/\s+(SCY|LCM|SCM)$/, '');
                let ageGroup = '10 & under';
                if (this.currentSwimmer.current_age >= 13) {
                    ageGroup = '13-14';
                } else if (this.currentSwimmer.current_age >= 11) {
                    ageGroup = '11-12';
                }

                const standardColumn = `${targetStandard.toLowerCase()}_standard`;

                try {
                    const { data: standards } = await this.supabase
                        .from('time_standards')
                        .select(standardColumn)
                        .eq('event_name', baseEvent)
                        .eq('age_group', ageGroup)
                        .eq('gender', this.currentSwimmer.gender || 'M')
                        .limit(1);

                    if (standards && standards.length > 0 && standards[0][standardColumn]) {
                        const targetTime = parseFloat(standards[0][standardColumn]);
                        const gap = currentTime - targetTime;

                        if (gap > 0) {
                            const monthsToTarget = gap / improvementPerMonth;

                            insights.push({
                                event,
                                targetStandard,
                                gap,
                                improvementRate: improvementPerMonth,
                                monthsToTarget,
                                targetTime,
                                lastEventDate  // Store the last event date
                            });
                        }
                    }
                } catch (err) {
                    console.warn(`Could not fetch standard for ${event}:`, err);
                }
            }
        }

        // Cache insights for sorting
        this.cachedInsights = insights;

        // Render insights table
        this.renderInsightsTable();
    }

    sortInsights(column) {
        // Toggle direction if same column, else default to ascending
        if (this.insightsSortConfig.column === column) {
            this.insightsSortConfig.direction = this.insightsSortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.insightsSortConfig.column = column;
            this.insightsSortConfig.direction = 'asc';
        }

        this.renderInsightsTable();
    }

    renderInsightsTable() {
        const contentContainer = document.getElementById('progressInsightsContent');
        const container = document.getElementById('progressInsights');
        if (!contentContainer || !container) return;

        const insights = [...this.cachedInsights];

        // Sort insights based on current config
        insights.sort((a, b) => {
            let compareValue = 0;

            switch (this.insightsSortConfig.column) {
                case 'event':
                    compareValue = a.event.localeCompare(b.event);
                    break;
                case 'current':
                    const currentTimeA = a.gap + a.targetTime;
                    const currentTimeB = b.gap + b.targetTime;
                    compareValue = currentTimeA - currentTimeB;
                    break;
                case 'target':
                    compareValue = a.targetTime - b.targetTime;
                    break;
                case 'gap':
                    compareValue = a.gap - b.gap;
                    break;
                case 'timeline':
                default:
                    const dateA = new Date(a.lastEventDate);
                    dateA.setMonth(dateA.getMonth() + Math.ceil(a.monthsToTarget));
                    const dateB = new Date(b.lastEventDate);
                    dateB.setMonth(dateB.getMonth() + Math.ceil(b.monthsToTarget));
                    compareValue = dateA - dateB;
                    break;
            }

            return this.insightsSortConfig.direction === 'asc' ? compareValue : -compareValue;
        });

        // Display ALL insights in table format with sortable headers
        if (insights.length > 0) {
            const getSortIcon = (column) => {
                if (this.insightsSortConfig.column !== column) return '⇅';
                return this.insightsSortConfig.direction === 'asc' ? '↑' : '↓';
            };

            const getSortPriority = (column) => {
                if (this.insightsSortConfig.column === column) return '①';
                return '';
            };

            let html = `
                <div class="insights-table">
                    <div class="insights-header">
                        <div class="sortable-header" data-column="event">
                            <span class="header-text">Event</span>
                            <span class="sort-indicator">
                                <span class="sort-priority">${getSortPriority('event')}</span>
                                <span class="sort-arrow">${getSortIcon('event')}</span>
                            </span>
                        </div>
                        <div class="sortable-header" data-column="current">
                            <span class="header-text">Current</span>
                            <span class="sort-indicator">
                                <span class="sort-priority">${getSortPriority('current')}</span>
                                <span class="sort-arrow">${getSortIcon('current')}</span>
                            </span>
                        </div>
                        <div class="sortable-header" data-column="target">
                            <span class="header-text">Target</span>
                            <span class="sort-indicator">
                                <span class="sort-priority">${getSortPriority('target')}</span>
                                <span class="sort-arrow">${getSortIcon('target')}</span>
                            </span>
                        </div>
                        <div class="sortable-header" data-column="gap">
                            <span class="header-text">Gap</span>
                            <span class="sort-indicator">
                                <span class="sort-priority">${getSortPriority('gap')}</span>
                                <span class="sort-arrow">${getSortIcon('gap')}</span>
                            </span>
                        </div>
                        <div class="sortable-header" data-column="timeline">
                            <span class="header-text">Timeline</span>
                            <span class="sort-indicator">
                                <span class="sort-priority">${getSortPriority('timeline')}</span>
                                <span class="sort-arrow">${getSortIcon('timeline')}</span>
                            </span>
                        </div>
                    </div>
            `;

            insights.forEach(insight => {
                const icon = insight.monthsToTarget < 2 ? '🎯' : insight.monthsToTarget < 6 ? '📈' : '💪';
                const months = Math.ceil(insight.monthsToTarget);

                // Calculate target date from last event date (not current date)
                const targetDate = new Date(insight.lastEventDate);
                targetDate.setMonth(targetDate.getMonth() + months);
                const targetMonth = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                const monthText = months === 1 ? '1 month' : `${months} months`;

                // Determine current standard
                const currentTime = insight.gap + insight.targetTime;
                const currentResult = this.results.find(r =>
                    r.event_name === insight.event &&
                    Math.abs(r.time_seconds - currentTime) < 0.1
                );
                const currentStandard = currentResult?.time_standard || 'B';

                html += `
                    <div class="insights-row">
                        <div class="insight-event">${icon} ${insight.event}</div>
                        <div class="insight-current">
                            <span class="record-standard ${currentStandard.toLowerCase()}">${currentStandard}</span>
                            <span class="insight-time">${this.formatTime(currentTime)}</span>
                        </div>
                        <div class="insight-target">
                            <span class="record-standard ${insight.targetStandard.toLowerCase()}">${insight.targetStandard}</span>
                            <span class="insight-time">${this.formatTime(insight.targetTime)}</span>
                        </div>
                        <div class="insight-gap">−${this.formatTime(insight.gap)}</div>
                        <div class="insight-timeline">${targetMonth} (${monthText})</div>
                    </div>
                `;
            });

            html += '</div>';
            contentContainer.innerHTML = html;
            container.classList.add('has-insights');

            // Add click event listeners to sortable headers
            const sortableHeaders = contentContainer.querySelectorAll('.sortable-header');
            sortableHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.getAttribute('data-column');
                    this.sortInsights(column);
                });
            });
        } else {
            container.classList.remove('has-insights');
        }
    }

    async renderGapChart() {
        const canvas = document.getElementById('gapChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.charts.gap) {
            this.charts.gap.destroy();
        }

        // Get best times for swimmer
        const results = this.results.filter(r => r.swimmer_id === this.currentSwimmer.id);
        const eventBests = {};

        results.forEach(result => {
            const key = result.event_name;
            if (!eventBests[key] || result.time_seconds < eventBests[key].time_seconds) {
                eventBests[key] = result;
            }
        });

        // Calculate gaps to next standard using database
        const gapsWithTargets = [];

        for (const [event, result] of Object.entries(eventBests)) {
            // Determine target standard based on current standard
            let targetStandard = null;
            if (!result.time_standard || result.time_standard === 'B') {
                targetStandard = 'BB';
            } else if (result.time_standard === 'BB') {
                targetStandard = 'A';
            }

            if (targetStandard) {
                try {
                    // Extract base event name (remove course type)
                    const baseEvent = event.replace(/\s+(SCY|LCM|SCM)$/, '');

                    // Determine age group based on swimmer's age
                    let ageGroup = '10 & under';
                    if (this.currentSwimmer.current_age >= 13) {
                        ageGroup = '13-14';
                    } else if (this.currentSwimmer.current_age >= 11) {
                        ageGroup = '11-12';
                    }

                    // Determine column name for target standard
                    const standardColumn = `${targetStandard.toLowerCase()}_standard`;

                    // Query time standards table for target time
                    const { data: standards, error } = await this.supabase
                        .from('time_standards')
                        .select(`${standardColumn}`)
                        .eq('event_name', baseEvent)
                        .eq('age_group', ageGroup)
                        .eq('gender', this.currentSwimmer.gender || 'M')
                        .limit(1);

                    if (!error && standards && standards.length > 0 && standards[0][standardColumn]) {
                        const targetTime = parseFloat(standards[0][standardColumn]);
                        const gap = result.time_seconds - targetTime;
                        if (gap > 0) {
                            gapsWithTargets.push({
                                event,
                                gap,
                                targetStandard,
                                currentTime: result.time_seconds,
                                targetTime: targetTime
                            });
                        }
                    }
                } catch (err) {
                    console.warn(`Could not fetch standard for ${event}:`, err);
                }
            }
        }

        // Sort by smallest gap first and take top 10
        const gaps = gapsWithTargets
            .sort((a, b) => a.gap - b.gap)
            .slice(0, 10);

        // Color code by target standard
        const getStandardColor = (standard) => {
            switch(standard) {
                case 'BB': return 'rgba(52, 199, 89, 0.8)';  // Green
                case 'A': return 'rgba(255, 149, 0, 0.8)';   // Orange
                case 'AA': return 'rgba(255, 204, 0, 0.8)';  // Gold
                case 'AAA': return 'rgba(175, 82, 222, 0.8)'; // Purple
                default: return 'rgba(0, 122, 255, 0.8)';    // Blue
            }
        };

        // Custom plugin to draw gap values on bars
        const gapLabelPlugin = {
            id: 'gapLabels',
            afterDatasetsDraw: (chart) => {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    meta.data.forEach((bar, index) => {
                        const gap = gaps[index];
                        if (gap) {
                            const value = `−${this.formatTime(gap.gap)}`;
                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 12px Inter';
                            ctx.textAlign = 'right';
                            ctx.textBaseline = 'middle';

                            const xPos = bar.x - 8;
                            const yPos = bar.y;

                            ctx.fillText(value, xPos, yPos);
                        }
                    });
                });
            }
        };

        this.charts.gap = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: gaps.map(g => g.event),
                datasets: [{
                    label: 'Gap to Next Standard',
                    data: gaps.map(g => g.gap),
                    backgroundColor: gaps.map(g => getStandardColor(g.targetStandard)),
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    datalabels: {
                        display: false
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            generateLabels: () => {
                                return [
                                    { text: 'BB Target', fillStyle: 'rgba(52, 199, 89, 0.8)' },
                                    { text: 'A Target', fillStyle: 'rgba(255, 149, 0, 0.8)' },
                                    { text: 'AA Target', fillStyle: 'rgba(255, 204, 0, 0.8)' }
                                ];
                            },
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 12, family: 'Inter' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const gap = gaps[context.dataIndex];
                                return [
                                    `Target: ${gap.targetStandard} (${this.formatTime(gap.targetTime)})`,
                                    `Current: ${this.formatTime(gap.currentTime)}`,
                                    `Gap: ${this.formatTime(gap.gap)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 12 },
                            callback: value => value.toFixed(2) + 's'
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 11 },
                            callback: (value, index) => {
                                const gap = gaps[index];
                                return gap ? `${gap.event} (−${this.formatTime(gap.gap)})` : value;
                            }
                        }
                    }
                }
            },
            plugins: [gapLabelPlugin]
        });
    }

    async renderMeetStrategy() {
        const container = document.getElementById('meetStrategy');
        if (!container) return;

        // Get best times for swimmer
        const results = this.results.filter(r => r.swimmer_id === this.currentSwimmer.id);
        const eventBests = {};

        results.forEach(result => {
            const key = result.event_name;
            // Skip relay events
            if (key && key.toLowerCase().includes('relay')) return;

            if (!eventBests[key] || result.time_seconds < eventBests[key].time_seconds) {
                eventBests[key] = result;
            }
        });

        // Analyze each event for strategic recommendations
        const recommendations = [];

        for (const [event, result] of Object.entries(eventBests)) {
            // Get historical data for this event to calculate improvement rate
            const eventHistory = results.filter(r => r.event_name === event)
                .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

            const lastSwimDate = new Date(result.event_date);
            const now = new Date();
            const daysSinceLastSwim = Math.floor((now - lastSwimDate) / (1000 * 60 * 60 * 24));
            const monthsSinceLastSwim = daysSinceLastSwim / 30;

            // Calculate improvement rate if we have history
            let improvementPerMonth = 0;
            if (eventHistory.length >= 2) {
                const firstDate = new Date(eventHistory[0].event_date);
                const lastDate = new Date(eventHistory[eventHistory.length - 1].event_date);
                const monthsDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30);
                const totalImprovement = eventHistory[0].time_seconds - eventHistory[eventHistory.length - 1].time_seconds;
                improvementPerMonth = totalImprovement / monthsDiff;
            }

            // Calculate expected improvement based on time elapsed
            const expectedImprovement = improvementPerMonth * monthsSinceLastSwim;

            // Determine target standard
            let targetStandard = null;
            if (!result.time_standard || result.time_standard === 'B') {
                targetStandard = 'BB';
            } else if (result.time_standard === 'BB') {
                targetStandard = 'A';
            } else if (result.time_standard === 'A') {
                targetStandard = 'AA';
            }

            if (targetStandard) {
                try {
                    const baseEvent = event.replace(/\s+(SCY|LCM|SCM)$/, '');
                    let ageGroup = '10 & under';
                    if (this.currentSwimmer.current_age >= 13) {
                        ageGroup = '13-14';
                    } else if (this.currentSwimmer.current_age >= 11) {
                        ageGroup = '11-12';
                    }

                    const standardColumn = `${targetStandard.toLowerCase()}_standard`;
                    const { data: standards } = await this.supabase
                        .from('time_standards')
                        .select(standardColumn)
                        .eq('event_name', baseEvent)
                        .eq('age_group', ageGroup)
                        .eq('gender', this.currentSwimmer.gender || 'M')
                        .limit(1);

                    if (standards && standards.length > 0 && standards[0][standardColumn]) {
                        const targetTime = parseFloat(standards[0][standardColumn]);
                        const gap = result.time_seconds - targetTime;
                        const gapPercent = (gap / result.time_seconds) * 100;

                        // Enhanced strategic priority scoring with timeline consideration
                        let priority = 'Medium';
                        let justification = '';
                        let reasons = [];

                        // Factor 1: Gap to next standard
                        if (gapPercent < 2) {
                            reasons.push(`very close to ${targetStandard} (${gapPercent.toFixed(1)}% gap)`);
                        } else if (gapPercent < 5) {
                            reasons.push(`close to ${targetStandard} (${gapPercent.toFixed(1)}% gap)`);
                        } else if (gapPercent < 10) {
                            reasons.push(`moderate gap to ${targetStandard} (${gapPercent.toFixed(1)}% gap)`);
                        }

                        // Factor 2: Time since last competition
                        if (daysSinceLastSwim > 90) {
                            reasons.push(`not tested in ${Math.floor(monthsSinceLastSwim)} months - validate progress`);
                            priority = 'High'; // Boost priority for events needing testing
                        } else if (daysSinceLastSwim > 60) {
                            reasons.push(`last swum ${Math.floor(monthsSinceLastSwim)} months ago`);
                        }

                        // Factor 3: Expected improvement vs gap
                        if (expectedImprovement > 0 && improvementPerMonth > 0.05) {
                            const expectedTime = result.time_seconds - expectedImprovement;
                            if (expectedTime <= targetTime) {
                                reasons.push(`expected improvement suggests ${targetStandard} achievable now`);
                                priority = 'High';
                            } else {
                                const remainingGap = expectedTime - targetTime;
                                reasons.push(`expect ${this.formatTime(expectedImprovement)} improvement since last swim`);
                            }
                        }

                        // Set base priority if not already high
                        if (priority !== 'High') {
                            if (gapPercent < 5 || (daysSinceLastSwim > 60 && improvementPerMonth > 0.05)) {
                                priority = 'High';
                            } else if (gapPercent < 10) {
                                priority = 'Medium';
                            } else {
                                priority = 'Low';
                            }
                        }

                        justification = reasons.join('; ') + '.';

                        recommendations.push({
                            event,
                            currentTime: result.time_seconds,
                            currentStandard: result.time_standard || 'B',
                            targetStandard,
                            targetTime,
                            gap,
                            gapPercent,
                            priority,
                            justification,
                            lastSwimDate,
                            daysSinceLastSwim,
                            expectedImprovement,
                            improvementPerMonth
                        });
                    }
                } catch (err) {
                    console.warn(`Could not analyze ${event}:`, err);
                }
            }
        }

        // Sort by target timeline (earliest first), then by last swim date (oldest first)
        recommendations.sort((a, b) => {
            // Calculate target date for both recommendations (projected achievement date)
            let targetDateA, targetDateB;

            if (a.improvementPerMonth > 0) {
                const monthsToTargetA = Math.ceil(a.gap / a.improvementPerMonth);
                targetDateA = new Date(a.lastSwimDate);
                targetDateA.setMonth(targetDateA.getMonth() + monthsToTargetA);
            } else {
                targetDateA = new Date(9999, 11, 31); // Far future for events with no improvement
            }

            if (b.improvementPerMonth > 0) {
                const monthsToTargetB = Math.ceil(b.gap / b.improvementPerMonth);
                targetDateB = new Date(b.lastSwimDate);
                targetDateB.setMonth(targetDateB.getMonth() + monthsToTargetB);
            } else {
                targetDateB = new Date(9999, 11, 31); // Far future for events with no improvement
            }

            // Primary sort: target timeline (earliest projected achievement date first)
            if (targetDateA.getTime() !== targetDateB.getTime()) {
                return targetDateA - targetDateB;
            }

            // Secondary sort: last swim date (oldest first - events swum longer ago have higher priority)
            return new Date(a.lastSwimDate) - new Date(b.lastSwimDate);
        });

        // Generate HTML
        if (recommendations.length > 0) {
            // Get current month name for Expected column header
            const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
            const expectedHeaderText = `Expected (if swum this month)`;

            let html = `
                <div class="strategy-intro">
                    <p>Strategic event selection based on current performance and improvement potential.
                    Focus on <strong>High Priority</strong> events for maximum scoring opportunities.</p>
                </div>
                <div class="strategy-table">
                    <div class="strategy-header">
                        <div>Priority</div>
                        <div>Event</div>
                        <div>Current</div>
                        <div>Target</div>
                        <div>${expectedHeaderText}</div>
                        <div>Confidence</div>
                        <div>Strategy</div>
                    </div>
            `;

            recommendations.forEach(rec => {
                const priorityClass = rec.priority.toLowerCase();
                const priorityIcon = rec.priority === 'High' ? '🎯' : rec.priority === 'Medium' ? '📈' : '💡';

                const lastSwimText = rec.lastSwimDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const daysAgo = rec.daysSinceLastSwim;
                const daysText = daysAgo > 60 ? `${Math.floor(daysAgo / 30)}mo ago` : `${daysAgo}d ago`;

                const expectedTime = rec.expectedImprovement > 0
                    ? this.formatTime(rec.currentTime - rec.expectedImprovement)
                    : '--';

                // Check if ready now (expected time already meets target)
                const isReadyNow = rec.expectedImprovement > 0 && (rec.currentTime - rec.expectedImprovement) <= rec.targetTime;

                // Calculate confidence score based on consistency
                const eventHistory = results.filter(r => r.event_name === rec.event);
                let confidenceScore = 0;
                let confidenceClass = 'low';
                if (eventHistory.length >= 5 && rec.improvementPerMonth > 0.05) {
                    confidenceScore = 90;
                    confidenceClass = 'high';
                } else if (eventHistory.length >= 3 && rec.improvementPerMonth > 0.02) {
                    confidenceScore = 70;
                    confidenceClass = 'medium';
                } else if (eventHistory.length >= 2) {
                    confidenceScore = 50;
                    confidenceClass = 'medium';
                } else {
                    confidenceScore = 30;
                    confidenceClass = 'low';
                }

                // Simplify justification to key points only
                let simplifiedJustification = '';
                if (isReadyNow) {
                    simplifiedJustification = `✅ Ready now • ${rec.gapPercent.toFixed(1)}% gap`;
                } else if (rec.gapPercent < 2) {
                    simplifiedJustification = `Very close • ${rec.gapPercent.toFixed(1)}% gap`;
                } else if (rec.gapPercent < 5) {
                    simplifiedJustification = `Close to ${rec.targetStandard} • ${rec.gapPercent.toFixed(1)}% gap`;
                } else {
                    simplifiedJustification = `${rec.gapPercent.toFixed(1)}% gap to ${rec.targetStandard}`;
                }

                if (rec.daysSinceLastSwim > 90) {
                    simplifiedJustification += ` • Not tested in ${Math.floor(rec.daysSinceLastSwim / 30)}mo`;
                }

                // Calculate projected target date based on improvement rate
                let targetDateText = '';
                let targetMonthsText = '';
                if (rec.improvementPerMonth > 0) {
                    const monthsToTarget = rec.gap / rec.improvementPerMonth;
                    const targetDate = new Date(rec.lastSwimDate);
                    targetDate.setMonth(targetDate.getMonth() + Math.ceil(monthsToTarget));
                    targetDateText = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    const monthsRounded = Math.ceil(monthsToTarget);
                    targetMonthsText = monthsRounded === 1 ? '1mo' : `${monthsRounded}mo`;
                } else {
                    targetDateText = 'Based on pace';
                    targetMonthsText = '';
                }

                html += `
                    <div class="strategy-row priority-${priorityClass}" data-priority="${priorityClass}">
                        <div class="strategy-priority">
                            <span class="priority-badge ${priorityClass}">${priorityIcon} ${rec.priority}</span>
                        </div>
                        <div class="strategy-event">${rec.event}${isReadyNow ? '<span class="ready-indicator">🎯 Ready</span>' : ''}</div>
                        <div class="strategy-current">
                            <div class="time-with-meta">
                                <div class="time-main">
                                    <span class="record-standard ${rec.currentStandard.toLowerCase()}">${rec.currentStandard}</span>
                                    <span class="strategy-time">${this.formatTime(rec.currentTime)}</span>
                                </div>
                                <div class="time-meta">
                                    <span class="time-date">${lastSwimText}</span>
                                    <span class="time-ago">${daysText}</span>
                                </div>
                            </div>
                        </div>
                        <div class="strategy-target">
                            <div class="time-with-meta">
                                <div class="time-main">
                                    <span class="record-standard ${rec.targetStandard.toLowerCase()}">${rec.targetStandard}</span>
                                    <span class="strategy-time">${this.formatTime(rec.targetTime)}</span>
                                </div>
                                <div class="time-meta">
                                    <span class="time-date">${targetDateText}</span>
                                    ${targetMonthsText ? `<span class="time-ago">${targetMonthsText}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="strategy-expected">${expectedTime}</div>
                        <div class="strategy-confidence confidence-${confidenceClass}">${confidenceScore}%</div>
                        <div class="strategy-justification">${simplifiedJustification}</div>
                    </div>
                `;
            });

            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="no-strategy">No strategic recommendations available. Keep training!</p>';
        }
    }

    async renderPracticeStrategy() {
        const container = document.getElementById('practiceStrategy');
        if (!container) return;

        // Get insights data with gaps and timelines
        const insights = this.cachedInsights;
        if (!insights || insights.length === 0) {
            container.innerHTML = '<p class="no-practice">Complete some events first to get personalized practice recommendations!</p>';
            return;
        }

        // Group insights by stroke
        const strokeGroups = {
            'FR': { name: 'Freestyle', icon: '🏊', events: [] },
            'BK': { name: 'Backstroke', icon: '🏊‍♂️', events: [] },
            'BR': { name: 'Breaststroke', icon: '🐸', events: [] },
            'FL': { name: 'Butterfly', icon: '🦋', events: [] },
            'IM': { name: 'Individual Medley', icon: '⚡', events: [] }
        };

        // Categorize events by stroke
        insights.forEach(insight => {
            const event = insight.event;
            for (const [strokeKey, strokeData] of Object.entries(strokeGroups)) {
                if (event.includes(strokeKey)) {
                    strokeGroups[strokeKey].events.push(insight);
                    break;
                }
            }
        });

        // Generate HTML for each stroke with events
        let html = '';
        for (const [strokeKey, strokeData] of Object.entries(strokeGroups)) {
            if (strokeData.events.length === 0) continue;

            // Sort events by timeline (most urgent first)
            strokeData.events.sort((a, b) => a.monthsToTarget - b.monthsToTarget);

            html += `
                <div class="stroke-practice">
                    <div class="stroke-header">
                        <span class="stroke-icon">${strokeData.icon}</span>
                        <span class="stroke-title">${strokeData.name} Training Program</span>
                    </div>
                    <div class="stroke-events">
            `;

            strokeData.events.forEach((insight, eventIndex) => {
                const gap = insight.gap;
                const months = Math.ceil(insight.monthsToTarget);
                const targetDate = new Date(insight.lastEventDate);
                targetDate.setMonth(targetDate.getMonth() + months);
                const targetMonth = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                // Determine distance and urgency
                const distance = parseInt(insight.event.match(/^\d+/)?.[0] || '0');
                const urgency = months <= 2 ? 'critical' : months <= 4 ? 'high' : 'moderate';
                const urgencyLabel = months <= 2 ? 'URGENT' : months <= 4 ? 'HIGH PRIORITY' : 'MODERATE';

                // Get detailed training plan
                const trainingPlan = this.getDetailedTrainingPlan(strokeKey, distance, gap, months, insight);

                const eventId = `event-${strokeKey}-${eventIndex}`;

                html += `
                    <div class="practice-event">
                        <div class="practice-event-header collapsible" data-target="${eventId}">
                            <div class="practice-event-info">
                                <div class="practice-event-name">${insight.event}</div>
                                <div class="practice-goal">
                                    <div class="practice-goal-text">Drop ${this.formatTime(gap)} to achieve ${insight.targetStandard} Standard</div>
                                    <div class="practice-timeline">⏱️ Target Date: ${targetMonth} • ${months} month${months > 1 ? 's' : ''} to prepare</div>
                                </div>
                            </div>
                            <div class="event-header-actions">
                                <span class="urgency-badge urgency-${urgency}">${urgencyLabel}</span>
                                <span class="collapse-icon">▼</span>
                            </div>
                        </div>

                        <div class="practice-event-content collapsed" id="${eventId}">
                            ${trainingPlan}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        if (html) {
            container.innerHTML = html;

            // Add click handlers for collapsible sections
            this.setupCollapsibleHandlers();
        } else {
            container.innerHTML = '<p class="no-practice">Complete some events first to get personalized practice recommendations!</p>';
        }
    }

    setupCollapsibleHandlers() {
        // Handle both phase headers and event headers
        const collapsibleHeaders = document.querySelectorAll('.collapsible');
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const targetId = header.getAttribute('data-target');
                const content = document.getElementById(targetId);
                const icon = header.querySelector('.collapse-icon');

                if (content && icon) {
                    content.classList.toggle('collapsed');
                    icon.textContent = content.classList.contains('collapsed') ? '▼' : '▲';
                }
            });
        });
    }

    // Bob Bowman-inspired detailed training plan generator
    getDetailedTrainingPlan(stroke, distance, gapSeconds, months, insight) {
        const phases = [];

        // Determine training phases based on timeline (periodization)
        if (months >= 4) {
            // Base Phase (40% of time)
            phases.push(this.getBasePhase(stroke, distance, gapSeconds));
            // Build Phase (30% of time)
            phases.push(this.getBuildPhase(stroke, distance, gapSeconds));
            // Taper Phase (30% of time)
            phases.push(this.getTaperPhase(stroke, distance, gapSeconds));
        } else if (months >= 2) {
            // Condensed: Build + Taper
            phases.push(this.getBuildPhase(stroke, distance, gapSeconds));
            phases.push(this.getTaperPhase(stroke, distance, gapSeconds));
        } else {
            // Urgent: Race-specific only
            phases.push(this.getTaperPhase(stroke, distance, gapSeconds));
        }

        let html = '<div class="practice-phases">';
        phases.forEach((phase, phaseIndex) => {
            const phaseId = `phase-${stroke}-${distance}-${phaseIndex}`;
            html += `
                <div class="training-phase">
                    <div class="phase-header collapsible" data-target="${phaseId}">
                        <div class="phase-info">
                            <span class="phase-icon">${phase.icon}</span>
                            <span class="phase-title">${phase.title}</span>
                            <span class="phase-duration">${phase.duration}</span>
                        </div>
                        <span class="collapse-icon">▼</span>
                    </div>
                    <div class="phase-content collapsed" id="${phaseId}">
                        <div class="phase-description">${phase.description}</div>
                        <div class="drill-sets">
                            ${phase.drills.map(drill => `
                                <div class="drill-set">
                                    <span class="drill-bullet">▸</span>
                                    <span class="drill-text">${drill}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        return html;
    }

    getBasePhase(stroke, distance, gapSeconds) {
        const drills = [];
        const isSprintEvent = distance <= 50;
        const isMidDistance = distance > 50 && distance <= 100;

        // Common base training
        drills.push('Aerobic base: 3000-4000 yards/meters at 70-75% effort, focusing on technique');
        drills.push('Threshold sets: 6-8 x 200 @ 85% with 20-30sec rest for lactate threshold');

        // Distance-specific base work
        if (isSprintEvent) {
            drills.push('Power development: 16 x 25 sprint @ max effort, 45sec rest - build explosive speed');
            drills.push('Resistance training: Parachute or band work, 8 x 50 building to race pace');
        } else if (isMidDistance) {
            drills.push('Pace work: 10 x 100 @ target race pace +3sec, 15sec rest - build speed endurance');
            drills.push('Descending ladder: 400-300-200-100-100-200-300-400 @ controlled pace');
        } else {
            drills.push('Endurance building: 20 x 100 @ comfortable pace, 10sec rest - aerobic capacity');
            drills.push('Negative split training: 5 x 400, second half faster than first');
        }

        // Stroke-specific technique
        drills.push(...this.getStrokeTechniqueDrills(stroke, distance, 'base'));

        return {
            icon: '🏗️',
            title: 'Phase 1: Base Building',
            duration: `Weeks 1-${Math.ceil(gapSeconds * 0.4)}`,
            description: 'Building aerobic foundation and perfecting stroke technique. Focus on volume and consistency over intensity. This phase develops the endurance base needed for race-specific training.',
            drills: drills
        };
    }

    getBuildPhase(stroke, distance, gapSeconds) {
        const drills = [];
        const isSprintEvent = distance <= 50;
        const isMidDistance = distance > 50 && distance <= 100;

        // Intensity progression
        drills.push('Race pace sets: 6-8 x ' + (distance === 50 ? '50' : distance === 100 ? '100' : '200') + ' @ goal race pace, adequate rest');

        if (isSprintEvent) {
            drills.push('Power + Speed: 10 x 25 ALL OUT from blocks, full recovery - max velocity training');
            drills.push('Start practice: 15 explosive starts, focus on reaction time (goal: <0.65sec)');
            drills.push('Turn acceleration: 8 x 25, 15m underwater, explosive breakout to surface');
        } else if (isMidDistance) {
            drills.push('Broken swims: ' + distance + ' as 4 x ' + (distance/4) + ' @ race pace -1sec, 10sec rest between');
            drills.push('Speed work: 12 x 50 @ 90-95% effort, 30sec rest - developing top-end speed');
            drills.push('Pace discipline: 400 IM pace work, maintaining target splits throughout');
        } else {
            drills.push('Threshold intervals: 5 x 300 @ 90% effort, 30sec rest - lactate tolerance');
            drills.push('Race simulation: Full ' + distance + ' time trial, analyze splits and pacing');
        }

        // Advanced technique under fatigue
        drills.push(...this.getStrokeTechniqueDrills(stroke, distance, 'build'));
        drills.push('Mental training: Visualization of perfect race, practice maintaining form when tired');

        return {
            icon: '💪',
            title: 'Phase 2: Specific Preparation',
            duration: 'Mid-cycle weeks',
            description: 'Race-specific training at target pace and faster. Building speed, power, and race-specific endurance. Maintaining technique under increasing fatigue.',
            drills: drills
        };
    }

    getTaperPhase(stroke, distance, gapSeconds) {
        const drills = [];
        const isSprintEvent = distance <= 50;

        // Taper and sharpening
        drills.push('Sharpening sprints: 4-6 x ' + (distance === 50 ? '25' : '50') + ' @ 95-100%, long rest - maintain speed, reduce volume');
        drills.push('Race pace rehearsal: 2 x ' + distance + ' @ race pace, full recovery - race simulation');

        if (isSprintEvent) {
            drills.push('Start explosiveness: 6-8 starts, focus on quick reaction and powerful drive phase');
            drills.push('Maximum velocity: 6 x 15m from dive, focus on stroke rate and DPS (distance per stroke)');
        } else {
            drills.push('Pace feel work: 4 x ' + Math.floor(distance/2) + ' @ exact race pace, practice split execution');
        }

        drills.push('Underwaters: 10 x underwater kicks (5-7 dolphin kicks), explosive breakouts');
        drills.push('Race strategy: Practice pacing, breathing patterns, and finish technique');
        drills.push(...this.getStrokeTechniqueDrills(stroke, distance, 'taper'));
        drills.push('Competition mindset: Mental rehearsal, pre-race routine practice, confidence building');

        return {
            icon: '🎯',
            title: 'Phase 3: Peak & Competition',
            duration: 'Final 2-3 weeks',
            description: 'Reduce volume, maintain intensity. Fine-tune race execution, starts, turns, and finish. Peak fitness and confidence for competition day.',
            drills: drills
        };
    }

    getStrokeTechniqueDrills(stroke, distance, phase) {
        const drills = [];

        switch (stroke) {
            case 'FR':
                if (phase === 'base') {
                    drills.push('Freestyle catch drill: 8 x 50 focus on high elbow catch, fingertip drag');
                    drills.push('Single arm freestyle: 4 x 75 (25 right, 25 left, 25 full stroke) for stroke symmetry');
                } else if (phase === 'build') {
                    drills.push('6-kick switch: 200s with 6 kicks per side, perfect body rotation and streamline');
                    drills.push('Bilateral breathing ladder: 200 (breathe every 3), 200 (every 5), 200 (every 7)');
                } else {
                    drills.push('Fast hands freestyle: 4 x 50 high turnover rate while maintaining distance per stroke');
                    drills.push('Sprint breathing pattern: Practice race breathing rhythm at race pace');
                }
                break;

            case 'BK':
                if (phase === 'base') {
                    drills.push('Backstroke streamline kicks: 8 x 50 underwater emphasis, 5-7 dolphins off each wall');
                    drills.push('Double arm backstroke: Focus on synchronous arm movement and body position');
                } else if (phase === 'build') {
                    drills.push('Backstroke spin drill: 200s focusing on high stroke rate with long axis rotation');
                    drills.push('Breakout timing: 10 x 15m underwater to breakout, optimize transition to stroke');
                } else {
                    drills.push('Backstroke turns: 8-10 race-pace turns, fast flip, perfect streamline, explosive breakout');
                    drills.push('Head position drill: Maintain perfect head alignment at race pace for reduced drag');
                }
                break;

            case 'BR':
                if (phase === 'base') {
                    drills.push('Breaststroke pullouts: 8 x one pullout + 3 strokes, perfect timing and streamline');
                    drills.push('2 kicks 1 pull: Emphasize powerful kick, patience in timing');
                } else if (phase === 'build') {
                    drills.push('Breaststroke tempo: 200s building stroke rate while maintaining length');
                    drills.push('Power kicks: 8 x 25 kick-only, maximum propulsion from whip kick');
                } else {
                    drills.push('Race-pace pullouts: Perfect underwater pullout timing at race intensity');
                    drills.push('Sprint breaststroke: 6 x 25 max effort, maintain technique at high rate');
                }
                break;

            case 'FL':
                if (phase === 'base') {
                    drills.push('Butterfly body dolphin: 8 x 50 focus on core-driven undulation, no arms');
                    drills.push('Single arm butterfly: 4 x 75 (25 right, 25 left, 25 full) for symmetrical power');
                } else if (phase === 'build') {
                    drills.push('3-3-3 butterfly: 3 strokes underwater, 3 one-arm, 3 full stroke - seamless transitions');
                    drills.push('Butterfly kick timing: Perfect 2-beat kick per stroke cycle at race pace');
                } else {
                    drills.push('Fast fly: 4-6 x 25-50 at race pace, focus on maintaining technique when fatigued');
                    drills.push('Finish strong: Practice last 15m at max effort with perfect stroke mechanics');
                }
                break;

            case 'IM':
                if (phase === 'base') {
                    drills.push('IM order transitions: 8 x 100 IM, focus on smooth stroke-to-stroke transitions');
                    drills.push('Stroke balance: Equal time on all four strokes, identify and improve weakest stroke');
                } else if (phase === 'build') {
                    drills.push('IM pace work: Broken ' + (distance === 200 ? '200' : '400') + ' IM with splits analysis');
                    drills.push('Fly endurance: Extra fly sets to build stamina for strong opening');
                } else {
                    drills.push('IM turns: Perfect transitions at race pace, especially fly-to-back and breast-to-free');
                    drills.push('Race simulation: Full IM at race pace, execute race plan');
                }
                break;
        }

        return drills;
    }

    renderTimelineChart() {
        const canvas = document.getElementById('timelineChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        const teams = this.teams
            .filter(t => t.swimmer_id === this.currentSwimmer.id)
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        if (teams.length === 0) return;

        // Calculate date ranges for each team
        const data = teams.map((team) => {
            const startDate = new Date(team.start_date);
            const endDate = team.end_date ? new Date(team.end_date) : new Date();

            return {
                x: [startDate, endDate],
                y: team.team_name
            };
        });

        // Find min and max dates from actual data
        const allDates = teams.flatMap(t => [
            new Date(t.start_date),
            t.end_date ? new Date(t.end_date) : new Date()
        ]);
        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));

        this.charts.timeline = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: teams.map(t => t.team_name),
                datasets: [{
                    label: 'Team Timeline',
                    data: data.map(d => ({
                        x: d.x,
                        y: d.y
                    })),
                    backgroundColor: teams.map((_, i) => this.getColor(i, 0.7)),
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const team = teams[context.dataIndex];
                                const startDate = new Date(team.start_date);
                                const endDate = team.end_date ? new Date(team.end_date) : new Date();
                                return [
                                    `${team.team_name}`,
                                    `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: {
                                month: 'MMM yyyy'
                            }
                        },
                        min: minDate,
                        max: maxDate,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { font: { size: 12 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                }
            }
        });
    }

    // Utility functions
    getColor(index, alpha = 1) {
        const colors = [
            '0, 122, 255',   // Blue
            '52, 199, 89',   // Green
            '255, 149, 0',   // Orange
            '255, 45, 85',   // Red
            '175, 82, 222',  // Purple
            '255, 204, 0',   // Yellow
            '90, 200, 250',  // Teal
            '255, 55, 95'    // Pink
        ];
        return `rgba(${colors[index % colors.length]}, ${alpha})`;
    }

    formatTime(seconds) {
        if (!seconds) return '--';
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(2);
        return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}`;
    }

    formatDate(dateStr) {
        if (!dateStr) return '--';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    updateStatus(message) {
        const el = document.getElementById('dataStatus');
        if (el) el.textContent = message;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SwimTracker());
} else {
    new SwimTracker();
}
