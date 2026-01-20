import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down';
  trendLabel?: string;
  color?: 'default' | 'emerald' | 'red';
  highlight?: boolean;
  className?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend,
  trendLabel,
  color = 'default',
  highlight = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all duration-200",
        highlight && "bg-gradient-to-br from-[#C0D860]/5 to-[#4AB7C6]/5 border-[#4AB7C6]/20",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
        {title}
      </p>
      <p
        className={cn(
          "text-3xl font-light font-mono tracking-tight",
          color === 'emerald' && "text-emerald-600 dark:text-emerald-400",
          color === 'red' && "text-red-600 dark:text-red-400",
          color === 'default' && "text-zinc-900 dark:text-zinc-100"
        )}
      >
        {value}
      </p>
      {trend && (
        <div
          className={cn(
            "mt-3 flex items-center gap-1.5 text-xs",
            trend === 'up' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}
        >
          {trend === 'up' ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>{trendLabel || 'vs. periodo anterior'}</span>
        </div>
      )}
    </div>
  );
};

export { formatCurrency };
