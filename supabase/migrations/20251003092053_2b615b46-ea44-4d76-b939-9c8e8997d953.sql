-- Create user_roles table to prevent privilege escalation
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to get user role safely
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (false); -- Disable direct inserts, use admin functions only

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (false); -- Disable direct updates, use admin functions only

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (false);

-- Migrate existing user roles from users table to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Update votes table RLS to be user-specific only
DROP POLICY IF EXISTS "Users can view all votes" ON public.votes;

CREATE POLICY "Users can view only their own vote"
ON public.votes
FOR SELECT
USING (user_id = auth.uid());

-- Strengthen customer PII protection
DROP POLICY IF EXISTS "Users can view customers in their companies" ON public.customers;

CREATE POLICY "Users can view customers in their companies (restricted PII)"
ON public.customers
FOR SELECT
USING (
  company_id IN (SELECT get_user_companies()) 
  AND get_user_role() = ANY(ARRAY['admin'::user_role, 'cashier'::user_role])
);

-- Add trigger to sync user_roles with users table on new user creation
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.role)
  ON CONFLICT (user_id) DO UPDATE SET role = NEW.role;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_user_role_trigger
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role();

-- Add updated_at trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();