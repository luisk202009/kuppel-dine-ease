import { useState } from 'react';
import { Settings as SettingsIcon, Monitor, Smartphone, Layout, RotateCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { AreaManager } from '@/components/pos/AreaManager';

interface LayoutSettings {
  catalogPosition: 'left' | 'right';
  keypadPosition: 'left' | 'right';
  compactMode: boolean;
  touchOptimized: boolean;
  gridColumns: number;
  buttonSize: 'small' | 'medium' | 'large';
  tablesEnabled: boolean;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { config, updateConfig } = useLayoutConfig();
  
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    catalogPosition: 'left',
    keypadPosition: 'right',
    compactMode: false,
    touchOptimized: true,
    gridColumns: 5,
    buttonSize: 'medium',
    tablesEnabled: config.tablesEnabled
  });

  const handleSettingChange = (key: keyof LayoutSettings, value: any) => {
    setLayoutSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('kuppel-layout-settings', JSON.stringify(layoutSettings));
    updateConfig({ tablesEnabled: layoutSettings.tablesEnabled });
    
    toast({
      title: "Configuración Guardada",
      description: "Los cambios se aplicarán inmediatamente",
    });
  };

  const handleResetSettings = () => {
    const defaultSettings: LayoutSettings = {
      catalogPosition: 'left',
      keypadPosition: 'right',
      compactMode: false,
      touchOptimized: true,
      gridColumns: 5,
      buttonSize: 'medium',
      tablesEnabled: true
    };
    
    setLayoutSettings(defaultSettings);
    localStorage.removeItem('kuppel-layout-settings');
    updateConfig({ tablesEnabled: true });
    
    toast({
      title: "Configuración Restaurada",
      description: "Se han restaurado los valores por defecto",
    });
  };

  const swapLayout = () => {
    setLayoutSettings(prev => ({
      ...prev,
      catalogPosition: prev.catalogPosition === 'left' ? 'right' : 'left',
      keypadPosition: prev.keypadPosition === 'left' ? 'right' : 'left'
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Configuración del Sistema
        </h1>
        <p className="text-muted-foreground mt-2">
          Personaliza la apariencia y comportamiento del sistema POS
        </p>
      </div>

      <Tabs defaultValue="layout" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="layout">Diseño</TabsTrigger>
          <TabsTrigger value="display">Pantalla</TabsTrigger>
          <TabsTrigger value="touch">Táctil</TabsTrigger>
          <TabsTrigger value="admin">Administración</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Distribución de Pantalla
              </CardTitle>
              <CardDescription>
                Configura la posición de los elementos principales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-4">
                <div className="flex h-32 gap-2">
                  <div className={`${layoutSettings.catalogPosition === 'left' ? 'order-1' : 'order-2'} flex-1 bg-primary/10 rounded flex items-center justify-center`}>
                    <span className="text-sm font-medium">Catálogo</span>
                  </div>
                  <div className={`${layoutSettings.keypadPosition === 'left' ? 'order-1' : 'order-2'} w-24 bg-secondary/10 rounded flex items-center justify-center`}>
                    <span className="text-sm font-medium">Teclado</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Posición del Catálogo</Label>
                  <Select 
                    value={layoutSettings.catalogPosition} 
                    onValueChange={(value: 'left' | 'right') => handleSettingChange('catalogPosition', value)}
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

                <div className="space-y-2">
                  <Label>Posición del Teclado</Label>
                  <Select 
                    value={layoutSettings.keypadPosition} 
                    onValueChange={(value: 'left' | 'right') => handleSettingChange('keypadPosition', value)}
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

              <div className="space-y-2">
                <Label>Columnas del Catálogo</Label>
                <Select 
                  value={layoutSettings.gridColumns.toString()} 
                  onValueChange={(value) => handleSettingChange('gridColumns', parseInt(value))}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Configuración de Pantalla
              </CardTitle>
              <CardDescription>
                Ajusta la apariencia visual del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label>Tamaño de Botones</Label>
                <Select 
                  value={layoutSettings.buttonSize} 
                  onValueChange={(value: 'small' | 'medium' | 'large') => handleSettingChange('buttonSize', value)}
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

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Modo Compacto</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce el espaciado entre elementos
                  </p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={layoutSettings.compactMode}
                  onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="touch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Configuración Táctil
              </CardTitle>
              <CardDescription>
                Optimiza la interfaz para pantallas táctiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="touch-optimized">Optimizado para Táctil</Label>
                  <p className="text-sm text-muted-foreground">
                    Aumenta el área de toque de los botones
                  </p>
                </div>
                <Switch
                  id="touch-optimized"
                  checked={layoutSettings.touchOptimized}
                  onCheckedChange={(checked) => handleSettingChange('touchOptimized', checked)}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Características Táctiles:</h4>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Gestión de Áreas
              </CardTitle>
              <CardDescription>
                Configura las áreas de tu establecimiento. Las mesas se crean dentro de cada área desde la vista principal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AreaManager />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sistema de Mesas</CardTitle>
              <CardDescription>
                Activa o desactiva la gestión de mesas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tables-enabled">Habilitar gestión de mesas</Label>
                  <p className="text-sm text-muted-foreground">
                    Si se desactiva, solo se mostrarán ventas de mostrador
                  </p>
                </div>
                <Switch
                  id="tables-enabled"
                  checked={layoutSettings.tablesEnabled}
                  onCheckedChange={(checked) => handleSettingChange('tablesEnabled', checked)}
                />
              </div>
              {!layoutSettings.tablesEnabled && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Con el sistema de mesas desactivado, todas las ventas se registrarán como ventas de mostrador.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-4 border-t">
        <Button onClick={handleSaveSettings} className="flex-1">
          Guardar Configuración
        </Button>
        <Button onClick={handleResetSettings} variant="outline">
          Restaurar
        </Button>
      </div>
    </div>
  );
}
