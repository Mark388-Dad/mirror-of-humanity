
-- 1. Reset all points to 3
UPDATE public.book_submissions SET points_earned = 3 WHERE points_earned != 3;

-- 2. Reset all bonus points
UPDATE public.reading_streaks SET total_bonus_points = 0 WHERE total_bonus_points != 0;

-- 3. Drop the old trigger
DROP TRIGGER IF EXISTS on_book_submission_streak ON public.book_submissions;

-- 4. Replace the function to NOT modify points_earned
CREATE OR REPLACE FUNCTION public.update_reading_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID := NEW.user_id;
  last_date DATE;
  curr_streak INTEGER;
  long_streak INTEGER;
BEGIN
  SELECT last_submission_date, current_streak, longest_streak
  INTO last_date, curr_streak, long_streak
  FROM public.reading_streaks
  WHERE user_id = current_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.reading_streaks (user_id, current_streak, longest_streak, last_submission_date, total_bonus_points)
    VALUES (current_user_id, 1, 1, NEW.date_finished, 0);
  ELSE
    IF NEW.date_finished::DATE - last_date <= 7 AND NEW.date_finished::DATE > last_date THEN
      curr_streak := curr_streak + 1;
      IF curr_streak > long_streak THEN
        long_streak := curr_streak;
      END IF;
    ELSIF NEW.date_finished::DATE > last_date THEN
      curr_streak := 1;
    END IF;

    UPDATE public.reading_streaks
    SET current_streak = curr_streak,
        longest_streak = long_streak,
        last_submission_date = NEW.date_finished
    WHERE user_id = current_user_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Re-create the trigger
CREATE TRIGGER on_book_submission_streak
AFTER INSERT ON public.book_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_reading_streak();

-- 6. Enable realtime for book_submissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_submissions;

-- 7. Seed missing homepage sections
INSERT INTO public.homepage_content (section_key, title, content, display_order, is_visible)
SELECT * FROM (VALUES
  ('hero', '45-Book Reading Challenge', 'Fiction as a Mirror of Humanity', 1, true),
  ('goals', 'Our Goals', 'Through this challenge, learners will journey across worlds, voices, and experiences.', 2, true),
  ('points', 'Points System', 'Every page you read earns points for you, your class, and your house.', 3, true),
  ('categories', '30 Reading Categories', 'Choose from fiction, non-fiction, poetry, or plays.', 4, true),
  ('ib_connections', 'IB Connections', 'This challenge connects deeply with IB frameworks and learner development.', 5, true),
  ('outcomes', 'Expected Outcomes', 'By the end of this challenge, you will have achieved:', 6, true),
  ('footer', '45-Book Reading Challenge', 'Every story is a mirror; when we read, we find not only the world but also ourselves.', 7, true),
  ('motivation', 'Motivational Quote', 'A reader lives a thousand lives before he dies. The man who never reads lives only one.', 8, true),
  ('tip_of_day', 'Reading Tip', 'Set aside 20 minutes each day for uninterrupted reading time.', 9, false)
) AS v(section_key, title, content, display_order, is_visible)
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_content WHERE homepage_content.section_key = v.section_key
);
