

# Platform Enhancement Plan

## Summary

After reviewing the codebase, most features described already exist (auth, access codes, certificates, challenges, dashboard, member management, categories, bulk import). This plan focuses on the **genuinely missing/enhanced** items.

**Regarding the external Supabase URL**: This project runs on Lovable Cloud, which already provides all backend capabilities. Connecting a separate Supabase project is not supported -- your data lives securely in Lovable Cloud. There is no need to duplicate data elsewhere.

---

## Phase 1: Forgot Password Flow

**Status**: Missing entirely -- no reset link on the sign-in form.

**Changes**:
- Add "Forgot Password?" link below the sign-in form in `Auth.tsx`
- Create a forgot password dialog/section that calls `supabase.auth.resetPasswordForEmail()`
- Create a new `/reset-password` page that handles the recovery token and lets the user set a new password via `supabase.auth.updateUser({ password })`
- Add the `/reset-password` route in `App.tsx` as a public route

---

## Phase 2: Librarian User-Detail View (Click User → See All Submissions)

**Status**: The `LibrarianUserManager` shows a flat list of all submissions. No per-user drill-down.

**Changes**:
- Add a "Student Profiles" view in the librarian submissions tab
- Show a list of all students (searchable, filterable)
- When a librarian clicks on a student, open a detail panel showing:
  - Student info (name, house, year, class, email)
  - All their book submissions with status badges
  - Total points, books read, achievement level
  - Actions: approve/reject/flag individual submissions
  - Certificate eligibility status

---

## Phase 3: Enhanced Challenge Builder with AI

**Status**: The `EnhancedChallengeCreator` already supports creating challenges with AI generation, multiple challenge types, participation rules, difficulty levels, and badge assignment. The `generate-challenge` edge function exists.

**Enhancements**:
- Add an "Ask AI to Build" text input where the librarian describes a challenge in natural language and AI generates the full configuration
- Add AI suggestion buttons ("Improve description", "Suggest points", "Recommend difficulty")
- Add a live preview card showing how the challenge will appear to students
- Add a pre-publish checklist (title set, dates set, points configured, etc.)
- Add challenge templates (Reading Sprint, Writing Contest, Poetry Competition, Genre Explorer) that pre-fill the form

---

## Phase 4: Submission & Dashboard Enhancements

- Certificate download from student dashboard (button appears when milestone is reached)
- Dynamic dashboard cards that reflect unlocked content and active challenges
- Improved notification system for deadline reminders and submission feedback

---

## Technical Details

### New Files
- `src/pages/ResetPassword.tsx` -- Password reset page
- `src/components/StudentDetailView.tsx` -- Librarian per-student submission viewer
- `src/components/ChallengeTemplates.tsx` -- Pre-built challenge templates
- `src/components/ChallengePreviewCard.tsx` -- Live preview for challenge builder

### Modified Files
- `src/pages/Auth.tsx` -- Add forgot password link and dialog
- `src/App.tsx` -- Add `/reset-password` route
- `src/components/LibrarianUserManager.tsx` -- Add student list view with click-to-detail
- `src/components/EnhancedChallengeCreator.tsx` -- AI buttons, templates, preview, checklist
- `src/pages/MyProgress.tsx` -- Certificate download buttons per milestone

### No Database Changes Required
All needed tables already exist (profiles, book_submissions, challenges, certificate_templates, notifications).

