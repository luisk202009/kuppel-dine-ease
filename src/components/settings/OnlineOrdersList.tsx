import React, { useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { useOnlineOrders, ORDER_STATUS_CONFIG, OrderStatus, OnlineOrder } from '@/hooks/useOnlineOrders';
import { ConvertToInvoiceModal } from './ConvertToInvoiceModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageCircle, Eye, Package, Phone, MapPin, Calendar, RefreshCw, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const OnlineOrdersList: React.FC = () => {
  const { authState } = usePOS();
  const companyId = authState.selectedCompany?.id;
  
  const { 
    orders, 
    isLoading, 
    statusFilter, 
    setStatusFilter, 
    updateOrderStatus, 
    getWhatsAppLink,
    refetch 
  } = useOnlineOrders({ companyId });

  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  const handleViewDetails = (order: OnlineOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleWhatsApp = (order: OnlineOrder) => {
    window.open(getWhatsAppLink(order), '_blank');
  };

  const handleConvertToInvoice = (order: OnlineOrder) => {
    setSelectedOrder(order);
    setIsConvertModalOpen(true);
  };

  const handleConvertSuccess = () => {
    refetch();
    setIsDetailOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy, h:mm a", { locale: es });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Estado:</span>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(ORDER_STATUS_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">No hay pedidos</h3>
              <p className="text-muted-foreground mt-1">
                Los pedidos de tu tienda online aparecerán aquí
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.customer_name}</span>
                          <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={ORDER_STATUS_CONFIG[order.status].color}>
                          {ORDER_STATUS_CONFIG[order.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(order)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleConvertToInvoice(order)}
                            title="Convertir a factura"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleWhatsApp(order)}
                            title="Contactar por WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pedido {selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription>
              Detalles del pedido y productos
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {selectedOrder.customer_phone}
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  {selectedOrder.customer_address}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(selectedOrder.created_at)}
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="font-medium">Productos</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <span className="font-medium">{item.product_name}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cambiar estado</label>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(value) => {
                    updateOrderStatus(selectedOrder.id, value as OrderStatus);
                    setSelectedOrder({ ...selectedOrder, status: value as OrderStatus });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORDER_STATUS_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline"
                  className="flex-1" 
                  onClick={() => handleWhatsApp(selectedOrder)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={() => handleConvertToInvoice(selectedOrder)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Convertir a Factura
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Invoice Modal */}
      {selectedOrder && (
        <ConvertToInvoiceModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          order={selectedOrder}
          onSuccess={handleConvertSuccess}
        />
      )}
    </div>
  );
};
