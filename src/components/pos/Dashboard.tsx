import React, { useState, useEffect } from 'react';
import { ShoppingBag, Receipt, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { usePOS } from '@/contexts/POSContext';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { toast } from '@/hooks/use-toast';
import { TableGrid } from './TableGrid';
import { ShoppingCart } from './ShoppingCart';
import { ProductManager } from './ProductManager';
import { Table } from '@/types/pos';

type ViewMode = 'table-list' | 'table-products' | 'products';

export const Dashboard: React.FC = () => {
  const { posState, loadPendingOrder, addToCart } = usePOS();
  const { config } = useLayoutConfig();
  const [viewMode, setViewMode] = useState<ViewMode>(config.tablesEnabled ? 'table-list' : 'products');
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  
  // Notifications setup
  const { showNotification, requestPermission, isGranted, isSupported } = useNotifications();
  
  // Request notification permission on mount
  useEffect(() => {
    if (isSupported && !isGranted) {
      requestPermission();
    }
  }, [isSupported, isGranted, requestPermission]);
  
  // Realtime updates for orders and tables
  useRealtimeUpdates({
    onNewOrder: (order) => {
      showNotification('Nueva Orden', {
        body: `Orden ${order.order_number} creada`,
        tag: 'new-order',
        requireInteraction: false
      });
      
      toast({
        title: "Nueva Orden",
        description: `Orden ${order.order_number} ha sido creada`
      });
    },
    onTableStatusChange: (table, oldStatus) => {
      const statusLabels: Record<string, string> = {
        available: 'Disponible',
        occupied: 'Ocupada',
        pending: 'Cuenta Pendiente',
        reserved: 'Reservada'
      };
      
      showNotification('Cambio en Mesa', {
        body: `${table.name}: ${statusLabels[oldStatus]} → ${statusLabels[table.status]}`,
        tag: 'table-status',
        requireInteraction: false
      });
      
      toast({
        title: "Cambio en Mesa",
        description: `${table.name} cambió a ${statusLabels[table.status]}`
      });
    },
    enabled: true
  });

  // Update view mode when tablesEnabled changes
  useEffect(() => {
    if (!config.tablesEnabled) {
      setViewMode('products');
      setSelectedTableForOrder(null);
    } else if (viewMode === 'products' && !selectedTableForOrder) {
      setViewMode('table-list');
    }
  }, [config.tablesEnabled]);


  const handleTableClick = (table: Table) => {
    setSelectedTableForOrder(table);
    
    // Check if table has pending order
    if (table.status === 'pending') {
      const pendingOrder = loadPendingOrder(table.id);
      if (pendingOrder) {
        // Load items into cart
        pendingOrder.items.forEach(item => {
          const product = posState.categories
            .flatMap(cat => cat.products)
            .find(p => p.id === item.id);
          if (product) {
            addToCart(product, item.quantity);
          }
        });
        toast({
          title: "Cuenta abierta cargada",
          description: `Se cargaron los items de la mesa ${table.name}`,
        });
      }
    }
    
    setViewMode('table-products');
  };

  const handleBackToTables = () => {
    setViewMode('table-list');
    setSelectedTableForOrder(null);
  };

  const renderMainContent = () => {
    // Main views
    if (viewMode === 'table-list' && config.tablesEnabled) {
      return (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Mesas</h2>
            <p className="text-muted-foreground">
              Selecciona una mesa para iniciar o continuar un pedido
            </p>
          </div>
          
          <Tabs defaultValue={posState.areas[0]?.id || 'plantas'} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {posState.areas.map((area) => (
                <TabsTrigger key={area.id} value={area.id} className="capitalize">
                  {area.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {posState.areas.map((area) => (
              <TabsContent key={area.id} value={area.id}>
                <TableGrid area={area} onTableClick={handleTableClick} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      );
    }

    if (viewMode === 'table-products' && selectedTableForOrder) {
      return (
        <div>
          <div className="mb-6 flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToTables}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Mesas
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Mesa: {selectedTableForOrder.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedTableForOrder.area} • Capacidad: {selectedTableForOrder.capacity} personas
              </p>
            </div>
          </div>
          <ProductManager />
        </div>
      );
    }

    if (viewMode === 'products') {
      return (
        <div>
          {!config.tablesEnabled && (
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2">
                Modo sin mesas - Ventas de mostrador
              </Badge>
            </div>
          )}
          <ProductManager />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Tabs */}
        {config.tablesEnabled && (
          <div className="bg-card border-b border-border px-6 py-3">
            <div className="flex items-center space-x-4">
              <Button
                variant={viewMode === 'table-list' ? 'default' : 'ghost'}
                onClick={() => {
                  setViewMode('table-list');
                  setSelectedTableForOrder(null);
                }}
                className="flex items-center space-x-2"
              >
                <Receipt className="h-4 w-4" />
                <span>Mesas</span>
              </Button>
              
              <Button
                variant={viewMode === 'products' ? 'default' : 'ghost'}
                onClick={() => {
                  setViewMode('products');
                  setSelectedTableForOrder(null);
                }}
                className="flex items-center space-x-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Productos</span>
              </Button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {renderMainContent()}
        </div>
      </div>

      {/* Shopping Cart Sidebar */}
      <div className="w-96 bg-card border-l border-border h-full">
        <ShoppingCart selectedTable={selectedTableForOrder} onBackToTables={handleBackToTables} />
      </div>
    </div>
  );
};

export default Dashboard;
