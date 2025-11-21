import React, { useState } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, ArrowRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CompanyInfoStepProps {
  onNext: (companyId: string, branchId: string, companyName: string) => void;
  userId: string;
}

export const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({ onNext, userId }) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido';
    } else if (formData.companyName.length < 3) {
      newErrors.companyName = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.companyName.length > 100) {
      newErrors.companyName = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores en el formulario",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // 1. Crear la compañía (con owner_id = usuario actual)
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName.trim(),
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          is_active: true,
          owner_id: userId, // ✅ Asignar ownership al usuario actual
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Asignar el usuario a la compañía (sin branch_id todavía)
      const { error: userCompanyError } = await supabase
        .from('user_companies')
        .insert({
          user_id: userId,
          company_id: company.id,
          branch_id: null, // Se actualizará después
        });

      if (userCompanyError) throw userCompanyError;

      // 3. Ahora crear la sucursal principal (RLS pasará porque user_companies ya existe)
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .insert({
          company_id: company.id,
          name: 'Sucursal Principal',
          address: formData.address || null,
          phone: formData.phone || null,
          is_active: true,
        })
        .select()
        .single();

      if (branchError) throw branchError;

      // 4. Actualizar la asociación user_companies con el branch_id
      const { error: updateError } = await supabase
        .from('user_companies')
        .update({ branch_id: branch.id })
        .eq('user_id', userId)
        .eq('company_id', company.id);

      if (updateError) throw updateError;

      toast({
        title: "¡Empresa creada!",
        description: `${formData.companyName} ha sido creada exitosamente`,
      });

      // Pasar al siguiente paso
      onNext(company.id, branch.id, company.name);

    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        title: "Error al crear empresa",
        description: error.message || "No se pudo crear la empresa. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">Información de tu Empresa</CardTitle>
        <CardDescription className="text-base">
          Cuéntanos sobre tu negocio para personalizar tu experiencia
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre de empresa - requerido */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium">
              Nombre de la Empresa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="Ej: Restaurante El Buen Sabor"
              value={formData.companyName}
              onChange={(e) => {
                setFormData({ ...formData, companyName: e.target.value });
                if (errors.companyName) {
                  setErrors({ ...errors, companyName: '' });
                }
              }}
              className={errors.companyName ? 'border-destructive' : ''}
              disabled={isCreating}
              maxLength={100}
              required
            />
            {errors.companyName && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.companyName}</span>
              </div>
            )}
          </div>

          {/* Email - opcional */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@empresa.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              className={errors.email ? 'border-destructive' : ''}
              disabled={isCreating}
            />
            {errors.email && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Teléfono - opcional */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Teléfono
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+57 300 123 4567"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (errors.phone) {
                  setErrors({ ...errors, phone: '' });
                }
              }}
              className={errors.phone ? 'border-destructive' : ''}
              disabled={isCreating}
            />
            {errors.phone && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.phone}</span>
              </div>
            )}
          </div>

          {/* Dirección - opcional */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Dirección
            </Label>
            <Input
              id="address"
              placeholder="Calle 123 #45-67, Ciudad"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={isCreating}
            />
          </div>

          {/* Botón de continuar */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              size="lg"
              className="min-w-[200px]"
              disabled={isCreating || !formData.companyName.trim()}
            >
              {isCreating ? (
                <>Creando empresa...</>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          * Campo requerido
        </p>
      </CardContent>
    </>
  );
};
