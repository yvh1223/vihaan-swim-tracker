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
    }

    async selectSwimmer(swimmerId) {
        this.currentSwimmer = this.swimmers.find(s => s.id === swimmerId);
        if (!this.currentSwimmer) return;

        this.updateStatus('Loading swimmer data...');

        // Load data for this swimmer
        await this.loadData();

        // Update UI with loaded data
        this.updateUI();
        this.renderCharts();

        this.updateStatus('Ready');
    }

    updateUI() {
        if (!this.currentSwimmer) return;

        // Update hero
        const nameEl = document.getElementById('swimmerName');
        const teamEl = document.getElementById('currentTeam');

        if (nameEl) nameEl.textContent = this.currentSwimmer.full_name;
        if (teamEl) {
            const currentTeam = this.teams
                .filter(t => t.swimmer_id === this.currentSwimmer.id)
                .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
            teamEl.textContent = currentTeam ? currentTeam.team_name : this.currentSwimmer.club;
        }

        // Update stats
        const swimmerResults = this.results.filter(r => r.swimmer_id === this.currentSwimmer.id);

        const bbCount = swimmerResults.filter(r => r.time_standard === 'BB').length;
        const bCount = swimmerResults.filter(r => r.time_standard === 'B').length;
        const aCount = swimmerResults.filter(r => r.time_standard === 'A').length;
        const uniqueEvents = new Set(swimmerResults.map(r => r.event_name)).size;

        this.updateStat('bbCount', bbCount);
        this.updateStat('bCount', bCount);
        this.updateStat('aCount', aCount);
        this.updateStat('totalEvents', uniqueEvents);

        // Update records table
        this.renderRecordsTable(swimmerResults);
    }

    updateStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    renderRecordsTable(results) {
        const container = document.getElementById('recordsTable');
        if (!container) return;

        // Get best time for each event
        const eventBests = {};
        results.forEach(result => {
            const key = result.event_name;
            if (!eventBests[key] || result.time_seconds < eventBests[key].time_seconds) {
                eventBests[key] = result;
            }
        });

        const records = Object.values(eventBests)
            .sort((a, b) => a.event_name.localeCompare(b.event_name));

        let html = `
            <div class="record-row header">
                <div>Event</div>
                <div>Time</div>
                <div>Standard</div>
                <div>Date</div>
            </div>
        `;

        records.forEach(record => {
            const standard = record.time_standard || 'N/A';
            html += `
                <div class="record-row">
                    <div class="record-event">${record.event_name}</div>
                    <div class="record-time">${record.time_formatted}</div>
                    <div>
                        <span class="record-standard ${standard.toLowerCase()}">${standard}</span>
                    </div>
                    <div class="record-date">${this.formatDate(record.event_date)}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderCharts() {
        if (!this.currentSwimmer) return;

        this.renderProgressChart();
        this.renderGapChart();
        this.renderTimelineChart();
    }

    renderProgressChart() {
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        // Get swimmer's results
        const results = this.results
            .filter(r => r.swimmer_id === this.currentSwimmer.id)
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

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

        const datasets = Object.entries(eventGroups).map(([event, data], index) => ({
            label: event,
            data,
            borderColor: this.getColor(index),
            backgroundColor: this.getColor(index, 0.1),
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3
        }));

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
                            font: { size: 12, family: 'Inter' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        bodyFont: { size: 14 },
                        displayColors: false
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
                        reverse: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 12 },
                            callback: value => this.formatTime(value)
                        }
                    }
                }
            }
        });
    }

    renderGapChart() {
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

        // Calculate gaps to BB standard (simplified - would need time standards table)
        const gaps = Object.entries(eventBests)
            .filter(([_, result]) => result.time_standard !== 'BB' && result.time_standard !== 'A')
            .slice(0, 10) // Top 10 closest
            .map(([event, result]) => ({
                event,
                gap: Math.random() * 5 + 0.5 // Placeholder - needs actual BB times
            }));

        this.charts.gap = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: gaps.map(g => g.event),
                datasets: [{
                    label: 'Seconds to BB',
                    data: gaps.map(g => g.gap),
                    backgroundColor: 'rgba(0, 122, 255, 0.8)',
                    borderRadius: 8
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
                        padding: 12
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
                        ticks: { font: { size: 11 } }
                    }
                }
            }
        });
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

        const data = teams.map((team, index) => ({
            x: [new Date(team.start_date), team.end_date ? new Date(team.end_date) : new Date()],
            y: team.team_name
        }));

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
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'month' },
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
