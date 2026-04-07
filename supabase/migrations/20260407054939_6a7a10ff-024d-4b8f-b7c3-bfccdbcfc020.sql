
-- Add theming and layout columns to challenges table
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS layout_config jsonb DEFAULT '{"sections":["hero","leaderboard","submissions","progress","gallery"],"show_streak":true,"show_xp":true,"show_recommendations":true,"hero_style":"full"}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_css text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS welcome_message text DEFAULT NULL;
