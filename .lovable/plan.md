

# Plan: Actualización de Esquema para Control de Facturación Electrónica

## Resumen del Análisis

### Campos ya existentes en `standard_invoices`:
| Campo | Tipo | Estado |
|-------|------|--------|
| `dataico_uuid` | text | ✅ Existe |
| `dataico_status` | text | ✅ Existe |
| `dataico_sent_at` | timestamp | ✅ Existe |
| `cufe` | text | ✅ Existe |

### Campos faltantes:
| Campo | Tipo | Estado |
|-------|------|--------|
| `dataico_pdf_url` | text | ❌ No existe |
| UNIQUE en `dataico_uuid` | constraint | ❌ No existe |

---

## SQL a Ejecutar en Supabase

Ejecuta el siguiente SQL en el SQL Editor de Supabase:

```sql
-- Agregar columna dataico_pdf_url para almacenar URL del PDF legal
ALTER TABLE public.standard_invoices 
ADD COLUMN IF NOT EXISTS dataico_pdf_url text;

-- Agregar comentario descriptivo
COMMENT ON COLUMN public.standard_invoices.dataico_pdf_url 
IS 'URL del PDF legal generado por Dataico después de la emisión exitosa';

-- Agregar restricción UNIQUE a dataico_uuid para prevenir duplicados
-- Nota: Se permite NULL para que múltiples facturas sin emitir no violen la restricción
ALTER TABLE public.standard_invoices 
ADD CONSTRAINT standard_invoices_dataico_uuid_unique UNIQUE (dataico_uuid);
```

---

## Modificaciones de Código Requeridas

### 1. Actualización del Edge Function

En `supabase/functions/process-dataico-invoice/index.ts`, agregar la extracción del PDF URL de la respuesta de Dataico (líneas 227-233):

```typescript
// Línea 231 - Agregar después de cufe
if (dataicoResult.pdf_url) {
  updateData.dataico_pdf_url = dataicoResult.pdf_url;
}
```

### 2. Tipos de TypeScript

Después de ejecutar la migración, el archivo `src/integrations/supabase/types.ts` debe incluir el nuevo campo. Lovable regenerará automáticamente los tipos tras la migración, pero el campo esperado será:

```typescript
// En standard_invoices.Row (alrededor de línea 1521)
dataico_pdf_url: string | null

// En standard_invoices.Insert
dataico_pdf_url?: string | null

// En standard_invoices.Update
dataico_pdf_url?: string | null
```

---

## Flujo de Datos Actualizado

```text
1. Usuario emite factura electrónica
   │
   ▼
2. Edge Function envía a Dataico API
   │
   ▼
3. Dataico responde con:
   ├── uuid      → dataico_uuid (UNIQUE)
   ├── cufe      → cufe
   └── pdf_url   → dataico_pdf_url (NUEVO)
   │
   ▼
4. Edge Function actualiza standard_invoices
   │
   ▼
5. UI puede mostrar:
   ├── Badge "DIAN" si dataico_uuid existe
   └── Botón "Ver PDF DIAN" con dataico_pdf_url
```

---

## Beneficios de la Restricción UNIQUE

La restricción `UNIQUE` en `dataico_uuid`:
- Previene que una factura se registre dos veces en la DIAN por error
- Permite valores NULL (múltiples facturas sin emitir)
- Genera error si se intenta insertar un UUID duplicado

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/process-dataico-invoice/index.ts` | Extraer y guardar `dataico_pdf_url` de la respuesta |

---

## Pasos de Implementación

1. **Ejecutar SQL en Supabase** - Usar el SQL Editor para agregar la columna y la restricción
2. **Aprobar este plan** - Para que modifique el Edge Function
3. **Verificar regeneración de tipos** - Los tipos se actualizarán automáticamente

