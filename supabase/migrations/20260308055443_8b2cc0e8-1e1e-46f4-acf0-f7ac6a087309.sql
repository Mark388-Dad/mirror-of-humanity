
CREATE OR REPLACE VIEW public.student_progress AS
SELECT 
  p.user_id,
  p.full_name,
  p.house,
  p.year_group,
  p.class_name,
  COALESCE(sub.books_read, 0)::bigint AS books_read,
  (
    COALESCE(sub.books_read, 0) * 3
    + CASE WHEN COALESCE(sub.books_read, 0) >= 1 THEN 3 ELSE 0 END
    + CASE WHEN COALESCE(sub.books_read, 0) >= 15 THEN 5 ELSE 0 END
    + CASE WHEN COALESCE(sub.books_read, 0) >= 30 THEN 10 ELSE 0 END
    + CASE WHEN COALESCE(sub.books_read, 0) >= 45 THEN 15 ELSE 0 END
  )::bigint AS total_points,
  CASE 
    WHEN COALESCE(sub.books_read, 0) >= 45 THEN 'gold'
    WHEN COALESCE(sub.books_read, 0) >= 30 THEN 'silver'
    WHEN COALESCE(sub.books_read, 0) >= 15 THEN 'bronze'
    ELSE 'none'
  END::achievement_level AS achievement_level
FROM profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*)::integer AS books_read
  FROM book_submissions
  GROUP BY user_id
) sub ON p.user_id = sub.user_id
WHERE p.role = 'student';

DROP VIEW IF EXISTS public.house_leaderboard;
CREATE OR REPLACE VIEW public.house_leaderboard AS
SELECT sp.house,
    count(DISTINCT sp.user_id) AS total_readers,
    sum(sp.books_read)::bigint AS total_books,
    sum(sp.total_points)::bigint AS total_points
FROM public.student_progress sp
WHERE sp.house IS NOT NULL
GROUP BY sp.house
ORDER BY sum(sp.total_points) DESC;
