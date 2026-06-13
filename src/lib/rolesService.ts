import { supabase } from './supabase';

export type AppRole = 'super_admin' | 'store_admin' | 'staff';

export type RoleDefinition = {
  role: AppRole;
  title: string;
  badge: string;
  tone: string;
  shortDescription: string;
  description: string;
  idealFor: string;
  canDo: string[];
  limitations: string[];
};

export type PermissionKey =
  | 'dashboard'
  | 'pos'
  | 'inventory_view'
  | 'inventory_manage'
  | 'purchases'
  | 'cash'
  | 'reports'
  | 'goals'
  | 'settings'
  | 'roles'
  | 'critical_actions';

export type PermissionRow = {
  key: PermissionKey;
  module: string;
  description: string;
  super_admin: 'full' | 'pin' | 'limited' | 'no';
  store_admin: 'full' | 'pin' | 'limited' | 'no';
  staff: 'full' | 'pin' | 'limited' | 'no';
};

export type CurrentAccess = {
  globalRole: AppRole | string | null;
  storeRole: AppRole | string | null;
  storeId: string | null;
  isSuperAdmin: boolean;
  isStoreAdmin: boolean;
  isStaff: boolean;
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'super_admin',
    title: 'Super Admin',
    badge: 'Control total',
    tone: 'from-yellow-300/25 to-orange-500/20 border-yellow-300/40',
    shortDescription: 'Dueño/plataforma. Puede administrar todo y autorizar acciones críticas.',
    description:
      'Tiene control total de Snack Robots, tiendas, configuración, seguridad, usuarios, reportes y acciones protegidas. Es el rol que valida cambios delicados con PIN.',
    idealFor: 'Propietario principal, creador del sistema o administrador máximo.',
    canDo: [
      'Administrar todas las tiendas y módulos.',
      'Cambiar configuración crítica del negocio.',
      'Administrar roles, permisos y usuarios.',
      'Autorizar acciones delicadas con PIN.',
      'Ver costos, ganancias, reportes y exportaciones.',
    ],
    limitations: ['No debería usarse como usuario diario de caja si hay empleados.'],
  },
  {
    role: 'store_admin',
    title: 'Store Admin',
    badge: 'Administrador de tienda',
    tone: 'from-sky-400/25 to-blue-600/20 border-sky-300/40',
    shortDescription: 'Administra la operación completa de su tienda, pero lo crítico pide PIN de Super Admin.',
    description:
      'Puede operar ventas, inventario, compras, caja, reportes y metas de su tienda. Los cambios sensibles quedan protegidos para evitar errores o abuso.',
    idealFor: 'Encargado, gerente familiar o responsable de una sucursal.',
    canDo: [
      'Vender y registrar movimientos del día.',
      'Administrar inventario y compras.',
      'Revisar caja, reportes, metas y logros.',
      'Modificar configuración operativa no crítica.',
      'Gestionar tareas diarias sin depender siempre del dueño.',
    ],
    limitations: [
      'Cambios críticos pueden requerir PIN de Super Admin.',
      'No debe modificar roles máximos sin autorización.',
      'No debe desactivar datos importantes sin confirmación.',
    ],
  },
  {
    role: 'staff',
    title: 'Staff / Cajero',
    badge: 'Operación diaria',
    tone: 'from-emerald-400/20 to-teal-600/20 border-emerald-300/35',
    shortDescription: 'Rol limitado para vender, consultar inventario y trabajar sin ver información sensible.',
    description:
      'Diseñado para empleados que atienden ventas. Mantiene protegidos costos, utilidad, configuración, reportes completos y acciones delicadas.',
    idealFor: 'Cajeros, ayudantes temporales o empleados de mostrador.',
    canDo: [
      'Entrar al POS para vender.',
      'Consultar inventario básico.',
      'Ver alertas necesarias para operar.',
      'Trabajar sin acceso a configuración sensible.',
    ],
    limitations: [
      'Sin acceso a configuración avanzada.',
      'Sin administración de roles.',
      'Sin cambios críticos de precios o stock sin autorización.',
      'Reportes financieros limitados o bloqueados.',
    ],
  },
];

