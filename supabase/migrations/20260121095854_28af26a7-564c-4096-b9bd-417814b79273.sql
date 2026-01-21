-- Crear tabla de invitaciones de empresa
CREATE TABLE public.company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX idx_company_invitations_company ON public.company_invitations(company_id);
CREATE INDEX idx_company_invitations_token ON public.company_invitations(token);
CREATE INDEX idx_company_invitations_email ON public.company_invitations(email);
CREATE INDEX idx_company_invitations_status ON public.company_invitations(status);

-- Política: Company owners pueden gestionar invitaciones de su empresa
CREATE POLICY "Company owners can manage their invitations"
ON public.company_invitations
FOR ALL
USING (
  company_id IN (SELECT get_user_companies())
  AND get_user_role() IN ('company_owner', 'admin', 'platform_admin')
)
WITH CHECK (
  company_id IN (SELECT get_user_companies())
  AND get_user_role() IN ('company_owner', 'admin', 'platform_admin')
);

-- Política: Cualquiera puede ver invitaciones por token (para aceptar)
CREATE POLICY "Anyone can view invitation by token"
ON public.company_invitations
FOR SELECT
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_company_invitations_updated_at
BEFORE UPDATE ON public.company_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();