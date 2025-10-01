import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';

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

  const handleCreateArea = async () => {
    if (!areaName.trim() || !authState.selectedBranch) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('areas')
        .insert({
          name: areaName.trim(),
          color: areaColor,
          branch_id: authState.selectedBranch.id,
          display_order: areas.length + 1
        });

      if (error) throw error;

      toast({
        title: "Área creada",
        description: `Área "${areaName}" creada exitosamente`,
      });

      setAreaName('');
      setAreaColor('#3b82f6');
      setIsCreateDialogOpen(false);
      loadAreas();
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
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (area: Area) => {
    setSelectedArea(area);
    setIsDeleteDialogOpen(true);
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
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Área
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <MapPin className="h-16 w-16 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No hay áreas configuradas</h3>
              <p className="text-muted-foreground max-w-md">
                Comienza creando tu primera área (ej: Jardín, Terraza, Salón Principal). 
                Después podrás agregar mesas a cada área.
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Crear Primera Área
            </Button>
          </div>
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
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mesas:</span>
                    <span className="font-medium">{area.table_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="font-mono text-xs">{area.color}</span>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Área</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="area-name">Nombre del Área</Label>
              <Input
                id="area-name"
                placeholder="Ej: Terraza, Interior, VIP"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="area-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="area-color"
                  type="color"
                  value={areaColor}
                  onChange={(e) => setAreaColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={areaColor}
                  onChange={(e) => setAreaColor(e.target.value)}
                  placeholder="#3b82f6"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleCreateArea} disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Área</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-area-name">Nombre del Área</Label>
              <Input
                id="edit-area-name"
                placeholder="Ej: Terraza, Interior, VIP"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="edit-area-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-area-color"
                  type="color"
                  value={areaColor}
                  onChange={(e) => setAreaColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={areaColor}
                  onChange={(e) => setAreaColor(e.target.value)}
                  placeholder="#3b82f6"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleEditArea} disabled={isLoading}>
                {isLoading ? 'Actualizando...' : 'Actualizar'}
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
    </div>
  );
};