-- Allow agents to insert ticket types for their own concerts
CREATE POLICY "Agents can insert ticket types for their concerts"
ON public.ticket_types
FOR INSERT
WITH CHECK (
  concert_id IN (
    SELECT c.id FROM concerts c
    JOIN agents a ON c.agent_id = a.id
    WHERE a.user_id = auth.uid()
    AND a.registration_status = 'active'
  )
);

-- Allow agents to update ticket types for their own concerts
CREATE POLICY "Agents can update ticket types for their concerts"
ON public.ticket_types
FOR UPDATE
USING (
  concert_id IN (
    SELECT c.id FROM concerts c
    JOIN agents a ON c.agent_id = a.id
    WHERE a.user_id = auth.uid()
  )
);

-- Allow agents to delete ticket types for their own concerts (only for draft/pending events)
CREATE POLICY "Agents can delete ticket types for their concerts"
ON public.ticket_types
FOR DELETE
USING (
  concert_id IN (
    SELECT c.id FROM concerts c
    JOIN agents a ON c.agent_id = a.id
    WHERE a.user_id = auth.uid()
    AND c.event_status IN ('draft', 'pending_approval')
  )
);