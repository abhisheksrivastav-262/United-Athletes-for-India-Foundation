-- ============================================================================
-- Migration: 20261010000002_min_donation_one_rupee.sql
-- Rule: any amount >= 1 is eligible (min_amount = 1)
-- ============================================================================

-- Update existing razorpay settings row (key/value schema) if present
UPDATE public.site_settings
SET value = jsonb_set(COALESCE(value, '{}'::jsonb), '{min_amount}', '1'::jsonb),
    updated_at = NOW()
WHERE key = 'razorpay'
  AND COALESCE((value->>'min_amount')::numeric, 100) != 1;
