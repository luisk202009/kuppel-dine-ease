import React, { useState, useEffect } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronLeft, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Area {
  id: string;
  name: string;
  color: string;
  tables: Table[];
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  areaId: string;
}

interface TablesStepProps {
  branchId: string;
  onNext: (data: { useTables: boolean; areas: Area[]; tables: Table[] }) => void;
  onBack: () => void;
}

export const TablesStep: React.FC<TablesStepProps> = ({ branchId, onNext, onBack }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useTables, setUseTables] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadAreasAndTables = async () => {
      if (!branchId) {
        toast({
          title: "Error",
          description: "No se encontró el ID de la sucursal",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        const { data: areasData, error: areasError } = await supabase
          .from('areas')
          .select('id, name, color')
          .eq('branch_id', branchId)
          .eq('is_active', true)
          .order('display_order');

        if (areasError) throw areasError;

        if (areasData && areasData.length > 0) {
          const { data: tablesData, error: tablesError } = await supabase
            .from('tables')
            .select('id, name, capacity, area_id, display_order')
            .eq('branch_id', branchId)
            .order('display_order');

          if (tablesError) throw tablesError;

          const areasWithTables = areasData.map(area => ({
            ...area,
            tables: tablesData?.filter(t => t.area_id === area.id).map(t => ({
              ...t,
              areaId: t.area_id,
            })) || [],
          }));

          setAreas(areasWithTables);
          setUseTables(true);
        } else {
          setUseTables(false);
        }
      } catch (err: any) {
        console.error('Error loading areas and tables:', err);
        toast({
          title: "Error al cargar mesas",
          description: err.message || "No se pudieron cargar las mesas",
          variant: "destructive",
        });
        setUseTables(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadAreasAndTables();
  }, [branchId, toast]);

  const handleNext = () => {
    const allTables = areas.flatMap(area => area.tables);
    onNext({ useTables, areas, tables: allTables });
  };

  if (isLoading) {
    return (
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando configuración de mesas...</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Configuración de Mesas</h2>
        <p className="text-muted-foreground">
          Configura si tu negocio utiliza sistema de mesas
        </p>
      </div>

      <div className="flex items-center justify-center space-x-4 p-6 bg-muted/50 rounded-lg border">
        <Switch
          id="use-tables"
          checked={useTables}
          onCheckedChange={setUseTables}
        />
        <Label htmlFor="use-tables" className="text-lg cursor-pointer">
          ¿Tu negocio utiliza mesas?
        </Label>
      </div>

      {useTables && areas.length > 0 ? (
        <div className="space-y-6">
          {areas.map((area) => (
            <div key={area.id} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="h-5 w-5" style={{ color: area.color }} />
                <h3 className="font-semibold text-lg">{area.name}</h3>
                <span className="text-sm text-muted-foreground">
                  ({area.tables.length} mesa{area.tables.length !== 1 ? 's' : ''})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {area.tables.map((table) => (
                  <div
                    key={table.id}
                    className="p-3 bg-muted/50 rounded-lg border text-center"
                  >
                    <p className="font-medium text-sm">{table.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {table.capacity} persona{table.capacity !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {!useTables 
              ? 'Tu negocio no utilizará sistema de mesas. Podrás activarlo más tarde desde configuración.'
              : 'No se encontraron mesas. Podrás agregarlas desde el panel de control.'
            }
          </p>
        </div>
      )}

      <div className="bg-muted/50 border rounded-lg p-4">
        <p className="text-sm text-muted-foreground text-center">
          💡 {useTables 
            ? 'Podrás agregar, editar y eliminar áreas y mesas desde el panel de control'
            : 'Si cambias de opinión, podrás activar el sistema de mesas desde configuración'
          }
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button onClick={handleNext} size="lg">
          Finalizar Configuración
        </Button>
      </div>
    </CardContent>
  );
};
