import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, Wallet, Package, Users, Receipt, BarChart3, CreditCard, DollarSign, Lock, ShoppingCart, FileText, Store, Landmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EnabledModules, DEFAULT_ENABLED_MODULES } from '@/types/pos';

interface CompanyModulesManagerProps {
  companyId: string;
  initialModules?: EnabledModules | null;
  onSave?: () => void;
}

interface ModuleConfig {
  id: keyof EnabledModules;
  label: string;
  description: string;
  icon: React.ElementType;
  locked?: boolean;
}

const MODULES_CONFIG: ModuleConfig[] = [
  {
    id: 'pos',
    label: 'Punto de Venta (POS)',
    description: 'Acceso al sistema de ventas, mesas y productos',
    icon: ShoppingCart,
  },
  {
    id: 'settings',
    label: 'Ajustes',
    description: 'Configuración general del sistema',
    icon: Settings,
    locked: true, // Always enabled
  },
  {
    id: 'subscriptions',
    label: 'Suscripciones',
    description: 'Gestión de suscripciones y planes',
    icon: Wallet,
    locked: true, // Always enabled
  },
  {
    id: 'products',
    label: 'Productos',
    description: 'Gestión de productos y categorías',
    icon: Package,
  },
  {
    id: 'customers',
    label: 'Clientes',
    description: 'Gestión de clientes',
    icon: Users,
  },
  {
    id: 'orders',
    label: 'Órdenes',
    description: 'Historial de órdenes',
    icon: Receipt,
  },
  {
    id: 'reports',
    label: 'Reportes',
    description: 'Reportes y estadísticas de ventas',
    icon: BarChart3,
  },
  {
    id: 'expenses',
    label: 'Gastos',
    description: 'Registro y gestión de gastos',
    icon: CreditCard,
  },
  {
    id: 'cash',
    label: 'Caja',
    description: 'Gestión de caja y arqueos',
    icon: DollarSign,
  },
  {
    id: 'standardInvoicing',
    label: 'Facturación Estándar',
    description: 'Emisión de facturas estándar con ítems personalizados',
    icon: FileText,
  },
  {
    id: 'onlineStore',
    label: 'Tienda Online',
    description: 'Catálogo público de productos y pedidos online',
    icon: Store,
  },
  {
    id: 'treasury',
    label: 'Tesorería',
    description: 'Gestión de cuentas bancarias, movimientos y transferencias',
    icon: Landmark,
  },
  {
    id: 'paymentReceipts',
    label: 'Pagos Recibidos',
    description: 'Registro de cobros asociados a facturas',
    icon: Wallet,
  },
  {
    id: 'expensePayments',
    label: 'Pagos Realizados',
    description: 'Registro de pagos asociados a gastos',
    icon: CreditCard,
  },
];

export const CompanyModulesManager: React.FC<CompanyModulesManagerProps> = ({
  companyId,
  initialModules,
  onSave,
}) => {
  const [modules, setModules] = useState<EnabledModules>(
    initialModules || DEFAULT_ENABLED_MODULES
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialModules) {
      setModules(initialModules);
    }
  }, [initialModules]);

  const handleToggle = (moduleId: keyof EnabledModules) => {
    const config = MODULES_CONFIG.find(m => m.id === moduleId);
    if (config?.locked) return;

    setModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('companies')
        .update({ enabled_modules: modules as unknown as Record<string, boolean> })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Módulos actualizados',
        description: 'Los módulos visibles para esta empresa han sido actualizados.',
      });

      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving modules:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Módulos Habilitados
        </CardTitle>
        <CardDescription>
          Configura qué módulos estarán visibles para los usuarios de esta empresa en el menú de configuración.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES_CONFIG.map(config => {
            const Icon = config.icon;
            const isEnabled = modules[config.id];
            const isLocked = config.locked;

            return (
              <div
                key={config.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isLocked ? 'bg-muted/50' : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="font-medium flex items-center gap-2">
                      {config.label}
                      {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </Label>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => handleToggle(config.id)}
                  disabled={isLocked}
                />
              </div>
            );
          })}
        </div>

        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
