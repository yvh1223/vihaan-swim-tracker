/**
 * Parent View Module
 * Handles parent dashboard, feedback viewing, and acknowledgment
 */

// Global state
let parentViewManager = null;
let currentParentProfile = null;

// ============================================================================
// PARENT VIEW MANAGER CLASS
// ============================================================================

class ParentViewManager {
    constructor(supabase) {
        this.supabase = supabase;
    }

    // ========================================================================
    // Feedback Operations
    // ========================================================================

    /**
     * Load feedback for parent's linked swimmers
     */
    async loadFeedbackForSwimmer(swimmerId) {
        try {
            const { data, error } = await this.supabase
                .from('coach_feedback')
                .select('*')
                .eq('swimmer_id', swimmerId)
                .in('visibility', ['parent-visible', 'public'])
                .order('meet_date', { ascending: false });

            if (error) throw error;

            console.log(`Loaded ${data?.length || 0} feedback entries for swimmer ${swimmerId}`);
            return data || [];
        } catch (error) {
            console.error('Error loading feedback:', error);
            return [];
        }
    }

    /**
     * Acknowledge feedback (mark as read)
     */
    async acknowledgeFeedback(feedbackId) {
        try {
            const { data, error } = await this.supabase
                .from('coach_feedback')
                .update({
                    parent_acknowledged: true,
                    parent_acknowledged_at: new Date().toISOString()
                })
                .eq('id', feedbackId)
                .select()
                .single();

            if (error) throw error;

            console.log('Feedback acknowledged successfully');
            return { data, error: null };
        } catch (error) {
            console.error('Error acknowledging feedback:', error);
            return { data: null, error };
        }
    }

    /**
     * Get count of unacknowledged feedback
     */
    async getUnacknowledgedCount(swimmerId) {
        try {
            const { count, error } = await this.supabase
                .from('coach_feedback')
                .select('*', { count: 'exact', head: true })
                .eq('swimmer_id', swimmerId)
                .in('visibility', ['parent-visible', 'public'])
                .eq('parent_acknowledged', false);

            if (error) throw error;

            return count || 0;
        } catch (error) {
            console.error('Error getting unacknowledged count:', error);
            return 0;
        }
    }

    // ========================================================================
    // Rendering Functions
    // ========================================================================

