-- Create a pending_submissions table for students who haven't registered yet
CREATE TABLE public.pending_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  year_group TEXT,
  class_name TEXT,
  house TEXT,
  category_number INTEGER NOT NULL,
  category_name TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  date_started DATE NOT NULL,
  date_finished DATE NOT NULL,
  reflection TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  imported_at TIMESTAMP WITH TIME ZONE,
  imported_to_user_id UUID
);

-- Enable RLS
ALTER TABLE public.pending_submissions ENABLE ROW LEVEL SECURITY;

-- Staff can view all pending submissions
CREATE POLICY "Staff can view pending submissions"
  ON public.pending_submissions FOR SELECT
  USING (public.is_staff(auth.uid()));

-- Staff can manage pending submissions  
CREATE POLICY "Staff can insert pending submissions"
  ON public.pending_submissions FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update pending submissions"
  ON public.pending_submissions FOR UPDATE
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete pending submissions"
  ON public.pending_submissions FOR DELETE
  USING (public.is_staff(auth.uid()));