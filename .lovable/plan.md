

# Plan: Corregir la Visibilidad de la Configuración de Facturación Electrónica

## Diagnóstico del Problema

El formulario de "Configuración de Facturación Electrónica" en `BillingDataForm.tsx` no se muestra porque:

1. **El módulo `standardInvoicing` no existe en la base de datos**: Los registros de `enabled_modules` en la tabla `companies` no incluyen el campo `standardInvoicing`.

2. **Condición de visibilidad fallida**: El código verifica:
   ```typescript
   const showElectronicBilling = enabledModules?.standardInvoicing === true;
   ```
   Como `standardInvoicing` no existe, siempre es `undefined`, y la sección nunca se renderiza.

---

## Solución Propuesta

### Opción Recomendada: Actualizar la Base de Datos + Corregir el Código

#### 1. Migración SQL para agregar `standardInvoicing` a las empresas existentes

```sql
-- Agregar standardInvoicing a enabled_modules para todas las empresas
UPDATE companies 
SET enabled_modules = enabled_modules || '{"standardInvoicing": false}'::jsonb
WHERE NOT (enabled_modules ? 'standardInvoicing');

-- Actualizar el valor por defecto de la columna
ALTER TABLE companies 
ALTER COLUMN enabled_modules 
SET DEFAULT '{"pos": true, "cash": true, "orders": true, "reports": true, "expenses": true, "products": true, "settings": true, "treasury": true, "customers": true, "onlineStore": false, "subscriptions": true, "expensePayments": true, "paymentReceipts": true, "standardInvoicing": false}'::jsonb;
```

#### 2. Modificar `BillingDataForm.tsx` para manejar el caso fallback

Cambiar la lógica para que maneje correctamente cuando `enabledModules` no esté definido:

```typescript
// Línea 62-64 actual:
const enabledModules = authState.selectedCompany?.enabledModules as EnabledModules | undefined;
const showElectronicBilling = enabledModules?.standardInvoicing === true;

// Cambiar a:
const enabledModules = authState.enabledModules as EnabledModules | undefined;
const showElectronicBilling = enabledModules?.standardInvoicing === true;
```

**Nota**: Usar `authState.enabledModules` en lugar de `authState.selectedCompany?.enabledModules` porque el contexto ya sincroniza los módulos habilitados en `authState.enabledModules`.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Agregar `standardInvoicing` a todas las empresas y actualizar el default |
| `src/components/settings/BillingDataForm.tsx` | Usar `authState.enabledModules` en lugar de `authState.selectedCompany?.enabledModules` |

---

## Flujo de la Solución

```text
1. Aplicar migración SQL
   │
   ├─▶ Agregar "standardInvoicing": false a todas las empresas existentes
   └─▶ Actualizar valor por defecto para nuevas empresas
   │
   ▼
2. Corregir BillingDataForm.tsx
   │
   └─▶ Cambiar fuente de enabledModules a authState.enabledModules
   │
   ▼
3. Habilitar manualmente standardInvoicing para empresas específicas
   │
   └─▶ Desde el panel de admin (AdminCompanyDetailModal > Módulos)
   │
   ▼
4. La sección se mostrará correctamente
```

---

## Verificación Post-Implementación

Para verificar que funciona:

1. Ir al panel de administración (`/admin`)
2. Abrir el detalle de una empresa
3. En la sección de "Módulos Disponibles", habilitar "Facturación Estándar" (`standardInvoicing`)
4. Cerrar sesión y volver a iniciar sesión (o refrescar)
5. Ir a Ajustes > Suscripciones > Datos de Facturación
6. La sección "Configuración de Facturación Electrónica" debería aparecer

---

## Resultado Esperado

Una vez implementados los cambios:

1. Todas las empresas tendrán el campo `standardInvoicing` en su JSON `enabled_modules`
2. Los administradores podrán habilitar/deshabilitar el módulo desde el panel de admin
3. Los dueños de negocio verán la sección de configuración fiscal cuando el módulo esté habilitado

