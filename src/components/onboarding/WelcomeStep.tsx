import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface WelcomeStepProps {
  onStart: () => void;
  onSkip: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onStart, onSkip }) => {
  return (
    <CardContent className="p-12">
      <div className="flex flex-col items-center text-center space-y-8">
        {/* Logo */}
        <div className="animate-pulse">
          <Logo width={180} height={72} />
        </div>

        {/* Welcome Message */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">¡Bienvenido a tu POS!</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Para empezar a usar tu sistema, vamos a configurar tu negocio en 3 simples pasos
          </p>
        </div>

        {/* Steps Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Categorías</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Organiza tus productos por tipo
            </p>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Productos</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Agrega tus productos iniciales
            </p>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Mesas (opcional)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configura áreas y mesas
            </p>
          </div>
        </div>

        {/* Time Estimate */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>⏱️</span>
          <span>Tiempo estimado: 5 minutos</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onSkip} className="min-w-[160px]">
            Lo haré después
          </Button>
          <Button onClick={onStart} size="lg" className="min-w-[160px]">
            Empezar Configuración
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          No te preocupes, podrás modificar toda esta configuración más adelante
        </p>
      </div>
    </CardContent>
  );
};
