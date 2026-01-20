import React, { useState } from 'react';
import { useDashboardMetrics, YearFilter, PeriodFilter } from '@/hooks/useDashboardMetrics';
import { CashFlowChart } from './CashFlowChart';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { TopExpensesChart } from './TopExpensesChart';
import { KPICard, formatCurrency } from './KPICard';
import { usePOS } from '@/contexts/POSContext';
import { AlertCircle } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-zinc-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          No hay sucursal seleccionada
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Por favor selecciona una sucursal para ver el dashboard
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Error al cargar datos
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
      {/* Header - Minimal */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Resumen financiero de {authState.selectedBranch?.name || 'tu negocio'}
        </p>
      </div>

      {/* KPI Cards - Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Saldo Inicial"
          value={formatCurrency(metrics.summary.openingBalance)}
        />
        <KPICard
          title="Ingresos"
          value={formatCurrency(metrics.summary.totalIncome)}
          trend="up"
          color="emerald"
        />
        <KPICard
          title="Gastos"
          value={formatCurrency(metrics.summary.totalExpense)}
          trend="down"
          color="red"
        />
        <KPICard
          title="Saldo Final"
          value={formatCurrency(metrics.summary.closingBalance)}
          highlight={true}
        />
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
