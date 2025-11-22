import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface PlanLimitWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  dimension: 'users' | 'branches' | 'documents';
  status: 'near_limit' | 'over_limit';
  used: number;
  limit: number | null;
  usagePct: number | null;
}

const getDimensionLabels = (dimension: 'users' | 'branches' | 'documents') => {
  const labels = {
    users: {
      singular: 'usuario',
      plural: 'usuarios',
      article: 'el',
    },
    branches: {
      singular: 'sucursal',
      plural: 'sucursales',
      article: 'el',
    },
    documents: {
      singular: 'documento',
      plural: 'documentos',
      article: 'el',
    },
  };
  return labels[dimension];
};

export const PlanLimitWarningModal: React.FC<PlanLimitWarningModalProps> = ({
  open,
  onOpenChange,
  onContinue,
  dimension,
  status,
  used,
  limit,
  usagePct,
}) => {
  const labels = getDimensionLabels(dimension);
  const isOverLimit = status === 'over_limit';

  const handleContinue = () => {
    onContinue();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`h-6 w-6 ${isOverLimit ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertDialogTitle>
              {isOverLimit 
                ? `Has superado ${labels.article} límite de ${labels.plural}` 
                : `Estás cerca del límite de ${labels.plural}`}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tu plan actual permite un máximo de <strong>{limit}</strong> {labels.plural}.
              Actualmente tienes <strong>{used}</strong> {used === 1 ? labels.singular : labels.plural}
              {usagePct && ` (${usagePct.toFixed(0)}% del límite)`}.
            </p>
            
            {isOverLimit ? (
              <p className="text-red-600 font-medium">
                Has superado el límite permitido por tu plan. Te recomendamos actualizar a un plan superior 
                para seguir utilizando esta función sin restricciones.
              </p>
            ) : (
              <p className="text-yellow-600 font-medium">
                Con esta acción podrías alcanzar o superar el máximo permitido por tu plan. 
                Considera actualizar a un plan superior para evitar interrupciones.
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              Puedes continuar por ahora, pero te sugerimos contactar a soporte o revisar 
              los planes disponibles para ampliar tus límites.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleContinue}
            className={isOverLimit ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
          >
            Continuar de todos modos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
