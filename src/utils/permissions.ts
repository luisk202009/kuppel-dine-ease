import { User } from '@/types/pos';

export type Permission = 
  // Permisos de visualización
  | 'view_dashboard'
  | 'view_tables'
  | 'view_products' 
  | 'view_customers'
  | 'view_orders'
  | 'view_reports'
  | 'view_expenses'
  | 'view_cash'
  // Permisos de creación/edición
  | 'create_orders'
  | 'edit_orders'
  | 'create_products'
  | 'edit_products'
  | 'create_expenses'
  | 'manage_cash'
  // Permisos de administración
  | 'manage_team'
  | 'manage_settings'
  | 'manage_users';

// Roles simplificados para gestión de equipo
export const TEAM_ROLES = {
  viewer: {
    label: 'Visualizador',
    description: 'Solo puede ver información del sistema',
    icon: '👁️'
  },
  staff: {
    label: 'Personal',
    description: 'Puede crear y editar registros',
    icon: '✏️'
  },
  company_owner: {
    label: 'Dueño',
    description: 'Control total de la empresa',
    icon: '👑'
  }
} as const;

// Roles que pueden ser asignados por un company_owner
export const ASSIGNABLE_ROLES = ['viewer', 'staff'] as const;

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Platform admin - acceso total
  admin: [
    'view_dashboard',
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_reports',
    'view_expenses',
    'view_cash',
    'create_orders',
    'edit_orders',
    'create_products',
    'edit_products',
    'create_expenses',
    'manage_cash',
    'manage_team',
    'manage_settings',
    'manage_users'
  ],
  platform_admin: [
    'view_dashboard',
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_reports',
    'view_expenses',
    'view_cash',
    'create_orders',
    'edit_orders',
    'create_products',
    'edit_products',
    'create_expenses',
    'manage_cash',
    'manage_team',
    'manage_settings',
    'manage_users'
  ],
  // Dueño de empresa - control total de su empresa
  company_owner: [
    'view_dashboard',
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_reports',
    'view_expenses',
    'view_cash',
    'create_orders',
    'edit_orders',
    'create_products',
    'edit_products',
    'create_expenses',
    'manage_cash',
    'manage_team',
    'manage_settings'
  ],
  // Manager - casi todo excepto gestión de equipo
  manager: [
    'view_dashboard',
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_reports',
    'view_expenses',
    'view_cash',
    'create_orders',
    'edit_orders',
    'create_products',
    'edit_products',
    'create_expenses',
    'manage_cash'
  ],
  // Personal (staff) - operaciones diarias
  staff: [
    'view_dashboard',
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_reports',
    'view_expenses',
    'view_cash',
    'create_orders',
    'edit_orders',
    'create_products',
    'edit_products',
    'create_expenses',
    'manage_cash'
  ],
  // Cajero - operaciones de caja
  cashier: [
    'view_dashboard',
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_cash',
    'create_orders',
    'manage_cash'
  ],
  // Mesero - solo mesas y pedidos
  waiter: [
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'create_orders'
  ],
  // Visualizador - solo lectura
  viewer: [
    'view_dashboard',
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_reports',
    'view_expenses',
    'view_cash'
  ]
};

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

export const getUserPermissions = (user: User | null): Permission[] => {
  if (!user) return [];
  return ROLE_PERMISSIONS[user.role] || [];
};

export const canManageTeam = (user: User | null): boolean => {
  return hasPermission(user, 'manage_team');
};

export const getRoleLabel = (role: string): string => {
  return TEAM_ROLES[role as keyof typeof TEAM_ROLES]?.label || role;
};

export const getRoleDescription = (role: string): string => {
  return TEAM_ROLES[role as keyof typeof TEAM_ROLES]?.description || '';
};
