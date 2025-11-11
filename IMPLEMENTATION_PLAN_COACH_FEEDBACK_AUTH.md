# Implementation Plan: Coach Feedback & Parent Authentication System

## Date: 2025-01-14
## Status: Planning Phase - Ready for Implementation

---

## Executive Summary

Add coach feedback capture and parent authentication to the swim tracker to systematically record post-meet feedback and provide private access to parents. This addresses the problem of valuable coach feedback being lost after competitions.

**Core Value Proposition:**
- **For Coaches**: Systematic feedback capture, no more lost notes
- **For Parents**: Private, detailed feedback integrated with performance stats
- **For Swimmers**: Clear goals and documented progress over time

---

## System Architecture

### Current State
- Static GitHub Pages website (no backend server)
- Supabase database for swim data
- Public-facing interface for all users
- No authentication or private data

### Proposed State
- Same static GitHub Pages (no server changes needed)
- Supabase Auth for user authentication
- Three-tier access: Public, Parent, Coach
- Private feedback data with Row-Level Security

---

## Database Schema Design

### New Tables

#### 1. `user_profiles` Table
Stores user accounts linked to Supabase Auth.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coach', 'parent', 'swimmer')),
  full_name TEXT NOT NULL,
  linked_swimmer_ids INTEGER[] DEFAULT '{}',  -- Array of swimmer IDs for parents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

