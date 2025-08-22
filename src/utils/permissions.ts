import { User } from '@/types/pos';

export type Permission = 
  | 'view_tables'
  | 'view_products' 
  | 'view_customers'
  | 'view_orders'
  | 'view_reports'
  | 'view_expenses'
  | 'view_cash'
  | 'manage_cash'
  | 'create_expenses'
  | 'manage_users';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_reports',
    'view_expenses',
    'view_cash',
    'manage_cash',
    'create_expenses',
    'manage_users'
  ],
  manager: [
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_reports',
    'view_expenses',
    'view_cash',
    'manage_cash',
    'create_expenses'
  ],
  cashier: [
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders',
    'view_cash',
    'manage_cash'
  ],
  waiter: [
    'view_tables',
    'view_products',
    'view_customers',
    'view_orders'
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