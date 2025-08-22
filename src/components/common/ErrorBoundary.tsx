import React from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Oops! Algo salió mal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Se ha producido un error inesperado. Nuestro equipo ha sido notificado automáticamente.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
              {error.message}
            </pre>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Recargar página
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ({ error, resetError }) => <ErrorFallback error={error as Error} resetError={resetError} />,
    beforeCapture: (scope) => {
      scope.setTag('boundary', 'main-app');
    },
  }
);