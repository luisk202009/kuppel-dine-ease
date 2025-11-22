import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, MapPin, Sparkles, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';
import { cn } from '@/lib/utils';
import { useCompanyLimits } from '@/hooks/useCompanyLimits';
import { PlanLimitWarningModal } from '@/components/common/PlanLimitWarningModal';

const PRESET_COLORS = [
  { name: 'Azul', color: '#3b82f6' },
  { name: 'Verde', color: '#22c55e' },
  { name: 'Naranja', color: '#f97316' },
  { name: 'Morado', color: '#a855f7' },
  { name: 'Rosa', color: '#ec4899' },
  { name: 'Amarillo', color: '#eab308' },
  { name: 'Rojo', color: '#ef4444' },
  { name: 'Turquesa', color: '#14b8a6' },
];

const AREA_SUGGESTIONS = [
  'Terraza',
  'Jardín',
  'Salón Principal',
  'Interior',
  'VIP',
  'Bar',
  'Patio',
  'Balcón'
];

interface Area {
  id: string;
  name: string;
  color: string;
  display_order: number;
  table_count?: number;
}

export const AreaManager: React.FC = () => {
  const { authState } = usePOS();
  const [areas, setAreas] = useState<Area[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaColor, setAreaColor] = useState('#3b82f6');
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { limitsStatus, refetch: refetchLimits, checkDimension } = useCompanyLimits(authState.selectedCompany?.id);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [pendingAreaCreation, setPendingAreaCreation] = useState(false);

  const loadAreas = async () => {
    if (!authState.selectedBranch) return;

    try {
      const { data, error } = await supabase
        .from('areas')
        .select(`
          *,
          tables (count)
        `)
        .eq('branch_id', authState.selectedBranch.id)
        .order('display_order');

      if (error) throw error;

      const areasWithCount = data?.map(area => ({
        id: area.id,
        name: area.name,
        color: area.color || '#3b82f6',
        display_order: area.display_order,
        table_count: area.tables?.[0]?.count || 0
      })) || [];

      setAreas(areasWithCount);
    } catch (error) {
      console.error('Error loading areas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las áreas",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadAreas();
  }, [authState.selectedBranch]);

  const validateAreaName = (name: string) => {
    if (!name.trim()) {
      setNameError('El nombre es requerido');
      return false;
    }
    
    const duplicate = areas.find(
      area => area.name.toLowerCase() === name.trim().toLowerCase() &&
      (!selectedArea || area.id !== selectedArea.id)
    );
    
    if (duplicate) {
      setNameError('Ya existe un área con este nombre');
      return false;
    }
    
    setNameError(null);
    return true;
  };

  const handleCreateArea = async () => {
    if (!areaName.trim() || !authState.selectedBranch) return;
    if (!validateAreaName(areaName)) return;

    // Verificar límite de branches antes de crear
    const branchesLimit = checkDimension('branches');
    if (branchesLimit && (branchesLimit.status === 'near_limit' || branchesLimit.status === 'over_limit')) {
      setPendingAreaCreation(true);
      setShowLimitWarning(true);
      return;
    }

    await executeCreateArea();
  };

  const executeCreateArea = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('areas')
        .insert({
          name: areaName.trim(),
          color: areaColor,
          branch_id: authState.selectedBranch!.id,
          display_order: areas.length + 1
        });

      if (error) throw error;

      toast({
        title: "Área creada",
        description: `Área "${areaName}" creada exitosamente`,
      });

      setAreaName('');
      setAreaColor('#3b82f6');
      setNameError(null);
      setIsCreateDialogOpen(false);
      setPendingAreaCreation(false);
      await loadAreas();
      await refetchLimits();
    } catch (error) {
      console.error('Error creating area:', error);
      toast({
        title: "Error al crear área",
        description: "No se pudo crear el área. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditArea = async () => {
    if (!areaName.trim() || !selectedArea) return;
    if (!validateAreaName(areaName)) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('areas')
        .update({
          name: areaName.trim(),
          color: areaColor
        })
        .eq('id', selectedArea.id);

      if (error) throw error;

      toast({
        title: "Área actualizada",
        description: `Área "${areaName}" actualizada exitosamente`,
      });

      setIsEditDialogOpen(false);
      loadAreas();
    } catch (error) {
      console.error('Error updating area:', error);
      toast({
        title: "Error al actualizar área",
        description: "No se pudo actualizar el área. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArea = async () => {
    if (!selectedArea) return;

    if ((selectedArea.table_count || 0) > 0) {
      toast({
        title: "No se puede eliminar",
        description: "No puedes eliminar un área que tiene mesas asignadas",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', selectedArea.id);

      if (error) throw error;

      toast({
        title: "Área eliminada",
        description: `Área "${selectedArea.name}" eliminada exitosamente`,
      });

      setIsDeleteDialogOpen(false);
      loadAreas();
    } catch (error) {
      console.error('Error deleting area:', error);
      toast({
        title: "Error al eliminar área",
        description: "No se pudo eliminar el área. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (area: Area) => {
    setSelectedArea(area);
    setAreaName(area.name);
    setAreaColor(area.color);
    setNameError(null);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (area: Area) => {
    setSelectedArea(area);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenCreateDialog = () => {
    setAreaName('');
    setAreaColor('#3b82f6');
    setNameError(null);
    setShowSuggestions(false);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Áreas</h2>
          <p className="text-muted-foreground">
            Organiza tus mesas por ubicaciones (Jardín, Terraza, Salón Principal, etc.)
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Área
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <MapPin className="h-20 w-20 text-muted-foreground/40" />
                <Sparkles className="h-8 w-8 text-primary absolute -top-2 -right-2" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">Organiza tu espacio</h3>
                <p className="text-muted-foreground max-w-md text-base">
                  Crea áreas para organizar tus mesas según la distribución de tu restaurante.
                  Por ejemplo: Jardín, Terraza, Salón Principal, VIP.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {AREA_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                  <div
                    key={suggestion}
                    className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground"
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
              <Button onClick={handleOpenCreateDialog} size="lg" className="mt-2">
                <Plus className="mr-2 h-5 w-5" />
                Crear Primera Área
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <Card key={area.id} className="pos-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" style={{ color: area.color }} />
                    <span>{area.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(area)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(area)}
                      disabled={(area.table_count || 0) > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total de mesas</span>
                    <span className="text-2xl font-bold">{area.table_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-background shadow-sm"
                      style={{ backgroundColor: area.color }}
                    />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Color identificador</p>
                      <p className="text-sm font-mono">{area.color}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Área</DialogTitle>
            <DialogDescription>
              Configura un área para organizar tus mesas por ubicación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="area-name">Nombre del Área *</Label>
              <Input
                id="area-name"
                placeholder="Ej: Terraza, Jardín, VIP..."
                value={areaName}
                onChange={(e) => {
                  setAreaName(e.target.value);
                  if (e.target.value) validateAreaName(e.target.value);
                }}
                onFocus={() => setShowSuggestions(true)}
                maxLength={50}
                className={nameError ? 'border-destructive' : ''}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
              
              {/* Suggestions */}
              {showSuggestions && !areaName && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Sugerencias:</p>
                  <div className="flex flex-wrap gap-2">
                    {AREA_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setAreaName(suggestion);
                          setShowSuggestions(false);
                          validateAreaName(suggestion);
                        }}
                        className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
              <Label>Color Identificador *</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => setAreaColor(preset.color)}
                    className={cn(
                      "relative p-3 rounded-lg border-2 transition-all hover:scale-105",
                      areaColor === preset.color
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-full h-8 rounded"
                      style={{ backgroundColor: preset.color }}
                    />
                    <p className="text-xs mt-1 text-center">{preset.name}</p>
                    {areaColor === preset.color && (
                      <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Custom Color */}
              <div className="flex gap-2 items-center pt-2">
                <Label htmlFor="custom-color" className="text-xs">
                  Color personalizado:
                </Label>
                <Input
                  id="custom-color"
                  type="color"
                  value={areaColor}
                  onChange={(e) => setAreaColor(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  value={areaColor}
                  onChange={(e) => setAreaColor(e.target.value)}
                  placeholder="#3b82f6"
                  maxLength={7}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Preview */}
            {areaName && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6" style={{ color: areaColor }} />
                  <span className="font-semibold text-lg">{areaName}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)} 
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateArea} 
                disabled={isLoading || !areaName.trim() || !!nameError}
              >
                {isLoading ? 'Creando...' : 'Crear Área'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Área</DialogTitle>
            <DialogDescription>
              Modifica el nombre o color del área
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="edit-area-name">Nombre del Área *</Label>
              <Input
                id="edit-area-name"
                placeholder="Ej: Terraza, Jardín, VIP..."
                value={areaName}
                onChange={(e) => {
                  setAreaName(e.target.value);
                  if (e.target.value) validateAreaName(e.target.value);
                }}
                maxLength={50}
                className={nameError ? 'border-destructive' : ''}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
              <Label>Color Identificador *</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => setAreaColor(preset.color)}
                    className={cn(
                      "relative p-3 rounded-lg border-2 transition-all hover:scale-105",
                      areaColor === preset.color
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-full h-8 rounded"
                      style={{ backgroundColor: preset.color }}
                    />
                    <p className="text-xs mt-1 text-center">{preset.name}</p>
                    {areaColor === preset.color && (
                      <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Custom Color */}
              <div className="flex gap-2 items-center pt-2">
                <Label htmlFor="edit-custom-color" className="text-xs">
                  Color personalizado:
                </Label>
                <Input
                  id="edit-custom-color"
                  type="color"
                  value={areaColor}
                  onChange={(e) => setAreaColor(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  value={areaColor}
                  onChange={(e) => setAreaColor(e.target.value)}
                  placeholder="#3b82f6"
                  maxLength={7}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Preview */}
            {areaName && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6" style={{ color: areaColor }} />
                  <span className="font-semibold text-lg">{areaName}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)} 
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEditArea} 
                disabled={isLoading || !areaName.trim() || !!nameError}
              >
                {isLoading ? 'Actualizar' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar área?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el área "{selectedArea?.name}"? Esta acción no se puede deshacer.
              {(selectedArea?.table_count || 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Esta área tiene {selectedArea?.table_count} mesas asignadas y no puede ser eliminada.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArea}
              disabled={isLoading || (selectedArea?.table_count || 0) > 0}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Limit Warning Modal */}
      {limitsStatus && checkDimension('branches') && showLimitWarning && (
        <PlanLimitWarningModal
          open={showLimitWarning}
          onOpenChange={setShowLimitWarning}
          onContinue={async () => {
            if (pendingAreaCreation) {
              await executeCreateArea();
            }
          }}
          dimension="branches"
          status={checkDimension('branches')!.status as 'near_limit' | 'over_limit'}
          used={checkDimension('branches')!.used}
          limit={checkDimension('branches')!.limit}
          usagePct={checkDimension('branches')!.usage_pct}
        />
      )}
    </div>
  );
};