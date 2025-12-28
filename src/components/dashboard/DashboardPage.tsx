import React, { useState } from 'react';
import { useDashboardMetrics, YearFilter, PeriodFilter } from '@/hooks/useDashboardMetrics';
import { CashFlowChart } from './CashFlowChart';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { TopExpensesChart } from './TopExpensesChart';
import { usePOS } from '@/contexts/POSContext';
import { AlertCircle, LayoutDashboard } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { authState } = usePOS();
  const [cashFlowYear, setCashFlowYear] = useState<YearFilter>('thisYear');
  const [incomeExpenseYear, setIncomeExpenseYear] = useState<YearFilter>('thisYear');
  const [expensePeriod, setExpensePeriod] = useState<PeriodFilter>('thisYear');

  // Use the most inclusive year filter for data fetching
  const yearFilter = cashFlowYear === 'compare' || incomeExpenseYear === 'compare' ? 'compare' : cashFlowYear;
  
  const { data, isLoading, error } = useDashboardMetrics(yearFilter, expensePeriod);

  // Check if branch is selected
  if (!authState.selectedBranch?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No hay sucursal seleccionada</h2>
        <p className="text-muted-foreground">
          Por favor selecciona una sucursal para ver el dashboard
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al cargar datos</h2>
        <p className="text-muted-foreground">
          {error.message || 'Ocurrió un error al obtener los datos del dashboard'}
        </p>
      </div>
    );
  }

  const emptyData = {
    cashFlow: [],
    cashFlowCompare: undefined,
    incomeExpense: [],
    incomeExpenseCompare: undefined,
    topExpenses: [],
    summary: { openingBalance: 0, totalIncome: 0, totalExpense: 0, closingBalance: 0 },
    summaryCompare: undefined,
  };

  const metrics = data || emptyData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="h-7 w-7 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        </div>
        <p className="text-muted-foreground">
          Resumen financiero de {authState.selectedBranch?.name || 'tu negocio'}
        </p>
      </div>

      {/* Cash Flow - Full Width */}
      <CashFlowChart
        data={metrics.cashFlow}
        compareData={metrics.cashFlowCompare}
        summary={metrics.summary}
        summaryCompare={metrics.summaryCompare}
        yearFilter={cashFlowYear}
        onYearFilterChange={setCashFlowYear}
        isLoading={isLoading}
      />

      {/* Income vs Expense & Top Expenses - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeExpenseChart
          data={metrics.incomeExpense}
          compareData={metrics.incomeExpenseCompare}
          yearFilter={incomeExpenseYear}
          onYearFilterChange={setIncomeExpenseYear}
          isLoading={isLoading}
        />

        <TopExpensesChart
          data={metrics.topExpenses}
          period={expensePeriod}
          onPeriodChange={setExpensePeriod}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
