-- Add monthly_sessions and monthly_price to groups
ALTER TABLE public.groups 
  ADD COLUMN IF NOT EXISTS monthly_sessions integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS monthly_price numeric(12,2) NOT NULL DEFAULT 0;

-- Change schedule to jsonb to handle array of GroupSchedule objects
-- Safe conversion: we will drop the column and recreate it as jsonb since text might not parse cleanly to jsonb array if it contains random text
ALTER TABLE public.groups DROP COLUMN IF EXISTS schedule;
ALTER TABLE public.groups ADD COLUMN schedule jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add for_month to payments table
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS for_month text NOT NULL DEFAULT to_char(current_date, 'YYYY-MM');

-- Allow null group_id in attendance for flexibility, or keep it (already references groups(id) on delete set null)
-- Ensure settings can be saved per tenant
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  billing_model text NOT NULL DEFAULT 'prepaid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tenant_settings_set_updated_at ON public.tenant_settings;
CREATE TRIGGER tenant_settings_set_updated_at
BEFORE UPDATE ON public.tenant_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS for tenant_settings
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users can read their tenant_settings" ON public.tenant_settings;
CREATE POLICY "Tenant users can read their tenant_settings"
ON public.tenant_settings FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM public.users WHERE id = auth.uid()
));

DROP POLICY IF EXISTS "Tenant admins can update their tenant_settings" ON public.tenant_settings;
CREATE POLICY "Tenant admins can update their tenant_settings"
ON public.tenant_settings FOR UPDATE
USING (tenant_id IN (
  SELECT tenant_id FROM public.users WHERE id = auth.uid()
));

DROP POLICY IF EXISTS "Tenant admins can insert their tenant_settings" ON public.tenant_settings;
CREATE POLICY "Tenant admins can insert their tenant_settings"
ON public.tenant_settings FOR INSERT
WITH CHECK (tenant_id IN (
  SELECT tenant_id FROM public.users WHERE id = auth.uid()
));
