import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  useStandardInvoice, 
  useCreateStandardInvoice, 
  useUpdateStandardInvoice,
  useUpdateInvoiceStatus,
} from '@/hooks/useStandardInvoices';
import { usePOSContext } from '@/contexts/POSContext';
import { InvoiceItemsList } from './InvoiceItemsList';
import { 
  StandardInvoiceItemFormData,
  StandardInvoiceFormData,
  calculateInvoiceTotals 
} from '@/types/invoicing';

const formSchema = z.object({
  customerId: z.string().optional(),
  issueDate: z.date(),
  dueDate: z.date().optional(),
  currency: z.string().default('COP'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  branchId: string;
  invoiceId?: string | null;
  onClose: () => void;
}

export const InvoiceForm = ({ branchId, invoiceId, onClose }: InvoiceFormProps) => {
  const [items, setItems] = useState<StandardInvoiceItemFormData[]>([]);
  const { posState } = usePOSContext();
  const customers = posState.customers;

  const { data: existingInvoice, isLoading: isLoadingInvoice } = useStandardInvoice(invoiceId || undefined);
  const createInvoice = useCreateStandardInvoice();
  const updateInvoice = useUpdateStandardInvoice();
  const updateStatus = useUpdateInvoiceStatus();

  const isEditing = !!invoiceId;
  const isReadOnly = existingInvoice && existingInvoice.status !== 'draft';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issueDate: new Date(),
      currency: 'COP',
    },
  });

  // Load existing invoice data
  useEffect(() => {
    if (existingInvoice) {
      form.reset({
        customerId: existingInvoice.customerId || '',
        issueDate: existingInvoice.issueDate,
        dueDate: existingInvoice.dueDate,
        currency: existingInvoice.currency,
        paymentMethod: existingInvoice.paymentMethod || '',
        notes: existingInvoice.notes || '',
        termsConditions: existingInvoice.termsConditions || '',
      });

      if (existingInvoice.items) {
        setItems(existingInvoice.items.map(item => ({
          id: item.id,
          productId: item.productId,
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountRate: item.discountRate,
        })));
      }
    }
  }, [existingInvoice, form]);

  const totals = calculateInvoiceTotals(items);

  const handleSave = async (data: FormData, emit: boolean = false) => {
    const formData: StandardInvoiceFormData = {
      customerId: data.customerId,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      termsConditions: data.termsConditions,
      items,
    };

    if (isEditing && invoiceId) {
      await updateInvoice.mutateAsync({ invoiceId, formData });
      if (emit) {
        await updateStatus.mutateAsync({ invoiceId, status: 'issued' });
      }
    } else {
      const result = await createInvoice.mutateAsync({ branchId, formData });
      if (emit && result) {
        await updateStatus.mutateAsync({ invoiceId: result.id, status: 'issued' });
      }
    }
    onClose();
  };

  const onSubmit = (data: FormData) => handleSave(data, false);
  const onSubmitAndEmit = () => form.handleSubmit((data) => handleSave(data, true))();

  if (isLoadingInvoice && invoiceId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing 
              ? (isReadOnly ? 'Ver Factura' : 'Editar Factura')
              : 'Nueva Factura'
            }
          </h1>
          {existingInvoice && (
            <p className="text-muted-foreground">{existingInvoice.invoiceNumber}</p>
          )}
        </div>
        {!isReadOnly && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createInvoice.isPending || updateInvoice.isPending || items.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Borrador
            </Button>
            <Button
              onClick={onSubmitAndEmit}
              disabled={createInvoice.isPending || updateInvoice.isPending || items.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Guardar y Emitir
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Select */}
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} {customer.lastName || ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Currency */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                          <SelectItem value="USD">USD - Dólar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Issue Date */}
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Emisión</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isReadOnly}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Vencimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isReadOnly}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Method */}
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="card">Tarjeta</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                          <SelectItem value="credit">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </Form>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ítems de la Factura</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceItemsList
                items={items}
                onItemsChange={setItems}
                isReadOnly={isReadOnly}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notas y Condiciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales..."
                  {...form.register('notes')}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="terms">Términos y Condiciones</Label>
                <Textarea
                  id="terms"
                  placeholder="Términos y condiciones de pago..."
                  {...form.register('termsConditions')}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Totals Sidebar */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descuentos</span>
                <span className="text-red-600">-${totals.totalDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impuestos</span>
                <span>${totals.totalTax.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totals.total.toLocaleString()}</span>
              </div>

              <div className="pt-4 text-sm text-muted-foreground">
                <p>{items.length} ítem(s)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
