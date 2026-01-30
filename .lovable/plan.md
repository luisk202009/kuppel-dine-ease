

# Plan: Implementar Interfaz de Integración con Dataico

## Resumen

Se implementará la integración completa de la UI con Dataico, incluyendo un hook reutilizable, botones en las interfaces de POS y facturación, y el seguimiento del estado de sincronización.

---

## Archivos a Crear/Modificar

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/hooks/useDataico.ts` | Nuevo | Hook para comunicación con Edge Function |
| `src/types/invoicing.ts` | Modificar | Añadir campos de Dataico a los tipos |
| `src/components/invoicing/InvoiceList.tsx` | Modificar | Botón "Enviar a DIAN" en el menú |
| `src/components/invoicing/InvoiceActions.tsx` | Modificar | Botón de Dataico junto a PDF/Email |
| `src/components/pos/PaymentModal.tsx` | Modificar | Botón post-pago para factura electrónica |

---

## 1. Hook `useDataico.ts`

### Funcionalidad

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface DataicoResponse {
  success: boolean;
  message: string;
  dataico?: {
    uuid?: string;
    cufe?: string;
    pdf_url?: string;
    xml_url?: string;
  };
  error?: string;
  details?: any;
}

export const useDataico = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const sendInvoiceToDataico = async (
    invoiceId: string, 
    options?: { sendEmail?: boolean }
  ): Promise<DataicoResponse | null> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-dataico-invoice', {
        body: { 
          invoiceId,
          sendEmail: options?.sendEmail ?? false
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: '✅ Factura enviada a la DIAN',
          description: data.message || 'La factura fue procesada correctamente',
        });
        
        // Invalidar queries para refrescar datos
        queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
        queryClient.invalidateQueries({ queryKey: ['standard-invoice', invoiceId] });
        
        return data;
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'No se pudo enviar la factura a la DIAN';
      const details = error.details;
      
      toast({
        variant: 'destructive',
        title: '❌ Error de Facturación Electrónica',
        description: details?.message || errorMessage,
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendInvoiceToDataico,
    isLoading,
  };
};
```

---

## 2. Actualización de Tipos (`src/types/invoicing.ts`)

### Nuevos campos en `StandardInvoice`

```typescript
// Agregar al interface StandardInvoice (después de línea 60):
  
  // Dataico / Facturación Electrónica
  dataicoUuid?: string;
  dataicoStatus?: 'pending' | 'sent' | 'accepted' | 'rejected' | null;
  cufe?: string;
  dataicoSentAt?: Date;
```

### Nuevos campos en `StandardInvoiceRow`

```typescript
// Agregar al interface StandardInvoiceRow (después de línea 164):
  
  dataico_uuid: string | null;
  dataico_status: string | null;
  cufe: string | null;
  dataico_sent_at: string | null;
```

### Actualizar `mapInvoiceRowToInvoice`

```typescript
// En la función de mapeo, agregar:
  dataicoUuid: row.dataico_uuid || undefined,
  dataicoStatus: row.dataico_status as any || undefined,
  cufe: row.cufe || undefined,
  dataicoSentAt: row.dataico_sent_at ? new Date(row.dataico_sent_at) : undefined,
```

**Nota:** Se necesitará una migración SQL para agregar las columnas a la tabla `standard_invoices`.

---

## 3. Modificar `InvoiceList.tsx`

### Importaciones adicionales

```typescript
import { Zap, Loader2 } from 'lucide-react';
import { useDataico } from '@/hooks/useDataico';
```

### Lógica del componente

```typescript
// Dentro del componente InvoiceList:
const { sendInvoiceToDataico, isLoading: isDataicoLoading } = useDataico();
const [dataicoInvoiceId, setDataicoInvoiceId] = useState<string | null>(null);

// Verificar si Dataico está configurado
const enabledModules = authState.enabledModules;
const hasDataicoConfig = authState.selectedCompany?.dataico_auth_token && 
                         authState.selectedCompany?.dataico_account_id;
const showDataicoButton = enabledModules?.standardInvoicing && hasDataicoConfig;

const handleSendToDataico = async (invoice: StandardInvoice) => {
  setDataicoInvoiceId(invoice.id);
  await sendInvoiceToDataico(invoice.id);
  setDataicoInvoiceId(null);
};
```

### Nueva opción en el menú desplegable

Agregar después de "Emitir" (línea 219):

```tsx
{/* Enviar a DIAN - Solo si está configurado Dataico y la factura está emitida */}
{showDataicoButton && invoice.status === 'issued' && !invoice.dataicoUuid && (
  <DropdownMenuItem 
    onClick={() => handleSendToDataico(invoice)}
    disabled={dataicoInvoiceId === invoice.id}
  >
    {dataicoInvoiceId === invoice.id ? (
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    ) : (
      <Zap className="h-4 w-4 mr-2 text-yellow-600" />
    )}
    Enviar a la DIAN
  </DropdownMenuItem>
)}

{/* Indicador de ya sincronizado */}
{invoice.dataicoUuid && (
  <DropdownMenuItem disabled className="text-green-600">
    <CheckCircle className="h-4 w-4 mr-2" />
    Sincronizada con DIAN
  </DropdownMenuItem>
)}
```

---

## 4. Modificar `InvoiceActions.tsx`

### Nuevas props y imports

```typescript
import { Zap, Loader2 } from 'lucide-react';
import { useDataico } from '@/hooks/useDataico';
import { usePOSContext } from '@/contexts/POSContext';

interface InvoiceActionsProps {
  invoiceId: string;
  customerEmail?: string;
  invoiceStatus?: string;
  dataicoUuid?: string;  // Nuevo
}
```

