import React, { useState, useEffect } from 'react';
import { Layout, RotateCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface LayoutConfig {
  catalogPosition: 'left' | 'right';
  keypadPosition: 'left' | 'right';
  gridColumns: number;
}

export const LayoutSettings: React.FC = () => {
  const [config, setConfig] = useState<LayoutConfig>(() => {
    const saved = localStorage.getItem('kuppel-layout-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        catalogPosition: parsed.catalogPosition || 'left',
        keypadPosition: parsed.keypadPosition || 'right',
        gridColumns: parsed.gridColumns || 5
      };
    }
    return {
      catalogPosition: 'left',
      keypadPosition: 'right',
      gridColumns: 5
    };
  });

  const handleChange = (key: keyof LayoutConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const existing = localStorage.getItem('kuppel-layout-settings');
    const existingData = existing ? JSON.parse(existing) : {};
    localStorage.setItem('kuppel-layout-settings', JSON.stringify({
      ...existingData,
      ...config
    }));
    toast({
      title: "Configuración guardada",
      description: "Los cambios se aplicarán inmediatamente",
    });
  };

  const swapLayout = () => {
    setConfig(prev => ({
      ...prev,
      catalogPosition: prev.catalogPosition === 'left' ? 'right' : 'left',
      keypadPosition: prev.keypadPosition === 'left' ? 'right' : 'left'
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5" />
          Distribución de Pantalla
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Layout Preview */}
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          <div className="flex h-32 gap-2">
            <div className={`${config.catalogPosition === 'left' ? 'order-1' : 'order-2'} flex-1 bg-primary/10 rounded flex items-center justify-center`}>
              <span className="text-sm font-medium">Catálogo</span>
            </div>
            <div className={`${config.keypadPosition === 'left' ? 'order-1' : 'order-2'} w-24 bg-secondary/10 rounded flex items-center justify-center`}>
              <span className="text-sm font-medium">Teclado</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Posición del Catálogo</Label>
            <Select 
              value={config.catalogPosition} 
              onValueChange={(value: 'left' | 'right') => handleChange('catalogPosition', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Izquierda</SelectItem>
                <SelectItem value="right">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Posición del Teclado</Label>
            <Select 
              value={config.keypadPosition} 
              onValueChange={(value: 'left' | 'right') => handleChange('keypadPosition', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Izquierda</SelectItem>
                <SelectItem value="right">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={swapLayout} variant="outline" className="w-full">
          <RotateCw className="h-4 w-4 mr-2" />
          Intercambiar Posiciones
        </Button>

        <div>
          <Label>Columnas del Catálogo</Label>
          <Select 
            value={config.gridColumns.toString()} 
            onValueChange={(value) => handleChange('gridColumns', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Columnas</SelectItem>
              <SelectItem value="4">4 Columnas</SelectItem>
              <SelectItem value="5">5 Columnas</SelectItem>
              <SelectItem value="6">6 Columnas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} className="w-full">
          Guardar Cambios
        </Button>
      </CardContent>
    </Card>
  );
};
