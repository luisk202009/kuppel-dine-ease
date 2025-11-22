import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { CompanyLimitsStatus } from '@/hooks/useCompanyLimits';

interface PlanLimitsAlertProps {
  limitsStatus: CompanyLimitsStatus | null;
}

export const PlanLimitsAlert: React.FC<PlanLimitsAlertProps> = ({ limitsStatus }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!limitsStatus || limitsStatus.overall_status === 'ok' || limitsStatus.overall_status === 'no_plan') {
    return null;
  }

  if (dismissed && limitsStatus.overall_status === 'near_limit') {
    return null;
  }

  const isOverLimit = limitsStatus.overall_status === 'over_limit';
  const overLimitItems: string[] = [];
  const nearLimitItems: string[] = [];

  // Recopilar items que están en over_limit o near_limit
  if (limitsStatus.users.status === 'over_limit') {
    overLimitItems.push(`Usuarios: ${limitsStatus.users.used} / ${limitsStatus.users.limit}`);
  } else if (limitsStatus.users.status === 'near_limit') {
    nearLimitItems.push(`Usuarios: ${limitsStatus.users.used} / ${limitsStatus.users.limit} (${limitsStatus.users.usage_pct}%)`);
  }

  if (limitsStatus.branches.status === 'over_limit') {
    overLimitItems.push(`Sucursales: ${limitsStatus.branches.used} / ${limitsStatus.branches.limit}`);
  } else if (limitsStatus.branches.status === 'near_limit') {
    nearLimitItems.push(`Sucursales: ${limitsStatus.branches.used} / ${limitsStatus.branches.limit} (${limitsStatus.branches.usage_pct}%)`);
  }

  if (limitsStatus.documents.status === 'over_limit') {
    overLimitItems.push(`Documentos este mes: ${limitsStatus.documents.used} / ${limitsStatus.documents.limit}`);
  } else if (limitsStatus.documents.status === 'near_limit') {
    nearLimitItems.push(`Documentos este mes: ${limitsStatus.documents.used} / ${limitsStatus.documents.limit} (${limitsStatus.documents.usage_pct}%)`);
  }

  return (
    <Alert 
      variant={isOverLimit ? 'destructive' : 'default'}
      className={isOverLimit ? '' : 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950 mb-4'}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-start justify-between">
        <div className="flex-1">
          <strong className="block mb-2">
            {isOverLimit ? '¡Has superado los límites de tu plan!' : 'Estás cerca de los límites de tu plan'}
          </strong>
          {isOverLimit && overLimitItems.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mb-2">
              {overLimitItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
          {!isOverLimit && nearLimitItems.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mb-2">
              {nearLimitItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
          <p className="text-sm mt-2">
            {isOverLimit 
              ? 'Te recomendamos actualizar tu plan para seguir utilizando estas funciones sin restricciones.'
              : 'Considera actualizar tu plan para evitar interrupciones en el servicio.'}
          </p>
        </div>
        {!isOverLimit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
