
BEGIN;

-- Add business profile and contact information.
ALTER TABLE public.organisations
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Add business preferences.
ALTER TABLE public.organisations
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ZAR',
ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Johannesburg',
ADD COLUMN IF NOT EXISTS date_format text NOT NULL DEFAULT 'DD/MM/YYYY';

-- Validate currency format.
ALTER TABLE public.organisations
ADD CONSTRAINT organisations_currency_check
CHECK (currency ~ '^[A-Z]{3}$');

-- Validate date format.
ALTER TABLE public.organisations
ADD CONSTRAINT organisations_date_format_check
CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'));

COMMENT ON COLUMN public.organisations.description IS
'Optional description of the business.';

COMMENT ON COLUMN public.organisations.currency IS
'Three-letter ISO currency code used by the business.';

COMMENT ON COLUMN public.organisations.timezone IS
'Business timezone using an IANA timezone identifier.';

COMMIT;
