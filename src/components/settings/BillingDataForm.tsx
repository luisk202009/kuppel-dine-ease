import React, { useState, useEffect } from 'react';
import { Building2, Save, FileText, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

interface ElectronicBillingData {
  tax_regime: string;
  tax_id: string;
  invoice_prefix: string;
  invoice_resolution: string;
  invoice_range_start: string;
  invoice_range_end: string;
}

interface EnabledModules {
  pos?: boolean;
  cash?: boolean;
  orders?: boolean;
  reports?: boolean;
  expenses?: boolean;
  products?: boolean;
  settings?: boolean;
  treasury?: boolean;
  customers?: boolean;
  onlineStore?: boolean;
  subscriptions?: boolean;
  expensePayments?: boolean;
  paymentReceipts?: boolean;
  standardInvoicing?: boolean;
}

const taxRegimeOptions = [
  { value: 'persona_juridica', label: 'Persona Jurídica' },
  { value: 'persona_natural', label: 'Persona Natural' },
];

export const BillingDataForm: React.FC = () => {
  const { authState } = usePOS();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = authState.selectedCompany?.id;

  // Check if electronic invoicing module is enabled
  // Use authState.enabledModules which is synced by the context
  const enabledModules = authState.enabledModules as EnabledModules | undefined;
  const showElectronicBilling = enabledModules?.standardInvoicing === true;

  const [formData, setFormData] = useState<BillingData>({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
  });

  const [electronicForm, setElectronicForm] = useState<ElectronicBillingData>({
    tax_regime: '',
    tax_id: '',
    invoice_prefix: '',
    invoice_resolution: '',
    invoice_range_start: '',
    invoice_range_end: '',
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isElectronicDirty, setIsElectronicDirty] = useState(false);
  const [isSavingElectronic, setIsSavingElectronic] = useState(false);

  // Fetch company data directly from Supabase
  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company-billing', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('id, name, tax_id, email, phone, address, tax_regime, invoice_prefix, invoice_resolution, invoice_range_start, invoice_range_end')
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
      setElectronicForm({
        tax_regime: companyData.tax_regime || '',
        tax_id: companyData.tax_id || '',
        invoice_prefix: companyData.invoice_prefix || '',
        invoice_resolution: companyData.invoice_resolution || '',
        invoice_range_start: companyData.invoice_range_start?.toString() || '',
        invoice_range_end: companyData.invoice_range_end?.toString() || '',
      });
      setIsDirty(false);
      setIsElectronicDirty(false);
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

  const handleElectronicChange = (field: keyof ElectronicBillingData, value: string) => {
    setElectronicForm((prev) => ({ ...prev, [field]: value }));
    setIsElectronicDirty(true);
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

  const handleSaveElectronicBilling = async () => {
    if (!companyId) return;

    // Validate required fields if any billing data is entered
    const hasAnyData = electronicForm.invoice_prefix || electronicForm.invoice_resolution || 
                       electronicForm.invoice_range_start || electronicForm.invoice_range_end;
    
    if (hasAnyData) {
      if (!electronicForm.tax_id.trim()) {
        toast({
          title: 'Error',
          description: 'El NIT/RUT es obligatorio para facturación electrónica',
          variant: 'destructive',
        });
        return;
      }
      if (!electronicForm.invoice_resolution.trim()) {
        toast({
          title: 'Error',
          description: 'La resolución DIAN es obligatoria para facturación electrónica',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSavingElectronic(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          tax_regime: electronicForm.tax_regime || null,
          tax_id: electronicForm.tax_id || null,
          invoice_prefix: electronicForm.invoice_prefix || null,
          invoice_resolution: electronicForm.invoice_resolution || null,
          invoice_range_start: electronicForm.invoice_range_start ? parseInt(electronicForm.invoice_range_start) : null,
          invoice_range_end: electronicForm.invoice_range_end ? parseInt(electronicForm.invoice_range_end) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) throw error;

      // Also update the main form's tax_id to keep them in sync
      setFormData(prev => ({ ...prev, tax_id: electronicForm.tax_id }));
      
      queryClient.invalidateQueries({ queryKey: ['company-billing', companyId] });
      toast({
        title: 'Configuración guardada',
        description: 'Los datos fiscales se actualizaron correctamente',
      });
      setIsElectronicDirty(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los datos fiscales',
        variant: 'destructive',
      });
      console.error('Error updating electronic billing data:', error);
    } finally {
      setIsSavingElectronic(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
        {showElectronicBilling && <Skeleton className="h-80 w-full" />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Datos de Facturación</h3>
        <p className="text-sm text-muted-foreground">
          Información de tu empresa para facturación y documentos legales
        </p>
      </div>

      {/* Company Data Card */}
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

      {/* Electronic Billing Card - Only visible if standardInvoicing is enabled */}
      {showElectronicBilling && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Configuración de Facturación Electrónica</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Estos datos son necesarios para que tus facturas tengan validez legal ante la entidad fiscal a través de Dataico.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription>
                  Datos fiscales requeridos para emitir facturas electrónicas válidas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Estos datos son necesarios para que tus facturas tengan validez legal ante la entidad fiscal a través de Dataico.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tax_regime">Tipo de Contribuyente</Label>
                  <Select 
                    value={electronicForm.tax_regime} 
                    onValueChange={(value) => handleElectronicChange('tax_regime', value)}
                  >
                    <SelectTrigger id="tax_regime">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxRegimeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="electronic_tax_id">
                    NIT/RUT <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="electronic_tax_id"
                    value={electronicForm.tax_id}
                    onChange={(e) => handleElectronicChange('tax_id', e.target.value)}
                    placeholder="900.123.456-7"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_prefix">Prefijo de Facturación</Label>
                  <Input
                    id="invoice_prefix"
                    value={electronicForm.invoice_prefix}
                    onChange={(e) => handleElectronicChange('invoice_prefix', e.target.value.toUpperCase())}
                    placeholder="SETT"
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_resolution">
                    Resolución DIAN <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="invoice_resolution"
                    value={electronicForm.invoice_resolution}
                    onChange={(e) => handleElectronicChange('invoice_resolution', e.target.value)}
                    placeholder="18764000001234"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_range_start">Numeración Desde</Label>
                  <Input
                    id="invoice_range_start"
                    type="number"
                    min="1"
                    value={electronicForm.invoice_range_start}
                    onChange={(e) => handleElectronicChange('invoice_range_start', e.target.value)}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_range_end">Numeración Hasta</Label>
                  <Input
                    id="invoice_range_end"
                    type="number"
                    min="1"
                    value={electronicForm.invoice_range_end}
                    onChange={(e) => handleElectronicChange('invoice_range_end', e.target.value)}
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="button"
                  onClick={handleSaveElectronicBilling}
                  disabled={!isElectronicDirty || isSavingElectronic}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingElectronic ? 'Guardando...' : 'Guardar Configuración Fiscal'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
