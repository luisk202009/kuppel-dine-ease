import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';

interface PlanSelectionStepProps {
  onNext: (planId: string) => void;
  onBack: () => void;
}

type Plan = Tables<'plans'>;

export const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({ onNext, onBack }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      console.log('[PlanSelectionStep] Fetching plans with filters: is_active=true, show_in_wizard=true');
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .eq('show_in_wizard', true)
        .order('price_monthly', { ascending: true, nullsFirst: false });

      console.log('[PlanSelectionStep] Raw query result:', { 
        count: data?.length || 0,
        error: error?.message || null 
      });
      
      console.log('[PlanSelectionStep] Plans received for wizard:', data?.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        is_active: p.is_active,
        show_in_wizard: p.show_in_wizard,
        price_monthly: p.price_monthly
      })));

      if (error) throw error;
      setPlans(data || []);

      // Auto-seleccionar el primer plan si existe
      if (data && data.length > 0) {
        setSelectedPlanId(data[0].id);
        console.log('[PlanSelectionStep] Auto-selected plan:', data[0].name);
      }
    } catch (error: any) {
      console.error('[PlanSelectionStep] Error fetching plans:', error);
      toast.error('Error al cargar los planes disponibles');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Gratis';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleContinue = () => {
    if (!selectedPlanId) {
      toast.error('Por favor selecciona un plan para continuar');
      return;
    }
    onNext(selectedPlanId);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Selecciona tu Plan</CardTitle>
          <CardDescription>Cargando planes disponibles...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle>Selecciona tu Plan</CardTitle>
        <CardDescription>
          Comienza con 15 días de prueba gratis. No se requiere tarjeta de crédito.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const priceToShow = plan.billing_interval_default === 'monthly' 
              ? plan.price_monthly 
              : plan.price_yearly;
            
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`
                  relative border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border hover:border-primary/50 hover:shadow'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      {formatPrice(priceToShow, plan.currency)}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.billing_interval_default === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </div>

                  {plan.limits && (
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-sm font-medium">Incluye:</p>
                      <ul className="space-y-1">
                        {typeof plan.limits === 'object' && plan.limits !== null && 'max_users' in plan.limits && plan.limits.max_users !== undefined && (
                          <li className="text-sm text-muted-foreground flex items-center gap-2">
                            <Check className="h-3 w-3 text-primary" />
                            {plan.limits.max_users === 0 
                              ? 'Usuarios ilimitados' 
                              : `Hasta ${plan.limits.max_users} usuarios`}
                          </li>
                        )}
                        {typeof plan.limits === 'object' && plan.limits !== null && 'max_branches' in plan.limits && plan.limits.max_branches !== undefined && (
                          <li className="text-sm text-muted-foreground flex items-center gap-2">
                            <Check className="h-3 w-3 text-primary" />
                            {plan.limits.max_branches === 0 
                              ? 'Sucursales ilimitadas' 
                              : `Hasta ${plan.limits.max_branches} sucursales`}
                          </li>
                        )}
                        {typeof plan.limits === 'object' && plan.limits !== null && 'max_documents_per_month' in plan.limits && plan.limits.max_documents_per_month !== undefined && (
                          <li className="text-sm text-muted-foreground flex items-center gap-2">
                            <Check className="h-3 w-3 text-primary" />
                            {plan.limits.max_documents_per_month === 0 
                              ? 'Documentos ilimitados' 
                              : `${plan.limits.max_documents_per_month} documentos/mes`}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {plan.trial_days && plan.trial_days > 0 ? (
                    <Badge variant="secondary" className="mt-4">
                      {plan.trial_days} días de prueba gratis
                    </Badge>
                  ) : (plan.price_monthly === null || plan.price_monthly === 0) && 
                     (plan.price_yearly === null || plan.price_yearly === 0) ? (
                    <Badge variant="secondary" className="mt-4">
                      Gratis para siempre
                    </Badge>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay planes disponibles en este momento.
          </div>
        )}

        <div className="flex justify-between pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
          >
            Volver
          </Button>
          <Button 
            type="button" 
            onClick={handleContinue}
            disabled={!selectedPlanId || plans.length === 0}
          >
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
