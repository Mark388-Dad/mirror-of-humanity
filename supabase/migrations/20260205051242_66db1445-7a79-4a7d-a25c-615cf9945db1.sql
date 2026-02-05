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