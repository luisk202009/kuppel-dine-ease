import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReportKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
  isCurrency?: boolean;
}

export const ReportKPICard: React.FC<ReportKPICardProps> = ({
  title,
  value,
  subtitle,
  className,
  isCurrency = false,
}) => {
  const formattedValue = typeof value === 'number' 
    ? isCurrency 
      ? `$${value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
      : value.toLocaleString('es-MX')
    : value;

  return (
    <Card className={cn("border-zinc-200 shadow-sm", className)}>
      <CardContent className="p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
          {title}
        </p>
        <p className={cn(
          "text-3xl font-light text-zinc-900 dark:text-zinc-100",
          (isCurrency || typeof value === 'number') && "font-mono"
        )}>
          {formattedValue}
        </p>
        {subtitle && (
          <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};
