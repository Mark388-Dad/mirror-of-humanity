-- Allow authenticated users to read pending submissions with their email
CREATE POLICY "Users can read their own pending submissions"
  ON public.pending_submissions FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Allow authenticated users to update their imported submissions
CREATE POLICY "Users can update their imported submissions"
  ON public.pending_submissions FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);