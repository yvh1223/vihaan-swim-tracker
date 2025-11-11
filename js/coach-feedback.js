/**
 * Coach Feedback Manager
 * Handles all coach feedback operations and UI management
 */

// Global state
let coachFeedbackManager = null;
let currentSwimmers = [];
let currentFeedback = [];
let strengthsTags = [];
let improvementsTags = [];
let focusTags = [];

// ============================================================================
// COACH FEEDBACK MANAGER CLASS
// ============================================================================

class CoachFeedbackManager {
    constructor(supabase) {
        this.supabase = supabase;
    }

    // ========================================================================
    // CRUD Operations
    // ========================================================================

    /**
     * Add new feedback for a swimmer
     */
    async addFeedback(swimmerId, meetDate, feedbackData) {
        try {
            const { data, error } = await this.supabase
                .from('coach_feedback')
                .insert({
                    swimmer_id: swimmerId,
                    meet_date: meetDate,
                    meet_name: feedbackData.meetName,
                    feedback_text: feedbackData.text,
                    focus_areas: feedbackData.focusAreas || [],
                    strengths: feedbackData.strengths || [],
                    improvements: feedbackData.improvements || [],
                    goals_for_next_meet: feedbackData.goals,
                    visibility: feedbackData.visibility || 'parent-visible'
                })
                .select()
                .single();

            if (error) throw error;

            console.log('Feedback added successfully:', data);
            return { data, error: null };
        } catch (error) {
            console.error('Error adding feedback:', error);
            return { data: null, error };
        }
    }

