import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export const TouchSettings: React.FC = () => {
  const [touchOptimized, setTouchOptimized] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('kuppel-layout-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTouchOptimized(parsed.touchOptimized !== undefined ? parsed.touchOptimized : true);
    }
  }, []);

  const handleSave = () => {
    const existing = localStorage.getItem('kuppel-layout-settings');
    const existingData = existing ? JSON.parse(existing) : {};
    localStorage.setItem('kuppel-layout-settings', JSON.stringify({
      ...existingData,
      touchOptimized
    }));
    toast({
      title: "Configuración guardada",
      description: "Los cambios se aplicarán inmediatamente",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Configuración Táctil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="touch-optimized"
            checked={touchOptimized}
            onCheckedChange={setTouchOptimized}
          />
          <Label htmlFor="touch-optimized">Optimizado para Pantallas Táctiles</Label>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Características Táctiles:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Botones más grandes y espaciados</li>
            <li>• Efectos visuales de retroalimentación</li>
            <li>• Gestos de deslizamiento mejorados</li>
            <li>• Teclado numérico ampliado</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <Monitor className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Escritorio</p>
            <p className="text-xs text-muted-foreground">Clics precisos</p>
          </div>
          <div className="p-4 border rounded-lg text-center bg-primary/5">
            <Smartphone className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Táctil</p>
            <p className="text-xs text-muted-foreground">Toque ampliado</p>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Guardar Cambios
        </Button>
      </CardContent>
    </Card>
  );
};
