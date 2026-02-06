

# Comprehensive Platform Update Plan

## Overview
This plan addresses points simplification, data integrity, class/year structure enforcement, leaderboard ordering, submission improvements, librarian dashboard enhancements, and Google Sheets sync deduplication.

---

## 1. Points System: Strictly 3 Points Per Book, No Bonuses

### Database Changes
- Update all existing `book_submissions` with `points_earned != 3` to set them to `3`
- Drop the `update_reading_streak` trigger that adds bonus points to submissions (the trigger currently adds +1 bonus points for streak books beyond the 2nd)
- Replace the `update_reading_streak()` function with a version that tracks streaks but does NOT modify `points_earned` on submissions
- Reset all `total_bonus_points` in `reading_streaks` table to `0`

### Frontend Changes
- **ReadingStreak.tsx**: Remove the "Bonus Points" display or change it to only show streak count (no bonus points reference)
- **XPProgressBar.tsx**: Adjust XP level thresholds to align with 3-points-per-book system (max 45 books = 135 points max)
  - New levels: Starter (0), Beginner (9), Learner (18), Developing (30), Intermediate (45), Skilled (60), Proficient (75), Advanced (90), Expert (105), Master Reader (120+)
- **AdvancedLeaderboard.tsx**: Update the `getXPLevel` function to match the new thresholds
- **Dashboard.tsx**: Ensure house colors use `HOUSE_COLORS` from constants (currently uses wrong mapping)
- **SubmitBook.tsx**: Already sets `points_earned: 3` -- confirmed correct
- **PointsSection.tsx**: Confirm it shows 3 points per book only

---

## 2. Class Structure: Year Group + Class Combinations

### Constants Update (constants.ts)
- Define a `CLASS_BY_YEAR` mapping that ties each class to its year group:

```text
MYP5: Swara, Chui, Duma, Nyati, Twiga, Kifaru
G10:  Swara, Chui, Duma, Nyati, Twiga, Kifaru
G11:  Swara, Chui, Duma, Nyati, Twiga, Kifaru
G12:  Swara, Chui, Duma, Nyati, Twiga, Kifaru
DP1:  Swara, Chui, Duma, Nyati, Twiga, Kifaru
DP2:  Swara, Chui, Duma, Nyati, Twiga, Kifaru
```

- Add constant `MAX_BOOKS = 45` and `MAX_STUDENTS_PER_CLASS = 25`

### Auth.tsx Updates
- When a student selects a year group, only show classes valid for that year group
- Add validation that class enrollment doesn't exceed 25 students (check against existing profiles count)
- Display classes as "MYP5 Swara", "DP1 Chui" format in the selection

### Leaderboard Ordering
- **AdvancedLeaderboard.tsx**: Change tab order from Houses > Students > Classes > Year Groups to: **Year Groups > Classes > Houses > Students**
- In the Classes tab, sort and display classes grouped by year group (e.g., "MYP5 Nyati", "MYP5 Swara", "DP1 Swara")
- Cap progress bars at 45 books max

---

## 3. Submissions & Category Selection

### SubmitBook.tsx Updates
- The book does NOT need to be found in the library catalog -- it can be any book. Remove the implication that it must be in Follett
- Add category selection that reflects on the submission, showing the category name and reflection prompt
- Already working but ensure it's clear that "Free Choice" (category 15) accepts any book

### Librarian Dashboard: Flagged + All Submissions
- **LibrarianUserManager.tsx**: Already supports viewing all submissions, editing points, approving/rejecting, and deleting. Enhancements needed:
  - Show category name on each submission card
  - Add a "flagged" filter shortcut at the top
  - Ensure flagged submissions appear prominently
  - Add realtime subscription so new submissions appear instantly without manual refresh

### Database: Realtime for Submissions
- Enable realtime on `book_submissions` table so librarian dashboard updates live

---

## 4. Google Sheets Sync: Deduplication & One-Time Fetch