**Purpose**: Links Supabase Auth users to roles and swimmers
**Key Fields**:
- `role`: 'coach', 'parent', or 'swimmer'
- `linked_swimmer_ids`: Array of swimmer IDs (for parents to access their kids' data)

---

#### 2. `coach_feedback` Table
Stores feedback entries from coaches for each swimmer/meet.

```sql
CREATE TABLE coach_feedback (
  id BIGSERIAL PRIMARY KEY,
  swimmer_id INTEGER NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  meet_date DATE NOT NULL,
  meet_name TEXT,
  feedback_text TEXT NOT NULL,
  focus_areas JSONB DEFAULT '[]',      -- Array of focus areas for practice
  strengths JSONB DEFAULT '[]',        -- Things swimmer did well
  improvements JSONB DEFAULT '[]',     -- Areas needing improvement
  goals_for_next_meet TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'parent-visible', 'public')),
  created_by_coach_id UUID REFERENCES user_profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  parent_acknowledged BOOLEAN DEFAULT FALSE,
  parent_acknowledged_at TIMESTAMPTZ,

  -- One feedback per swimmer per meet
  CONSTRAINT feedback_per_swimmer_meet UNIQUE (swimmer_id, meet_date)
);

-- Indexes for performance
CREATE INDEX idx_coach_feedback_swimmer ON coach_feedback(swimmer_id);
CREATE INDEX idx_coach_feedback_date ON coach_feedback(meet_date DESC);
CREATE INDEX idx_coach_feedback_visibility ON coach_feedback(visibility);
```

**Purpose**: Stores structured feedback from coaches
**Key Fields**:
- `focus_areas`: JSON array of specific practice focuses
- `strengths`: JSON array of positive observations
- `improvements`: JSON array of areas to work on
- `visibility`: Controls who can see the feedback
- `parent_acknowledged`: Tracks if parent has read the feedback

**Example Data**:
```json
{
  "swimmer_id": 1,
  "meet_date": "2025-11-15",
  "meet_name": "LAC Fall Invitational",
  "strengths": ["Strong starts", "Excellent streamline", "Good race strategy"],
  "improvements": ["Turn technique", "Breathing rhythm"],
  "focus_areas": ["Flip turns", "Underwater kicks", "Bilateral breathing"],
  "feedback_text": "Great progress on freestyle technique! Your starts have improved significantly...",
  "goals_for_next_meet": "Improve 50 FR by 0.5s, execute perfect flip turns",
  "visibility": "parent-visible"
}
```

---

#### 3. `feedback_acknowledgments` Table (Optional)
Tracks when parents view/acknowledge feedback.

```sql
CREATE TABLE feedback_acknowledgments (
  id BIGSERIAL PRIMARY KEY,
  feedback_id BIGINT REFERENCES coach_feedback(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES user_profiles(user_id),
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,  -- Optional parent notes/questions

  CONSTRAINT unique_acknowledgment UNIQUE (feedback_id, parent_user_id)
);
```

**Purpose**: Audit trail of parent engagement with feedback
**Use Case**: Track which feedback has been read, allow parent questions

---

#### 4. `feedback_audit_log` Table
Audit trail for all feedback changes (security & compliance).

```sql
CREATE TABLE feedback_audit_log (
  id BIGSERIAL PRIMARY KEY,
  feedback_id BIGINT REFERENCES coach_feedback(id),
  action TEXT NOT NULL,  -- 'created', 'updated', 'deleted'
  changed_by UUID REFERENCES user_profiles(user_id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB
);
```

**Purpose**: Track all changes to feedback for accountability
**Automatic**: Triggered by database on INSERT/UPDATE/DELETE

---

## Row-Level Security (RLS) Policies

Database-level privacy enforcement - most critical security layer.

### Enable RLS
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_acknowledgments ENABLE ROW LEVEL SECURITY;
```

### User Profiles Policies
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches can view all profiles (for linking parents to swimmers)
CREATE POLICY "Coaches can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );
```

### Coach Feedback Policies
```sql
-- Coaches can view all feedback
CREATE POLICY "Coaches can view all feedback"
  ON coach_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

-- Coaches can insert feedback
CREATE POLICY "Coaches can insert feedback"
  ON coach_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

-- Coaches can update own feedback
CREATE POLICY "Coaches can update own feedback"
  ON coach_feedback FOR UPDATE
  USING (created_by_coach_id = auth.uid());

-- Parents view feedback for their linked swimmers only
CREATE POLICY "Parents view feedback for linked swimmers"
  ON coach_feedback FOR SELECT
  USING (
    visibility IN ('parent-visible', 'public')
    AND swimmer_id = ANY (
      SELECT unnest(linked_swimmer_ids)
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Public users see only public feedback
CREATE POLICY "Public can view public feedback"
  ON coach_feedback FOR SELECT
  USING (visibility = 'public');
```

**Security Model Summary**:
- Database enforces privacy at row level
- No data leaks even if client code has bugs
- Parents can ONLY see feedback for swimmers in their `linked_swimmer_ids` array
- Coaches have full read/write access
- Public users see stats but no private feedback

---

## Authentication Setup

### Supabase Auth Configuration

**Provider**: Email/Password (primary)
**Optional**: Magic Links (passwordless email login)

**Configuration Steps**:
1. Enable Email provider in Supabase Dashboard → Authentication → Providers
2. Configure email templates:
   - Confirmation email
   - Password reset
   - Magic link (optional)
3. Set up redirect URLs for GitHub Pages domain

### Auto-Create User Profile Trigger
```sql
-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),  -- Default to parent
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on auth.users INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Flow**:
1. User signs up via Supabase Auth
2. Record created in `auth.users` table
3. Trigger fires automatically
4. User profile created in `user_profiles` with default role='parent'
5. Coach can later update role if needed

---

## Frontend Implementation

### File Structure

```
/auth/
  ├── login.html              # Login page
  ├── signup.html             # Registration page
  ├── coach-dashboard.html    # Coach feedback entry
  ├── parent-dashboard.html   # Parent view
  └── auth.css                # Auth-specific styles

/js/
  ├── auth.js                 # Authentication logic
  ├── coach-feedback.js       # Coach feedback management
  └── parent-view.js          # Parent dashboard logic
```

### Authentication Logic (`js/auth.js`)

```javascript
// Initialize Supabase (reuse existing config)
const supabase = window.supabase.createClient(
    'https://gwqwpicbtkamojwwlmlp.supabase.co',
    'YOUR_ANON_KEY'
);

// Login function
async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage(error.message, 'error');
        return null;
    }

    // Get user profile to determine role
    const profile = await getUserProfile(data.user.id);

    // Redirect based on role
    if (profile.role === 'coach') {
        window.location.href = '/auth/coach-dashboard.html';
    } else if (profile.role === 'parent') {
        window.location.href = '/auth/parent-dashboard.html';
    }

    return data;
}

