# Guía Multi-Tenant - Sistema POS Kuppel

## Descripción General

El sistema POS de Kuppel está diseñado con una arquitectura **multi-tenant** que permite:
- Múltiples empresas (companies) en el sistema
- Múltiples sucursales (branches) por empresa
- Aislamiento completo de datos entre empresas
- Gestión de permisos basada en roles (RLS - Row Level Security)

## Estructura de Datos

### Jerarquía

```
Usuario (users)
    └── Empresa (companies)
            └── Sucursal (branches)
                    ├── Áreas (areas)
                    │   └── Mesas (tables)
                    ├── Categorías (categories)
                    │   └── Productos (products)
                    ├── Clientes (customers)
                    └── Órdenes (orders)
```

### Tablas Principales

1. **users**: Usuarios del sistema
   - `id`: UUID del usuario (desde Supabase Auth)
   - `email`, `name`: Información básica
   - `role`: Rol del usuario (company_owner, admin, cashier, etc.)
   - `setup_completed`: Indica si completó el wizard de configuración inicial

2. **companies**: Empresas/Negocios
   - `id`: UUID de la empresa
   - `owner_id`: ID del usuario dueño
   - `name`, `email`, `phone`: Información de contacto
   - `business_type`: Tipo de negocio (restaurant, cafe, bar, etc.)
   - `plan_id`: Plan de suscripción

3. **user_companies**: Relación usuarios-empresas
   - `user_id`: ID del usuario
   - `company_id`: ID de la empresa
   - `branch_id`: Sucursal asignada al usuario

4. **branches**: Sucursales
   - `id`: UUID de la sucursal
   - `company_id`: Empresa a la que pertenece
   - `name`, `address`, `phone`: Información de la sucursal

5. **areas**: Áreas dentro de una sucursal
   - `id`: UUID del área
   - `branch_id`: Sucursal a la que pertenece
   - `name`: Nombre (ej: "Terraza", "Salón Principal")
   - `color`: Color identificador

6. **tables**: Mesas físicas
   - `id`: UUID de la mesa
   - `branch_id`: Sucursal
   - `area_id`: Área donde está ubicada
   - `name`: Nombre de la mesa
   - `status`: Estado (available, occupied, etc.)

## Flujo de Onboarding para Nuevos Usuarios

### 1. Registro
- Usuario se registra con email/contraseña
- Se crea automáticamente en `users` con:
  - `role: 'company_owner'`
  - `setup_completed: false`

### 2. Wizard de Configuración (SetupWizard)
El usuario es guiado a través de:

**a. Selección de Plan**
- Elige entre planes disponibles (Emprendedor, Pyme, etc.)

**b. Información de la Empresa**
- Crea su empresa (company)
- Crea su primera sucursal (branch) llamada "Sucursal Principal"
- Se asocia automáticamente en `user_companies`

**c. Tipo de Negocio**
- Selecciona el tipo (restaurant, cafe, bar, etc.)
- Sistema genera datos semilla (seed) automáticamente:
  - Categorías predefinidas según el tipo
  - Productos de ejemplo
  - Áreas comunes (si aplica)
  - Mesas de ejemplo (si aplica)

**d. Revisión y Personalización** (opcional)
- Puede revisar/editar categorías generadas
- Puede revisar/editar productos
- Puede revisar/editar áreas y mesas

**e. Finalización**
- Se marca `setup_completed: true`
- Usuario es redirigido al dashboard

### 3. Acceso al Dashboard
- Usuario ahora tiene acceso completo al sistema
- Puede ver y gestionar:
  - Mesas y áreas
  - Productos y categorías
  - Órdenes
  - Reportes

## Seguridad - Row Level Security (RLS)

### Políticas Principales

#### Companies
```sql
-- Usuarios pueden crear sus propias empresas
users_insert_own_companies: INSERT cuando auth.uid() = owner_id

-- Usuarios pueden ver empresas donde son dueños o empleados
users_select_companies: SELECT cuando owner_id = auth.uid() OR está en user_companies
```

#### User Companies
```sql
-- Usuarios pueden gestionar sus relaciones con empresas
users_manage_own_companies_relations: ALL cuando user_id = auth.uid() OR es dueño de la company
```

#### Areas
```sql
-- Usuarios pueden gestionar áreas en sucursales de sus empresas
Users can manage areas in their branches: 
  - ALL cuando la branch pertenece a una company del usuario
  - O cuando la branch pertenece a una company donde el usuario es owner
```

#### Tables
```sql
-- Usuarios pueden gestionar mesas en sucursales de sus empresas
Users can manage tables in their branches:
  - ALL cuando la branch pertenece a una company del usuario
  - O cuando la branch pertenece a una company donde el usuario es owner
```

