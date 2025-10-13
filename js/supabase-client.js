// Supabase Client for Vihaan's Swim Tracker
// Handles all database interactions with the multi-swimmer database

// Supabase configuration (loaded from environment or hardcoded for browser)
const SUPABASE_CONFIG = {
    url: 'https://gwqwpicbtkamojwwlmlp.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXdwaWNidGthbW9qd3dsbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODk3MzAsImV4cCI6MjA3NTg2NTczMH0.5KiCESGV2zzSmhpwDmJ3TsCwdqyCQXntgTGhWkuV27s'
};

// Initialize Supabase client
// Using the browser-compatible CDN version
let supabase = null;

// Initialize client when the script loads
async function initSupabaseClient() {
    try {
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase library not loaded. Make sure to include the CDN script.');
            return null;
        }

        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );

        console.log('Supabase client initialized successfully');
        return supabase;
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return null;
    }
}

// ===================================
// SWIMMER OPERATIONS
// ===================================

/**
 * Get all swimmers from the database
 * @returns {Promise<Array>} Array of swimmer objects
 */
async function getAllSwimmers() {
    try {
        const { data, error } = await supabase
            .from('swimmers')
            .select('*')
            .eq('active', true)
            .order('full_name');

        if (error) throw error;

        console.log('Fetched swimmers:', data);
        return data || [];
    } catch (error) {
        console.error('Error fetching swimmers:', error);
        return [];
    }
}

/**
 * Get a specific swimmer by ID
 * @param {number} swimmerId - The swimmer's ID
 * @returns {Promise<Object|null>} Swimmer object or null
 */
async function getSwimmerById(swimmerId) {
    try {
        const { data, error } = await supabase
            .from('swimmers')
            .select('*')
            .eq('id', swimmerId)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error fetching swimmer:', error);
        return null;
    }
}

// ===================================
// COMPETITION RESULTS OPERATIONS
// ===================================

/**
 * Get all competition results for a swimmer
 * @param {number} swimmerId - The swimmer's ID
 * @returns {Promise<Array>} Array of competition result objects
 */
async function getCompetitionResults(swimmerId) {
    try {
        const { data, error } = await supabase
            .from('competition_results')
            .select('*')
            .eq('swimmer_id', swimmerId)
            .order('event_date', { ascending: true });

        if (error) throw error;

        console.log(`Fetched ${data?.length || 0} competition results for swimmer ${swimmerId}`);
        return data || [];
    } catch (error) {
        console.error('Error fetching competition results:', error);
        return [];
    }
}

/**
 * Get competition results with calculated standards
 * Uses the competition_results_with_standards view
 * @param {number} swimmerId - The swimmer's ID
 * @returns {Promise<Array>} Array of competition results with standards
 */
async function getCompetitionResultsWithStandards(swimmerId) {
    try {
        const { data, error } = await supabase
            .from('competition_results_with_standards')
            .select('*')
            .eq('swimmer_id', swimmerId)
            .order('event_date', { ascending: true });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching competition results with standards:', error);
        return [];
    }
}

// ===================================
// PROGRESS REPORT OPERATIONS
// ===================================

/**
 * Get progress report for a swimmer
 * Shows current times, standards, and gaps to next goals
 * @param {number} swimmerId - The swimmer's ID
 * @returns {Promise<Array>} Array of progress report entries
 */
async function getProgressReport(swimmerId) {
    try {
        const { data, error } = await supabase
            .from('progress_report')
            .select('*')
            .eq('swimmer_id', swimmerId)
            .order('event_name');

        if (error) throw error;

        console.log(`Fetched progress report for swimmer ${swimmerId}:`, data);
        return data || [];
    } catch (error) {
        console.error('Error fetching progress report:', error);
        return [];
    }
}

/**
 * Get events closest to achieving next standard
 * @param {number} swimmerId - The swimmer's ID
 * @param {number} limit - Number of results to return (default: 5)
 * @returns {Promise<Array>} Array of events closest to next goal
 */
async function getClosestToGoals(swimmerId, limit = 5) {
    try {
        const { data, error } = await supabase
            .from('progress_report')
            .select('event_name, current_standard, next_standard, gap_seconds, time_formatted')
            .eq('swimmer_id', swimmerId)
            .not('next_standard', 'is', null)
            .order('gap_seconds', { ascending: true })
            .limit(limit);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching closest to goals:', error);
        return [];
    }
}

// ===================================
// PERSONAL BESTS OPERATIONS
// ===================================

/**
 * Get personal bests for a swimmer
 * @param {number} swimmerId - The swimmer's ID
 * @returns {Promise<Array>} Array of personal best records
 */
async function getPersonalBests(swimmerId) {
    try {
        const { data, error } = await supabase
            .from('personal_bests')
            .select('*')
            .eq('swimmer_id', swimmerId)
            .order('event_name');

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching personal bests:', error);
        return [];
    }
}

// ===================================
// TEAM PROGRESSION OPERATIONS
// ===================================

/**
 * Get team progression history for a swimmer
 * @param {number} swimmerId - The swimmer's ID
 * @returns {Promise<Array>} Array of team progression records
 */
async function getTeamProgression(swimmerId) {
    try {
        const { data, error } = await supabase
            .from('team_progression')
            .select('*')
            .eq('swimmer_id', swimmerId)
            .order('start_date', { ascending: true });

        if (error) throw error;

        console.log(`Fetched ${data?.length || 0} team progression records for swimmer ${swimmerId}`);
        return data || [];
    } catch (error) {
        console.error('Error fetching team progression:', error);
        return [];
    }
}

// ===================================
// DATA TRANSFORMATION HELPERS
// ===================================

/**
 * Transform competition results to match legacy eventData format
 * @param {Array} results - Competition results from database
 * @returns {Array} Transformed data in legacy format
 */
function transformToEventData(results) {
    return results.map(result => ({
        event: result.event_name,
        date: result.event_date,
        time: result.time_formatted || formatSecondsToTime(result.time_seconds),
        // Use time_standard from database (A, BB, B, or NULL)
        // Don't provide fallback - let calculateTimeStandard() handle it
        timeStandard: result.time_standard || null,
        meet: result.meet_name || '',
        points: result.points || 0,
        age: result.age || 10
    }));
}

/**
 * Transform team progression to match legacy teamData format
 * @param {Array} progression - Team progression from database
 * @returns {Array} Transformed data in legacy format
 */
function transformToTeamData(progression) {
    return progression.map(team => ({
        team: team.team_name,
        startDate: team.start_date,
        endDate: team.end_date
    }));
}

/**
 * Format seconds to MM:SS.SS time format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatSecondsToTime(seconds) {
    if (!seconds) return '0.00';

    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);

    if (minutes > 0) {
        return `${minutes}:${secs.padStart(5, '0')}`;
    }
    return secs;
}

// ===================================
// INITIALIZATION
// ===================================

// Auto-initialize when script loads
console.log('Supabase client module loaded');

// Export functions for use in other scripts
window.SupabaseClient = {
    init: initSupabaseClient,

    // Swimmer operations
    getAllSwimmers,
    getSwimmerById,

    // Competition results
    getCompetitionResults,
    getCompetitionResultsWithStandards,

    // Progress and goals
    getProgressReport,
    getClosestToGoals,
    getPersonalBests,

    // Team progression
    getTeamProgression,

    // Transformers
    transformToEventData,
    transformToTeamData,
    formatSecondsToTime
};
