import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, Eye, Save, Send } from 'lucide-react';
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
import { InvoicePreviewModal } from './InvoicePreviewModal';
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

const CURRENCY_OPTIONS = [
  { value: 'COP', label: 'COP' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

export const InvoiceForm = ({ branchId, invoiceId, onClose }: InvoiceFormProps) => {
  const [items, setItems] = useState<StandardInvoiceItemFormData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { posState, authState } = usePOSContext();
  const customers = posState.customers;
  const currentBranch = authState.selectedBranch;
  const currentCompany = authState.selectedCompany;
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

  const watchCurrency = form.watch('currency');

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

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '$';
    }
  };

  const formatPrice = (value: number) => {
    return `${getCurrencySymbol(watchCurrency)}${value.toLocaleString('es-CO')}`;
  };

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
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowPreview(true)}
            disabled={items.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Previsualizar
          </Button>
          {!isReadOnly && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Full Width Layout */}
      <div className="space-y-6">
        <Form {...form}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Row 1: Cliente + Moneda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
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
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            <SelectValue placeholder="Seleccionar" />
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
              </div>

              {/* Row 2: Fechas compactas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Emisión</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal h-10",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isReadOnly}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>dd/mm/yyyy</span>
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

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Vencimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal h-10",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isReadOnly}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>dd/mm/yyyy</span>
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
              </div>
            </CardContent>
          </Card>
        </Form>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Ítems de la Factura</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceItemsList
              items={items}
              onItemsChange={setItems}
              isReadOnly={isReadOnly}
              currency={watchCurrency}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Notas y Condiciones</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales..."
                {...form.register('notes')}
                disabled={isReadOnly}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="terms">Términos y Condiciones</Label>
              <Textarea
                id="terms"
                placeholder="Términos y condiciones de pago..."
                {...form.register('termsConditions')}
                disabled={isReadOnly}
                className="mt-1.5"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary at the bottom */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Resumen de la Factura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 text-sm">
                <div className="flex flex-col items-center sm:items-end">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-base">{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex flex-col items-center sm:items-end">
                  <span className="text-muted-foreground">Descuentos</span>
                  <span className="font-medium text-base text-red-600">-{formatPrice(totals.totalDiscount)}</span>
                </div>
                <div className="flex flex-col items-center sm:items-end">
                  <span className="text-muted-foreground">Impuestos</span>
                  <span className="font-medium text-base">{formatPrice(totals.totalTax)}</span>
                </div>
                <div className="flex flex-col items-center sm:items-end border-l-2 border-primary pl-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-xl">{formatPrice(totals.total)}</span>
                </div>
              </div>
            </div>
            <div className="text-right mt-4 text-sm text-muted-foreground">
              {items.length} ítem(s)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      <InvoicePreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        data={{
          invoiceNumber: existingInvoice?.invoiceNumber,
          issueDate: form.getValues('issueDate'),
          dueDate: form.getValues('dueDate'),
          currency: form.getValues('currency'),
          paymentMethod: form.getValues('paymentMethod'),
          notes: form.getValues('notes'),
          termsConditions: form.getValues('termsConditions'),
          customer: customers.find(c => c.id === form.getValues('customerId')) || null,
          items,
          branch: currentBranch ? {
            name: currentBranch.name,
            address: currentBranch.address || undefined,
            phone: undefined,
            company: {
              name: currentCompany?.name || '',
              taxId: undefined,
              address: currentCompany?.address || undefined,
              phone: currentCompany?.phone || undefined,
              email: currentCompany?.email || undefined,
            }
          } : undefined,
          status: existingInvoice?.status || 'draft',
        }}
      />
    </div>
  );
};
