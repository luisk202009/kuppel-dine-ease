import React, { useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { OnlineOrder } from '@/hooks/useOnlineOrders';
import { useInvoiceTypes } from '@/hooks/useInvoiceTypes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, User, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ConvertToInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OnlineOrder;
  onSuccess: () => void;
}

export const ConvertToInvoiceModal: React.FC<ConvertToInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { authState } = usePOS();
  const branchId = authState.selectedBranch?.id;
  const companyId = authState.selectedCompany?.id;
  const queryClient = useQueryClient();

const { data: invoiceTypes = [], isLoading: loadingTypes } = useInvoiceTypes(companyId);
  const activeTypes = invoiceTypes.filter(t => t.isActive);

  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [createCustomer, setCreateCustomer] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleConvert = async () => {
    if (!branchId || !companyId) {
      toast.error('Error: No se encontró la sucursal o empresa');
      return;
    }

    setIsConverting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let customerId: string | null = null;

      // Create customer if requested
      if (createCustomer) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            company_id: companyId,
            name: order.customer_name,
            phone: order.customer_phone,
            address: order.customer_address,
          })
          .select()
          .single();

        if (customerError) {
          console.error('Error creating customer:', customerError);
          // Don't fail the whole process, just continue without customer
        } else {
          customerId = newCustomer.id;
        }
      }

      // Get invoice type prefix
      let prefix = 'FE';
      if (selectedTypeId) {
        const selectedType = activeTypes.find(t => t.id === selectedTypeId);
        if (selectedType) {
          prefix = selectedType.prefix;
        }
      } else {
        // Use standard default
        const defaultType = activeTypes.find(t => t.isStandardDefault);
        if (defaultType) {
          prefix = defaultType.prefix;
        }
      }

      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase.rpc(
        'generate_invoice_number_with_prefix',
        {
          p_branch_id: branchId,
          p_prefix: prefix,
        }
      );

      if (numberError) throw numberError;

      // Create the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('standard_invoices')
        .insert({
          branch_id: branchId,
          customer_id: customerId,
          invoice_type_id: selectedTypeId || null,
          invoice_number: invoiceNumber,
          source: 'online_store',
          issue_date: new Date().toISOString().split('T')[0],
          currency: 'COP',
          subtotal: order.subtotal,
          total_tax: 0,
          total_discount: 0,
          total: order.total,
          status: 'issued',
          notes: `Convertido desde pedido online ${order.order_number}. Cliente: ${order.customer_name}, Tel: ${order.customer_phone}, Dir: ${order.customer_address}`,
          created_by: user.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (order.items && order.items.length > 0) {
        const itemsToInsert = order.items.map((item, index) => ({
          invoice_id: invoice.id,
          product_id: item.product_id,
          item_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: 0,
          tax_amount: 0,
          discount_rate: 0,
          discount_amount: 0,
          subtotal: item.total,
          total: item.total,
          display_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('standard_invoice_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Update order status to confirmed
      await supabase
        .from('online_orders')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });

      toast.success(`Factura ${invoiceNumber} creada exitosamente`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error converting order to invoice:', error);
      toast.error(error.message || 'Error al convertir el pedido');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Convertir a Factura
          </DialogTitle>
          <DialogDescription>
            Crear una factura estándar a partir del pedido {order.order_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Type Selector */}
          <div className="space-y-2">
            <Label>Tipo de factura</Label>
            {loadingTypes ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando tipos...
              </div>
            ) : (
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de factura" />
                </SelectTrigger>
                <SelectContent>
                  {activeTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.prefix})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Separator />

          {/* Customer Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Datos del cliente</span>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
              <p><strong>Nombre:</strong> {order.customer_name}</p>
              <p><strong>Teléfono:</strong> {order.customer_phone}</p>
              <p><strong>Dirección:</strong> {order.customer_address}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createCustomer"
                checked={createCustomer}
                onCheckedChange={(checked) => setCreateCustomer(checked as boolean)}
              />
              <Label htmlFor="createCustomer" className="text-sm font-normal cursor-pointer">
                Crear cliente en el sistema con estos datos
              </Label>
            </div>
          </div>

          <Separator />

          {/* Order Items Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Productos ({order.items?.length || 0})</span>
            </div>
            <ScrollArea className="h-32 border rounded-lg p-2">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>
                    {item.product_name} <span className="text-muted-foreground">x{item.quantity}</span>
                  </span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center font-semibold text-lg p-3 bg-primary/10 rounded-lg">
            <span>Total de la factura</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConverting}>
            Cancelar
          </Button>
          <Button onClick={handleConvert} disabled={isConverting}>
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Crear Factura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
