import React, { useState, useEffect } from 'react';
import { Plus, Table as TableIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';
import { CreateTableDialog } from './CreateTableDialog';
import { toast } from '@/hooks/use-toast';

interface Area {
  id: string;
  name: string;
  color: string;
  table_count: number;
}

export const TableManager: React.FC = () => {
  const { authState } = usePOS();
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const loadAreas = async () => {
    if (!authState.selectedBranch) return;

    try {
      setIsLoading(true);
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('id, name, color')
        .eq('branch_id', authState.selectedBranch.id)
        .eq('is_active', true)
        .order('display_order');

      if (areasError) throw areasError;

      // Get table counts for each area
      const areasWithCount = await Promise.all(
        (areasData || []).map(async (area) => {
          const { count, error } = await supabase
            .from('tables')
            .select('*', { count: 'exact', head: true })
            .eq('area_id', area.id);

          return {
            id: area.id,
            name: area.name,
            color: area.color || '#3b82f6',
            table_count: error ? 0 : (count || 0)
          };
        })
      );

      setAreas(areasWithCount);
    } catch (error) {
      console.error('Error loading areas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las áreas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, [authState.selectedBranch]);

  const handleOpenCreateDialog = (area: Area) => {
    setSelectedArea(area);
    setIsCreateDialogOpen(true);
  };

  const handleTableCreated = () => {
    loadAreas();
  };

  if (!isLoading && areas.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <TableIcon className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                No hay áreas configuradas
              </h3>
              <p className="text-muted-foreground text-sm">
                Primero debes crear áreas en la sección "Gestión de Áreas" de arriba para poder agregar mesas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map((area) => (
          <Card key={area.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                  <span className="text-base">{area.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenCreateDialog(area)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  Total de mesas
                </span>
                <span className="text-2xl font-bold">
                  {area.table_count}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedArea && (
        <CreateTableDialog
          isOpen={isCreateDialogOpen}
          onClose={() => {
            setIsCreateDialogOpen(false);
            setSelectedArea(null);
          }}
          area={selectedArea.name}
          areaId={selectedArea.id}
          onTableCreated={handleTableCreated}
        />
      )}
    </div>
  );
};
