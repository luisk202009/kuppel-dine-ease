import { useState } from 'react';
import { Plus, FileText, DollarSign, Clock, AlertCircle, BarChart3, Store, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStandardInvoices } from '@/hooks/useStandardInvoices';
import { InvoiceList } from './InvoiceList';
import { InvoiceForm } from './InvoiceForm';
import { InvoicingReports } from './InvoicingReports';
import { InvoiceStatus, InvoiceSource } from '@/types/invoicing';

interface InvoicingDashboardProps {
  branchId: string;
}

type ViewMode = 'list' | 'reports';
type SourceFilter = 'all' | 'pos' | 'manual';

export const InvoicingDashboard = ({ branchId }: InvoicingDashboardProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const { data: allInvoices = [], isLoading } = useStandardInvoices();

  // Calculate stats
  const stats = {
    total: allInvoices.length,
    pos: allInvoices.filter(inv => inv.source === 'pos').length,
    manual: allInvoices.filter(inv => inv.source === 'manual' || !inv.source).length,
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
    if (statusTab === 'all') return undefined;
    return statusTab as InvoiceStatus;
  };

  const getFilterSource = (): InvoiceSource | undefined => {
    if (sourceFilter === 'all') return undefined;
    return sourceFilter as InvoiceSource;
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
          <h1 className="text-2xl font-bold text-foreground">Facturación</h1>
          <p className="text-muted-foreground">Gestiona todas tus facturas y tickets</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'reports' ? 'default' : 'outline'} 
            onClick={() => setViewMode(viewMode === 'list' ? 'reports' : 'list')}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {viewMode === 'list' ? 'Reportes' : 'Lista'}
          </Button>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Factura
          </Button>
        </div>
      </div>

      {viewMode === 'reports' ? (
        <InvoicingReports />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${sourceFilter === 'all' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
              onClick={() => setSourceFilter('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  documentos
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${sourceFilter === 'pos' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
              onClick={() => setSourceFilter('pos')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tickets POS
                </CardTitle>
                <Store className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.pos}</div>
                <p className="text-xs text-muted-foreground">
                  ventas directas
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${sourceFilter === 'manual' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
              onClick={() => setSourceFilter('manual')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Facturas
                </CardTitle>
                <FileCheck className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.manual}</div>
                <p className="text-xs text-muted-foreground">
                  estándar
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
                  {stats.issued} por cobrar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice List with Tabs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <Tabs value={statusTab} onValueChange={setStatusTab}>
                  <TabsList>
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="draft">
                      Borradores
                      {stats.draft > 0 && (
                        <span className="ml-1.5 bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-full text-xs">
                          {stats.draft}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="issued">Emitidas</TabsTrigger>
                    <TabsTrigger value="paid">Pagadas</TabsTrigger>
                    <TabsTrigger value="overdue">
                      Vencidas
                      {stats.overdue > 0 && (
                        <span className="ml-1.5 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs">
                          {stats.overdue}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Source filter indicator */}
                {sourceFilter !== 'all' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Filtro:</span>
                    <span className={`font-medium ${sourceFilter === 'pos' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {sourceFilter === 'pos' ? '🏪 Tickets POS' : '📄 Facturas Estándar'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSourceFilter('all')}
                      className="h-6 px-2"
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <InvoiceList
                statusFilter={getFilterStatus()}
                sourceFilter={getFilterSource()}
                onEdit={handleEdit}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
