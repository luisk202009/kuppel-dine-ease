-- Allow company owners and users to view their company's subscriptions
CREATE POLICY "Users can view their company subscriptions" 
ON public.company_subscriptions 
FOR SELECT 
USING (
  is_platform_admin() OR 
  company_id IN (SELECT get_user_companies())
);