import React, { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, X, ChevronLeft, MapPin, AlertCircle } from 'lucide-react';
import { areaSchema, tableSchema, checkDuplicateNames } from '@/lib/wizardValidation';
import { useToast } from '@/hooks/use-toast';

interface Area {
  name: string;
  color: string;
}

interface Table {
  name: string;
  capacity: number;
  areaId: string;
}

interface TablesStepProps {
  onNext: (data: { useTables: boolean; areas: Area[]; tables: Table[] }) => void;
  onBack: () => void;
}

const PRESET_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#eab308'];

const AREA_SUGGESTIONS = ['Terraza', 'Jardín', 'Salón Principal', 'Interior', 'VIP', 'Bar'];

export const TablesStep: React.FC<TablesStepProps> = ({ onNext, onBack }) => {
  const [useTables, setUseTables] = useState(true);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [areaName, setAreaName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4');
  const [selectedAreaIndex, setSelectedAreaIndex] = useState('0');
  const [areaError, setAreaError] = useState('');
  const [tableError, setTableError] = useState('');
  const { toast } = useToast();

  const addArea = (name: string) => {
    setAreaError('');
    
    if (!name.trim()) {
      setAreaError('El nombre del área no puede estar vacío');
      return;
    }
    
    // Check for duplicates
    const duplicateCheck = checkDuplicateNames(areas, name, 'área');
    if (duplicateCheck.isDuplicate) {
      setAreaError(duplicateCheck.message!);
      toast({
        title: "Error de validación",
        description: duplicateCheck.message,
        variant: "destructive"
      });
      return;
    }
    
    // Validate the area
    const validation = areaSchema.safeParse({
      name: name.trim(),
      color: selectedColor
    });
    
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Error de validación';
      setAreaError(errorMsg);
      toast({
        title: "Error de validación",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }
    
    setAreas([...areas, { name: name.trim(), color: selectedColor }]);
    setAreaName('');
  };

  const removeArea = (index: number) => {
    setAreas(areas.filter((_, i) => i !== index));
    setTables(tables.filter(t => t.areaId !== index.toString()));
  };

  const addTable = () => {
    setTableError('');
    
    if (!tableName.trim()) {
      setTableError('El nombre de la mesa no puede estar vacío');
      return;
    }
    
    if (areas.length === 0) {
      setTableError('Debe crear al menos un área primero');
      return;
    }
    
    const capacity = parseInt(tableCapacity);
    
    // Check for duplicates
    const duplicateCheck = checkDuplicateNames(tables, tableName, 'mesa');
    if (duplicateCheck.isDuplicate) {
      setTableError(duplicateCheck.message!);
      toast({
        title: "Error de validación",
        description: duplicateCheck.message,
        variant: "destructive"
      });
      return;
    }
    
    // Validate the table
    const validation = tableSchema.safeParse({
      name: tableName.trim(),
      capacity,
      areaId: selectedAreaIndex
    });
    
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Error de validación';
      setTableError(errorMsg);
      toast({
        title: "Error de validación",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    setTables([...tables, {
      name: tableName.trim(),
      capacity,
      areaId: selectedAreaIndex
    }]);
    
    // Auto-increment table number
    const match = tableName.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0]) + 1;
      setTableName(tableName.replace(/\d+$/, num.toString()));
    } else {
      setTableName('');
    }
  };

  const removeTable = (index: number) => {
    setTables(tables.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    onNext({ useTables, areas, tables });
  };

  const getAreaName = (areaId: string) => {
    const index = parseInt(areaId);
    return areas[index]?.name || '';
  };

  return (
    <CardContent className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Configuración de Mesas</h2>
        <p className="text-muted-foreground">
          ¿Tu negocio utiliza mesas? Configúralas aquí
        </p>
      </div>

      {/* Use Tables Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="space-y-1">
          <Label htmlFor="use-tables" className="text-base">¿Usar sistema de mesas?</Label>
          <p className="text-sm text-muted-foreground">
            Activa esto si tu negocio tiene mesas (restaurante, café)
          </p>
        </div>
        <Switch
          id="use-tables"
          checked={useTables}
          onCheckedChange={setUseTables}
        />
      </div>

      {useTables && (
        <>
          {/* Areas Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Áreas</Label>
              <span className="text-sm text-muted-foreground">{areas.length} áreas</span>
            </div>

            {/* Area Suggestions */}
            <div className="flex flex-wrap gap-2">
              {AREA_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => addArea(suggestion)}
                  disabled={areas.some(a => a.name === suggestion)}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-sm disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Add Custom Area */}
            {areaError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{areaError}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Nombre del área"
                value={areaName}
                onChange={(e) => {
                  setAreaName(e.target.value);
                  setAreaError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && addArea(areaName)}
                maxLength={30}
                className={areaError ? 'border-destructive' : ''}
              />
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 3).map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded border-2 ${selectedColor === color ? 'border-primary' : 'border-border'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button onClick={() => addArea(areaName)} disabled={!areaName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Areas List */}
            {areas.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {areas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-background rounded-lg border">
                    <MapPin className="h-4 w-4" style={{ color: area.color }} />
                    <span className="text-sm flex-1">{area.name}</span>
                    <button onClick={() => removeArea(index)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tables Section */}
          {areas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg">Mesas</Label>
                <span className="text-sm text-muted-foreground">{tables.length} mesas</span>
              </div>

              {/* Add Table */}
              {tableError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm col-span-3">
                  <AlertCircle className="h-4 w-4" />
                  <span>{tableError}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Mesa 1"
                  value={tableName}
                  onChange={(e) => {
                    setTableName(e.target.value);
                    setTableError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && addTable()}
                  className={tableError ? 'border-destructive' : ''}
                />
                <Input
                  type="number"
                  placeholder="Capacidad"
                  value={tableCapacity}
                  onChange={(e) => {
                    setTableCapacity(e.target.value);
                    setTableError('');
                  }}
                  min="1"
                  max="20"
                  className={tableError ? 'border-destructive' : ''}
                />
                <select
                  value={selectedAreaIndex}
                  onChange={(e) => setSelectedAreaIndex(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {areas.map((area, index) => (
                    <option key={index} value={index.toString()}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={addTable} className="w-full" disabled={!tableName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Mesa
              </Button>

              {/* Tables List */}
              {tables.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tables.map((table, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded-lg border text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{table.name}</span>
                        <span className="text-muted-foreground">• {table.capacity} personas</span>
                        <span className="text-muted-foreground">• {getAreaName(table.areaId)}</span>
                      </div>
                      <button onClick={() => removeTable(index)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Actions */}
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
