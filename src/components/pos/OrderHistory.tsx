import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Search, Eye, Receipt, Filter } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency } from '@/lib/utils';
import { Order, PaymentMethod } from '@/types/pos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderHistoryProps {
  className?: string;
}

type OrderStatus = 'all' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';
type TimeFilter = 'today' | 'week' | 'month' | 'all';

export const OrderHistory: React.FC<OrderHistoryProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading, error, refetch } = useInvoices();

  // Filter orders based on search and filters
  const filteredOrders = React.useMemo(() => {
    let filtered = orders;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.tableId && order.tableId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customer && `${order.customer.name} ${order.customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.items && order.items.some((item: any) => 
          item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply customer filter
    if (customerFilter !== 'all') {
      filtered = filtered.filter(order => 
        customerFilter === 'with-customer' ? order.customer : !order.customer
      );
    }

    // Apply time filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (timeFilter) {
      case 'today':
        filtered = filtered.filter(order => new Date(order.createdAt) >= today);
        break;
      case 'week':
        filtered = filtered.filter(order => new Date(order.createdAt) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(order => new Date(order.createdAt) >= monthAgo);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, statusFilter, timeFilter, customerFilter]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'delivered': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo';
      case 'delivered': return 'Entregado';
      case 'paid': return 'Pagado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <Card className="pos-card-interactive cursor-pointer" onClick={() => setSelectedOrder(order)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-base">Orden #{order.id.slice(-6)}</h3>
            <p className="text-sm text-muted-foreground">Mesa {order.tableId}</p>
            {order.customer && (
              <p className="text-sm font-medium text-primary mt-1">
                👤 {order.customer.name} {order.customer.lastName}
              </p>
            )}
          </div>
          <Badge className={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {format(new Date(order.createdAt), 'PPp', { locale: es })}
          </div>
          <div className="text-sm">
            {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-primary">
            {formatCurrency(order.total)}
          </div>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Ver detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orden #{order.id.slice(-6)}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.customer && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <h4 className="font-medium mb-2">Cliente</h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.customer.name} {order.customer.lastName}</p>
                {order.customer.identification && (
                  <p className="text-muted-foreground">ID: {order.customer.identification}</p>
                )}
                {order.customer.phone && (
                  <p className="text-muted-foreground">Tel: {order.customer.phone}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Mesa</p>
              <p className="text-sm text-muted-foreground">{order.tableId}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Estado</p>
              <Badge className={getStatusColor(order.status)}>
                {getStatusText(order.status)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Fecha</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(order.createdAt), 'PPP', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Hora</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(order.createdAt), 'p', { locale: es })}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Productos</h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic">
                        Nota: {item.notes}
                      </p>
                    )}
                  </div>
                  <p className="font-medium">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Impuestos:</span>
                <span>{formatCurrency(order.taxes)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {order.paymentMethod && (
            <div className="flex justify-between items-center">
              <span className="font-medium">Método de pago:</span>
              <Badge variant="outline">{order.paymentMethod}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error al cargar el historial de órdenes</p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar órdenes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: OrderStatus) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="ready">Listo</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with-customer">Con cliente</SelectItem>
                <SelectItem value="no-customer">Sin cliente</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()}>
              <Filter className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No se encontraron órdenes</p>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || timeFilter !== 'today'
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'No hay órdenes para mostrar'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default OrderHistory;