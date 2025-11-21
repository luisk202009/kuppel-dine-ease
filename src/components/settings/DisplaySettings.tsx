import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';

export const DisplaySettings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [buttonSize, setButtonSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kuppel-layout-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setButtonSize(parsed.buttonSize || 'medium');
      setCompactMode(parsed.compactMode || false);
    }
  }, []);

  const handleSave = () => {
    const existing = localStorage.getItem('kuppel-layout-settings');
    const existingData = existing ? JSON.parse(existing) : {};
    localStorage.setItem('kuppel-layout-settings', JSON.stringify({
      ...existingData,
      buttonSize,
      compactMode
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
          <Monitor className="h-5 w-5" />
          Configuración de Pantalla
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Tema de Color</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Oscuro</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tamaño de Botones</Label>
          <Select 
            value={buttonSize} 
            onValueChange={(value: 'small' | 'medium' | 'large') => setButtonSize(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeño</SelectItem>
              <SelectItem value="medium">Mediano</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="compact-mode"
            checked={compactMode}
            onCheckedChange={setCompactMode}
          />
          <Label htmlFor="compact-mode">Modo Compacto</Label>
        </div>

        <Button onClick={handleSave} className="w-full">
          Guardar Cambios
        </Button>
      </CardContent>
    </Card>
  );
};