// Signup function
async function signup(email, password, fullName, role, linkedSwimmers = []) {
    const { data, error } = await supabase.auth.signUp({
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

    if (error) {
        showMessage(error.message, 'error');
        return null;
    }

    showMessage('Account created! Please check your email to confirm.', 'success');
    return data;
}

// Check if user is logged in
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = '/auth/login.html';
        return null;
    }

    return session;
}

// Logout
async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/index.html';
}

// Get user profile
async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    return data;
}
```

---

### Coach Feedback Manager (`js/coach-feedback.js`)

```javascript
class CoachFeedbackManager {
    constructor(supabase) {
        this.supabase = supabase;
    }

    // Add new feedback
    async addFeedback(swimmerId, meetDate, feedbackData) {
        const { data, error } = await this.supabase
            .from('coach_feedback')
            .insert({
                swimmer_id: swimmerId,
                meet_date: meetDate,
                meet_name: feedbackData.meetName,
                feedback_text: feedbackData.text,
                focus_areas: feedbackData.focusAreas,
                strengths: feedbackData.strengths,
                improvements: feedbackData.improvements,
                goals_for_next_meet: feedbackData.goals,
                visibility: feedbackData.visibility || 'parent-visible'
            })
            .select()
            .single();

        return { data, error };
    }

    // Get all feedback for a swimmer
    async getFeedbackForSwimmer(swimmerId) {
        const { data, error } = await this.supabase
            .from('coach_feedback')
            .select('*')
            .eq('swimmer_id', swimmerId)
            .order('meet_date', { ascending: false });

        return data || [];
    }

    // Update existing feedback
    async updateFeedback(feedbackId, updates) {
        const { data, error } = await this.supabase
            .from('coach_feedback')
            .update(updates)
            .eq('id', feedbackId)
            .select()
            .single();

        return { data, error };
    }

    // Delete feedback
    async deleteFeedback(feedbackId) {
        const { error } = await this.supabase
            .from('coach_feedback')
            .delete()
            .eq('id', feedbackId);

        return { error };
    }
}
```

---

### Parent Dashboard Logic (`js/parent-view.js`)

```javascript
class ParentDashboard {
    constructor(supabase) {
        this.supabase = supabase;
    }

    // Load feedback for parent's linked swimmers
    async loadFeedbackForSwimmer(swimmerId) {
        const { data, error } = await this.supabase
            .from('coach_feedback')
            .select('*')
            .eq('swimmer_id', swimmerId)
            .in('visibility', ['parent-visible', 'public'])
            .order('meet_date', { ascending: false });

        if (error) {
            console.error('Error loading feedback:', error);
            return [];
        }

        return data;
    }

    // Mark feedback as acknowledged
    async acknowledgeFeedback(feedbackId) {
        const { data, error } = await this.supabase
            .from('coach_feedback')
            .update({
                parent_acknowledged: true,
                parent_acknowledged_at: new Date().toISOString()
            })
            .eq('id', feedbackId)
            .select()
            .single();

        return { data, error };
    }

