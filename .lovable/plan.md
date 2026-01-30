

# Plan: Corregir Visibilidad de Configuración Fiscal Dataico e Interfaz de Facturación

## Problema Identificado

El dueño de empresa no puede ver la interfaz de configuración de Dataico ni las opciones de facturación electrónica porque:

1. **Los campos de Dataico no se pasan al contexto**: En `POSContext.tsx`, cuando se cargan las empresas del usuario, los campos `dataico_auth_token`, `dataico_account_id` y `dataico_status` no se incluyen en el objeto `Company` transformado.

2. **Los módulos habilitados pueden estar nulos**: Si `enabledModules` es `null`, la sección de facturación electrónica en `BillingDataForm.tsx` no se muestra (línea 65: `enabledModules?.standardInvoicing === true`).

3. **Campos faltantes en transformación de empresa**: Las líneas 428-435 y 454-461 del contexto solo mapean `id`, `name`, `address`, `phone`, `email` y `enabledModules`, omitiendo los campos de Dataico.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/contexts/POSContext.tsx` | Incluir campos Dataico en la transformación de empresas |

---

## Solución Técnica

### 1. Modificar `handleUserSession` (líneas 428-435)

Agregar los campos de Dataico al mapear las empresas:

```typescript
// Antes (líneas 428-435):
companies: companies.map((comp: any) => ({
  id: comp.id,
  name: comp.name,
  address: comp.address,
  phone: comp.phone,
  email: comp.email,
  enabledModules: comp.enabledModules || comp.enabled_modules || null,
})),

// Después:
companies: companies.map((comp: any) => ({
  id: comp.id,
  name: comp.name,
  address: comp.address,
  phone: comp.phone,
  email: comp.email,
  enabledModules: comp.enabledModules || comp.enabled_modules || null,
  dataico_auth_token: comp.dataico_auth_token || null,
  dataico_account_id: comp.dataico_account_id || null,
  dataico_status: comp.dataico_status || null,
})),
```

### 2. Modificar auto-selección de empresa (líneas 454-461)

Incluir los campos de Dataico al transformar la empresa seleccionada automáticamente:

```typescript
// Antes (líneas 454-461):
const transformedCompany = {
  id: companies[0].id,
  name: companies[0].name,
  address: companies[0].address,
  phone: companies[0].phone,
  email: companies[0].email,
  enabledModules: (companies[0] as any).enabledModules || (companies[0] as any).enabled_modules || null,
};

// Después:
const transformedCompany = {
  id: companies[0].id,
  name: companies[0].name,
  address: companies[0].address,
  phone: companies[0].phone,
  email: companies[0].email,
  enabledModules: (companies[0] as any).enabledModules || (companies[0] as any).enabled_modules || null,
  dataico_auth_token: (companies[0] as any).dataico_auth_token || null,
  dataico_account_id: (companies[0] as any).dataico_account_id || null,
  dataico_status: (companies[0] as any).dataico_status || null,
};
```

---

## Flujo de Datos Corregido

```text
1. Usuario inicia sesión
   │
   ▼
2. handleUserSession() obtiene empresas con SELECT *
   │
   ▼
3. Transformación incluye campos Dataico ← CORRECCIÓN
   │
   ▼
4. setAuthState guarda empresa con todos los campos
   │
   ▼
5. Componentes leen authState.selectedCompany
   │
   ├── BillingDataForm: Verifica enabledModules.standardInvoicing
   │
   ├── InvoiceList: Verifica dataico_auth_token && dataico_account_id
   │
   └── InvoiceActions: Muestra botón "Enviar a DIAN" si configurado
```

---

## Resultado Esperado

1. El dueño de empresa verá la sección "Configuración de Facturación Electrónica" en Datos de Facturación cuando `standardInvoicing` esté habilitado.

2. El botón "Enviar a la DIAN" aparecerá en la lista de facturas cuando la empresa tenga configurados `dataico_auth_token` y `dataico_account_id`.

3. Los campos de Dataico estarán disponibles en `authState.selectedCompany` para todos los componentes que los necesiten.

