import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { YearFilter } from '@/hooks/useDashboardMetrics';

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
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Flujo de Caja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Cargando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some(d => d.income > 0 || d.expense > 0);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          Flujo de Caja
        </CardTitle>
        <Select value={yearFilter} onValueChange={(v) => onYearFilterChange(v as YearFilter)}>
          <SelectTrigger className="w-[160px]">
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
          <div className="flex-1 h-[280px]">
            {!hasData ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No hay datos para el periodo seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(180, 100%, 40%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(180, 100%, 40%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBalanceCompare" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(263, 100%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(263, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="monthLabel" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name={yearFilter === 'compare' ? `Saldo ${currentYear}` : 'Saldo Acumulado'}
                    stroke="hsl(180, 100%, 40%)"
                    strokeWidth={2}
                    fill="url(#colorBalance)"
                  />
                  {yearFilter === 'compare' && (
                    <Area
                      type="monotone"
                      dataKey="balanceCompare"
                      name={`Saldo ${currentYear - 1}`}
                      stroke="hsl(263, 100%, 50%)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="url(#colorBalanceCompare)"
                    />
                  )}
                  {yearFilter === 'compare' && <Legend />}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Summary */}
          <div className="lg:w-64 space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Saldo Inicial</p>
              <p className="text-lg font-semibold">{formatCurrency(summary.openingBalance)}</p>
            </div>
            
            <div className="p-3 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <p className="text-xs text-muted-foreground">Ingresos Totales</p>
              </div>
              <p className="text-lg font-semibold text-success">{formatCurrency(summary.totalIncome)}</p>
              {summaryCompare && (
                <p className="text-xs text-muted-foreground mt-1">
                  Año ant: {formatCurrency(summaryCompare.totalIncome)}
                </p>
              )}
            </div>

            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <p className="text-xs text-muted-foreground">Gastos Totales</p>
              </div>
              <p className="text-lg font-semibold text-destructive">{formatCurrency(summary.totalExpense)}</p>
              {summaryCompare && (
                <p className="text-xs text-muted-foreground mt-1">
                  Año ant: {formatCurrency(summaryCompare.totalExpense)}
                </p>
              )}
            </div>

            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Saldo Final</p>
              <p className={`text-lg font-bold ${summary.closingBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(summary.closingBalance)}
              </p>
              {summaryCompare && (
                <p className="text-xs text-muted-foreground mt-1">
                  Año ant: {formatCurrency(summaryCompare.closingBalance)}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
