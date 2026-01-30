

# Plan: Integración de Campos Dataico en Frontend

## Resumen

Se actualizarán los tipos de TypeScript y los componentes del panel de administración para reflejar los nuevos campos de Dataico añadidos a la base de datos.

---

## Archivos a Modificar

### 1. `src/integrations/supabase/types.ts`

**Cambios en la tabla `companies` (Row, Insert, Update):**
```typescript
// Agregar estos campos:
dataico_account_id: string | null
dataico_auth_token: string | null
dataico_status: string | null
```

**Cambios en la tabla `plans` (Row, Insert, Update):**
```typescript
// Agregar este campo:
max_electronic_documents: number | null
```

---

### 2. `src/components/admin/AdminCompanyDetailModal.tsx`

**Nuevos estados y lógica:**
- Añadir estados para los campos Dataico: `dataicoAccountId`, `dataicoAuthToken`, `dataicoStatus`
- Crear función `fetchDataicoConfig()` para cargar la configuración actual
- Crear función `handleSaveDataicoConfig()` para guardar los cambios

**Nueva sección UI después de "CompanyModulesManager":**
```text
┌────────────────────────────────────────────────────────────────┐
│ 🏛️ Configuración Fiscal (Dataico)                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │ Account ID          │  │ Estado              │             │
│  │ [________________]  │  │ [pending ▼]         │             │
│  └─────────────────────┘  └─────────────────────┘             │
│                                                                │
│  ┌─────────────────────────────────────────────┐              │
│  │ Auth Token                                   │              │
│  │ [••••••••••••••••••••••••••] 👁              │              │
│  └─────────────────────────────────────────────┘              │
│                                                                │
│  [Guardar Configuración Fiscal]                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Componentes a usar:**
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Input` (normal para Account ID, type="password" para Auth Token)
- `Select` con opciones: `pending`, `active`, `error`
- `Button` para guardar
- `Label` para cada campo

---

### 3. `src/components/admin/AdminPlanModal.tsx`

**Nuevos estados:**
- `maxElectronicDocuments` (string para el input)

**Cambios en `useEffect`:**
- Leer `plan.max_electronic_documents` al cargar un plan

**Cambios en `handleSubmit`:**
- Incluir `max_electronic_documents` en el objeto `planData`

**Nueva UI en la sección "Límites del Plan":**
```text
Añadir un cuarto campo junto a los existentes:

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Usuarios Máx.   │  │ Sucursales Máx. │  │ Documentos/Mes  │  │ Docs. Electrón. │
│ [_________]     │  │ [_________]     │  │ [_________]     │  │ [_________]     │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

El campo "Docs. Electrónicos" (Límite de Documentos Electrónicos) permite definir cuántas facturas electrónicas (vía Dataico) puede emitir una empresa según su plan.

---

## Estructura de Datos

### Tabla `companies` - Campos Dataico

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `dataico_account_id` | text | ID de cuenta en Dataico |
| `dataico_auth_token` | text | Token de autenticación (sensible) |
| `dataico_status` | text | Estado: `pending`, `active`, `error` |

### Tabla `plans` - Campo Nuevo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `max_electronic_documents` | integer | Límite de facturas electrónicas por mes |

---

## Detalles de Implementación

### AdminCompanyDetailModal.tsx

**Ubicación de la nueva sección:** 
Entre el componente `CompanyModulesManager` y la sección "Resumen de Uso"

**Patrón de guardado:**
```typescript
const handleSaveDataicoConfig = async () => {
  // Validación básica
  // Update a supabase con los 3 campos
  // Toast de éxito/error
  // Refrescar datos
}
```

**Opciones del Select de Estado:**
- `pending` - "Pendiente de activación"
- `active` - "Activo"
- `error` - "Error de conexión"

### AdminPlanModal.tsx

**Cambios mínimos:**
- 1 nuevo estado `maxElectronicDocuments`
- Lectura en useEffect desde `plan.max_electronic_documents`
- Inclusión en planData al guardar
- 1 nuevo Input en el grid de límites

---

## Consideraciones de Seguridad

1. **Auth Token como Password:**
   - El input de `dataico_auth_token` tendrá `type="password"`
   - Opcionalmente se puede agregar un botón para mostrar/ocultar el token

2. **No exponer en logs:**
   - Evitar console.log de tokens
   - El token solo se muestra como asteriscos en la UI

---

## Resumen de Cambios por Archivo

| Archivo | Tipo de Cambio |
|---------|----------------|
| `src/integrations/supabase/types.ts` | Agregar tipos para 4 campos nuevos |
| `AdminCompanyDetailModal.tsx` | Nueva sección Card con 3 inputs + Select + botón guardar |
| `AdminPlanModal.tsx` | 1 nuevo Input en sección de límites |

