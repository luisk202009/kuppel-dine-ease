import React from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SecurityAlertProps {
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const SecurityAlert: React.FC<SecurityAlertProps> = ({
  type,
  title,
  message,
  onAction,
  actionLabel
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    return type === 'warning' ? 'destructive' : 'default';
  };

  return (
    <Alert variant={getVariant()} className="mb-4">
      {getIcon()}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {onAction && actionLabel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            className="ml-2 mt-2"
          >
            {actionLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};