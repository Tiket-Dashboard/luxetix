-- Add DELETE policy for agent_registrations to allow users to delete their own expired registrations
-- This is needed for retry functionality

-- First, drop existing policies if any
DROP POLICY IF EXISTS "Users can delete their expired registrations" ON public.agent_registrations;

-- Create new policy to allow deletion of own expired registrations
CREATE POLICY "Users can delete their expired registrations" 
ON public.agent_registrations 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id AND status = 'pending' AND expires_at < now());

-- Also allow admins to delete registrations
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.agent_registrations;

CREATE POLICY "Admins can delete registrations" 
ON public.agent_registrations 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));