-- Drop existing restrictive policies for admin on concerts
DROP POLICY IF EXISTS "Admins can update concerts" ON public.concerts;
DROP POLICY IF EXISTS "Admins can insert concerts" ON public.concerts;
DROP POLICY IF EXISTS "Admins can delete concerts" ON public.concerts;

-- Recreate as PERMISSIVE policies (default behavior when not specified as RESTRICTIVE)
CREATE POLICY "Admins can update all concerts" 
ON public.concerts 
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert concerts" 
ON public.concerts 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all concerts" 
ON public.concerts 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also add admin SELECT policy to ensure admins can see all concerts
DROP POLICY IF EXISTS "Admins can view all concerts" ON public.concerts;
CREATE POLICY "Admins can view all concerts" 
ON public.concerts 
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));