    /**
     * Render feedback card HTML
     */
    renderFeedback(feedback) {
        const isNew = !feedback.parent_acknowledged;

        return `
            <div class="feedback-card ${isNew ? 'feedback-new' : 'feedback-acknowledged'}" data-feedback-id="${feedback.id}">
                <div class="feedback-header">
                    <div>
                        <h3 class="feedback-title">
                            ${isNew ? '🆕 ' : ''}${feedback.meet_name || 'Meet Feedback'}
                        </h3>
                        <span class="feedback-date">${this.formatDate(feedback.meet_date)}</span>
                    </div>
                    ${isNew ? '<span class="new-badge">NEW</span>' : ''}
                </div>

                ${feedback.strengths && feedback.strengths.length > 0 ? `
                    <div class="feedback-section">
                        <h4 class="feedback-section-title">✅ Strengths</h4>
                        <ul class="feedback-list">
                            ${feedback.strengths.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${feedback.improvements && feedback.improvements.length > 0 ? `
                    <div class="feedback-section">
                        <h4 class="feedback-section-title">🎯 Areas to Improve</h4>
                        <ul class="feedback-list">
                            ${feedback.improvements.map(i => `<li>${i}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${feedback.focus_areas && feedback.focus_areas.length > 0 ? `
                    <div class="feedback-section">
                        <h4 class="feedback-section-title">🏊 Focus for Practice This Week</h4>
                        <ul class="feedback-list">
                            ${feedback.focus_areas.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${feedback.feedback_text ? `
                    <div class="feedback-section">
                        <h4 class="feedback-section-title">💬 Coach's Detailed Notes</h4>
                        <p class="feedback-text">${this.escapeHtml(feedback.feedback_text)}</p>
                    </div>
                ` : ''}

                ${feedback.goals_for_next_meet ? `
                    <div class="feedback-section">
                        <h4 class="feedback-section-title">🎯 Goals for Next Meet</h4>
                        <p class="feedback-text">${this.escapeHtml(feedback.goals_for_next_meet)}</p>
                    </div>
                ` : ''}

                <div class="feedback-footer">
                    ${!feedback.parent_acknowledged ? `
                        <button
                            class="btn-acknowledge"
                            onclick="acknowledgeFeedbackClick(${feedback.id})"
                        >
                            ✓ Mark as Read
                        </button>
                    ` : `
                        <span class="acknowledged-text">
                            ✓ Acknowledged ${this.formatDate(feedback.parent_acknowledged_at)}
                        </span>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Render all feedback for a swimmer
     */
    renderFeedbackList(feedbackList) {
        if (!feedbackList || feedbackList.length === 0) {
            return '<p class="no-feedback">No feedback available yet.</p>';
        }

        return feedbackList.map(f => this.renderFeedback(f)).join('');
    }

    // ========================================================================
    // Utility Functions
    // ========================================================================

    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ============================================================================
// GLOBAL FUNCTIONS (Called from HTML)
// ============================================================================

/**
 * Initialize parent view for a swimmer
 * Called from app-new.js when parent is logged in
 */
async function initParentView(swimmerId, userProfile) {
    try {
        if (!parentViewManager) {
            parentViewManager = new ParentViewManager(window.AuthModule.supabase);
        }

        currentParentProfile = userProfile;

        // Check if parent has access to this swimmer
        if (!userProfile.linked_swimmer_ids.includes(swimmerId)) {
            console.log('Parent does not have access to this swimmer');
            return;
        }

        // Load and display feedback
        await loadAndDisplayFeedback(swimmerId);

    } catch (error) {
        console.error('Error initializing parent view:', error);
    }
}

/**
 * Load and display feedback for current swimmer
 */
async function loadAndDisplayFeedback(swimmerId) {
    try {
        const feedbackList = await parentViewManager.loadFeedbackForSwimmer(swimmerId);

        // Get feedback container
        const container = document.getElementById('feedbackList');
        if (!container) {
            console.error('Feedback container not found');
            return;
        }

        // Render feedback
        container.innerHTML = parentViewManager.renderFeedbackList(feedbackList);

        // Update badge if there's new feedback
        const newCount = feedbackList.filter(f => !f.parent_acknowledged).length;
        updateFeedbackBadge(newCount);

        console.log(`Displayed ${feedbackList.length} feedback entries (${newCount} new)`);
    } catch (error) {
        console.error('Error loading and displaying feedback:', error);
    }
}

/**
 * Handle feedback acknowledgment button click
 */
async function acknowledgeFeedbackClick(feedbackId) {
    try {
        const { data, error } = await parentViewManager.acknowledgeFeedback(feedbackId);

        if (error) throw error;

        // Update UI
        const card = document.querySelector(`[data-feedback-id="${feedbackId}"]`);
        if (card) {
            card.classList.remove('feedback-new');
            card.classList.add('feedback-acknowledged');

            // Update footer
            const footer = card.querySelector('.feedback-footer');
            if (footer) {
                footer.innerHTML = `
                    <span class="acknowledged-text">
                        ✓ Acknowledged ${parentViewManager.formatDate(new Date())}
                    </span>
                `;
            }
        }

        // Update badge
        const currentCount = parseInt(document.getElementById('newFeedbackBadge')?.textContent || '0');
        updateFeedbackBadge(Math.max(0, currentCount - 1));

        console.log('Feedback acknowledged and UI updated');
    } catch (error) {
        console.error('Error acknowledging feedback:', error);
        alert('Error marking feedback as read. Please try again.');
    }
}

/**
 * Update feedback badge count
 */
function updateFeedbackBadge(count) {
    const badge = document.getElementById('newFeedbackBadge');
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count.toString();
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Check if current user is a parent with access to swimmer
 */
async function checkParentAccess(swimmerId) {
    try {
        const userProfile = await getCurrentUserProfile();

        if (!userProfile || !userProfile.profile) {
            return false;
        }

        if (userProfile.profile.role !== 'parent') {
            return false;
        }

        return userProfile.profile.linked_swimmer_ids.includes(swimmerId);
    } catch (error) {
        console.error('Error checking parent access:', error);
        return false;
    }
}

// ============================================================================
// EXPORT
// ============================================================================

if (typeof window !== 'undefined') {
    window.ParentViewModule = {
        ParentViewManager,
        initParentView,
        loadAndDisplayFeedback,
        acknowledgeFeedbackClick,
        updateFeedbackBadge,
        checkParentAccess
    };
}

console.log('Parent view module loaded');
