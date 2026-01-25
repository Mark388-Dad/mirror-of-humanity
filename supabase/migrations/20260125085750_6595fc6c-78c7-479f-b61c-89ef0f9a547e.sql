-- Drop and recreate views with security_invoker to fix security warnings
DROP VIEW IF EXISTS public.house_leaderboard;
DROP VIEW IF EXISTS public.student_progress;

-- Create view for house leaderboard with security_invoker
CREATE VIEW public.house_leaderboard
WITH (security_invoker = on) AS
SELECT 
  p.house,
  COUNT(DISTINCT p.user_id) as total_readers,
  COUNT(bs.id) as total_books,
  COALESCE(SUM(bs.points_earned), 0) as total_points
FROM public.profiles p
LEFT JOIN public.book_submissions bs ON p.user_id = bs.user_id
WHERE p.house IS NOT NULL AND p.role = 'student'
GROUP BY p.house
ORDER BY total_points DESC;

-- Create view for student progress with security_invoker
CREATE VIEW public.student_progress
WITH (security_invoker = on) AS
SELECT 
  p.user_id,
  p.full_name,
  p.house,
  p.year_group,
  p.class_name,
  COUNT(bs.id) as books_read,
  COALESCE(SUM(bs.points_earned), 0) as total_points,
  CASE 
    WHEN COUNT(bs.id) >= 45 THEN 'gold'::achievement_level
    WHEN COUNT(bs.id) >= 30 THEN 'silver'::achievement_level
    WHEN COUNT(bs.id) >= 15 THEN 'bronze'::achievement_level
    ELSE 'none'::achievement_level
  END as achievement_level
FROM public.profiles p
LEFT JOIN public.book_submissions bs ON p.user_id = bs.user_id
WHERE p.role = 'student'
GROUP BY p.user_id, p.full_name, p.house, p.year_group, p.class_name;