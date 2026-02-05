
# Fix Challenge Creation - Database Constraint Mismatch

## Problem Identified
The database has a CHECK constraint on `challenge_type` that only allows 4 values:
- `timed_sprint`, `category`, `house_competition`, `custom`

But the frontend form tries to insert 10 different challenge types that don't match (e.g., `reading`, `genre_explorer`, `reflection`, etc.).

## Solution
Update the database constraint to accept all the expanded challenge types that were added to the system.

## Implementation Steps

### Step 1: Database Migration
Run a migration to drop the old constraint and add a new one with all valid challenge types:

```sql
-- Drop the old restrictive constraint
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;

-- Add new constraint with all valid challenge types
ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check 
CHECK (challenge_type = ANY (ARRAY[
  'reading',
  'genre_explorer', 
  'reflection',
  'performance',
  'house_competition',
  'ai_buddy',
  'creative_response',
  'daily_streak',
  'classic_modern',
  'book_to_life',
  'timed_sprint',
  'category',
  'custom'
]));
```

### Step 2: Update Year Groups in Frontend
Also update the `YEAR_GROUPS` constant in `EnhancedChallengeCreator.tsx` to include the new grades (G10, G11, G12) that were added to the system:

```typescript
const YEAR_GROUPS = ['MYP5', 'DP1', 'DP2', 'G10', 'G11', 'G12'];
```

## What This Fixes
- Challenge creation will work for all 10 challenge categories
- Librarians can create Reading Challenges, Genre Explorers, Daily Streaks, and all other types
- Maintains backward compatibility with existing challenge types

## Technical Details
- The constraint violation happens at database level before any data is inserted
- The fix adds all frontend category values to the allowed list
- Keeps the original values (`timed_sprint`, `category`, `custom`) for backward compatibility
