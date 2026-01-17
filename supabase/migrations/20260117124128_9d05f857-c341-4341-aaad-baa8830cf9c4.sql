-- Add 'agent' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';

-- Create user status enum
CREATE TYPE public.user_status AS ENUM ('active', 'suspended', 'inactive');

-- Create event status enum  
CREATE TYPE public.event_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled');

-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status public.user_status NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS status_message text;

-- Create agent_settings table (global settings managed by admin)
CREATE TABLE public.agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_fee bigint NOT NULL DEFAULT 500000, -- Rp 500.000 default
  platform_commission_percent numeric(5,2) NOT NULL DEFAULT 10.00, -- 10% default
  max_events_before_auto_approve integer NOT NULL DEFAULT 3, -- After 3 successful events
  default_max_events integer NOT NULL DEFAULT 5, -- Default event limit for new agents
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.agent_settings (id) VALUES (gen_random_uuid());

-- Enable RLS on agent_settings
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_settings
CREATE POLICY "Anyone can view agent settings"
ON public.agent_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update agent settings"
ON public.agent_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create agents table (stores agent-specific data)
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name text NOT NULL,
  business_description text,
  bank_account_name text,
  bank_account_number text,
  bank_name text,
  max_events integer NOT NULL DEFAULT 5,
  successful_events_count integer NOT NULL DEFAULT 0,
  is_auto_approve boolean NOT NULL DEFAULT false,
  registration_status text NOT NULL DEFAULT 'pending', -- pending, paid, active, rejected
  registration_payment_id text,
  total_earnings bigint NOT NULL DEFAULT 0,
  total_commission_paid bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- RLS policies for agents
CREATE POLICY "Agents can view their own data"
ON public.agents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Agents can update their own data"
ON public.agents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can register as agent"
ON public.agents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all agents"
ON public.agents FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all agents"
ON public.agents FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add agent_id to concerts for agent-created events
ALTER TABLE public.concerts
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS event_status public.event_status NOT NULL DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS platform_commission_percent numeric(5,2);

-- Update concerts RLS to allow agents to manage their own concerts
CREATE POLICY "Agents can view their own concerts"
ON public.concerts FOR SELECT
USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

CREATE POLICY "Agents can insert their own concerts"
ON public.concerts FOR INSERT
WITH CHECK (
  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid() AND registration_status = 'active')
);

CREATE POLICY "Agents can update their own concerts"
ON public.concerts FOR UPDATE
USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

CREATE POLICY "Agents can delete their own draft concerts"
ON public.concerts FOR DELETE
USING (
  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  AND event_status = 'draft'
);

-- Create agent_payments table (track agent earnings and payouts)
CREATE TABLE public.agent_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  gross_amount bigint NOT NULL,
  commission_amount bigint NOT NULL,
  net_amount bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, paid, failed
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on agent_payments
ALTER TABLE public.agent_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_payments
CREATE POLICY "Agents can view their own payments"
ON public.agent_payments FOR SELECT
USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all payments"
ON public.agent_payments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage payments"
ON public.agent_payments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create agent_registrations table (track registration payments)
CREATE TABLE public.agent_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  business_description text,
  bank_account_name text,
  bank_account_number text,
  bank_name text,
  registration_fee bigint NOT NULL,
  payment_id text,
  payment_method text,
  payment_data jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, paid, approved, rejected
  expires_at timestamp with time zone,
  processed_at timestamp with time zone,
  processed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on agent_registrations
ALTER TABLE public.agent_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_registrations
CREATE POLICY "Users can view their own registrations"
ON public.agent_registrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create registrations"
ON public.agent_registrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
ON public.agent_registrations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update registrations"
ON public.agent_registrations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to check if user has agent role
CREATE OR REPLACE FUNCTION public.is_agent(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agents
    WHERE user_id = _user_id
      AND registration_status = 'active'
  )
$$;

-- Update trigger for agents table
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for agent_settings table
CREATE TRIGGER update_agent_settings_updated_at
BEFORE UPDATE ON public.agent_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();