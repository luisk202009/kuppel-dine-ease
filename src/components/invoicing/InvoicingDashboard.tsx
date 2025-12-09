import { useState } from 'react';
import { Plus, FileText, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStandardInvoices } from '@/hooks/useStandardInvoices';
import { InvoiceList } from './InvoiceList';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceStatus } from '@/types/invoicing';

interface InvoicingDashboardProps {
  branchId: string;
}

export const InvoicingDashboard = ({ branchId }: InvoicingDashboardProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const { data: allInvoices = [], isLoading } = useStandardInvoices();

  // Calculate stats
  const stats = {
    total: allInvoices.length,
    draft: allInvoices.filter(inv => inv.status === 'draft').length,
    issued: allInvoices.filter(inv => inv.status === 'issued').length,
    paid: allInvoices.filter(inv => inv.status === 'paid').length,
    overdue: allInvoices.filter(inv => inv.status === 'overdue').length,
    totalAmount: allInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0),
    pendingAmount: allInvoices
      .filter(inv => inv.status === 'issued')
      .reduce((sum, inv) => sum + inv.total, 0),
  };

  const handleCreateNew = () => {
    setEditingInvoiceId(null);
    setShowForm(true);
  };

  const handleEdit = (invoiceId: string) => {
    setEditingInvoiceId(invoiceId);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingInvoiceId(null);
  };

  const getFilterStatus = (): InvoiceStatus | undefined => {
    if (activeTab === 'all') return undefined;
    return activeTab as InvoiceStatus;
  };

  if (showForm) {
    return (
      <InvoiceForm
        branchId={branchId}
        invoiceId={editingInvoiceId}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturación Estándar</h1>
          <p className="text-muted-foreground">Gestiona tus facturas y documentos</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Factura
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Facturas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.draft} borradores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagadas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.paid} facturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${stats.pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.issued} facturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencidas
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List with Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="draft">Borradores</TabsTrigger>
              <TabsTrigger value="issued">Emitidas</TabsTrigger>
              <TabsTrigger value="paid">Pagadas</TabsTrigger>
              <TabsTrigger value="overdue">Vencidas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <InvoiceList
            statusFilter={getFilterStatus()}
            onEdit={handleEdit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};
