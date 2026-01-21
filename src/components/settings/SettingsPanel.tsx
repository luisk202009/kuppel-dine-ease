import React, { useState } from 'react';
import { 
  Settings, 
  Monitor, 
  Smartphone, 
  Layout, 
  RotateCw, 
  MapPin, 
  Building2, 
  Palette, 
  Users, 
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { AreaManager } from '@/components/pos/AreaManager';
import { TableManager } from '@/components/pos/TableManager';
import { CompanyAndPlanSettings } from './CompanyAndPlanSettings';
import { TeamManagement } from './TeamManagement';
import { SubscriptionsPage } from './SubscriptionsPage';

interface LayoutSettings {
  catalogPosition: 'left' | 'right';
  keypadPosition: 'left' | 'right';
  compactMode: boolean;
  touchOptimized: boolean;
  gridColumns: number;
  buttonSize: 'small' | 'medium' | 'large';
  tablesEnabled: boolean;
}

type SettingsSubSection = 
  | 'company' 
  | 'layout' 
  | 'display' 
  | 'touch' 
  | 'admin' 
  | 'team' 
  | 'subscriptions' 
  | null;

interface SettingsCard {
  id: SettingsSubSection;
  label: string;
  description: string;
  icon: React.ElementType;
}

const settingsCards: SettingsCard[] = [
  {
    id: 'company',
    label: 'Empresa',
    description: 'Datos de la empresa y configuración general',
    icon: Building2,
  },
  {
    id: 'layout',
    label: 'Diseño',
    description: 'Distribución y layout del POS',
    icon: Layout,
  },
  {
    id: 'display',
    label: 'Pantalla',
    description: 'Tema de color y visualización',
    icon: Palette,
  },
  {
    id: 'touch',
    label: 'Táctil',
    description: 'Optimización para pantallas táctiles',
    icon: Smartphone,
  },
  {
    id: 'admin',
    label: 'Administración',
    description: 'Áreas y gestión de mesas',
    icon: Settings,
  },
  {
    id: 'team',
    label: 'Equipo',
    description: 'Miembros y permisos del equipo',
    icon: Users,
  },
  {
    id: 'subscriptions',
    label: 'Suscripciones',
    description: 'Planes y datos de facturación',
    icon: CreditCard,
  },
];

export const SettingsPanel: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { config, updateConfig } = useLayoutConfig();
  const [activeSubSection, setActiveSubSection] = useState<SettingsSubSection>(null);
  
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

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'company':
        return <CompanyAndPlanSettings />;
      
      case 'layout':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Distribución de Pantalla
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Layout Preview */}
              <div className="border-2 border-dashed border-border rounded-lg p-4">
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
                <div>
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

                <div>
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

              <div>
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

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSaveSettings} className="flex-1">
                  Guardar
                </Button>
                <Button onClick={handleResetSettings} variant="outline">
                  Restaurar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'display':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="compact-mode"
                  checked={layoutSettings.compactMode}
                  onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                />
                <Label htmlFor="compact-mode">Modo Compacto</Label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSaveSettings} className="flex-1">
                  Guardar
                </Button>
                <Button onClick={handleResetSettings} variant="outline">
                  Restaurar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'touch':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Configuración Táctil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="touch-optimized"
                  checked={layoutSettings.touchOptimized}
                  onCheckedChange={(checked) => handleSettingChange('touchOptimized', checked)}
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

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSaveSettings} className="flex-1">
                  Guardar
                </Button>
                <Button onClick={handleResetSettings} variant="outline">
                  Restaurar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'admin':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Gestión de Áreas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura las áreas de tu establecimiento. Las áreas te permiten organizar las mesas por zonas (jardín, terraza, salón principal, etc.).
                </p>
                <AreaManager />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sistema de Mesas</CardTitle>
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
                    checked={layoutSettings.tablesEnabled}
                    onCheckedChange={(checked) => handleSettingChange('tablesEnabled', checked)}
                  />
                </div>

                {layoutSettings.tablesEnabled ? (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium mb-2">Gestionar Mesas</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Agrega mesas a tus áreas existentes. Las mesas se mostrarán en el POS para gestionar pedidos.
                      </p>
                    </div>
                    <TableManager />
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Con el sistema de mesas desactivado, todas las ventas se registrarán como ventas de mostrador.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSaveSettings} className="flex-1">
                    Guardar
                  </Button>
                  <Button onClick={handleResetSettings} variant="outline">
                    Restaurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'team':
        return <TeamManagement />;
      
      case 'subscriptions':
        return <SubscriptionsPage />;
      
      default:
        return null;
    }
  };

  const getSubSectionTitle = () => {
    const card = settingsCards.find(c => c.id === activeSubSection);
    return card?.label || 'Ajustes';
  };

  // If a sub-section is active, show its content with a back button
  if (activeSubSection) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setActiveSubSection(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Ajustes
        </Button>
        
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4">{getSubSectionTitle()}</h3>
          {renderSubSectionContent()}
        </div>
      </div>
    );
  }

  // Main settings grid view
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.id}
              className="cursor-pointer transition-all duration-200 hover:border-[#4AB7C6]/50 hover:shadow-sm group"
              onClick={() => setActiveSubSection(card.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-[#4AB7C6]/10 transition-colors">
                    <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400 group-hover:text-[#4AB7C6] transition-colors" />
                  </div>
                  <CardTitle className="text-base font-medium">{card.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};