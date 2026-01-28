
# Plan: Agregar Nuevos Módulos a los Permisos de Empresa

## Resumen

Actualmente hay módulos en el menú lateral que no están controlados por el sistema de permisos de empresa. Se agregarán 4 nuevos módulos al sistema de `enabled_modules` para que los administradores puedan habilitarlos o deshabilitarlos por empresa.

---

## Módulos a Agregar

| Módulo | ID | Descripción | Valor por defecto |
|--------|----|--------------|--------------------|
| Tienda Online | `onlineStore` | Catálogo público y pedidos online | `false` |
| Tesorería | `treasury` | Cuentas bancarias y movimientos | `true` |
| Pagos Recibidos | `paymentReceipts` | Recibos de cobro de facturas | `true` |
| Pagos Realizados | `expensePayments` | Registro de pagos a gastos | `true` |

---

## Archivos a Modificar

### 1. `src/types/pos.ts`

**Cambios:**
- Agregar los 4 nuevos módulos al interface `EnabledModules`
- Actualizar `DEFAULT_ENABLED_MODULES` con valores por defecto

```typescript
export interface EnabledModules {
  settings: boolean;
  subscriptions: boolean;
  products: boolean;
  customers: boolean;
  orders: boolean;
  reports: boolean;
  expenses: boolean;
  cash: boolean;
  pos: boolean;
  standardInvoicing: boolean;
  // NUEVOS:
  onlineStore: boolean;
  treasury: boolean;
  paymentReceipts: boolean;
  expensePayments: boolean;
}

export const DEFAULT_ENABLED_MODULES: EnabledModules = {
  settings: true,
  subscriptions: true,
  products: true,
  customers: true,
  orders: true,
  reports: true,
  expenses: true,
  cash: true,
  pos: true,
  standardInvoicing: false,
  // NUEVOS:
  onlineStore: false,      // Deshabilitado por defecto
  treasury: true,          // Habilitado por defecto
  paymentReceipts: true,   // Habilitado por defecto
  expensePayments: true,   // Habilitado por defecto
};
```

---

### 2. `src/components/admin/CompanyModulesManager.tsx`

**Cambios:**
- Agregar los 4 nuevos módulos a `MODULES_CONFIG` con sus iconos y descripciones

```typescript
const MODULES_CONFIG: ModuleConfig[] = [
  // ... módulos existentes ...
  
  // NUEVOS:
  {
    id: 'onlineStore',
    label: 'Tienda Online',
    description: 'Catálogo público de productos y pedidos online',
    icon: Store,
  },
  {
    id: 'treasury',
    label: 'Tesorería',
    description: 'Gestión de cuentas bancarias, movimientos y transferencias',
    icon: Landmark,
  },
  {
    id: 'paymentReceipts',
    label: 'Pagos Recibidos',
    description: 'Registro de cobros asociados a facturas',
    icon: Wallet,
  },
  {
    id: 'expensePayments',
    label: 'Pagos Realizados',
    description: 'Registro de pagos asociados a gastos',
    icon: Wallet,
  },
];
```

---

### 3. Migración de Base de Datos

**Cambios:**
- Actualizar el valor por defecto de la columna `enabled_modules` en la tabla `companies`
- Actualizar empresas existentes para incluir los nuevos módulos (sin cambiar su estado actual)

```sql
-- Actualizar el valor por defecto para nuevas empresas
ALTER TABLE public.companies 
ALTER COLUMN enabled_modules 
SET DEFAULT '{"pos": true, "cash": true, "orders": true, "reports": true, "expenses": true, "products": true, "settings": true, "customers": true, "subscriptions": true, "standardInvoicing": false, "onlineStore": false, "treasury": true, "paymentReceipts": true, "expensePayments": true}'::jsonb;

-- Agregar nuevos módulos a empresas existentes (solo si no existen)
UPDATE public.companies
SET enabled_modules = enabled_modules || 
  jsonb_build_object(
    'onlineStore', COALESCE((enabled_modules->>'onlineStore')::boolean, false),
    'treasury', COALESCE((enabled_modules->>'treasury')::boolean, true),
    'paymentReceipts', COALESCE((enabled_modules->>'paymentReceipts')::boolean, true),
    'expensePayments', COALESCE((enabled_modules->>'expensePayments')::boolean, true)
  )
WHERE enabled_modules IS NOT NULL;
```

---

## Diagrama: Sistema de Módulos Actualizado

```text
┌──────────────────────────────────────────────────────────────────┐
│                    MÓDULOS DE EMPRESA                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SIEMPRE HABILITADOS (locked)                                    │
│  ┌───────────────┐  ┌───────────────┐                           │
│  │   Ajustes     │  │ Suscripciones │                           │
│  │   🔒          │  │   🔒          │                           │
│  └───────────────┘  └───────────────┘                           │
│                                                                  │
│  CONFIGURABLES (toggle on/off)                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   POS         │  │   Caja        │  │   Productos   │        │
│  │   🛒          │  │   💵          │  │   📦          │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   Clientes    │  │   Reportes    │  │   Gastos      │        │
│  │   👥          │  │   📊          │  │   💳          │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   Órdenes     │  │  Facturación  │  │ Tienda Online │  NEW   │
│  │   📋          │  │   📄          │  │   🏪          │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   Tesorería   │  │ Pagos Recib.  │  │ Pagos Realiz. │  NEW   │
│  │   🏦          │  │   💰          │  │   💸          │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Visibilidad en el Sidebar

```text
Usuario accede al menú
         │
         ▼
┌─────────────────────────────┐
│ company.enabled_modules     │
│ ¿Módulo habilitado?         │
└─────────────────────────────┘
         │
    ┌────┴────┐
    │         │
   true     false
    │         │
    ▼         ▼
 VISIBLE   OCULTO
```

El `SettingsSidebar` ya tiene la lógica para ocultar módulos:
```typescript
if (enabledModules && enabledModules[item.id as keyof EnabledModules] === false) {
  return false; // Item no visible
}
```

Solo falta que los nuevos módulos estén definidos en el tipo.

---

## Resultado Esperado

1. **Admin Panel**: Verá 4 nuevos switches en "Módulos Habilitados" al editar una empresa
2. **Tienda Online**: Deshabilitada por defecto (requiere configuración explícita)
3. **Tesorería, Pagos Recibidos, Pagos Realizados**: Habilitados por defecto
4. **Empresas existentes**: Mantendrán sus configuraciones actuales + nuevos módulos con valores por defecto
5. **Nuevas empresas**: Tendrán todos los módulos con los valores por defecto definidos
