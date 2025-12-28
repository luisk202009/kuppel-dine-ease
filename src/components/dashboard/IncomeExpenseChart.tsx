import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpDown } from 'lucide-react';
import { YearFilter } from '@/hooks/useDashboardMetrics';

interface MonthlyData {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
}

interface IncomeExpenseChartProps {
  data: MonthlyData[];
  compareData?: MonthlyData[];
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

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  data,
  compareData,
  yearFilter,
  onYearFilterChange,
  isLoading,
}) => {
  const currentYear = new Date().getFullYear();

  // Merge data for comparison view
  const chartData = data.map((item, index) => ({
    ...item,
    incomeCompare: compareData?.[index]?.income || 0,
    expenseCompare: compareData?.[index]?.expense || 0,
  }));

  // Calculate totals
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
  const totalIncomeCompare = compareData?.reduce((sum, d) => sum + d.income, 0) || 0;
  const totalExpenseCompare = compareData?.reduce((sum, d) => sum + d.expense, 0) || 0;

  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            Ingresos vs Gastos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Cargando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some(d => d.income > 0 || d.expense > 0);

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowUpDown className="h-5 w-5 text-primary" />
          Ingresos vs Gastos
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
        <div className="h-[250px] mb-4">
          {!hasData ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No hay datos para el periodo seleccionado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Legend />
                <Bar 
                  dataKey="income" 
                  name={yearFilter === 'compare' ? `Ingresos ${currentYear}` : 'Ingresos'} 
                  fill="hsl(142, 76%, 36%)" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expense" 
                  name={yearFilter === 'compare' ? `Gastos ${currentYear}` : 'Gastos'} 
                  fill="hsl(0, 84%, 60%)" 
                  radius={[4, 4, 0, 0]}
                />
                {yearFilter === 'compare' && (
                  <>
                    <Bar 
                      dataKey="incomeCompare" 
                      name={`Ingresos ${currentYear - 1}`} 
                      fill="hsl(142, 76%, 36%)" 
                      fillOpacity={0.4}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="expenseCompare" 
                      name={`Gastos ${currentYear - 1}`} 
                      fill="hsl(0, 84%, 60%)" 
                      fillOpacity={0.4}
                      radius={[4, 4, 0, 0]}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
            <p className="text-xs text-muted-foreground mb-1">Total Ingresos</p>
            <p className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</p>
            {yearFilter === 'compare' && (
              <p className="text-xs text-muted-foreground mt-1">
                Año ant: {formatCurrency(totalIncomeCompare)}
              </p>
            )}
          </div>
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-xs text-muted-foreground mb-1">Total Gastos</p>
            <p className="text-lg font-bold text-destructive">{formatCurrency(totalExpense)}</p>
            {yearFilter === 'compare' && (
              <p className="text-xs text-muted-foreground mt-1">
                Año ant: {formatCurrency(totalExpenseCompare)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
