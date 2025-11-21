import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { SetupData } from '@/hooks/useInitialSetup';

interface CompletionStepProps {
  setupData: SetupData;
  onFinish: () => void;
  isLoading: boolean;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({ setupData, onFinish, isLoading }) => {
  return (
    <CardContent className="p-12">
      <div className="flex flex-col items-center text-center space-y-8">
        {/* Success Icon */}
        <div className="relative">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <Sparkles className="h-8 w-8 text-primary absolute -top-2 -right-2 animate-pulse" />
        </div>

        {/* Success Message */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">¡Todo listo!</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Tu sistema está configurado y listo para usar
          </p>
        </div>

        {/* Summary */}
        <div className="w-full max-w-md space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg border text-left">
            <h3 className="font-semibold mb-3">Resumen de Configuración</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categorías creadas:</span>
                <span className="font-medium">{setupData.categories.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Productos agregados:</span>
                <span className="font-medium">{setupData.products.length}</span>
              </div>
              {setupData.useTables && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Áreas configuradas:</span>
                    <span className="font-medium">{setupData.areas.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mesas creadas:</span>
                    <span className="font-medium">{setupData.tables.length}</span>
                  </div>
                </>
              )}
              {!setupData.useTables && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modo:</span>
                  <span className="font-medium">Ventas de Mostrador</span>
                </div>
              )}
            </div>
          </div>

          {/* Categories List */}
          {setupData.categories.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg border text-left">
              <h4 className="font-medium text-sm mb-2">Categorías:</h4>
              <div className="flex flex-wrap gap-2">
                {setupData.categories.map((cat, index) => (
                  <div 
                    key={index}
                    className="px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="w-full max-w-md p-4 bg-primary/5 rounded-lg border border-primary/20 text-left">
          <h3 className="font-semibold mb-2 text-sm">Próximos pasos:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Explora tu panel de control</li>
            <li>✓ Agrega más productos si lo necesitas</li>
            <li>✓ Comienza a registrar ventas</li>
            <li>✓ Revisa los reportes y estadísticas</li>
          </ul>
        </div>

        {/* Action */}
        <Button onClick={onFinish} disabled={isLoading} size="lg" className="min-w-[200px]">
          {isLoading ? 'Configurando...' : 'Ir al Dashboard'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Podrás modificar toda esta configuración desde el panel de Configuración
        </p>
      </div>
    </CardContent>
  );
};
