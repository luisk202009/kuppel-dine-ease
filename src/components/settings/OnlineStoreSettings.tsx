import React, { useState, useEffect } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Store, Globe, MessageCircle, Save, Loader2, ShoppingBag, Settings } from 'lucide-react';
import { OnlineOrdersList } from './OnlineOrdersList';

export const OnlineStoreSettings: React.FC = () => {
  const { authState } = usePOS();
  const companyId = authState.selectedCompany?.id;

  const [publicSlug, setPublicSlug] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [publicStoreEnabled, setPublicStoreEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [slugError, setSlugError] = useState('');

  useEffect(() => {
    if (companyId) {
      loadCompanyData();
    }
  }, [companyId]);

  const loadCompanyData = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('public_slug, whatsapp_number, public_store_enabled')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      if (data) {
        setPublicSlug(data.public_slug || '');
        setWhatsappNumber(data.whatsapp_number || '');
        setPublicStoreEnabled(data.public_store_enabled || false);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      toast.error('Error al cargar los datos de la tienda');
    } finally {
      setIsLoading(false);
    }
  };

  const validateSlug = (value: string): boolean => {
    if (value.includes(' ')) {
      setSlugError('El slug no puede contener espacios');
      return false;
    }
    if (value && !/^[a-zA-Z0-9-_]+$/.test(value)) {
      setSlugError('Solo se permiten letras, números, guiones y guiones bajos');
      return false;
    }
    setSlugError('');
    return true;
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPublicSlug(value);
    validateSlug(value);
  };

  const handleSave = async () => {
    if (!companyId) {
      toast.error('No se encontró la empresa');
      return;
    }

    if (!validateSlug(publicSlug)) {
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('companies')
        .update({
          public_slug: publicSlug || null,
          whatsapp_number: whatsappNumber || null,
          public_store_enabled: publicStoreEnabled,
        })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Tienda Online</h2>
        <p className="text-muted-foreground">
          Gestiona pedidos y configura tu tienda pública
        </p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="mt-6">
          <OnlineOrdersList />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Configuración de la Tienda
              </CardTitle>
              <CardDescription>
                Personaliza cómo se verá tu tienda pública
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Store Enabled Switch */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="store-enabled" className="text-base">Tienda Activa</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilita o deshabilita tu tienda pública
                  </p>
                </div>
                <Switch
                  id="store-enabled"
                  checked={publicStoreEnabled}
                  onCheckedChange={setPublicStoreEnabled}
                />
              </div>

              <div className="border-t border-border pt-6" />

              {/* Public Slug */}
              <div className="space-y-2">
                <Label htmlFor="public-slug" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  URL de tu Tienda (Slug)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {window.location.origin}/tienda/
                  </span>
                  <Input
                    id="public-slug"
                    placeholder="mi-tienda"
                    value={publicSlug}
                    onChange={handleSlugChange}
                    className={slugError ? 'border-destructive' : ''}
                  />
                </div>
                {slugError && (
                  <p className="text-sm text-destructive">{slugError}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Este será el enlace único de tu tienda. Solo letras, números, guiones y guiones bajos.
                </p>
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Número de WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  placeholder="+57 300 123 4567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Los clientes podrán contactarte directamente por WhatsApp desde tu tienda
                </p>
              </div>

              <div className="border-t border-border pt-6">
                <Button onClick={handleSave} disabled={isSaving || !!slugError}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};