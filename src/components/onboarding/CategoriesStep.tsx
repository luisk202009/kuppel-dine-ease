import React, { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Check, Coffee, UtensilsCrossed, Wine, IceCream, Pizza, Cake, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categorySchema, checkDuplicateNames } from '@/lib/wizardValidation';
import { useToast } from '@/hooks/use-toast';

const PRESET_COLORS = [
  '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#eab308', '#ef4444', '#14b8a6'
];

const CATEGORY_SUGGESTIONS = [
  { name: 'Bebidas', icon: 'Coffee', color: '#3b82f6' },
  { name: 'Comidas', icon: 'UtensilsCrossed', color: '#22c55e' },
  { name: 'Bebidas Alcohólicas', icon: 'Wine', color: '#a855f7' },
  { name: 'Postres', icon: 'IceCream', color: '#ec4899' },
  { name: 'Entradas', icon: 'Pizza', color: '#f97316' },
  { name: 'Panadería', icon: 'Cake', color: '#eab308' },
];

const ICON_MAP: Record<string, any> = {
  Coffee, UtensilsCrossed, Wine, IceCream, Pizza, Cake
};

interface Category {
  name: string;
  color: string;
  icon: string;
}

interface CategoriesStepProps {
  onNext: (categories: Category[]) => void;
}

export const CategoriesStep: React.FC<CategoriesStepProps> = ({ onNext }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [customName, setCustomName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const addSuggestion = (suggestion: typeof CATEGORY_SUGGESTIONS[0]) => {
    setError('');
    
    // Check for duplicates
    const duplicateCheck = checkDuplicateNames(categories, suggestion.name, 'categoría');
    if (duplicateCheck.isDuplicate) {
      setError(duplicateCheck.message!);
      toast({
        title: "Error de validación",
        description: duplicateCheck.message,
        variant: "destructive"
      });
      return;
    }
    
    // Validate the category
    const validation = categorySchema.safeParse({
      name: suggestion.name,
      color: suggestion.color,
      icon: suggestion.icon
    });
    
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Error de validación';
      setError(errorMsg);
      toast({
        title: "Error de validación",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }
    
    setCategories([...categories, { ...suggestion }]);
  };

  const addCustomCategory = () => {
    setError('');
    
    if (!customName.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }
    
    // Check for duplicates
    const duplicateCheck = checkDuplicateNames(categories, customName, 'categoría');
    if (duplicateCheck.isDuplicate) {
      setError(duplicateCheck.message!);
      toast({
        title: "Error de validación",
        description: duplicateCheck.message,
        variant: "destructive"
      });
      return;
    }
    
    // Validate the category
    const validation = categorySchema.safeParse({
      name: customName.trim(),
      color: selectedColor,
      icon: 'UtensilsCrossed'
    });
    
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Error de validación';
      setError(errorMsg);
      toast({
        title: "Error de validación",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }
    
    setCategories([...categories, {
      name: customName.trim(),
      color: selectedColor,
      icon: 'UtensilsCrossed'
    }]);
    setCustomName('');
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (categories.length === 0) return;
    onNext(categories);
  };

  return (
    <CardContent className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Categorías de Productos</h2>
        <p className="text-muted-foreground">
          Selecciona o crea categorías para organizar tus productos (mínimo 1)
        </p>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <Label>Categorías Sugeridas</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORY_SUGGESTIONS.map((suggestion) => {
            const Icon = ICON_MAP[suggestion.icon];
            const isAdded = categories.some(c => c.name === suggestion.name);
            
            return (
              <button
                key={suggestion.name}
                onClick={() => addSuggestion(suggestion)}
                disabled={isAdded}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left",
                  isAdded 
                    ? "bg-primary/10 border-primary cursor-default"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${suggestion.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: suggestion.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{suggestion.name}</p>
                  </div>
                  {isAdded && <Check className="h-5 w-5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Category */}
      <div className="space-y-3">
        <Label>Crear Categoría Personalizada</Label>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Ej: Ensaladas, Sopas..."
            value={customName}
            onChange={(e) => {
              setCustomName(e.target.value);
              setError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
            maxLength={30}
            className={error ? 'border-destructive' : ''}
          />
          <div className="flex gap-1">
            {PRESET_COLORS.slice(0, 4).map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "w-10 h-10 rounded border-2 transition-all",
                  selectedColor === color ? "border-primary scale-110" : "border-border"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button onClick={addCustomCategory} disabled={!customName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selected Categories */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <Label>Categorías Seleccionadas ({categories.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map((category, index) => {
              const Icon = ICON_MAP[category.icon] || UtensilsCrossed;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg border"
                >
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: category.color }} />
                  </div>
                  <span className="text-sm font-medium flex-1 truncate">{category.name}</span>
                  <button
                    onClick={() => removeCategory(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleNext} 
          disabled={categories.length === 0}
          size="lg"
        >
          Continuar con Productos
        </Button>
      </div>
    </CardContent>
  );
};
