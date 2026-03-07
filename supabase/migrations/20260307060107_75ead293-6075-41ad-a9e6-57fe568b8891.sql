
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
