import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';

export type PeriodFilter = 'thisYear' | 'lastYear' | 'thisMonth' | 'thisQuarter';
export type YearFilter = 'thisYear' | 'lastYear' | 'compare';

interface MonthlyData {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CashFlowSummary {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
}

interface DashboardMetrics {
  cashFlow: MonthlyData[];
  cashFlowCompare?: MonthlyData[];
  incomeExpense: MonthlyData[];
  incomeExpenseCompare?: MonthlyData[];
  topExpenses: CategoryData[];
  summary: CashFlowSummary;
  summaryCompare?: CashFlowSummary;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CATEGORY_COLORS = [
  'hsl(180, 100%, 40%)', // Primary teal
  'hsl(263, 100%, 50%)', // Secondary purple
  'hsl(142, 76%, 36%)',  // Success green
  'hsl(38, 92%, 50%)',   // Warning orange
  'hsl(0, 84%, 60%)',    // Destructive red
  'hsl(200, 80%, 50%)',  // Blue
  'hsl(280, 70%, 50%)',  // Purple variant
  'hsl(320, 70%, 50%)',  // Pink
];

const getDateRangeForPeriod = (period: PeriodFilter): { start: Date; end: Date } => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  switch (period) {
    case 'thisYear':
      return {
        start: new Date(currentYear, 0, 1),
        end: new Date(currentYear, 11, 31, 23, 59, 59),
      };
    case 'lastYear':
      return {
        start: new Date(currentYear - 1, 0, 1),
        end: new Date(currentYear - 1, 11, 31, 23, 59, 59),
      };
    case 'thisMonth':
      return {
        start: new Date(currentYear, now.getMonth(), 1),
        end: new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59),
      };
    case 'thisQuarter':
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(currentYear, quarter * 3, 1),
        end: new Date(currentYear, (quarter + 1) * 3, 0, 23, 59, 59),
      };
    default:
      return {
        start: new Date(currentYear, 0, 1),
        end: new Date(currentYear, 11, 31, 23, 59, 59),
      };
  }
};

const getYearRange = (yearFilter: YearFilter): { year: number; compareYear?: number } => {
  const currentYear = new Date().getFullYear();
  
  switch (yearFilter) {
    case 'thisYear':
      return { year: currentYear };
    case 'lastYear':
      return { year: currentYear - 1 };
    case 'compare':
      return { year: currentYear, compareYear: currentYear - 1 };
    default:
      return { year: currentYear };
  }
};

const fetchMonthlyData = async (
  branchId: string,
  year: number
): Promise<MonthlyData[]> => {
  const startDate = new Date(year, 0, 1).toISOString();
  const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

  // Fetch orders (income) - paid/delivered orders
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('created_at, total')
    .eq('branch_id', branchId)
    .in('status', ['paid', 'delivered'])
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (ordersError) throw ordersError;

  // Fetch expenses
  const { data: expensesData, error: expensesError } = await supabase
    .from('expenses')
    .select('created_at, amount')
    .eq('branch_id', branchId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (expensesError) throw expensesError;

  // Aggregate by month
  const monthlyData: MonthlyData[] = MONTHS.map((label, index) => ({
    month: `${year}-${String(index + 1).padStart(2, '0')}`,
    monthLabel: label,
    income: 0,
    expense: 0,
    balance: 0,
  }));

  // Sum orders by month
  ordersData?.forEach((order) => {
    const date = new Date(order.created_at);
    const monthIndex = date.getMonth();
    monthlyData[monthIndex].income += Number(order.total) || 0;
  });

  // Sum expenses by month
  expensesData?.forEach((expense) => {
    const date = new Date(expense.created_at);
    const monthIndex = date.getMonth();
    monthlyData[monthIndex].expense += Number(expense.amount) || 0;
  });

  // Calculate cumulative balance
  let runningBalance = 0;
  monthlyData.forEach((month) => {
    runningBalance += month.income - month.expense;
    month.balance = runningBalance;
  });

  return monthlyData;
};

const fetchExpensesByCategory = async (
  branchId: string,
  period: PeriodFilter
): Promise<CategoryData[]> => {
  const { start, end } = getDateRangeForPeriod(period);

  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount')
    .eq('branch_id', branchId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error) throw error;

  // Group by category
  const categoryMap: Record<string, number> = {};
  data?.forEach((expense) => {
    const category = expense.category || 'Sin categoría';
    categoryMap[category] = (categoryMap[category] || 0) + Number(expense.amount);
  });

  // Convert to array and sort
  const categories = Object.entries(categoryMap)
    .map(([category, amount], index) => ({
      category,
      amount,
      percentage: 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate percentages
  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
  categories.forEach((cat) => {
    cat.percentage = total > 0 ? (cat.amount / total) * 100 : 0;
  });

  // Group small categories into "Otros" if more than 7 categories
  if (categories.length > 7) {
    const topCategories = categories.slice(0, 6);
    const otherAmount = categories.slice(6).reduce((sum, cat) => sum + cat.amount, 0);
    const otherPercentage = total > 0 ? (otherAmount / total) * 100 : 0;
    
    return [
      ...topCategories,
      {
        category: 'Otros',
        amount: otherAmount,
        percentage: otherPercentage,
        color: CATEGORY_COLORS[7],
      },
    ];
  }

  return categories;
};

const calculateSummary = (data: MonthlyData[]): CashFlowSummary => {
  const totalIncome = data.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = data.reduce((sum, m) => sum + m.expense, 0);
  
  return {
    openingBalance: 0,
    totalIncome,
    totalExpense,
    closingBalance: totalIncome - totalExpense,
  };
};

export const useDashboardMetrics = (
  yearFilter: YearFilter = 'thisYear',
  expensePeriod: PeriodFilter = 'thisYear'
) => {
  const { authState } = usePOS();
  const branchId = authState.selectedBranch?.id || '';
  const { year, compareYear } = getYearRange(yearFilter);

  return useQuery({
    queryKey: ['dashboard-metrics', branchId, yearFilter, expensePeriod],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!branchId) {
        throw new Error('No branch selected');
      }

      // Fetch data for main year
      const monthlyData = await fetchMonthlyData(branchId, year);
      const topExpenses = await fetchExpensesByCategory(branchId, expensePeriod);
      const summary = calculateSummary(monthlyData);

      const result: DashboardMetrics = {
        cashFlow: monthlyData,
        incomeExpense: monthlyData,
        topExpenses,
        summary,
      };

      // Fetch comparison year if needed
      if (compareYear) {
        const compareData = await fetchMonthlyData(branchId, compareYear);
        result.cashFlowCompare = compareData;
        result.incomeExpenseCompare = compareData;
        result.summaryCompare = calculateSummary(compareData);
      }

      return result;
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
