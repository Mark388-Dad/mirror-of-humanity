-- Create enum types
CREATE TYPE public.user_role AS ENUM ('student', 'homeroom_tutor', 'head_of_year', 'house_patron', 'librarian', 'staff');
CREATE TYPE public.year_group AS ENUM ('MYP5', 'DP1');
CREATE TYPE public.house_name AS ENUM ('Kenya', 'Longonot', 'Kilimanjaro', 'Elgon');
CREATE TYPE public.achievement_level AS ENUM ('none', 'bronze', 'silver', 'gold');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  year_group year_group,
  class_name TEXT,
  house house_name,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create book_submissions table
CREATE TABLE public.book_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_number INTEGER NOT NULL CHECK (category_number >= 1 AND category_number <= 30),
  category_name TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  date_started DATE NOT NULL,
  date_finished DATE NOT NULL,
  reflection TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id
$$;

-- Create security definer function to check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id 
    AND role IN ('homeroom_tutor', 'head_of_year', 'house_patron', 'librarian', 'staff')
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for book_submissions
CREATE POLICY "Users can view all submissions"
ON public.book_submissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own submissions"
ON public.book_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
ON public.book_submissions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions"
ON public.book_submissions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_book_submissions_updated_at
BEFORE UPDATE ON public.book_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for house leaderboard
CREATE OR REPLACE VIEW public.house_leaderboard AS
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

-- Create view for student progress
CREATE OR REPLACE VIEW public.student_progress AS
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