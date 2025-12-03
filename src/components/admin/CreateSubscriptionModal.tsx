import React, { useState } from 'react';
import { Plus, Building2, CreditCard, Calendar, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { format, addMonths, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CreateSubscriptionModalProps {
  open: boolean;
  onClose: (refreshNeeded?: boolean) => void;
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({ open, onClose }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [status, setStatus] = useState<'trialing' | 'active' | 'past_due'>('active');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [paymentLink, setPaymentLink] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch companies
  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['admin-companies-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch plans
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['admin-plans-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, code, price_monthly, price_yearly')
        .eq('is_active', true)
        .order('price_monthly');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const resetForm = () => {
    setSelectedCompanyId('');
    setSelectedPlanId('');
    setBillingPeriod('monthly');
    setStatus('active');
    setStartDate(new Date());
    setPaymentLink('');
    setNotes('');
  };

  const handleClose = (refresh?: boolean) => {
    resetForm();
    onClose(refresh);
  };

  const handleSubmit = async () => {
    if (!selectedCompanyId || !selectedPlanId) {
      toast({ title: 'Error', description: 'Empresa y plan son requeridos', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const periodEnd = billingPeriod === 'monthly' 
        ? addMonths(startDate, 1) 
        : addYears(startDate, 1);

      // Create subscription
      const { error: subError } = await supabase.from('company_subscriptions').insert({
        company_id: selectedCompanyId,
        plan_id: selectedPlanId,
        status,
        billing_period: billingPeriod,
        current_period_start: startDate.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end_at: status === 'trialing' ? periodEnd.toISOString() : null,
        payment_link: paymentLink || null,
        notes: notes || 'Suscripción creada desde panel de administración',
      });

      if (subError) throw subError;

      // Update company
      const { error: compError } = await supabase
        .from('companies')
        .update({
          plan_id: selectedPlanId,
          subscription_status: status,
          billing_period: billingPeriod,
          trial_end_at: status === 'trialing' ? periodEnd.toISOString() : null,
        })
        .eq('id', selectedCompanyId);

      if (compError) throw compError;

      toast({ title: 'Éxito', description: 'Suscripción creada correctamente' });
      handleClose(true);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'No se pudo crear la suscripción', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans?.find(p => p.id === selectedPlanId);
  const price = selectedPlan 
    ? (billingPeriod === 'monthly' ? selectedPlan.price_monthly : selectedPlan.price_yearly)
    : null;
  
  const periodEnd = billingPeriod === 'monthly' 
    ? addMonths(startDate, 1) 
    : addYears(startDate, 1);

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva Suscripción
          </DialogTitle>
          <DialogDescription>
            Crear una nueva suscripción para un cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Company */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa *
            </Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCompanies ? 'Cargando...' : 'Seleccionar empresa'} />
              </SelectTrigger>
              <SelectContent>
                {companies?.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plan *
            </Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingPlans ? 'Cargando...' : 'Seleccionar plan'} />
              </SelectTrigger>
              <SelectContent>
                {plans?.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price_monthly?.toLocaleString()}/mes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billing Period */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Periodo de facturación *
            </Label>
            <Select value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'yearly')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Estado inicial *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'trialing' | 'active' | 'past_due')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="trialing">En prueba</SelectItem>
                <SelectItem value="past_due">Pago pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha de inicio *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Payment Link */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link de pago (opcional)
            </Label>
            <Input
              type="url"
              placeholder="https://pay.example.com/..."
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              URL destino para el botón "Actualizar mi plan" del cliente
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Agregar notas o comentarios..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Preview */}
          {selectedPlan && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">Resumen:</p>
              <p className="text-muted-foreground">
                Plan {selectedPlan.name} - {billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}
              </p>
              {price && (
                <p className="text-muted-foreground">
                  Precio: ${price.toLocaleString()} COP/{billingPeriod === 'monthly' ? 'mes' : 'año'}
                </p>
              )}
              <p className="text-muted-foreground">
                Periodo: {format(startDate, "dd MMM yyyy", { locale: es })} - {format(periodEnd, "dd MMM yyyy", { locale: es })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedCompanyId || !selectedPlanId}>
            {isSubmitting ? 'Creando...' : 'Crear suscripción'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};