    // Render feedback card HTML
    renderFeedback(feedback) {
        return `
            <div class="feedback-card ${feedback.parent_acknowledged ? 'acknowledged' : 'new'}">
                <div class="feedback-header">
                    <h3>${feedback.meet_name || 'Meet Feedback'}</h3>
                    <span class="feedback-date">${formatDate(feedback.meet_date)}</span>
                </div>

                ${feedback.strengths?.length > 0 ? `
                    <div class="feedback-section strengths">
                        <h4>✅ Strengths</h4>
                        <ul>
                            ${feedback.strengths.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${feedback.improvements?.length > 0 ? `
                    <div class="feedback-section improvements">
                        <h4>🎯 Areas to Improve</h4>
                        <ul>
                            ${feedback.improvements.map(i => `<li>${i}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${feedback.focus_areas?.length > 0 ? `
                    <div class="feedback-section focus">
                        <h4>🏊 Practice Focus</h4>
                        <ul>
                            ${feedback.focus_areas.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${feedback.feedback_text ? `
                    <div class="feedback-section detailed">
                        <h4>Coach's Detailed Feedback</h4>
                        <p>${feedback.feedback_text}</p>
                    </div>
                ` : ''}

                ${feedback.goals_for_next_meet ? `
                    <div class="feedback-section goals">
                        <h4>🎯 Goals for Next Meet</h4>
                        <p>${feedback.goals_for_next_meet}</p>
                    </div>
                ` : ''}

                ${!feedback.parent_acknowledged ? `
                    <button class="btn-acknowledge" onclick="acknowledgeFeedback(${feedback.id})">
                        Mark as Read
                    </button>
                ` : `
                    <span class="acknowledged-badge">✓ Acknowledged ${formatDate(feedback.parent_acknowledged_at)}</span>
                `}
            </div>
        `;
    }
}
```

---

## Integration with Existing App

### Update Main Page Header

**Modify `index.html` header:**
```html
<header class="header">
    <div class="header-content">
        <h1 class="logo" id="teamLogo">Loading...</h1>
        <div class="header-right">
            <select id="swimmerSelect" class="swimmer-select">
                <option value="">Loading...</option>
            </select>

            <!-- Show when not logged in -->
            <div id="authButtons">
                <a href="/auth/login.html" class="btn-login">Login</a>
            </div>

            <!-- Show when logged in -->
            <div id="userMenu" style="display:none;">
                <span id="userName"></span>
                <button onclick="logout()">Logout</button>
            </div>
        </div>
    </div>
</header>
```

### Add Feedback Section to Main Content

```html
<!-- Coach Feedback Section (visible only to authenticated parents) -->
<section class="feedback-section collapsible-section" id="coachFeedbackSection" style="display:none;">
    <div class="section-header collapsible" data-target="feedbackContent">
        <div class="section-header-content">
            <h3 class="section-title">
                Coach Feedback
                <span id="newFeedbackBadge" class="badge" style="display:none;">New</span>
            </h3>
        </div>
        <span class="collapse-icon">▲</span>
    </div>
    <div class="section-content" id="feedbackContent">
        <div id="feedbackList">
            <!-- Populated by JavaScript -->
        </div>
    </div>
</section>
```

### Session Management in `app-new.js`

```javascript
class SwimTracker {
    constructor() {
        // ... existing properties ...
        this.currentUser = null;
    }

    async init() {
        // ... existing code ...

        // Check authentication status
        await this.checkAuthStatus();

        // ... rest of init ...
    }

    async checkAuthStatus() {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            // User is logged in
            const profile = await this.getUserProfile(session.user.id);
            this.currentUser = profile;

            // Update UI
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('userMenu').style.display = 'block';
            document.getElementById('userName').textContent = profile.full_name;

            // Show feedback section for parents
            if (profile.role === 'parent') {
                document.getElementById('coachFeedbackSection').style.display = 'block';
                await this.loadCoachFeedback();
            }
        } else {
            // User is not logged in - show public view only
            document.getElementById('authButtons').style.display = 'block';
            document.getElementById('userMenu').style.display = 'none';
        }
    }

    async getUserProfile(userId) {
        const { data } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
        return data;
    }

    async loadCoachFeedback() {
        if (!this.currentSwimmer || !this.currentUser) return;

        // Check if current swimmer is linked to this parent
        if (!this.currentUser.linked_swimmer_ids.includes(this.currentSwimmer.id)) {
            return; // Not authorized
        }

        const parentView = new ParentDashboard(this.supabase);
        const feedback = await parentView.loadFeedbackForSwimmer(this.currentSwimmer.id);

        // Render feedback
        const feedbackList = document.getElementById('feedbackList');
        feedbackList.innerHTML = feedback.map(f => parentView.renderFeedback(f)).join('');

        // Show badge if there's new unacknowledged feedback
        const hasNew = feedback.some(f => !f.parent_acknowledged);
        if (hasNew) {
            document.getElementById('newFeedbackBadge').style.display = 'inline';
        }
    }
}
```

---

## Implementation Timeline

### Week 1: Database & Auth Foundation (7 days)

**Days 1-2: Database Setup**
- ✅ Create `user_profiles` table
- ✅ Create `coach_feedback` table
- ✅ Create `feedback_acknowledgments` table
- ✅ Create `feedback_audit_log` table
- ✅ Implement all RLS policies
- ✅ Set up auto-profile-creation trigger
- ✅ Test RLS with sample data

**Days 3-4: Authentication UI**
- ✅ Create `auth/login.html`
- ✅ Create `auth/signup.html`
- ✅ Implement `js/auth.js`
- ✅ Test login/signup flows
- ✅ Create test accounts (1 coach, 2 parents)

**Days 5-7: Coach Dashboard Foundation**
- ✅ Create `auth/coach-dashboard.html`
- ✅ Build feedback entry form
- ✅ Implement `js/coach-feedback.js`
- ✅ Test feedback CRUD operations
- ✅ Verify RLS enforcement

### Week 2: Coach & Parent Dashboards (7 days)

**Days 8-10: Coach Features**
- ✅ Complete coach dashboard UI
- ✅ Add swimmer selection dropdown
- ✅ Implement bulk feedback entry
- ✅ Add feedback history view
- ✅ Test with multiple swimmers

**Days 11-14: Parent Features**
- ✅ Build parent dashboard
- ✅ Implement feedback display
- ✅ Add acknowledgment system
- ✅ Create notification badges
- ✅ Test with linked swimmers

### Week 3: Integration & Testing (7 days)

**Days 15-17: Integration**
- ✅ Integrate auth with existing `index.html`
- ✅ Add conditional feedback section
- ✅ Update navigation and header
- ✅ Implement session management
- ✅ Style consistency with existing app

**Days 18-21: Testing & Deployment**
- ✅ End-to-end testing all flows
- ✅ Security audit and penetration testing
- ✅ Performance optimization
- ✅ Documentation
- ✅ Deploy to production

---

## Effort Breakdown

| Task | Complexity | Estimated Time | Priority |
|------|-----------|----------------|----------|
| Database Schema | Low | 2-3 hours | High |
| RLS Policies | Medium | 3-5 hours | Critical |
| Auth UI (Login/Signup) | Low | 3-4 hours | High |
| Auth Logic (js/auth.js) | Medium | 4-6 hours | High |
| Coach Dashboard | Medium | 6-8 hours | High |
| Coach Feedback Form | Medium | 4-5 hours | High |
| Parent Dashboard | Medium | 4-6 hours | High |
| Integration with Main App | Medium | 4-6 hours | High |
| Testing & Refinement | High | 6-10 hours | Critical |
| **TOTAL** | **Medium** | **36-53 hours** | **~2-3 weeks** |

---

## Security Considerations

### Data Privacy
- ✅ Row-Level Security enforces privacy at database level
- ✅ Parents can ONLY see feedback for their linked swimmers
- ✅ No data leaks even if client code has bugs
- ✅ JWT tokens for authentication (Supabase standard)

### Audit Trail
- ✅ All feedback changes logged in `feedback_audit_log`
- ✅ Track who made changes and when
- ✅ Old and new values preserved

### Access Control Matrix

| Role | View Swimmers | View All Feedback | Create Feedback | Edit Feedback | Delete Feedback |
|------|---------------|-------------------|-----------------|---------------|-----------------|
| **Public** | ✅ Public list | ❌ None | ❌ | ❌ | ❌ |
| **Parent** | ✅ Linked only | ✅ Linked swimmers (parent-visible) | ❌ | ❌ | ❌ |
| **Coach** | ✅ All | ✅ All | ✅ | ✅ Own | ✅ Own |

### Additional Security Measures
- Email verification required for signup
- Password reset flow via email
- Session timeout after inactivity
- HTTPS enforced (GitHub Pages default)

---

## Testing Plan

### Unit Tests
- ✅ RLS policies work correctly
- ✅ Parent can only access linked swimmers
- ✅ Coach can access all feedback
- ✅ Public cannot see private feedback

### Integration Tests
- ✅ Signup → Email verification → Login → Dashboard
- ✅ Coach creates feedback → Parent sees it
- ✅ Parent acknowledges feedback → Status updates
- ✅ Coach edits feedback → Changes reflected

### Security Tests
- ❌ Attempt to access feedback without authentication
- ❌ Parent tries to access non-linked swimmer
- ❌ Tamper with JWT token
- ❌ SQL injection attempts

### Performance Tests
- ✅ Page load time < 2 seconds
- ✅ Feedback list loads < 500ms
- ✅ No N+1 query problems

---

## Optional Enhancements (Post-MVP)

### Phase 4: Advanced Features

1. **Email Notifications**
   - Send email when coach adds new feedback
   - Weekly digest of unacknowledged feedback
   - Reminder notifications

2. **Mobile-Responsive Coach Entry**
   - Poolside feedback entry from phone
   - Voice-to-text integration
   - Quick templates for common feedback

3. **Rich Media Support**
   - Upload videos of race techniques
   - Annotate swim videos
   - Photo attachments for form analysis

4. **Analytics Dashboard**
   - Track feedback trends over time
   - Correlate feedback with performance
   - Identify common focus areas

5. **Parent-Coach Messaging**
   - In-app messaging system
   - Question/answer threads
   - Schedule meeting requests

6. **Swimmer Self-Assessment**
   - Swimmers log own reflections
   - Compare self-assessment with coach feedback
   - Goal tracking and journaling

---

## Success Metrics

### Technical Metrics
- ✅ 100% RLS policy coverage
- ✅ Zero security vulnerabilities
- ✅ < 2 second page load time
- ✅ 99.9% uptime (Supabase SLA)

### User Engagement Metrics
- 🎯 80% of coaches enter feedback within 48 hours of meets
- 🎯 90% of parents acknowledge feedback within 1 week
- 🎯 50% reduction in "lost" coach feedback
- 🎯 Positive parent/coach satisfaction surveys

---

## Rollout Plan

### Phase 1: Beta Testing (Week 1-2)
- Deploy to staging environment
- Invite 1 coach + 3 parent families
- Gather feedback and iterate

### Phase 2: Limited Release (Week 3-4)
- Deploy to production
- Onboard all LAC coaches
- Onboard 10-15 parent families
- Monitor usage and issues

### Phase 3: Full Release (Week 5+)
- Open to all team members
- Marketing/announcement emails
- Training sessions for coaches
- Parent onboarding guide

---

## Documentation Requirements

### For Coaches
- How to create an account
- How to add feedback after meets
- How to edit past feedback
- Best practices for feedback content

### For Parents
- How to create an account
- How to link to your swimmer
- How to view and acknowledge feedback
- Privacy and data security info

### For Developers
- Database schema documentation
- API reference for feedback operations
- RLS policy explanations
- Deployment procedures

---

## Known Limitations & Future Improvements

### Current Limitations
- Single coach role (no coach hierarchy)
- Parents must manually link to swimmers (not auto-detected)
- No mobile app (web only)
- English language only

### Future Improvements
- Head coach vs. assistant coach roles
- Automatic parent-swimmer linking
- Native mobile apps (iOS/Android)
- Multi-language support
- Feedback templates and quick entry
- Video annotation tools
- Calendar integration for meets

---

## Questions to Resolve

1. **User Onboarding**: How do parents get invited/signup?
   - Manual coach approval?
   - Self-service with verification?
   - Email invitation system?

2. **Feedback Visibility**: Default visibility setting?
   - Private (coach only)?
   - Parent-visible?
   - Let coach choose per-feedback?

3. **Multiple Coaches**: How to handle?
   - Any coach can edit any feedback?
   - Each coach owns their feedback?
   - Head coach can edit all?

4. **Swimmer Access**: Should swimmers see their own feedback?
   - Read-only view?
   - Age-gated (older swimmers only)?
   - Parent decides?

---

## References

### Technical Documentation
- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Chart.js Docs: https://www.chartjs.org/docs/latest/

### Related Files
- `/js/app-new.js` - Main application logic
- `/js/supabase-client.js` - Database client
- `/.project-rules.md` - Project conventions
- `/TODO_TIME_STANDARDS_LABELS.md` - Previous feature documentation

---

## Contact & Support

**Project Owner**: Vihaan's Family
**Repository**: https://github.com/yvh1223/vihaan-swim-tracker
**Email**: yvh1223@gmail.com

---

**Document Status**: ✅ Complete - Ready for Review
**Last Updated**: 2025-01-14
**Next Review**: Before implementation start
