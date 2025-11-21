import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbsProps {
  currentView: string;
}

const viewLabels: Record<string, string> = {
  dashboard: 'Inicio',
  settings: 'Ajustes',
  customers: 'Clientes',
  orders: 'Órdenes',
  reports: 'Reportes',
  expenses: 'Gastos',
  cash: 'Cajas',
};

export function Breadcrumbs({ currentView }: BreadcrumbsProps) {
  const currentLabel = viewLabels[currentView] || 'Inicio';

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink className="flex items-center gap-1">
            <Home className="h-3 w-3" />
            Inicio
          </BreadcrumbLink>
        </BreadcrumbItem>
        {currentView !== 'dashboard' && (
          <>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
