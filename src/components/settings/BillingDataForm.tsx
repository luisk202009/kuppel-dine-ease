import React, { useState, useEffect } from 'react';
import { Building2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePOS } from '@/contexts/POSContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface BillingData {
  name: string;
  tax_id: string;
  email: string;
  phone: string;
  address: string;
}

export const BillingDataForm: React.FC = () => {
  const { authState } = usePOS();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = authState.selectedCompany?.id;

  const [formData, setFormData] = useState<BillingData>({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
  });

  const [isDirty, setIsDirty] = useState(false);

  // Fetch company data directly from Supabase
  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company-billing', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('id, name, tax_id, email, phone, address')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (companyData) {
      setFormData({
        name: companyData.name || '',
        tax_id: companyData.tax_id || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        address: companyData.address || '',
      });
      setIsDirty(false);
    }
  }, [companyData]);

  const updateMutation = useMutation({
    mutationFn: async (data: BillingData) => {
      if (!companyId) throw new Error('No hay empresa seleccionada');

      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          tax_id: data.tax_id || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-billing', companyId] });
      toast({
        title: 'Datos actualizados',
        description: 'Los datos de facturación se guardaron correctamente',
      });
      setIsDirty(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los datos',
        variant: 'destructive',
      });
      console.error('Error updating billing data:', error);
    },
  });

  const handleChange = (field: keyof BillingData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la empresa es requerido',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Datos de Facturación</h3>
        <p className="text-sm text-muted-foreground">
          Información de tu empresa para facturación y documentos legales
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Datos de la Empresa</CardTitle>
              <CardDescription>
                Estos datos aparecerán en tus facturas y documentos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre de la empresa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Mi Empresa S.A.S"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">NIT / Identificación fiscal</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                  placeholder="900.123.456-7"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="facturacion@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Calle 123 #45-67, Ciudad, País"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={!isDirty || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