## Solución de Problemas Comunes

### Error: "No se puede crear el área"
**Causa**: Usuario no tiene una sucursal asociada o no completó el onboarding

**Solución**:
1. Verificar que `setup_completed = true` en la tabla `users`
2. Verificar que existe un registro en `user_companies` para el usuario
3. Verificar que existe una sucursal (`branches`) asociada
4. Si no existe, guiar al usuario a completar el wizard de configuración

### Error: "La pantalla de Mesas queda en 'Cargando mesas…'"
**Causa**: No hay áreas configuradas o hay error de permisos RLS

**Solución**:
1. Verificar que existen áreas en `areas` para la sucursal
2. Verificar políticas RLS en tablas `areas` y `tables`
3. Revisar logs de Supabase para ver errores específicos:
   ```sql
   SELECT * FROM postgres_logs 
   WHERE event_message LIKE '%area%' OR event_message LIKE '%table%'
   ORDER BY timestamp DESC LIMIT 20;
   ```

### Usuario nuevo no ve el wizard
**Causa**: Campo `setup_completed` no está en `false`

**Solución**:
1. Verificar que el trigger `handle_new_user()` está activo
2. Verificar que el valor por defecto de `setup_completed` es `false`
3. Manualmente actualizar si es necesario:
   ```sql
   UPDATE users SET setup_completed = false WHERE id = '<user_id>';
   ```

## Mejores Prácticas

### Para Desarrolladores

1. **Siempre validar sucursal seleccionada**
   ```typescript
   if (!authState.selectedBranch) {
     toast({ title: "Error", description: "No hay sucursal seleccionada" });
     return;
   }
   ```

2. **Manejar errores de RLS específicamente**
   ```typescript
   if (error.code === '42501') {
     // Error de permisos RLS
     toast({ 
       title: "Error de permisos",
       description: "No tienes permiso para realizar esta acción" 
     });
   }
   ```

3. **Usar relaciones correctas en queries**
   ```typescript
   // ✅ CORRECTO - Filtrar por branch_id
   const { data } = await supabase
     .from('areas')
     .select('*')
     .eq('branch_id', authState.selectedBranch.id);

   // ❌ INCORRECTO - No filtrar, viola RLS
   const { data } = await supabase
     .from('areas')
     .select('*');
   ```

### Para Usuarios

1. **Completar el wizard inicial**: No saltarse pasos del wizard de configuración
2. **Crear áreas antes de mesas**: El sistema requiere al menos un área para crear mesas
3. **Verificar plan activo**: Algunos límites dependen del plan de suscripción

## Arquitectura de Permisos

```
┌─────────────────────────────────────────────────┐
│ Usuario (authenticated via Supabase Auth)      │
└─────────────────┬───────────────────────────────┘
                  │
                  ├─ RLS Policy Check
                  │  (¿Pertenece a esta company?)
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Company (via user_companies)                    │
├─────────────────────────────────────────────────┤
│ - Acceso a todas las branches de la company    │
│ - Acceso a datos compartidos (categories, etc) │
└─────────────────┬───────────────────────────────┘
                  │
                  ├─ RLS Policy Check
                  │  (¿Tiene acceso a esta branch?)
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Branch (sucursal específica)                    │
├─────────────────────────────────────────────────┤
│ - Acceso a áreas de esta branch                │
│ - Acceso a mesas de esta branch                │
│ - Acceso a órdenes de esta branch              │
└─────────────────────────────────────────────────┘
```

## Monitoreo y Debugging

### Ver logs de base de datos
```sql
-- Logs de errores recientes
SELECT identifier, timestamp, event_message, parsed.error_severity
FROM postgres_logs
CROSS JOIN unnest(metadata) as m
CROSS JOIN unnest(m.parsed) as parsed
WHERE parsed.error_severity IN ('ERROR', 'WARNING')
ORDER BY timestamp DESC
LIMIT 50;
```

### Verificar permisos de un usuario
```sql
-- Ver empresas del usuario
SELECT c.* FROM companies c
INNER JOIN user_companies uc ON c.id = uc.company_id
WHERE uc.user_id = '<user_id>';

-- Ver sucursales del usuario
SELECT b.* FROM branches b
INNER JOIN user_companies uc ON b.company_id = uc.company_id
WHERE uc.user_id = '<user_id>';
```

### Auditoría de acceso
```sql
-- Ver tabla de logs para auditoría
SELECT * FROM logs
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 100;
```

## Contacto y Soporte

Para problemas o preguntas sobre el sistema multi-tenant:
- Revisar esta guía primero
- Verificar logs de Supabase
- Verificar políticas RLS están activas
- Contactar al equipo de desarrollo con logs específicos del error
