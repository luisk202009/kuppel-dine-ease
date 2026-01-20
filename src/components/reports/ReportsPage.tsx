import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { Download, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SalesReportTab } from './tabs/SalesReportTab';
import { ExpensesReportTab } from './tabs/ExpensesReportTab';
import { ProductPerformanceTab } from './tabs/ProductPerformanceTab';
import { TransactionLogsTab } from './tabs/TransactionLogsTab';
import { useQueryClient } from '@tanstack/react-query';

export const ReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sales');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Default to this month
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['reports'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExportCSV = () => {
    // This is a placeholder - in production you'd export the current tab's data
    const data = [
      { fecha: new Date().toISOString(), tipo: 'Ejemplo', monto: 0 }
    ];
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Reportes
        </h1>
        <div className="flex items-center gap-3">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-100/50 dark:bg-zinc-800/50 p-1 h-auto">
          <TabsTrigger 
            value="sales" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm px-4 py-2"
          >
            Ventas
          </TabsTrigger>
          <TabsTrigger 
            value="expenses"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm px-4 py-2"
          >
            Gastos
          </TabsTrigger>
          <TabsTrigger 
            value="products"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm px-4 py-2"
          >
            Productos
          </TabsTrigger>
          <TabsTrigger 
            value="transactions"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm px-4 py-2"
          >
            Transacciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <SalesReportTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpensesReportTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductPerformanceTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionLogsTab dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
