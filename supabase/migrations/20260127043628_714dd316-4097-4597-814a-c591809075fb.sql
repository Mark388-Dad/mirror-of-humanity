-- Create challenges table for librarian-created challenges
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('timed_sprint', 'category', 'house_competition', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_books INTEGER DEFAULT 1,
  target_categories INTEGER[] DEFAULT NULL,
  points_reward INTEGER DEFAULT 5,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge participants table
CREATE TABLE public.challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  books_completed INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE(challenge_id, user_id)
);

-- Add approval status to book_submissions
ALTER TABLE public.book_submissions 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'flagged', 'rejected')),
ADD COLUMN IF NOT EXISTS ai_feedback TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create notifications table for tracking sent notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('submission', 'achievement', 'challenge', 'approval')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Challenges policies: Everyone can view, only librarians can create/edit
CREATE POLICY "Anyone can view active challenges" 
ON public.challenges FOR SELECT 
USING (is_active = true);

CREATE POLICY "Librarians can manage challenges" 
ON public.challenges FOR ALL 
USING (public.get_user_role(auth.uid()) = 'librarian');

-- Challenge participants policies
CREATE POLICY "Users can view all participants" 
ON public.challenge_participants FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Students can join challenges" 
ON public.challenge_participants FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id AND 
  public.get_user_role(auth.uid()) = 'student'
);

CREATE POLICY "Users can update own participation" 
ON public.challenge_participants FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update book_submissions policy to only allow students to insert
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.book_submissions;
CREATE POLICY "Only students can create submissions" 
ON public.book_submissions FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id AND 
  public.get_user_role(auth.uid()) = 'student'
);