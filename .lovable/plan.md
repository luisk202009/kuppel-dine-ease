

# Plan: Configuración de Facturación Electrónica para Dueños de Negocio

## Resumen

Se añadirá una nueva sección de "Configuración de Facturación Electrónica" en el componente de ajustes, visible solo cuando el módulo `standardInvoicing` esté habilitado. Esta sección permitirá a los dueños de negocio configurar los datos fiscales necesarios para Dataico.

---

## Archivos a Modificar

| Archivo | Tipo de Cambio |
|---------|----------------|
| `src/integrations/supabase/types.ts` | Agregar campos fiscales que faltan en la tabla `companies` |
| `src/components/settings/BillingDataForm.tsx` | Agregar sección de Facturación Electrónica |

---

## 1. Actualización de Tipos (`src/integrations/supabase/types.ts`)

Los siguientes campos ya existen en la base de datos (según el contexto) pero faltan en los tipos:

```typescript
// Añadir a companies.Row, Insert, Update:
invoice_prefix: string | null
invoice_resolution: string | null
invoice_range_start: number | null
invoice_range_end: number | null
tax_regime: string | null
```

---

## 2. Nueva Sección en BillingDataForm

### Ubicación
Se añadirá una nueva `Card` debajo de la sección "Datos de la Empresa" existente, visible solo si `enabledModules?.standardInvoicing === true`.

### Diseño de la UI

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ 📄 Configuración de Facturación Electrónica                                │
│                                                                            │
│ [i] Estos datos son necesarios para que tus facturas tengan validez       │
│     legal ante la entidad fiscal a través de Dataico.                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                 │
│  │ Tipo de Contribuyente   │  │ NIT/RUT *               │                 │
│  │ [Persona Jurídica ▼]    │  │ [900.123.456-7_______] │                 │
│  └─────────────────────────┘  └─────────────────────────┘                 │
│                                                                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                 │
│  │ Prefijo de Facturación  │  │ Resolución DIAN *       │                 │
│  │ [SETT_______________]   │  │ [18764000001234______]  │                 │
│  └─────────────────────────┘  └─────────────────────────┘                 │
│                                                                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                 │
│  │ Numeración Desde        │  │ Numeración Hasta        │                 │
│  │ [1____________________] │  │ [5000_________________] │                 │
│  └─────────────────────────┘  └─────────────────────────┘                 │
│                                                                            │
│                                        [💾 Guardar Configuración Fiscal]  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Campos del Formulario

| Campo UI | Campo DB | Tipo | Requerido |
|----------|----------|------|-----------|
| Tipo de Contribuyente | `tax_regime` | Select | No |
| NIT/RUT | `tax_id` (ya existe) | Input texto | Sí* |
| Prefijo de Facturación | `invoice_prefix` | Input texto | No |
| Resolución DIAN | `invoice_resolution` | Input texto | Sí* |
| Numeración Desde | `invoice_range_start` | Input numérico | No |
| Numeración Hasta | `invoice_range_end` | Input numérico | No |

*Campos obligatorios solo al guardar la configuración fiscal.

### Opciones del Select "Tipo de Contribuyente"

```typescript
const taxRegimeOptions = [
  { value: 'persona_juridica', label: 'Persona Jurídica' },
  { value: 'persona_natural', label: 'Persona Natural' },
];
```

---

## 3. Lógica de Implementación

### Estado del Formulario

```typescript
interface ElectronicBillingData {
  tax_regime: string;
  tax_id: string;
  invoice_prefix: string;
  invoice_resolution: string;
  invoice_range_start: string;
  invoice_range_end: string;
}
```

### Dependencias a importar

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, FileText } from 'lucide-react';
import { usePOS } from '@/contexts/POSContext';
```

### Obtener enabledModules

El componente necesitará acceder a `enabledModules` desde el contexto de la empresa para determinar la visibilidad:

```typescript
const { authState } = usePOS();
const enabledModules = authState.selectedCompany?.enabled_modules as EnabledModules | undefined;
const showElectronicBilling = enabledModules?.standardInvoicing === true;
```

### Query para cargar datos adicionales

Modificar la query existente para incluir los nuevos campos:

```typescript
const { data, error } = await supabase
  .from('companies')
  .select('id, name, tax_id, email, phone, address, tax_regime, invoice_prefix, invoice_resolution, invoice_range_start, invoice_range_end')
  .eq('id', companyId)
  .single();
```

### Función de guardado

```typescript
const handleSaveElectronicBilling = async () => {
  // Validación: si hay datos, NIT y resolución son obligatorios
  if (electronicForm.invoice_prefix || electronicForm.invoice_resolution) {
    if (!electronicForm.tax_id.trim()) {
      toast({ 
        title: 'Error', 
        description: 'El NIT/RUT es obligatorio para facturación electrónica',
        variant: 'destructive' 
      });
      return;
    }
    if (!electronicForm.invoice_resolution.trim()) {
      toast({ 
        title: 'Error', 
        description: 'La resolución DIAN es obligatoria para facturación electrónica',
        variant: 'destructive' 
      });
      return;
    }
  }

  const { error } = await supabase
    .from('companies')
    .update({
      tax_regime: electronicForm.tax_regime || null,
      tax_id: electronicForm.tax_id || null,
      invoice_prefix: electronicForm.invoice_prefix || null,
      invoice_resolution: electronicForm.invoice_resolution || null,
      invoice_range_start: electronicForm.invoice_range_start ? parseInt(electronicForm.invoice_range_start) : null,
      invoice_range_end: electronicForm.invoice_range_end ? parseInt(electronicForm.invoice_range_end) : null,
    })
    .eq('id', companyId);

  if (error) throw error;
  
  toast({ title: 'Configuración guardada', description: 'Los datos fiscales se actualizaron correctamente' });
};
```

---

## 4. Flujo de Validación

```text
Usuario hace clic en "Guardar Configuración Fiscal"
    │
    ▼
┌─────────────────────────────────────────┐
│ ¿Se ingresó algún dato de facturación? │
└─────────────────────────────────────────┘
    │                      │
    │ Sí                   │ No
    ▼                      ▼
┌─────────────────┐    Guardar todo
│ Validar:        │    (campos vacíos → null)
│ - NIT requerido │
│ - Resolución req│
└─────────────────┘
    │
    │ ¿Válido?
    │     │
    │ Sí  │ No
    ▼     ▼
  Guardar  Mostrar error toast
```

---

## 5. Consideraciones UX

1. **Tooltip informativo**: Añadir un icono `Info` junto al título de la sección con un tooltip que explique la importancia de estos datos.

2. **Visibilidad condicional**: La sección solo aparece si `standardInvoicing` está habilitado en `enabledModules`.

3. **Separación visual**: Usar un `Card` separado del formulario principal de datos de empresa para distinguir la configuración fiscal.

4. **Botón de guardado independiente**: Permitir guardar la configuración fiscal sin afectar los datos básicos de la empresa.

---

## Resultado Esperado

1. Los dueños de negocio con el módulo de facturación habilitado verán una nueva sección en la página de Datos de Facturación.
2. Podrán configurar todos los datos fiscales necesarios para emitir facturas electrónicas válidas.
3. El sistema validará que NIT y Resolución estén completos antes de guardar.
4. Los datos se persistirán correctamente en la tabla `companies` de Supabase.