    /**
     * Get all feedback for a specific swimmer
     */
    async getFeedbackForSwimmer(swimmerId) {
        try {
            const { data, error } = await this.supabase
                .from('coach_feedback')
                .select('*')
                .eq('swimmer_id', swimmerId)
                .order('meet_date', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error fetching feedback:', error);
            return [];
        }
    }

    /**
     * Get all feedback (for history view)
     */
    async getAllFeedback() {
        try {
            const { data, error } = await this.supabase
                .from('coach_feedback')
                .select(`
                    *,
                    swimmers:swimmer_id (
                        id,
                        full_name,
                        current_age,
                        gender
                    )
                `)
                .order('meet_date', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error fetching all feedback:', error);
            return [];
        }
    }

    /**
     * Update existing feedback
     */
    async updateFeedback(feedbackId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('coach_feedback')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', feedbackId)
                .select()
                .single();

            if (error) throw error;

            console.log('Feedback updated successfully:', data);
            return { data, error: null };
        } catch (error) {
            console.error('Error updating feedback:', error);
            return { data: null, error };
        }
    }

    /**
     * Delete feedback
     */
    async deleteFeedback(feedbackId) {
        try {
            const { error } = await this.supabase
                .from('coach_feedback')
                .delete()
                .eq('id', feedbackId);

            if (error) throw error;

            console.log('Feedback deleted successfully');
            return { error: null };
        } catch (error) {
            console.error('Error deleting feedback:', error);
            return { error };
        }
    }

    /**
     * Get recent meets (unique meet dates with feedback counts)
     */
    async getRecentMeets() {
        try {
            const { data, error } = await this.supabase
                .from('coach_feedback')
                .select('meet_date, meet_name, swimmer_id')
                .order('meet_date', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Group by meet date
            const meetsMap = new Map();
            data.forEach(item => {
                const key = item.meet_date;
                if (!meetsMap.has(key)) {
                    meetsMap.set(key, {
                        date: item.meet_date,
                        name: item.meet_name || 'Unnamed Meet',
                        swimmerCount: new Set()
                    });
                }
                meetsMap.get(key).swimmerCount.add(item.swimmer_id);
            });

            // Convert to array and sort
            const meets = Array.from(meetsMap.values())
                .map(meet => ({
                    date: meet.date,
                    name: meet.name,
                    swimmerCount: meet.swimmerCount.size
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5); // Top 5 most recent

            return meets;
        } catch (error) {
            console.error('Error fetching recent meets:', error);
            return [];
        }
    }
}

// ============================================================================
// DASHBOARD INITIALIZATION
// ============================================================================

async function initCoachDashboard() {
    try {
        // Initialize Supabase client
        await window.SupabaseClient.init();

        // Create feedback manager instance
        coachFeedbackManager = new CoachFeedbackManager(window.AuthModule.supabase);

        // Get current user
        const user = await getCurrentUserProfile();
        if (user && user.profile) {
            document.getElementById('coachName').textContent = user.profile.full_name;
        }

        // Load initial data
        await loadSwimmers();
        await loadRecentMeets();

        // Set up form handlers
        setupFormHandlers();

        console.log('Coach dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing coach dashboard:', error);
        showFeedbackMessage('Error loading dashboard. Please refresh the page.', 'error');
    }
}

// ============================================================================
// DATA LOADING FUNCTIONS
// ============================================================================

async function loadSwimmers() {
    try {
        const swimmers = await window.SupabaseClient.getAllSwimmers();
        currentSwimmers = swimmers;

        // Populate swimmer select dropdowns
        const selectElements = [
            document.getElementById('feedbackSwimmerSelect'),
            document.getElementById('historySwimmerFilter')
        ];

        selectElements.forEach(select => {
            if (!select) return;

            const options = swimmers.map(s =>
                `<option value="${s.id}">${s.full_name} (Age ${s.current_age}, ${s.gender})</option>`
            ).join('');

            if (select.id === 'feedbackSwimmerSelect') {
                select.innerHTML = '<option value="">-- Select a swimmer --</option>' + options;
            } else {
                select.innerHTML = '<option value="">All Swimmers</option>' + options;
            }
        });

        // Display swimmers grid
        displaySwimmers(swimmers);

        return swimmers;
    } catch (error) {
        console.error('Error loading swimmers:', error);
        return [];
    }
}

async function loadRecentMeets() {
    try {
        const meets = await coachFeedbackManager.getRecentMeets();
        displayRecentMeets(meets);
    } catch (error) {
        console.error('Error loading recent meets:', error);
    }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

function displaySwimmers(swimmers) {
    const container = document.getElementById('swimmersList');
    if (!container) return;

    if (swimmers.length === 0) {
        container.innerHTML = '<p class="no-data">No active swimmers found.</p>';
        return;
    }

    container.innerHTML = swimmers.map(swimmer => `
        <div class="swimmer-card" data-swimmer-id="${swimmer.id}">
            <div class="swimmer-card-header">
                <h3 class="swimmer-name">${swimmer.full_name}</h3>
                <span class="swimmer-details">Age ${swimmer.current_age}, ${swimmer.gender}</span>
            </div>
            <div class="swimmer-card-actions">
                <a href="../index.html?swimmer=${swimmer.id}" class="btn-link" target="_blank">
                    📊 View Stats
                </a>
                <button class="btn-primary btn-small" onclick="quickAddFeedback(${swimmer.id})">
                    📝 Add Feedback
                </button>
            </div>
        </div>
    `).join('');
}

function displayRecentMeets(meets) {
    const container = document.getElementById('recentMeets');
    if (!container) return;

    if (meets.length === 0) {
        container.innerHTML = '<p class="no-data">No recent meets found.</p>';
        return;
    }

    container.innerHTML = meets.map(meet => `
        <div class="meet-card">
            <div class="meet-card-header">
                <h3 class="meet-name">🏊 ${meet.name}</h3>
                <span class="meet-date">${formatDate(meet.date)}</span>
            </div>
            <p class="meet-info">
                ${meet.swimmerCount} swimmer${meet.swimmerCount !== 1 ? 's' : ''} with feedback
            </p>
        </div>
    `).join('');
}

// ============================================================================
// FORM HANDLING
// ============================================================================

function setupFormHandlers() {
    // Feedback form submit
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }

    // Tag inputs
    setupTagInput('strengthsInput', 'strengths');
    setupTagInput('improvementsInput', 'improvements');
    setupTagInput('focusInput', 'focus');
}

function setupTagInput(inputId, tagType) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = input.value.trim();
            if (value) {
                addTag(tagType, value);
                input.value = '';
            }
        }
    });
}