export const PERMISSION_MATRIX: PermissionRow[] = [
  {
    key: 'dashboard',
    module: 'Dashboard',
    description: 'Resumen general del negocio.',
    super_admin: 'full',
    store_admin: 'full',
    staff: 'limited',
  },
  {
    key: 'pos',
    module: 'Vender / POS',
    description: 'Registrar ventas y cobrar productos.',
    super_admin: 'full',
    store_admin: 'full',
    staff: 'full',
  },
  {
    key: 'inventory_view',
    module: 'Ver inventario',
    description: 'Consultar productos, stock y alertas.',
    super_admin: 'full',
    store_admin: 'full',
    staff: 'limited',
  },
  {
    key: 'inventory_manage',
    module: 'Modificar inventario',
    description: 'Crear productos, cambiar costos, precios o desactivar artículos.',
    super_admin: 'full',
    store_admin: 'pin',
    staff: 'no',
  },
  {
    key: 'purchases',
    module: 'Compras',
    description: 'Registrar mercancía y aumentar stock.',
    super_admin: 'full',
    store_admin: 'full',
    staff: 'no',
  },
  {
    key: 'cash',
    module: 'Caja',
    description: 'Revisar movimientos, fondo inicial y cierre.',
    super_admin: 'full',
    store_admin: 'pin',
    staff: 'limited',
  },
  {
    key: 'reports',
    module: 'Reportes',
    description: 'Ver ventas, compras, utilidad y exportaciones.',
    super_admin: 'full',
    store_admin: 'full',
    staff: 'no',
  },
  {
    key: 'goals',
    module: 'Metas y logros',
    description: 'Consultar objetivos, progreso y medallas.',
    super_admin: 'full',
    store_admin: 'full',
    staff: 'limited',
  },
  {
    key: 'settings',
    module: 'Configuración',
    description: 'Cambios del negocio, ticket, caja, seguridad y apariencia.',
    super_admin: 'full',
    store_admin: 'pin',
    staff: 'no',
  },
  {
    key: 'roles',
    module: 'Roles y usuarios',
    description: 'Invitar empleados, cambiar roles y administrar permisos.',
    super_admin: 'full',
    store_admin: 'pin',
    staff: 'no',
  },
  {
    key: 'critical_actions',
    module: 'Acciones críticas',
    description: 'Eliminar/desactivar, cambiar precios, cancelar ventas, cerrar caja o cambiar permisos.',
    super_admin: 'full',
    store_admin: 'pin',
    staff: 'no',
  },
];

export const CRITICAL_ACTIONS = [
  'Cambiar precio o costo de productos',
  'Desactivar productos o registros importantes',
  'Cancelar ventas / devoluciones',
  'Cerrar caja con diferencia',
  'Cambiar configuración de seguridad',
  'Modificar roles o permisos',
  'Exportar reportes financieros sensibles',
];

export function getRoleDefinition(role?: string | null) {
  return ROLE_DEFINITIONS.find((item) => item.role === role) ?? ROLE_DEFINITIONS[2];
}

export async function getCurrentAccess(userId?: string | null, globalRole?: string | null): Promise<CurrentAccess> {
  if (!userId) {
    return {
      globalRole: globalRole ?? null,
      storeRole: null,
      storeId: null,
      isSuperAdmin: globalRole === 'super_admin',
      isStoreAdmin: false,
      isStaff: false,
    };
  }

  const { data: membership } = await supabase
    .from('store_members')
    .select('store_id, role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const storeRole = (membership?.role as string | null) ?? null;
  const resolvedGlobal = globalRole ?? null;

  return {
    globalRole: resolvedGlobal,
    storeRole,
    storeId: (membership?.store_id as string | null) ?? null,
    isSuperAdmin: resolvedGlobal === 'super_admin',
    isStoreAdmin: storeRole === 'store_admin' || resolvedGlobal === 'store_admin',
    isStaff: storeRole === 'staff' || resolvedGlobal === 'staff',
  };
}
