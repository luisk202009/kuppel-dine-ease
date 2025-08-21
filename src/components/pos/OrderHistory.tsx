import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  User,
  Receipt,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Order {
  id: string;
  tableId: string;
  tableName: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  taxes: number;
  total: number;
  paymentMethod: string;
  status: 'completed' | 'cancelled' | 'refunded';
  timestamp: Date;
  cashier: string;
}

export const OrderHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled' | 'refunded'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock data - in real app this would come from backend
  const mockOrders: Order[] = [
    {
      id: 'ORD-001',
      tableId: 'table-1',
      tableName: 'Mesa 1',
      customerName: 'Juan Pérez',
      items: [
        { name: 'Café Americano', quantity: 2, price: 3500 },
        { name: 'Croissant', quantity: 1, price: 4500 }
      ],
      subtotal: 11500,
      taxes: 2185,
      total: 13685,
      paymentMethod: 'Efectivo',
      status: 'completed',
      timestamp: new Date(2024, 7, 21, 14, 30),
      cashier: 'María García'
    },
    {
      id: 'ORD-002',  
      tableId: 'table-3',
      tableName: 'Mesa 3',
      items: [
        { name: 'Hamburguesa Clásica', quantity: 1, price: 15000 },
        { name: 'Papas Fritas', quantity: 1, price: 6000 },
        { name: 'Coca Cola', quantity: 1, price: 3000 }
      ],
      subtotal: 24000,
      taxes: 4560,
      total: 28560,
      paymentMethod: 'Tarjeta',
      status: 'completed',
      timestamp: new Date(2024, 7, 21, 13, 15),
      cashier: 'Carlos Ruiz'
    },
    {
      id: 'ORD-003',
      tableId: 'table-5',
      tableName: 'Mesa 5',
      customerName: 'Ana López',
      items: [
        { name: 'Ensalada César', quantity: 1, price: 12000 },
        { name: 'Agua', quantity: 1, price: 2000 }
      ],
      subtotal: 14000,
      taxes: 2660,
      total: 16660,
      paymentMethod: 'Efectivo',
      status: 'cancelled',
      timestamp: new Date(2024, 7, 21, 12, 45),
      cashier: 'María García'
    }
  ];

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      case 'refunded': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Historial de Órdenes</h2>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredOrders.length} órdenes
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de orden, mesa o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                Todas
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                size="sm"
              >
                Completadas
              </Button>
              <Button
                variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('cancelled')}
                size="sm"
              >
                Canceladas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="pos-card-interactive">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-bold text-lg">{order.id}</h3>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {order.tableName}
                      {order.customerName && ` • ${order.customerName}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(order.timestamp, 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Productos</h4>
                  <div className="space-y-1 text-sm">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-muted-foreground">
                        +{order.items.length - 3} productos más
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impuestos:</span>
                      <span>${order.taxes.toFixed(0)}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${order.total.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Método:</span>
                      <span>{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Cajero:</span>
                      <span>{order.cashier}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalles
                </Button>
                <Button variant="outline" size="sm">
                  <Receipt className="h-4 w-4 mr-1" />
                  Reimprimir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No se encontraron órdenes</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Aún no hay órdenes registradas'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Modal would go here */}
    </div>
  );
};