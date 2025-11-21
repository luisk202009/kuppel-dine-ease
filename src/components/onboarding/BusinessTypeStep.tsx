import React, { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee, UtensilsCrossed, Pizza, Wine, ShoppingBag, Cake, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessTypeStepProps {
  onNext: (businessType: string) => void;
  companyName: string;
}

const BUSINESS_TYPES = [
  { 
    id: 'restaurant', 
    name: 'Restaurante', 
    icon: UtensilsCrossed, 
    color: '#22c55e',
    description: 'Comida completa con mesas'
  },
  { 
    id: 'cafe', 
    name: 'Café', 
    icon: Coffee, 
    color: '#a855f7',
    description: 'Cafetería o coffee shop'
  },
  { 
    id: 'pizzeria', 
    name: 'Pizzería', 
    icon: Pizza, 
    color: '#f97316',
    description: 'Especializado en pizzas'
  },
  { 
    id: 'bar', 
    name: 'Bar', 
    icon: Wine, 
    color: '#ec4899',
    description: 'Bar o pub con bebidas'
  },
  { 
    id: 'bakery', 
    name: 'Panadería', 
    icon: Cake, 
    color: '#eab308',
    description: 'Panadería o repostería'
  },
  { 
    id: 'retail', 
    name: 'Retail', 
    icon: ShoppingBag, 
    color: '#3b82f6',
    description: 'Tienda minorista'
  },
  { 
    id: 'other', 
    name: 'Otro', 
    icon: Store, 
    color: '#6b7280',
    description: 'Otro tipo de negocio'
  },
];

export const BusinessTypeStep: React.FC<BusinessTypeStepProps> = ({ onNext, companyName }) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedType) {
      onNext(selectedType);
    }
  };

  return (
    <CardContent className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">¿Qué tipo de negocio es {companyName}?</h2>
        <p className="text-muted-foreground">
          Esto nos ayudará a preparar categorías y productos iniciales para ti
        </p>
      </div>

      {/* Business Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "p-6 rounded-lg border-2 transition-all text-left",
                "hover:border-primary/50 hover:bg-muted/50",
                isSelected 
                  ? "bg-primary/10 border-primary shadow-md scale-105"
                  : "border-border"
              )}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${type.color}20` }}
                >
                  <Icon className="h-6 w-6" style={{ color: type.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Message */}
      <div className="bg-muted/50 border rounded-lg p-4">
        <p className="text-sm text-muted-foreground text-center">
          💡 Prepararemos categorías, productos y mesas de ejemplo para tu tipo de negocio
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleNext} 
          disabled={!selectedType}
          size="lg"
        >
          Continuar con Configuración
        </Button>
      </div>
    </CardContent>
  );
};
