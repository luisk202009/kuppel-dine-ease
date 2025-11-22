-- Fix infinite recursion in RLS policies between companies and user_companies tables

-- Drop existing problematic policies on user_companies
DROP POLICY IF EXISTS "users_manage_own_companies_relations" ON user_companies;
DROP POLICY IF EXISTS "owners_update_user_companies" ON user_companies;

-- Recreate simplified policies for user_companies that don't reference companies table
CREATE POLICY "users_can_view_own_relations"
ON user_companies FOR SELECT
USING (
  is_platform_admin() OR 
  user_id = auth.uid()
);

CREATE POLICY "users_can_insert_own_relations"
ON user_companies FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "users_can_update_own_relations"
ON user_companies FOR UPDATE
USING (
  user_id = auth.uid()
);

CREATE POLICY "users_can_delete_own_relations"
ON user_companies FOR DELETE
USING (
  user_id = auth.uid()
);

-- Drop and recreate companies policies to use get_user_companies() function
DROP POLICY IF EXISTS "users_select_companies" ON companies;
DROP POLICY IF EXISTS "users_update_companies" ON companies;
DROP POLICY IF EXISTS "users_insert_companies" ON companies;
DROP POLICY IF EXISTS "users_insert_own_companies" ON companies;

-- Simplified policies for companies table
CREATE POLICY "users_can_view_their_companies"
ON companies FOR SELECT
USING (
  is_platform_admin() OR
  owner_id = auth.uid() OR
  id IN (SELECT get_user_companies())
);

CREATE POLICY "users_can_update_their_companies"
ON companies FOR UPDATE
USING (
  is_platform_admin() OR
  owner_id = auth.uid()
)
WITH CHECK (
  is_platform_admin() OR
  owner_id = auth.uid()
);

CREATE POLICY "users_can_insert_their_companies"
ON companies FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
);