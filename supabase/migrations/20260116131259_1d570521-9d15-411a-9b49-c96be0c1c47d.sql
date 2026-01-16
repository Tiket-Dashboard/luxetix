-- Add columns to track ticket validation
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id);

-- Create index for faster lookup by ticket_code
CREATE INDEX IF NOT EXISTS idx_order_items_ticket_code ON public.order_items(ticket_code);

-- Allow admins to update order_items for validation
CREATE POLICY "Admins can update order items for validation"
ON public.order_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));