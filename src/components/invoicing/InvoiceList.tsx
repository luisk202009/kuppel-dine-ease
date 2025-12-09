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
  FileText 
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
  useUpdateInvoiceStatus, 
  useDeleteStandardInvoice 
} from '@/hooks/useStandardInvoices';
import { InvoiceStatus, StandardInvoice } from '@/types/invoicing';

interface InvoiceListProps {
  statusFilter?: InvoiceStatus;
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

export const InvoiceList = ({ statusFilter, onEdit, isLoading }: InvoiceListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StandardInvoice | null>(null);

  const { data: invoices = [] } = useStandardInvoices(
    statusFilter ? { status: statusFilter } : undefined
  );
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
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Vencimiento</TableHead>
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
                  {invoice.customer 
                    ? `${invoice.customer.name} ${invoice.customer.lastName || ''}`.trim()
                    : <span className="text-muted-foreground">Sin cliente</span>
                  }
                </TableCell>
                <TableCell>
                  {format(invoice.issueDate, 'dd MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell>
                  {invoice.dueDate 
                    ? format(invoice.dueDate, 'dd MMM yyyy', { locale: es })
                    : '-'
                  }
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
    </>
  );
};
