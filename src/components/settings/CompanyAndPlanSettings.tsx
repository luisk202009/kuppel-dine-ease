import React, { useState, useEffect } from 'react';
import { Building2, MapPin, CreditCard, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePOS } from '@/contexts/POSContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompanyData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  plan_id: string | null;
  subscription_status: string | null;
  billing_period: string | null;
  trial_end_at: string | null;
}

interface BranchData {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface PlanData {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export const CompanyAndPlanSettings: React.FC = () => {
  const { toast } = useToast();
  const { authState } = usePOS();
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [isLoadingBranch, setIsLoadingBranch] = useState(true);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSavingBranch, setIsSavingBranch] = useState(false);
  const [showPlanRequestModal, setShowPlanRequestModal] = useState(false);
  
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [branchData, setBranchData] = useState<BranchData | null>(null);
  const [planData, setPlanData] = useState<PlanData | null>(null);

  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
  });

  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    if (authState.selectedCompany?.id) {
      loadCompanyData();
    }
    if (authState.selectedBranch?.id) {
      loadBranchData();
    }
  }, [authState.selectedCompany?.id, authState.selectedBranch?.id]);

  const loadCompanyData = async () => {
    try {
      setIsLoadingCompany(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', authState.selectedCompany?.id)
        .single();

      if (error) throw error;

      setCompanyData(data);
      setCompanyForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        tax_id: data.tax_id || '',
      });

      // Load plan data if plan_id exists
      if (data.plan_id) {
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('id, name, code, description')
          .eq('id', data.plan_id)
          .single();

        if (!planError && plan) {
          setPlanData(plan);
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la empresa',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCompany(false);
    }
  };

  const loadBranchData = async () => {
    try {
      setIsLoadingBranch(true);
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, address, phone')
        .eq('id', authState.selectedBranch?.id)
        .single();

      if (error) throw error;

      setBranchData(data);
      setBranchForm({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
      });
    } catch (error) {
      console.error('Error loading branch data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la sucursal',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBranch(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyData?.id) return;

    try {
      setIsSavingCompany(true);
      
      // Only update basic company fields, NOT plan-related fields
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyForm.name,
          email: companyForm.email,
          phone: companyForm.phone,
          address: companyForm.address,
          tax_id: companyForm.tax_id,
        })
        .eq('id', companyData.id);

      if (error) throw error;

      toast({
        title: 'Empresa actualizada',
        description: 'Los datos de la empresa se han guardado correctamente',
      });

      await loadCompanyData();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la información de la empresa',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleSaveBranch = async () => {
    if (!branchData?.id) return;

    try {
      setIsSavingBranch(true);
      const { error } = await supabase
        .from('branches')
        .update({
          name: branchForm.name,
          address: branchForm.address,
          phone: branchForm.phone,
        })
        .eq('id', branchData.id);

      if (error) throw error;

      toast({
        title: 'Sucursal actualizada',
        description: 'Los datos de la sucursal se han guardado correctamente',
      });

      await loadBranchData();
    } catch (error) {
      console.error('Error saving branch:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la información de la sucursal',
        variant: 'destructive',
      });
    } finally {
      setIsSavingBranch(false);
    }
  };

  const getSubscriptionStatusBadge = (status: string | null) => {
    if (!status) return null;

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      trialing: { label: 'En prueba', variant: 'secondary' },
      active: { label: 'Activa', variant: 'default' },
      past_due: { label: 'Pago pendiente', variant: 'destructive' },
      paused: { label: 'Pausada', variant: 'outline' },
      canceled: { label: 'Cancelada', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Company Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Datos de la Empresa
          </CardTitle>
          <CardDescription>
            Información básica de tu empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingCompany ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nombre de la empresa *</Label>
                  <Input
                    id="company-name"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre comercial"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-tax-id">NIF/CIF</Label>
                  <Input
                    id="company-tax-id"
                    value={companyForm.tax_id}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, tax_id: e.target.value }))}
                    placeholder="B12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-phone">Teléfono</Label>
                  <Input
                    id="company-phone"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company-address">Dirección</Label>
                  <Input
                    id="company-address"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Calle, número, ciudad"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveCompany} 
                disabled={isSavingCompany}
                className="w-full md:w-auto"
              >
                {isSavingCompany ? 'Guardando...' : 'Guardar cambios de empresa'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Branch Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Datos de la Sucursal
          </CardTitle>
          <CardDescription>
            Información de la sucursal actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingBranch ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch-name">Nombre de la sucursal *</Label>
                  <Input
                    id="branch-name"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Sucursal principal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch-phone">Teléfono</Label>
                  <Input
                    id="branch-phone"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="branch-address">Dirección</Label>
                  <Input
                    id="branch-address"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Calle, número, ciudad"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveBranch} 
                disabled={isSavingBranch}
                className="w-full md:w-auto"
              >
                {isSavingBranch ? 'Guardando...' : 'Guardar cambios de sucursal'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Plan and Subscription Card (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plan y Suscripción
          </CardTitle>
          <CardDescription>
            Información sobre tu plan actual y suscripción
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingCompany ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <>
              {!companyData?.plan_id ? (
                <Alert>
                  <AlertDescription>
                    No hay un plan asignado a tu empresa. Contacta con soporte para más información.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Plan actual</Label>
                      <p className="text-lg font-semibold">{planData?.name || '-'}</p>
                      {planData?.code && (
                        <p className="text-sm text-muted-foreground">Código: {planData.code}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Estado de suscripción</Label>
                      <div>{getSubscriptionStatusBadge(companyData.subscription_status)}</div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Periodo de facturación</Label>
                      <p className="text-base">
                        {companyData.billing_period === 'monthly' ? 'Mensual' : 
                         companyData.billing_period === 'yearly' ? 'Anual' : 
                         companyData.billing_period || '-'}
                      </p>
                    </div>

                    {companyData.subscription_status === 'trialing' && companyData.trial_end_at && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Fin del periodo de prueba</Label>
                        <p className="text-base">{formatDate(companyData.trial_end_at)}</p>
                      </div>
                    )}
                  </div>

                  {planData?.description && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{planData.description}</p>
                    </div>
                  )}

                  {companyData.subscription_status === 'trialing' && companyData.trial_end_at && (
                    <Alert>
                      <AlertDescription>
                        Tu prueba termina el {formatDate(companyData.trial_end_at)}. Al finalizar la prueba, tu plan se renovará según las condiciones acordadas con nuestro equipo.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => setShowPlanRequestModal(true)}
                      variant="outline"
                      className="w-full md:w-auto"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Solicitar cambio de plan
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Si quieres cambiar de plan (upgrade/downgrade), ponte en contacto con nuestro equipo para revisar las opciones disponibles.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Plan Change Request Modal */}
      <Dialog open={showPlanRequestModal} onOpenChange={setShowPlanRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar cambio de plan</DialogTitle>
            <DialogDescription>
              Para cambiar tu plan actual, contacta con nuestro equipo de soporte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Email de soporte</p>
                <p className="text-base">soporte@kuppel.co</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Tu plan actual</p>
                <p className="text-base">{planData?.name || 'Sin plan asignado'}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Nuestro equipo te ayudará a encontrar el plan que mejor se adapte a las necesidades de tu negocio y te informará sobre opciones de upgrade o downgrade.
            </p>
            {/* TODO: En el futuro, este modal podría:
                - Mostrar un formulario para seleccionar el plan deseado
                - Iniciar un flujo de pago automatizado
                - Registrar una solicitud de cambio en una tabla de "plan_change_requests"
                - Por ahora, el cambio real de plan lo realiza solo el admin desde /admin
            */}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowPlanRequestModal(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
