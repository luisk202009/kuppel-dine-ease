import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableGrid } from './TableGrid';
import { usePOS } from '@/contexts/POSContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const TableManager: React.FC = () => {
  const { posState } = usePOS();

  if (!posState.areas || posState.areas.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No hay áreas configuradas. Por favor, crea áreas primero en la sección "Gestión de Áreas" arriba.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue={posState.areas[0]?.id} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        {posState.areas.map((area) => (
          <TabsTrigger key={area.id} value={area.id} className="capitalize">
            {area.name}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {posState.areas.map((area) => (
        <TabsContent key={area.id} value={area.id}>
          <TableGrid area={area} />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default TableManager;