async function handleFeedbackSubmit(e) {
    e.preventDefault();

    const swimmerId = parseInt(document.getElementById('feedbackSwimmerSelect').value);
    const meetDate = document.getElementById('meetDate').value;
    const meetName = document.getElementById('meetName').value;
    const feedbackText = document.getElementById('feedbackText').value;
    const goalsText = document.getElementById('goalsText').value;
    const visibility = document.querySelector('input[name="visibility"]:checked').value;

    if (!swimmerId) {
        showFeedbackMessage('Please select a swimmer.', 'error');
        return;
    }

    if (!meetDate) {
        showFeedbackMessage('Please enter a meet date.', 'error');
        return;
    }

    // Prepare feedback data
    const feedbackData = {
        meetName: meetName || null,
        text: feedbackText,
        goals: goalsText || null,
        visibility: visibility,
        strengths: strengthsTags,
        improvements: improvementsTags,
        focusAreas: focusTags
    };

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const { data, error } = await coachFeedbackManager.addFeedback(swimmerId, meetDate, feedbackData);

        if (error) throw error;

        showFeedbackMessage('Feedback saved successfully!', 'success');

        // Reset form after 2 seconds
        setTimeout(() => {
            resetFeedbackForm();
            switchTab('dashboard');
        }, 2000);

    } catch (error) {
        console.error('Error saving feedback:', error);
        showFeedbackMessage(error.message || 'Error saving feedback. Please try again.', 'error');
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Save Feedback';
    }
}

// ============================================================================
// TAG MANAGEMENT
// ============================================================================

function addTag(type, value) {
    const tagArrays = {
        'strengths': strengthsTags,
        'improvements': improvementsTags,
        'focus': focusTags
    };

    const tagArray = tagArrays[type];
    if (!tagArray) return;

    // Avoid duplicates
    if (tagArray.includes(value)) return;

    tagArray.push(value);
    renderTags(type);
}

function removeTag(type, value) {
    const tagArrays = {
        'strengths': strengthsTags,
        'improvements': improvementsTags,
        'focus': focusTags
    };

    const tagArray = tagArrays[type];
    if (!tagArray) return;

    const index = tagArray.indexOf(value);
    if (index > -1) {
        tagArray.splice(index, 1);
        renderTags(type);
    }
}

function renderTags(type) {
    const containers = {
        'strengths': 'strengthsTags',
        'improvements': 'improvementsTags',
        'focus': 'focusTags'
    };

    const tagArrays = {
        'strengths': strengthsTags,
        'improvements': improvementsTags,
        'focus': focusTags
    };

    const containerId = containers[type];
    const container = document.getElementById(containerId);
    if (!container) return;

    const tags = tagArrays[type];

    container.innerHTML = tags.map(tag => `
        <span class="tag">
            ${tag}
            <button type="button" class="tag-remove" onclick="removeTag('${type}', '${tag}')">×</button>
        </span>
    `).join('');
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

function switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load data if needed
    if (tabName === 'history') {
        loadFeedbackHistory();
    }
}

function loadSwimmerInfo() {
    const select = document.getElementById('feedbackSwimmerSelect');
    const swimmerId = parseInt(select.value);

    const swimmerInfo = document.getElementById('swimmerInfo');
    const feedbackForm = document.getElementById('feedbackForm');

    if (!swimmerId) {
        swimmerInfo.style.display = 'none';
        feedbackForm.style.display = 'none';
        return;
    }

    const swimmer = currentSwimmers.find(s => s.id === swimmerId);
    if (!swimmer) return;

    // Show swimmer info
    document.getElementById('swimmerInfoName').textContent = swimmer.full_name;
    document.getElementById('swimmerInfoDetails').textContent =
        `Age ${swimmer.current_age}, ${swimmer.gender}`;
    document.getElementById('viewStatsLink').href = `../index.html?swimmer=${swimmerId}`;

    swimmerInfo.style.display = 'block';
    feedbackForm.style.display = 'block';
}

