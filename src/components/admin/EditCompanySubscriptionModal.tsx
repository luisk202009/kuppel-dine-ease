import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  plan_id: string | null;
  subscription_status: string | null;
  billing_period: string | null;
  trial_end_at: string | null;
}

interface Plan {
  id: string;
  name: string;
  code: string;
}

interface EditCompanySubscriptionModalProps {
  company: Company | null;
  plan: Plan | null;
  open: boolean;
  onClose: (refreshNeeded: boolean) => void;
}

interface PlanOption {
  id: string;
  name: string;
  code: string;
  billing_interval_default: string;
}

export const EditCompanySubscriptionModal: React.FC<EditCompanySubscriptionModalProps> = ({
  company,
  plan,
  open,
  onClose,
}) => {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>('');
  const [trialEndDate, setTrialEndDate] = useState<string>('');
  
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPlans();
      // Prellenar formulario
      setSelectedPlanId(company?.plan_id || '');
      setSelectedStatus(company?.subscription_status || 'trialing');
      setSelectedBillingPeriod(company?.billing_period || 'monthly');
      setTrialEndDate(company?.trial_end_at ? company.trial_end_at.split('T')[0] : '');
    }
  }, [open, company]);

  const fetchPlans = async () => {
    try {
      setIsLoadingPlans(true);
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, code, billing_interval_default')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error al cargar planes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleSave = async () => {
    if (!company) return;

    // Validación
    if (!selectedPlanId) {
      toast({
        title: 'Plan requerido',
        description: 'Debes seleccionar un plan.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedStatus) {
      toast({
        title: 'Estado requerido',
        description: 'Debes seleccionar un estado de suscripción.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      // 1. Actualizar companies
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          plan_id: selectedPlanId,
          subscription_status: selectedStatus,
          billing_period: selectedBillingPeriod,
          trial_end_at: trialEndDate || null,
        })
        .eq('id', company.id);

      if (updateError) throw updateError;

      // 2. Crear registro en company_subscriptions (historial)
      const now = new Date();
      const periodEnd = new Date();
      if (selectedBillingPeriod === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      const { error: subscriptionError } = await supabase
        .from('company_subscriptions')
        .insert({
          company_id: company.id,
          plan_id: selectedPlanId,
          status: selectedStatus,
          billing_period: selectedBillingPeriod,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          trial_end_at: trialEndDate || null,
          notes: 'Cambio manual desde panel de administración',
        });

      if (subscriptionError) throw subscriptionError;

      toast({
        title: 'Suscripción actualizada',
        description: `Plan y estado actualizados correctamente para ${company.name}.`,
      });

      onClose(true); // Refresh needed
    } catch (error: any) {
      console.error('Error saving subscription:', error);
      toast({
        title: 'Error al guardar',
        description: error.message || 'No se pudo actualizar la suscripción.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Plan y Suscripción</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" value={company.name} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan *</Label>
            {isLoadingPlans ? (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando planes...</span>
              </div>
            ) : (
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_period">Periodo de facturación *</Label>
            <Select value={selectedBillingPeriod} onValueChange={setSelectedBillingPeriod}>
              <SelectTrigger id="billing_period">
                <SelectValue placeholder="Selecciona periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado de suscripción *</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trialing">En prueba</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="past_due">Pago pendiente</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trial_end">Fecha de fin de prueba (opcional)</Label>
            <Input
              id="trial_end"
              type="date"
              value={trialEndDate}
              onChange={(e) => setTrialEndDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deja vacío si no aplica período de prueba
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
