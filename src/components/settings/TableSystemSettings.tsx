import React from 'react';
import { Grid3x3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { toast } from '@/hooks/use-toast';

export const TableSystemSettings: React.FC = () => {
  const { config, updateConfig } = useLayoutConfig();

  const handleToggle = (checked: boolean) => {
    updateConfig({ tablesEnabled: checked });
    toast({
      title: checked ? "Sistema de mesas activado" : "Sistema de mesas desactivado",
      description: checked 
        ? "Ahora puedes gestionar pedidos por mesa" 
        : "Solo se mostrarán ventas de mostrador",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5" />
          Sistema de Mesas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="tables-enabled">Habilitar gestión de mesas</Label>
            <p className="text-sm text-muted-foreground">
              Activa o desactiva el sistema de mesas. Si se desactiva, solo se mostrarán ventas de mostrador.
            </p>
          </div>
          <Switch
            id="tables-enabled"
            checked={config.tablesEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
        {!config.tablesEnabled && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Con el sistema de mesas desactivado, todas las ventas se registrarán como ventas de mostrador.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
