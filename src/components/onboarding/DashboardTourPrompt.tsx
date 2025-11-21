import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

interface DashboardTourPromptProps {
  onStart: () => void;
  onSkip: () => void;
}

export const DashboardTourPrompt: React.FC<DashboardTourPromptProps> = ({ onStart, onSkip }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-md shadow-2xl border-2 border-primary/20 animate-scale-in">
        <CardContent className="p-6 space-y-4">
          {/* Close button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">¡Tu sistema está listo! 🎉</h2>
            <p className="text-muted-foreground">
              ¿Te gustaría un tour rápido de 2 minutos para conocer las funciones principales del dashboard?
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-2 text-sm text-left">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Navegación entre Mesas y Productos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Cómo usar el carrito de compras</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Acceso a configuración y reportes</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              Lo veré después
            </Button>
            <Button
              onClick={onStart}
              className="flex-1"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Iniciar Tour
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-center text-muted-foreground">
            Podrás repetir el tour cuando quieras desde Configuración
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
