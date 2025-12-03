import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Plan = Tables<'plans'>;

interface PlanLimits {
  max_users?: number | null;
  max_branches?: number | null;
  max_documents_per_month?: number | null;
}

interface AdminPlanModalProps {
  plan: Plan | null;
  open: boolean;
  onClose: (shouldRefresh: boolean) => void;
}

export const AdminPlanModal: React.FC<AdminPlanModalProps> = ({ plan, open, onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('');
  const [priceYearly, setPriceYearly] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isActive, setIsActive] = useState(true);
  const [showInWizard, setShowInWizard] = useState(true);
  const [trialDays, setTrialDays] = useState('15');
  
  // Limits
  const [maxUsers, setMaxUsers] = useState('');
  const [maxBranches, setMaxBranches] = useState('');
  const [maxDocuments, setMaxDocuments] = useState('');

  useEffect(() => {
    if (plan) {
      // Edit mode - populate form
      setName(plan.name);
      setCode(plan.code);
      setDescription(plan.description || '');
      setPriceMonthly(plan.price_monthly?.toString() || '');
      setPriceYearly(plan.price_yearly?.toString() || '');
      setCurrency(plan.currency);
      setBillingInterval(plan.billing_interval_default as 'monthly' | 'yearly');
      setIsActive(plan.is_active);
      setShowInWizard((plan as any).show_in_wizard ?? true);
      setTrialDays(plan.trial_days?.toString() || '0');
      
      const planLimits = plan.limits as PlanLimits | null;
      setMaxUsers(planLimits?.max_users?.toString() || '');
      setMaxBranches(planLimits?.max_branches?.toString() || '');
      setMaxDocuments(planLimits?.max_documents_per_month?.toString() || '');
    } else {
      // Create mode - reset form
      resetForm();
    }
  }, [plan, open]);

  const resetForm = () => {
    setName('');
    setCode('');
    setDescription('');
    setPriceMonthly('');
    setPriceYearly('');
    setCurrency('COP');
    setBillingInterval('monthly');
    setIsActive(true);
    setShowInWizard(true);
    setTrialDays('15');
    setMaxUsers('');
    setMaxBranches('');
    setMaxDocuments('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !code.trim()) {
      toast({
        title: 'Error de validación',
        description: 'El nombre y código son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Build limits object
      const limits: any = {};
      if (maxUsers) limits.max_users = parseInt(maxUsers);
      if (maxBranches) limits.max_branches = parseInt(maxBranches);
      if (maxDocuments) limits.max_documents_per_month = parseInt(maxDocuments);

      const planData = {
        name: name.trim(),
        code: code.trim().toLowerCase(),
        description: description.trim() || null,
        price_monthly: priceMonthly ? parseFloat(priceMonthly) : null,
        price_yearly: priceYearly ? parseFloat(priceYearly) : null,
        currency,
        billing_interval_default: billingInterval,
        is_active: isActive,
        show_in_wizard: showInWizard,
        trial_days: trialDays ? parseInt(trialDays) : 0,
        limits: Object.keys(limits).length > 0 ? limits : null,
      };

      if (plan) {
        // Update existing plan
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', plan.id);

        if (error) throw error;

        toast({
          title: 'Plan actualizado',
          description: `El plan "${name}" se ha actualizado correctamente`,
        });
      } else {
        // Create new plan
        const { error } = await supabase
          .from('plans')
          .insert([planData]);

        if (error) throw error;

        toast({
          title: 'Plan creado',
          description: `El plan "${name}" se ha creado correctamente`,
        });
      }

      onClose(true);
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error al guardar el plan',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar Plan' : 'Crear Nuevo Plan'}</DialogTitle>
          <DialogDescription>
            {plan
              ? 'Modifica los detalles del plan de suscripción'
              : 'Define un nuevo plan de suscripción para las empresas'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Plan *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Emprendedor, Pyme, Enterprise"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="Ej: starter, pro, enterprise"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={!!plan}
                />
                <p className="text-xs text-muted-foreground">
                  {plan ? 'El código no se puede modificar' : 'Sin espacios, minúsculas'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción del plan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Precios</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Precio Mensual</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceYearly">Precio Anual</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingInterval">Periodo de Facturación por Defecto</Label>
              <Select value={billingInterval} onValueChange={(v) => setBillingInterval(v as 'monthly' | 'yearly')}>
                <SelectTrigger id="billingInterval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trialDays">Días de Prueba</Label>
              <Input
                id="trialDays"
                type="number"
                min="0"
                placeholder="0"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Dejar en 0 para planes sin periodo de prueba
              </p>
            </div>
          </div>

          {/* Limits */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Límites del Plan</h4>
            <p className="text-xs text-muted-foreground">
              Deja en blanco para límites ilimitados
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Usuarios Máximos</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  placeholder="Ilimitado"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBranches">Sucursales Máximas</Label>
                <Input
                  id="maxBranches"
                  type="number"
                  placeholder="Ilimitado"
                  value={maxBranches}
                  onChange={(e) => setMaxBranches(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDocuments">Documentos/Mes</Label>
                <Input
                  id="maxDocuments"
                  type="number"
                  placeholder="Ilimitado"
                  value={maxDocuments}
                  onChange={(e) => setMaxDocuments(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Status Toggles */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Plan Activo</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="showInWizard"
                checked={showInWizard}
                onCheckedChange={setShowInWizard}
              />
              <div>
                <Label htmlFor="showInWizard">Mostrar en Wizard</Label>
                <p className="text-xs text-muted-foreground">
                  Si está activo, el plan aparecerá en la selección durante el registro
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {plan ? 'Actualizar Plan' : 'Crear Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
