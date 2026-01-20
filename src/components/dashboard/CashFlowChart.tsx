import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { YearFilter } from '@/hooks/useDashboardMetrics';
import { cn } from '@/lib/utils';

interface MonthlyData {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
}

interface CashFlowSummary {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
}

interface CashFlowChartProps {
  data: MonthlyData[];
  compareData?: MonthlyData[];
  summary: CashFlowSummary;
  summaryCompare?: CashFlowSummary;
  yearFilter: YearFilter;
  onYearFilterChange: (filter: YearFilter) => void;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  data,
  compareData,
  summary,
  summaryCompare,
  yearFilter,
  onYearFilterChange,
  isLoading,
}) => {
  const currentYear = new Date().getFullYear();

  // Merge data for comparison view
  const chartData = data.map((item, index) => ({
    ...item,
    balanceCompare: compareData?.[index]?.balance || 0,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Wallet className="h-4 w-4 text-[#4AB7C6]" />
            Flujo de Caja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="text-sm text-zinc-400">Cargando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some(d => d.income > 0 || d.expense > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          <Wallet className="h-4 w-4 text-[#4AB7C6]" />
          Flujo de Caja
        </CardTitle>
        <Select value={yearFilter} onValueChange={(v) => onYearFilterChange(v as YearFilter)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisYear">Este Año ({currentYear})</SelectItem>
            <SelectItem value="lastYear">Año Anterior ({currentYear - 1})</SelectItem>
            <SelectItem value="compare">Comparativo</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chart */}
          <div className="flex-1 h-[260px]">
            {!hasData ? (
              <div className="h-full flex items-center justify-center text-sm text-zinc-400">
                No hay datos para el periodo seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4AB7C6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4AB7C6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBalanceCompare" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C0D860" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C0D860" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e4e4e7"
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="monthLabel" 
                    className="text-xs"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value), 
                      name.includes('Compare') ? `${currentYear - 1}` : `${currentYear}`
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name={yearFilter === 'compare' ? `Saldo ${currentYear}` : 'Saldo Acumulado'}
                    stroke="#4AB7C6"
                    strokeWidth={1.5}
                    fill="url(#colorBalance)"
                  />
                  {yearFilter === 'compare' && (
                    <Area
                      type="monotone"
                      dataKey="balanceCompare"
                      name={`Saldo ${currentYear - 1}`}
                      stroke="#C0D860"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fill="url(#colorBalanceCompare)"
                    />
                  )}
                  {yearFilter === 'compare' && <Legend />}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Summary Cards */}
          <div className="lg:w-56 space-y-3">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Saldo Inicial</p>
              <p className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                {formatCurrency(summary.openingBalance)}
              </p>
            </div>
            
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Ingresos</p>
              </div>
              <p className="text-base font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.totalIncome)}
              </p>
              {summaryCompare && (
                <p className="text-xs text-zinc-400 mt-1">
                  Ant: {formatCurrency(summaryCompare.totalIncome)}
                </p>
              )}
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Gastos</p>
              </div>
              <p className="text-base font-semibold font-mono text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalExpense)}
              </p>
              {summaryCompare && (
                <p className="text-xs text-zinc-400 mt-1">
                  Ant: {formatCurrency(summaryCompare.totalExpense)}
                </p>
              )}
            </div>

            <div className={cn(
              "p-3 rounded-lg",
              "bg-gradient-to-br from-[#C0D860]/10 to-[#4AB7C6]/10"
            )}>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Saldo Final</p>
              <p className={cn(
                "text-base font-bold font-mono",
                summary.closingBalance >= 0 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(summary.closingBalance)}
              </p>
              {summaryCompare && (
                <p className="text-xs text-zinc-400 mt-1">
                  Ant: {formatCurrency(summaryCompare.closingBalance)}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
