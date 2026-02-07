

# Comprehensive Platform Update: Submissions, Sync, Challenges, Categories & Certificates

This is a large update spanning 7 major feature areas. Here is the full breakdown of what will be built and changed.

---

## 1. Submission Limits: Max 2 Books Per Category, Max 45 Total

### What changes
- When a student submits a book, the system checks how many books they have already submitted in that category. If it's 2 or more, the submission is blocked with a clear error message.
- When a student has 45 total submissions, they can no longer submit new books (the form shows "You've completed the 45-Book Challenge!").
- The Submit Book page will display how many slots remain per category and overall.

### Files modified
- `src/pages/SubmitBook.tsx` -- Add pre-submission checks querying `book_submissions` for the user's count per category and total count. Disable the form at 45 books. Show remaining slots per selected category.

---

## 2. Librarian Custom Categories

### What changes
- A new database table `custom_categories` stores librarian-created categories (with id, name, prompt, created_by, is_active).
- The librarian dashboard gets a "Categories" tab where they can add new categories with a name and reflection prompt.
- These custom categories appear alongside the 30 default categories on the Submit Book form, the My Progress checklist, and the leaderboard.
- The `READING_CATEGORIES` constant remains as the default set; custom categories are merged at runtime from the database.

### Database migration
- Create `custom_categories` table with columns: `id` (serial, starting at 31), `name`, `prompt`, `created_by`, `is_active`, `created_at`.
- RLS: staff can manage, everyone can read active categories.

### Files modified
- `src/pages/SubmitBook.tsx` -- Fetch and merge custom categories with default ones.
- `src/pages/MyProgress.tsx` -- Merge custom categories into checklist.
- `src/pages/LibrarianDashboard.tsx` -- Add "Categories" tab.
- New: `src/components/CategoryManager.tsx` -- UI for librarians to add/edit/delete custom categories.

---

## 3. Challenge Submissions (In-Challenge Book Tracking)

### What changes
- When a student joins a challenge and the challenge has its own submission target (not the main 45-book challenge), the challenge page shows a "Submit for this Challenge" button that opens an inline submission form.
- Challenge submissions are linked to the challenge via the `challenge_participants` table (incrementing `books_completed`).
- These challenge submissions do NOT count toward the 45-book main challenge -- they are separate.
- The challenge card shows the student's progress toward the challenge target.

### Database changes
- New table `challenge_submissions` with columns: `id`, `challenge_id`, `user_id`, `title`, `author`, `reflection`, `category_number`, `category_name`, `created_at`, `points_earned` (default 3).
- RLS: students can insert their own, everyone can read.

### Files modified
- `src/pages/Challenges.tsx` -- Add inline submission form for joined challenges. Show progress. Distinguish between main 45-book challenge and librarian-created challenges.
- `src/components/EnhancedChallengeCreator.tsx` -- Already comprehensive. Add a toggle for "Independent from 45-book challenge" so librarian can mark it as separate.

---

## 4. Enhanced Challenge Creator

### What changes
- The existing challenge creator is already fairly complete. Enhancements include:
  - A richer description editor (multiline with formatting hints).
  - Preview card showing how the challenge will look to students.
  - Option to mark a challenge as "Independent" (not counting toward 45-book total).
  - Librarian can set specific categories that qualify for the challenge.
  - All 13 challenge types are supported (already in DB constraint).

### Files modified
- `src/components/EnhancedChallengeCreator.tsx` -- Add "Independent Challenge" toggle, preview card, richer UI.

---

## 5. Leaderboard Shows All Students

### What changes
- Currently the student leaderboard is capped at 50 entries. Remove the `.slice(0, 50)` limit so all students are shown.
- Add pagination or "Load More" for performance if needed.

### Files modified
- `src/components/AdvancedLeaderboard.tsx` -- Remove the `.slice(0, 50)` cap. Show all students in the list.

---

## 6. Google Sheets Two-Way Sync & Deduplication

### What changes
- **Sheet to Web (already working)**: The sync edge function pulls data from Google Sheets and imports it. Enhanced deduplication: check by email + title (case-insensitive) across both `pending_submissions` and `book_submissions`.
- **Web to Sheet (new)**: When a student submits a book through the web app, a new edge function `push-to-sheet` appends the row to the Google Sheet using the Google Sheets API.
- **Deduplication**: If data already exists (same email + same title), it is skipped. Re-running sync never creates duplicates.

### New edge function
- `supabase/functions/push-to-sheet/index.ts` -- Uses the Google Sheets API (via service account or API key) to append a new row when a web submission is made.
- However, appending to Google Sheets requires either a Google API key or a service account. Since the sheet is public for reading but writing requires authentication, this will need a Google service account JSON key stored as a secret.

