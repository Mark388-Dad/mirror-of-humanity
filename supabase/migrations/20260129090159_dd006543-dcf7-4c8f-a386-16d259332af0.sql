-- Create reading_streaks table for tracking consecutive submissions
CREATE TABLE public.reading_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_submission_date DATE,
  total_bonus_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_streak UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.reading_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all streaks" 
ON public.reading_streaks 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own streak" 
ON public.reading_streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak" 
ON public.reading_streaks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reading_streaks_updated_at
BEFORE UPDATE ON public.reading_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update streak when a book is submitted
CREATE OR REPLACE FUNCTION public.update_reading_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID := NEW.user_id;
  last_date DATE;
  curr_streak INTEGER;
  long_streak INTEGER;
  bonus INTEGER := 0;
BEGIN
  -- Get existing streak data
  SELECT last_submission_date, current_streak, longest_streak
  INTO last_date, curr_streak, long_streak
  FROM public.reading_streaks
  WHERE user_id = current_user_id;

  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO public.reading_streaks (user_id, current_streak, longest_streak, last_submission_date, total_bonus_points)
    VALUES (current_user_id, 1, 1, NEW.date_finished, 0);
  ELSE
    -- Check if this extends the streak (within 7 days)
    IF NEW.date_finished::DATE - last_date <= 7 AND NEW.date_finished::DATE > last_date THEN
      curr_streak := curr_streak + 1;
      -- Bonus points: +1 for each consecutive book after the 2nd
      IF curr_streak >= 3 THEN
        bonus := 1;
      END IF;
      IF curr_streak > long_streak THEN
        long_streak := curr_streak;
      END IF;
    ELSIF NEW.date_finished::DATE > last_date THEN
      -- Streak broken, reset
      curr_streak := 1;
    END IF;

    UPDATE public.reading_streaks
    SET current_streak = curr_streak,
        longest_streak = long_streak,
        last_submission_date = NEW.date_finished,
        total_bonus_points = total_bonus_points + bonus
    WHERE user_id = current_user_id;

    -- Add bonus points to the submission if earned
    IF bonus > 0 THEN
      UPDATE public.book_submissions
      SET points_earned = points_earned + bonus
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for streak updates
CREATE TRIGGER update_streak_on_submission
AFTER INSERT ON public.book_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_reading_streak();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;