### Edge Function (sync-google-sheet/index.ts)
- Already checks for duplicates by email + title + date_finished in `pending_submissions` and by title + author in `book_submissions`
- Strengthen deduplication: also check email + title combination in `book_submissions` (via user lookup)
- Ensure re-running sync does NOT re-import records that already exist
- Keep the published CSV / gviz / export fallback strategy for public and non-public sheets

### Frontend (GoogleSheetSync.tsx)
- Already shows sync status and history -- no major changes needed
- Add a note clarifying that duplicate records are automatically skipped

---

## 5. Homepage Editor: Full CMS Control

### HomepageEditor.tsx
- Already supports editing title, content, image URL, visibility toggle, and adding/deleting sections
- Add pre-configured section keys for ALL homepage sections: `hero`, `goals`, `categories`, `ib_connections`, `outcomes`, `points`, `footer`, `announcement`, `featured_challenge`, `motivation`, `tip_of_day`

### Index.tsx (Homepage)
- Connect the remaining static sections (GoalsSection, CategoriesSection, IBConnectionsSection, OutcomesSection, PointsSection, Footer) to read from `homepage_content` database
- Each section component should accept optional `title` and `content` overrides from the database
- If a section is hidden in the editor, it should not render on the homepage

### Section Components Updates
- **HeroSection.tsx**: Accept dynamic title/content from database
- **GoalsSection.tsx**: Accept dynamic content
- **PointsSection.tsx**: Accept dynamic content
- **CategoriesSection.tsx**: Accept dynamic content
- **IBConnectionsSection.tsx**: Accept dynamic content
- **OutcomesSection.tsx**: Accept dynamic content
- **Footer.tsx**: Accept dynamic content

---

## 6. Dashboard House Colors Fix

### Dashboard.tsx
- Replace the hardcoded `houseConfig` (which has wrong colors: Kenya=red, Longonot=blue) with the centralized `HOUSE_COLORS` from constants
- Kenya = Blue, Longonot = Yellow, Elgon = Green, Kilimanjaro = Red

---

## Technical Implementation Summary

### Database Migration
```text
1. UPDATE book_submissions SET points_earned = 3 WHERE points_earned != 3
2. UPDATE reading_streaks SET total_bonus_points = 0
3. Replace update_reading_streak() function (no bonus points)
4. ALTER PUBLICATION supabase_realtime ADD TABLE book_submissions
5. Seed any missing homepage_content sections
```

### Files to Modify
- `src/lib/constants.ts` -- Add CLASS_BY_YEAR, MAX_BOOKS, MAX_STUDENTS_PER_CLASS
- `src/pages/Auth.tsx` -- Year-group-dependent class filtering, enrollment cap check
- `src/components/XPProgressBar.tsx` -- Adjust XP thresholds for 3pts/book system
- `src/components/AdvancedLeaderboard.tsx` -- Reorder tabs, update XP levels, display classes with year group prefix
- `src/components/ReadingStreak.tsx` -- Remove bonus points display
- `src/pages/Dashboard.tsx` -- Use HOUSE_COLORS from constants
- `src/components/LibrarianUserManager.tsx` -- Add category display, flagged filter, realtime subscription
- `src/pages/SubmitBook.tsx` -- Minor text update clarifying any book is acceptable
- `src/components/HomepageEditor.tsx` -- Ensure all section keys are listed
- `src/pages/Index.tsx` -- Wire static sections to database content with visibility control
- `src/components/HeroSection.tsx` -- Accept props from database
- `src/components/GoalsSection.tsx` -- Accept props from database
- `src/components/PointsSection.tsx` -- Accept props from database
- `src/components/CategoriesSection.tsx` -- Accept props from database
- `src/components/IBConnectionsSection.tsx` -- Accept props from database
- `src/components/OutcomesSection.tsx` -- Accept props from database
- `src/components/Footer.tsx` -- Accept props from database
- `supabase/functions/sync-google-sheet/index.ts` -- Strengthen deduplication

### Edge Function
- `sync-google-sheet` -- Enhanced duplicate checking