### Alternative approach (simpler)
- Since setting up a Google service account adds complexity, the simpler approach is:
  - The sync remains one-directional (Sheet to Web) for the automated flow.
  - Web submissions are the source of truth and can be exported to CSV/Excel from the librarian dashboard for manual sheet updates.
  - Add an "Export to CSV" button on the librarian submissions manager for easy data transfer back to Sheets.

### Files modified
- `supabase/functions/sync-google-sheet/index.ts` -- Strengthen deduplication with case-insensitive email+title check across both tables.
- `src/components/LibrarianUserManager.tsx` -- Add "Export CSV" button.
- `src/components/GoogleSheetSync.tsx` -- Add note about deduplication behavior.

---

## 7. Certificate Generation System

### What changes
A complete certificate generation system with 4 achievement levels:
1. **Beginner Level** (first book submitted)
2. **Bronze Achievement** (15 books)
3. **Silver Achievement** (30 books)
4. **Gold Achievement** (45 books)

### Librarian Certificate Designer
- New tab "Certificates" in the Librarian Dashboard.
- For each level, the librarian can:
  - Choose a built-in certificate template (from 3-4 preset designs).
  - OR upload a custom background image.
  - Edit certificate text fields: title, subtitle, body text.
  - Add the school logo (upload once, applies to all).
  - Preview how the certificate will look with a sample student name.
  - Publish the certificate design (makes it available to students).

### Student Certificate Download
- On the My Progress page, when a student reaches an achievement level, a "Download Certificate" button appears next to that level.
- The certificate is generated as a PDF/image using HTML Canvas, with:
  - Student's full name
  - Achievement level and badge
  - Number of books read
  - Date of achievement
  - School logo (if uploaded by librarian)
  - The librarian's chosen template/background

### Database
- New table `certificate_templates` with columns: `id`, `level` (beginner/bronze/silver/gold), `title`, `subtitle`, `body_text`, `background_image_url`, `school_logo_url`, `template_preset` (built-in style name), `is_published`, `updated_by`, `created_at`, `updated_at`.
- RLS: librarians can manage, everyone can read published templates.

### New components
- `src/components/CertificateManager.tsx` -- Librarian UI for designing certificates per level.
- `src/components/CertificateGenerator.tsx` -- Client-side certificate generation using HTML Canvas, rendering the student's name, level, badge, and background.
- `src/components/CertificatePreview.tsx` -- Preview component used in both librarian designer and student download.

### Files modified
- `src/pages/LibrarianDashboard.tsx` -- Add "Certificates" tab.
- `src/pages/MyProgress.tsx` -- Add download buttons per achievement level.

---

## Technical Summary

### Database Migrations
1. Create `custom_categories` table (id serial starting at 31, name, prompt, created_by, is_active, created_at)
2. Create `challenge_submissions` table (id, challenge_id, user_id, title, author, reflection, category_number, category_name, created_at, points_earned default 3)
3. Create `certificate_templates` table (id, level, title, subtitle, body_text, background_image_url, school_logo_url, template_preset, is_published, updated_by, created_at, updated_at)
4. RLS policies for all new tables
5. Create storage bucket `certificates` for uploaded backgrounds and logos

### Edge Function Changes
- `sync-google-sheet` -- Enhanced deduplication (case-insensitive email + title check)

### New Components (6)
- `CategoryManager.tsx` -- Librarian category CRUD
- `CertificateManager.tsx` -- Librarian certificate designer
- `CertificateGenerator.tsx` -- Canvas-based PDF/image generation
- `CertificatePreview.tsx` -- Visual preview

### Modified Files (8+)
- `SubmitBook.tsx` -- Category limits (2/category, 45 total), custom categories
- `Challenges.tsx` -- In-challenge submissions, independent challenge tracking
- `EnhancedChallengeCreator.tsx` -- Independent challenge toggle, preview
- `AdvancedLeaderboard.tsx` -- Show all students (remove 50 cap)
- `LibrarianDashboard.tsx` -- Add Categories tab, Certificates tab, Export CSV
- `LibrarianUserManager.tsx` -- Export CSV button
- `MyProgress.tsx` -- Certificate download buttons, custom categories in checklist
- `GoogleSheetSync.tsx` -- Deduplication note
- `sync-google-sheet/index.ts` -- Stronger deduplication

### Constants
- `constants.ts` -- Add `MAX_BOOKS_PER_CATEGORY = 2`