### Nuevo botón en el componente

```tsx
export const InvoiceActions = ({ 
  invoiceId, 
  customerEmail, 
  invoiceStatus,
  dataicoUuid 
}: InvoiceActionsProps) => {
  const { toast } = useToast();
  const { authState } = usePOSContext();
  const { sendInvoiceToDataico, isLoading: isDataicoLoading } = useDataico();
  
  // ... estado existente ...

  // Verificar configuración Dataico
  const enabledModules = authState.enabledModules;
  const hasDataicoConfig = authState.selectedCompany?.dataico_auth_token && 
                           authState.selectedCompany?.dataico_account_id;
  const showDataicoButton = enabledModules?.standardInvoicing && 
                            hasDataicoConfig && 
                            invoiceStatus === 'issued' && 
                            !dataicoUuid;

  const handleSendToDataico = async () => {
    await sendInvoiceToDataico(invoiceId);
  };

  return (
    <>
      <div className="flex gap-2">
        {/* Botón Dataico - Nuevo */}
        {showDataicoButton && (
          <Button
            variant="default"
            size="sm"
            onClick={handleSendToDataico}
            disabled={isDataicoLoading}
            className="bg-yellow-500 hover:bg-yellow-600"
          >
            {isDataicoLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Enviar DIAN
          </Button>
        )}
        
        {/* Indicador de sincronizado */}
        {dataicoUuid && (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            DIAN
          </Badge>
        )}
        
        {/* Botones existentes de PDF y Email */}
        <Button variant="outline" size="sm" onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
          {/* ... */}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
          {/* ... */}
        </Button>
      </div>
      {/* ... resto del componente ... */}
    </>
  );
};
```

---

## 5. Modificar `PaymentModal.tsx` (Opcional - Post-Pago)

### Lógica adicional después del pago

Después de que el pago sea exitoso (línea 117), agregar una opción para emitir factura electrónica:

```tsx
// En el estado del componente:
const { sendInvoiceToDataico, isLoading: isDataicoLoading } = useDataico();
const enabledModules = authState.enabledModules;
const hasDataicoConfig = authState.selectedCompany?.dataico_auth_token;
const showDataicoOption = enabledModules?.standardInvoicing && hasDataicoConfig;

// En el PrintableReceipt callback, ofrecer la opción:
const handleSendElectronicInvoice = async () => {
  if (lastInvoice?.id) {
    await sendInvoiceToDataico(lastInvoice.id);
  }
};
```

Agregar un botón en el recibo impreso o después de completar el pago:

```tsx
{showDataicoOption && lastInvoice?.id && (
  <Button 
    onClick={handleSendElectronicInvoice}
    disabled={isDataicoLoading}
    variant="outline"
    className="w-full mt-2"
  >
    {isDataicoLoading ? (
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    ) : (
      <Zap className="h-4 w-4 mr-2" />
    )}
    Emitir Factura Electrónica
  </Button>
)}
```

---

## 6. Migración SQL Requerida

Para el seguimiento del estado de Dataico, se necesitará agregar columnas a la tabla `standard_invoices`:

```sql
-- Agregar columnas para seguimiento de Dataico
ALTER TABLE public.standard_invoices
ADD COLUMN IF NOT EXISTS dataico_uuid text,
ADD COLUMN IF NOT EXISTS dataico_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS cufe text,
ADD COLUMN IF NOT EXISTS dataico_sent_at timestamp with time zone;

-- Índice para búsquedas por UUID de Dataico
CREATE INDEX IF NOT EXISTS idx_standard_invoices_dataico_uuid 
ON public.standard_invoices(dataico_uuid) 
WHERE dataico_uuid IS NOT NULL;
```

---

## 7. Actualizar Edge Function para guardar respuesta

Modificar `process-dataico-invoice/index.ts` para actualizar la factura con los datos de Dataico:

```typescript
// Después de recibir respuesta exitosa de Dataico (línea 211):
if (dataicoResponse.ok && dataicoResult.uuid) {
  await supabaseAdmin
    .from('standard_invoices')
    .update({
      dataico_uuid: dataicoResult.uuid,
      dataico_status: 'sent',
      cufe: dataicoResult.cufe || null,
      dataico_sent_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);
}
```

---

## Flujo de Usuario

```text
1. Usuario crea/emite factura
   │
   ▼
2. Factura aparece en lista con estado "Emitida"
   │
   ▼
3. Si Dataico está configurado, aparece opción "Enviar a DIAN"
   │
   ▼
4. Usuario hace clic → Hook llama Edge Function
   │
   ▼
5. Edge Function procesa y devuelve respuesta
   │
   ├── ✅ Éxito: Toast verde + Badge "DIAN" + campos actualizados
   │
   └── ❌ Error: Toast rojo con mensaje específico del error
```

---

## Resultado Esperado

1. Nuevo hook `useDataico` reutilizable en cualquier componente
2. Botón "Enviar a DIAN" visible solo cuando:
   - El módulo `standardInvoicing` está habilitado
   - La empresa tiene configurado `dataico_auth_token` y `dataico_account_id`
   - La factura está en estado `issued`
   - La factura no tiene ya un `dataico_uuid`
3. Indicador visual (Badge verde) cuando la factura está sincronizada
4. Mensajes de error claros mostrados en toasts
5. Persistencia del estado de sincronización en la base de datos

