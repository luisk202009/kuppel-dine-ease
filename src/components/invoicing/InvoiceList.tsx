import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Send, 
  CheckCircle,
  XCircle,
  FileText,
  Store,
  Printer
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useStandardInvoices, 
  useStandardInvoice,
  useUpdateInvoiceStatus, 
  useDeleteStandardInvoice 
} from '@/hooks/useStandardInvoices';
import { InvoiceStatus, InvoiceSource, StandardInvoice } from '@/types/invoicing';
import { PrintPreviewModal } from './print';

interface InvoiceListProps {
  statusFilter?: InvoiceStatus;
  sourceFilter?: InvoiceSource;
  onEdit: (invoiceId: string) => void;
  isLoading?: boolean;
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  issued: { label: 'Emitida', variant: 'default' },
  paid: { label: 'Pagada', variant: 'outline' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  overdue: { label: 'Vencida', variant: 'destructive' },
};

export const InvoiceList = ({ statusFilter, sourceFilter, onEdit, isLoading }: InvoiceListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StandardInvoice | null>(null);
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);

  const { data: invoices = [] } = useStandardInvoices({
    status: statusFilter,
    source: sourceFilter,
  });
  const { data: printInvoice } = useStandardInvoice(printInvoiceId || undefined);
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteStandardInvoice();

  const handleStatusChange = (invoiceId: string, newStatus: InvoiceStatus) => {
    updateStatus.mutate({ invoiceId, status: newStatus });
  };

  const handleDelete = (invoice: StandardInvoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedInvoice) {
      deleteInvoice.mutate(selectedInvoice.id);
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    }
  };

  const handlePrint = (invoiceId: string) => {
    setPrintInvoiceId(invoiceId);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No hay facturas
        </h3>
        <p className="text-muted-foreground">
          {statusFilter 
            ? `No tienes facturas con estado "${statusConfig[statusFilter].label}"`
            : 'Crea tu primera factura para comenzar'
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>
                  {invoice.source === 'pos' ? (
                    <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200 bg-blue-50">
                      <Store className="h-3 w-3" />
                      POS
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-purple-600 border-purple-200 bg-purple-50">
                      <FileText className="h-3 w-3" />
                      Factura
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {invoice.customer 
                    ? `${invoice.customer.name} ${invoice.customer.lastName || ''}`.trim()
                    : <span className="text-muted-foreground">Mostrador</span>
                  }
                </TableCell>
                <TableCell>
                  {format(invoice.issueDate, 'dd MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[invoice.status].variant}>
                    {statusConfig[invoice.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${invoice.total.toLocaleString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePrint(invoice.id)}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(invoice.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalle
                      </DropdownMenuItem>
                      
                      {invoice.status === 'draft' && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(invoice.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(invoice.id, 'issued')}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Emitir
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {invoice.status === 'issued' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(invoice.id, 'paid')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como pagada
                        </DropdownMenuItem>
                      )}
                      
                      {(invoice.status === 'draft' || invoice.status === 'issued') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(invoice.id, 'cancelled')}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {invoice.status === 'draft' && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(invoice)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la factura
              {selectedInvoice && ` ${selectedInvoice.invoiceNumber}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        invoice={printInvoice || null}
        isOpen={!!printInvoiceId && !!printInvoice}
        onClose={() => setPrintInvoiceId(null)}
      />
    </>
  );
};
