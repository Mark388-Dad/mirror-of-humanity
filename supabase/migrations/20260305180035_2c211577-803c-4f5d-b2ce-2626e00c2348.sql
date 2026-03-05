-- Allow staff to update any student profile (house, class, year_group)
CREATE POLICY "Staff can update student profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));