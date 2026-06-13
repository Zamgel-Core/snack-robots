export type AppRole = 'super_admin' | 'store_admin' | 'staff';

export type PermissionKey =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'purchases'
  | 'cash'
  | 'reports'
  | 'goals'
  | 'achievements'
  | 'roles'
  | 'settings';

export type PermissionLevel = 'full' | 'limited' | 'pin' | 'blocked';

export type RoleLikeProfile = {
  global_role?: string | null;
} | null | undefined;

export const ROLE_ORDER: AppRole[] = ['super_admin', 'store_admin', 'staff'];

export const PERMISSIONS_BY_ROLE: Record<AppRole, Record<PermissionKey, PermissionLevel>> = {
  super_admin: {
    dashboard: 'full',
    pos: 'full',
    inventory: 'full',
    purchases: 'full',
    cash: 'full',
    reports: 'full',
    goals: 'full',
    achievements: 'full',
    roles: 'full',
    settings: 'full',
  },
  store_admin: {
    dashboard: 'full',
    pos: 'full',
    inventory: 'full',
    purchases: 'full',
    cash: 'full',
    reports: 'full',
    goals: 'full',
    achievements: 'full',
    roles: 'blocked',
    settings: 'pin',
  },
  staff: {
    dashboard: 'limited',
    pos: 'full',
    inventory: 'limited',
    purchases: 'blocked',
    cash: 'limited',
    reports: 'blocked',
    goals: 'blocked',
    achievements: 'blocked',
    roles: 'blocked',
    settings: 'blocked',
  },
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: 'Control total del sistema, usuarios, configuración, reportes y acciones críticas.',
  store_admin: 'Administra la operación de la tienda; cambios delicados requieren PIN de Super Admin.',
  staff: 'Operación diaria: vender, consultar inventario básico y trabajar sin acceso sensible.',
};

export function normalizeRole(role?: string | null): AppRole {
  if (role === 'super_admin' || role === 'store_admin' || role === 'staff') return role;
  return 'staff';
}

export function getEffectiveRole(profile: RoleLikeProfile): AppRole {
  return normalizeRole(profile?.global_role ?? 'staff');
}

export function getPermission(profile: RoleLikeProfile, permission: PermissionKey): PermissionLevel {
  const role = getEffectiveRole(profile);
  return PERMISSIONS_BY_ROLE[role][permission] ?? 'blocked';
}

export function canAccess(profile: RoleLikeProfile, permission: PermissionKey) {
  return getPermission(profile, permission) !== 'blocked';
}

export function needsPin(profile: RoleLikeProfile, permission: PermissionKey) {
  return getPermission(profile, permission) === 'pin';
}

export function roleLabel(role?: string | null) {
  const normalized = normalizeRole(role);
  if (normalized === 'super_admin') return 'Super Admin';
  if (normalized === 'store_admin') return 'Store Admin';
  return 'Staff';
}