function quickAddFeedback(swimmerId) {
    // Switch to add feedback tab
    switchTab('add-feedback');

    // Select the swimmer
    document.getElementById('feedbackSwimmerSelect').value = swimmerId;
    loadSwimmerInfo();

    // Set today's date
    document.getElementById('meetDate').valueAsDate = new Date();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFeedbackForm() {
    document.getElementById('feedbackForm').reset();
    document.getElementById('feedbackSwimmerSelect').value = '';
    document.getElementById('swimmerInfo').style.display = 'none';
    document.getElementById('feedbackForm').style.display = 'none';

    // Clear tags
    strengthsTags = [];
    improvementsTags = [];
    focusTags = [];
    renderTags('strengths');
    renderTags('improvements');
    renderTags('focus');

    clearFeedbackMessage();
}

function filterSwimmers() {
    const searchTerm = document.getElementById('swimmerSearch').value.toLowerCase();
    const swimmers = currentSwimmers.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm)
    );
    displaySwimmers(swimmers);
}

async function loadFeedbackHistory() {
    try {
        const allFeedback = await coachFeedbackManager.getAllFeedback();
        currentFeedback = allFeedback;
        filterHistory();
    } catch (error) {
        console.error('Error loading feedback history:', error);
    }
}

function filterHistory() {
    const swimmerFilter = document.getElementById('historySwimmerFilter').value;
    const monthFilter = document.getElementById('historyMonthFilter').value;

    let filtered = currentFeedback;

    // Filter by swimmer
    if (swimmerFilter) {
        filtered = filtered.filter(f => f.swimmer_id === parseInt(swimmerFilter));
    }

    // Filter by date
    if (monthFilter) {
        const monthsAgo = parseInt(monthFilter);
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);

        filtered = filtered.filter(f => new Date(f.meet_date) >= cutoffDate);
    }

    displayFeedbackHistory(filtered);
}

function displayFeedbackHistory(feedback) {
    const container = document.getElementById('feedbackHistory');
    if (!container) return;

    if (feedback.length === 0) {
        container.innerHTML = '<p class="no-data">No feedback found.</p>';
        return;
    }

    container.innerHTML = feedback.map(f => `
        <div class="feedback-history-card">
            <div class="feedback-history-header">
                <div>
                    <h3>${f.swimmers?.full_name || 'Unknown Swimmer'}</h3>
                    <p class="feedback-meta">
                        ${f.meet_name || 'Unnamed Meet'} • ${formatDate(f.meet_date)}
                    </p>
                </div>
                <span class="visibility-badge visibility-${f.visibility}">
                    ${f.visibility}
                </span>
            </div>
            <p class="feedback-preview">${f.feedback_text.substring(0, 150)}...</p>
            <div class="feedback-history-actions">
                <button class="btn-link" onclick="viewFeedbackDetail(${f.id})">View Full Feedback</button>
                ${f.parent_acknowledged ? '<span class="acknowledged-badge">✓ Acknowledged</span>' : ''}
            </div>
        </div>
    `).join('');
}

function viewFeedbackDetail(feedbackId) {
    // TODO: Implement modal or detail view
    alert(`View feedback details for ID: ${feedbackId}`);
}

function showFeedbackMessage(message, type) {
    const messageEl = document.getElementById('feedbackMessage');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
}

function clearFeedbackMessage() {
    const messageEl = document.getElementById('feedbackMessage');
    if (messageEl) {
        messageEl.style.display = 'none';
        messageEl.textContent = '';
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

console.log('Coach feedback manager loaded');
