/**
 * Authentication Module for Swim Tracker
 * Handles user authentication, session management, and role-based routing
 * Uses Supabase Auth for secure authentication
 */

// Initialize Supabase client (reuse config from supabase-client.js)
const SUPABASE_CONFIG = {
    url: 'https://gwqwpicbtkamojwwlmlp.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXdwaWNidGthbW9qd3dsbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODk3MzAsImV4cCI6MjA3NTg2NTczMH0.5KiCESGV2zzSmhpwDmJ3TsCwdqyCQXntgTGhWkuV27s'
};

let authSupabase = null;

// Initialize Supabase on script load
if (typeof window !== 'undefined' && typeof window.supabase !== 'undefined') {
    authSupabase = window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey
    );
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication data
 */
async function login(email, password) {
    try {
        const { data, error } = await authSupabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        console.log('Login successful:', data.user.email);

        // Get user profile to determine role
        const profile = await getUserProfile(data.user.id);

        if (!profile) {
            throw new Error('User profile not found. Please contact administrator.');
        }

        // Store user info in session storage
        sessionStorage.setItem('userRole', profile.role);
        sessionStorage.setItem('userName', profile.full_name);

        // Redirect based on role
        if (profile.role === 'coach') {
            window.location.href = '/auth/coach-dashboard.html';
        } else if (profile.role === 'parent') {
            window.location.href = '/index.html'; // Main page with feedback section
        } else {
            window.location.href = '/index.html';
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        showMessage(error.message || 'Login failed. Please check your credentials.', 'error');
        throw error;
    }
}

/**
 * Sign up new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User's full name
 * @param {string} role - User role (parent, coach, swimmer)
 * @param {Array<number>} linkedSwimmers - Array of swimmer IDs (for parents)
 * @returns {Promise<Object>} Signup data
 */
async function signup(email, password, fullName, role = 'parent', linkedSwimmers = []) {
    try {
        const { data, error } = await authSupabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                    linked_swimmer_ids: linkedSwimmers
                }
            }
        });

        if (error) throw error;

        console.log('Signup successful:', email);

        showMessage(
            'Account created successfully! Please check your email to confirm your account.',
            'success'
        );

        // Redirect to login after 3 seconds
        setTimeout(() => {
            window.location.href = '/auth/login.html';
        }, 3000);

        return data;
    } catch (error) {
        console.error('Signup error:', error);
        showMessage(error.message || 'Signup failed. Please try again.', 'error');
        throw error;
    }
}

/**
 * Logout current user
 */
async function logout() {
    try {
        const { error } = await authSupabase.auth.signOut();
        if (error) throw error;

        console.log('Logout successful');

        // Clear session storage
        sessionStorage.clear();

        // Redirect to main page
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Logout failed. Please try again.', 'error');
    }
}

/**
 * Check if user is authenticated
 * @returns {Promise<Object|null>} Session object or null
 */
async function checkAuth() {
    try {
        const { data: { session }, error } = await authSupabase.auth.getSession();

        if (error) throw error;

        return session;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} User object or null
 */
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await authSupabase.auth.getUser();

        if (error) throw error;

        return user;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

/**
 * Reset password
 * @param {string} email - User email
 */
async function resetPassword(email) {
    try {
        const { error } = await authSupabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password.html`
        });

        if (error) throw error;

        console.log('Password reset email sent to:', email);
        return true;
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
}

/**
 * Update password
 * @param {string} newPassword - New password
 */
async function updatePassword(newPassword) {
    try {
        const { error } = await authSupabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        console.log('Password updated successfully');
        showMessage('Password updated successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Password update error:', error);
        showMessage('Password update failed. Please try again.', 'error');
        throw error;
    }
}

// ============================================================================
// USER PROFILE FUNCTIONS
// ============================================================================

/**
 * Get user profile from database
 * @param {string} userId - Supabase auth user ID
 * @returns {Promise<Object|null>} User profile object
 */
async function getUserProfile(userId) {
    try {
        const { data, error } = await authSupabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Get profile error:', error);
        return null;
    }
}

/**
 * Update user profile
 * @param {string} userId - Supabase auth user ID
 * @param {Object} updates - Profile fields to update
 */
async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await authSupabase
            .from('user_profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        console.log('Profile updated successfully');
        return data;
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

/**
 * Get current user's full profile (auth + profile)
 * @returns {Promise<Object|null>} Combined user and profile data
 */
async function getCurrentUserProfile() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const profile = await getUserProfile(user.id);
        if (!profile) return null;

        return {
            ...user,
            profile
        };
    } catch (error) {
        console.error('Get current user profile error:', error);
        return null;
    }
}

// ============================================================================
// AUTH STATE MANAGEMENT
// ============================================================================

/**
 * Set up auth state change listener
 * @param {Function} callback - Function to call on auth state change
 */
function onAuthStateChange(callback) {
    if (!authSupabase) return;

    const { data: { subscription } } = authSupabase.auth.onAuthStateChange(
        (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            callback(event, session);
        }
    );

    return subscription;
}

/**
 * Require authentication (redirect to login if not authenticated)
 * Use on protected pages
 */
async function requireAuth() {
    const session = await checkAuth();

    if (!session) {
        console.log('Not authenticated, redirecting to login');
        window.location.href = '/auth/login.html';
        return false;
    }

    return true;
}

/**
 * Require specific role (redirect if user doesn't have required role)
 * @param {string} requiredRole - Role required to access page
 */
async function requireRole(requiredRole) {
    const session = await checkAuth();

    if (!session) {
        window.location.href = '/auth/login.html';
        return false;
    }

    const profile = await getUserProfile(session.user.id);

    if (!profile || profile.role !== requiredRole) {
        console.log(`Access denied. Required role: ${requiredRole}, User role: ${profile?.role}`);
        showMessage('Access denied. You do not have permission to view this page.', 'error');

        // Redirect based on actual role
        if (profile?.role === 'coach') {
            window.location.href = '/auth/coach-dashboard.html';
        } else {
            window.location.href = '/index.html';
        }

        return false;
    }

    return true;
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * Show message to user
 * @param {string} message - Message text
 * @param {string} type - Message type (success, error, info)
 */
function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('authMessage');

    if (!messageEl) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
    }

    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';

    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

/**
 * Clear message
 */
function clearMessage() {
    const messageEl = document.getElementById('authMessage');
    if (messageEl) {
        messageEl.style.display = 'none';
        messageEl.textContent = '';
    }
}

// ============================================================================
// EXPORTS (for use in other scripts)
// ============================================================================

if (typeof window !== 'undefined') {
    window.AuthModule = {
        // Auth functions
        login,
        signup,
        logout,
        checkAuth,
        getCurrentUser,
        resetPassword,
        updatePassword,

        // Profile functions
        getUserProfile,
        updateUserProfile,
        getCurrentUserProfile,

        // State management
        onAuthStateChange,
        requireAuth,
        requireRole,

        // UI helpers
        showMessage,
        clearMessage,

        // Direct access to Supabase client (for advanced use)
        supabase: authSupabase
    };
}

console.log('Auth module loaded');
