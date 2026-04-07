
# Multi-Challenge Dynamic Platform Architecture

## Overview
Convert the platform from being hardcoded around one challenge into a flexible system where any challenge can become the "active environment" with full theme takeover, custom layout, and scoped content.

---

## Phase A: Database Schema Updates

### Add theming & layout columns to `challenges` table:
- `primary_color` (text) — HSL color for primary theme
- `secondary_color` (text) — HSL color for secondary accents
- `accent_color` (text) — HSL color for highlights
- `cover_image_url` (text) — Hero/banner image
- `logo_url` (text) — Challenge-specific logo
- `layout_config` (jsonb) — Sections visibility/order config:
  ```json
  {
    "sections": ["hero", "leaderboard", "submissions", "progress", "gallery"],
    "show_streak": true,
    "show_xp": true,
    "show_recommendations": false,
    "hero_style": "full" | "compact" | "minimal"
  }
  ```
- `custom_css` (text) — Optional custom CSS overrides
- `welcome_message` (text) — Challenge-specific welcome text

---

## Phase B: Challenge Context & Theme System

### New: `src/contexts/ChallengeContext.tsx`
- Stores the currently selected challenge
- Persists selection in localStorage
- Provides `selectChallenge()`, `clearChallenge()`, `activeChallenge`
- Wraps the entire app

### New: `src/components/ChallengeThemeProvider.tsx`
- Reads active challenge from context
- Dynamically injects CSS variables (--primary, --secondary, --accent, etc.) based on challenge colors
- Applies cover image, logo, and branding
- Falls back to default theme when no challenge is selected

---

## Phase C: Challenge Hub (Selection Page)

### New: `src/pages/ChallengeHub.tsx`
- Grid/list of all available challenges
- Each challenge card shows: title, description, dates, participant count, cover image, theme colors
- Click → enters that challenge's "world"
- Filters: active/upcoming/completed, difficulty, type
- Featured challenges highlighted at top

### Route changes in `App.tsx`:
- `/challenges` → ChallengeHub (selection)
- `/challenge/:id` → ChallengeEnvironment wrapper
- `/challenge/:id/dashboard` → Scoped dashboard
- `/challenge/:id/submit` → Scoped submission
- `/challenge/:id/leaderboard` → Scoped leaderboard
- `/challenge/:id/gallery` → Scoped gallery
- `/challenge/:id/progress` → Scoped progress

---

## Phase D: Challenge Environment Wrapper

### New: `src/pages/ChallengeEnvironment.tsx`
- Reads challenge ID from URL params
- Loads challenge data and applies theme
- Renders nested routes (dashboard, submit, leaderboard, etc.)
- Shows challenge-specific navbar with challenge name/logo
- All child components receive challenge context

### Modified: Dashboard, SubmitBook, Leaderboard, MyProgress, BookGallery
- Accept optional `challengeId` from context
- Filter data by challenge when inside a challenge environment
- Use challenge theme colors
- Respect `layout_config` for section visibility

---

## Phase E: Librarian Challenge Customization

### New: `src/components/ChallengeThemeEditor.tsx`
- Color pickers for primary/secondary/accent
- Cover image upload
- Logo upload
- Welcome message editor
- Live preview of theme changes

### New: `src/components/ChallengeLayoutEditor.tsx`
- Toggle sections on/off (leaderboard, gallery, streak, XP, recommendations)
- Reorder sections via drag-and-drop
- Choose hero style (full/compact/minimal)
- Preview layout in real-time

### Modified: `EnhancedChallengeCreator.tsx`
- Add "Appearance" tab with ThemeEditor
- Add "Layout" tab with LayoutEditor
- Add "Preview" button showing full challenge environment preview

---

## Phase F: Convert 45-Book Challenge

- Remove hardcoded references to "45 books" throughout the codebase
- Create a migration-style conversion: the existing challenge structure becomes a regular challenge entry in the database
- All existing submissions remain linked via the existing `book_submissions` table
- The "main" challenge concept is replaced by a "featured" flag on any challenge

---

## Files Created
1. `src/contexts/ChallengeContext.tsx`
2. `src/components/ChallengeThemeProvider.tsx`
3. `src/pages/ChallengeHub.tsx`
4. `src/pages/ChallengeEnvironment.tsx`
5. `src/components/ChallengeThemeEditor.tsx`
6. `src/components/ChallengeLayoutEditor.tsx`

## Files Modified
1. `src/App.tsx` — New routing structure
2. `src/components/Navbar.tsx` — Challenge-aware navigation
3. `src/pages/Dashboard.tsx` — Challenge-scoped content
4. `src/pages/SubmitBook.tsx` — Challenge-scoped submissions
5. `src/pages/Leaderboard.tsx` — Challenge-scoped rankings
6. `src/pages/MyProgress.tsx` — Challenge-scoped progress
7. `src/pages/BookGallery.tsx` — Challenge-scoped gallery
8. `src/components/EnhancedChallengeCreator.tsx` — Theme/layout editors
9. `src/pages/LibrarianDashboard.tsx` — Enhanced challenge management

## Database Migration
- Add columns to `challenges` table (theming, layout, branding)
