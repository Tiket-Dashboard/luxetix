-- Add expires_at column for payment expiration
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add payment_data column to store payment details for resume payment
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_data JSONB;