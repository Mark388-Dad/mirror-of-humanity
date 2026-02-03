-- Homepage content table for librarian-editable sections
CREATE TABLE public.homepage_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Access codes for librarians and students
CREATE TABLE public.access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  code_type TEXT NOT NULL CHECK (code_type IN ('librarian', 'student')),
  school_name TEXT,
  year_group TEXT,
  class_name TEXT,
  house TEXT,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- File uploads by librarians with AI processing
CREATE TABLE public.librarian_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  ai_summary TEXT,
  ai_extracted_text TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Google Sheet sync logs
CREATE TABLE public.sheet_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  errors TEXT[],
  synced_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced challenges with more options
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'reading',
ADD COLUMN IF NOT EXISTS participation_type TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS allowed_year_groups TEXT[],
ADD COLUMN IF NOT EXISTS allowed_classes TEXT[],
ADD COLUMN IF NOT EXISTS allowed_houses TEXT[],
ADD COLUMN IF NOT EXISTS requires_submission BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS evidence_type TEXT DEFAULT 'reflection',
ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS leaderboard_type TEXT DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS badge_name TEXT,
ADD COLUMN IF NOT EXISTS badge_icon TEXT;

-- Enable RLS
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.librarian_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_sync_logs ENABLE ROW LEVEL SECURITY;

-- Homepage content policies
CREATE POLICY "Anyone can view visible homepage content"
ON public.homepage_content FOR SELECT
USING (is_visible = true);

CREATE POLICY "Librarians can manage homepage content"
ON public.homepage_content FOR ALL
USING (get_user_role(auth.uid()) = 'librarian');

-- Access codes policies
CREATE POLICY "Librarians can manage access codes"
ON public.access_codes FOR ALL
USING (get_user_role(auth.uid()) IN ('librarian', 'staff'));

CREATE POLICY "Anyone can verify codes"
ON public.access_codes FOR SELECT
USING (true);

-- Librarian files policies
CREATE POLICY "Anyone can view public files"
ON public.librarian_files FOR SELECT
USING (is_public = true OR auth.uid() = uploaded_by OR is_staff(auth.uid()));

CREATE POLICY "Librarians can upload files"
ON public.librarian_files FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'librarian');

CREATE POLICY "Librarians can manage their files"
ON public.librarian_files FOR UPDATE
USING (auth.uid() = uploaded_by OR get_user_role(auth.uid()) = 'librarian');

CREATE POLICY "Librarians can delete their files"
ON public.librarian_files FOR DELETE
USING (auth.uid() = uploaded_by OR get_user_role(auth.uid()) = 'librarian');

-- Sheet sync logs policies
CREATE POLICY "Staff can view sync logs"
ON public.sheet_sync_logs FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can create sync logs"
ON public.sheet_sync_logs FOR INSERT
WITH CHECK (is_staff(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_homepage_content_updated_at
BEFORE UPDATE ON public.homepage_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default homepage sections
INSERT INTO public.homepage_content (section_key, title, content, display_order) VALUES
('hero', 'Welcome to the Reading Challenge', 'Embark on an incredible reading journey! Earn points, unlock badges, and compete with your house.', 1),
('announcement', 'Featured Announcement', 'New monthly challenge starts next week! Get ready to explore fantasy worlds.', 2),
('tip_of_day', 'Reading Tip of the Day', 'Set a daily reading goal of at least 15 minutes to build a strong reading habit.', 3),
('featured_challenge', 'Featured Challenge', 'Genre Explorer Challenge: Read across 5 different genres this month!', 4),
('motivation', 'Motivational Message', 'Every page you read is a step towards becoming a better version of yourself.', 5);

-- Create storage bucket for librarian files
INSERT INTO storage.buckets (id, name, public) VALUES ('librarian-files', 'librarian-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Librarians can upload files to bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'librarian-files' AND is_staff(auth.uid()));

CREATE POLICY "Anyone can view public librarian files"
ON storage.objects FOR SELECT
USING (bucket_id = 'librarian-files');

CREATE POLICY "Librarians can delete their files"
ON storage.objects FOR DELETE
USING (bucket_id = 'librarian-files' AND is_staff(auth.uid()));