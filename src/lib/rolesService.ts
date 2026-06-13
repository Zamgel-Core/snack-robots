import { supabase } from './supabase';

export type AppRole = 'super_admin' | 'store_admin' | 'staff';
export type InvitationStatus = 'pending' | 'accepted' | 'cancelled' | 'expired';

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

export type StoreMember = {
  id: string;
  store_id: string;
  user_id: string;
  role: AppRole;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  display_name: string;
  full_name: string;
  global_role: string | null;
};

export type RoleInvitation = {
  id: string;
  store_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  invite_code: string;
  status: InvitationStatus;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
};

export type RoleAuditLog = {
  id: string;
  store_id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor_name?: string;
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
  { key: 'dashboard', module: 'Dashboard', description: 'Resumen general del negocio.', super_admin: 'full', store_admin: 'full', staff: 'limited' },
  { key: 'pos', module: 'Vender / POS', description: 'Registrar ventas y cobrar productos.', super_admin: 'full', store_admin: 'full', staff: 'full' },
  { key: 'inventory_view', module: 'Ver inventario', description: 'Consultar productos, stock y alertas.', super_admin: 'full', store_admin: 'full', staff: 'limited' },
  { key: 'inventory_manage', module: 'Modificar inventario', description: 'Crear productos, cambiar costos, precios o desactivar artículos.', super_admin: 'full', store_admin: 'pin', staff: 'no' },
  { key: 'purchases', module: 'Compras', description: 'Registrar mercancía y aumentar stock.', super_admin: 'full', store_admin: 'full', staff: 'no' },
  { key: 'cash', module: 'Caja', description: 'Revisar movimientos, fondo inicial y cierre.', super_admin: 'full', store_admin: 'pin', staff: 'limited' },
  { key: 'reports', module: 'Reportes', description: 'Ver ventas, compras, utilidad y exportaciones.', super_admin: 'full', store_admin: 'full', staff: 'no' },
  { key: 'goals', module: 'Metas y logros', description: 'Consultar objetivos, progreso y medallas.', super_admin: 'full', store_admin: 'full', staff: 'limited' },
  { key: 'settings', module: 'Configuración', description: 'Cambios del negocio, ticket, caja, seguridad y apariencia.', super_admin: 'full', store_admin: 'pin', staff: 'no' },
  { key: 'roles', module: 'Roles y usuarios', description: 'Invitar empleados, cambiar roles y administrar permisos.', super_admin: 'full', store_admin: 'pin', staff: 'no' },
  { key: 'critical_actions', module: 'Acciones críticas', description: 'Eliminar/desactivar, cambiar precios, cancelar ventas, cerrar caja o cambiar permisos.', super_admin: 'full', store_admin: 'pin', staff: 'no' },
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

export function roleLabel(role?: string | null) {
  return getRoleDefinition(role).title;
}

export async function getCurrentStoreId(userId?: string | null) {
  if (userId) {
    const { data: membership, error } = await supabase
      .from('store_members')
      .select('store_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (membership?.store_id) return membership.store_id as string;
  }

  const { data: store, error: storeError } = await supabase.from('stores').select('id').limit(1).maybeSingle();
  if (storeError) throw storeError;
  return (store?.id as string | undefined) ?? null;
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

  const { data: membership, error } = await supabase
    .from('store_members')
    .select('store_id, role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

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

async function getProfilesByIds(userIds: string[]) {
  if (!userIds.length) return new Map<string, any>();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, global_role')
    .in('id', userIds);

  if (error) throw error;

  return new Map((data ?? []).map((profile) => [profile.id as string, profile]));
}

export async function listStoreMembers(userId: string, globalRole?: string | null): Promise<StoreMember[]> {
  const storeId = await getCurrentStoreId(userId);
  if (!storeId) return [];

  const { data, error } = await supabase
    .from('store_members')
    .select('id, store_id, user_id, role, is_active, created_at, updated_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  const profiles = await getProfilesByIds(rows.map((member) => member.user_id as string));

  const normalized = rows.map((member: any) => {
    const profile = profiles.get(member.user_id) ?? {};
    return {
      id: member.id,
      store_id: member.store_id,
      user_id: member.user_id,
      role: member.role as AppRole,
      is_active: member.is_active ?? true,
      created_at: member.created_at ?? null,
      updated_at: member.updated_at ?? null,
      display_name: profile.display_name || profile.full_name || 'Usuario sin nombre',
      full_name: profile.full_name || profile.display_name || 'Usuario sin nombre',
      global_role: profile.global_role ?? null,
    };
  });

  if (globalRole === 'super_admin') {
    return normalized.sort((a, b) => Number(b.is_active) - Number(a.is_active));
  }

  return normalized.filter((member) => member.role !== 'super_admin');
}

export async function listRoleInvitations(userId: string): Promise<RoleInvitation[]> {
  const storeId = await getCurrentStoreId(userId);
  if (!storeId) return [];

  const { data, error } = await supabase
    .from('store_member_invitations')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as RoleInvitation[];
}

export async function listRoleAuditLogs(userId: string): Promise<RoleAuditLog[]> {
  const storeId = await getCurrentStoreId(userId);
  if (!storeId) return [];

  const { data, error } = await supabase
    .from('role_audit_logs')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) throw error;

  const logs = (data ?? []) as RoleAuditLog[];
  const profiles = await getProfilesByIds(logs.map((log) => log.actor_id).filter(Boolean) as string[]);

  return logs.map((log) => ({
    ...log,
    actor_name: profiles.get(log.actor_id ?? '')?.display_name || profiles.get(log.actor_id ?? '')?.full_name || 'Sistema',
  }));
}

export async function createRoleAuditLog(params: {
  actorId?: string | null;
  storeId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from('role_audit_logs').insert({
    store_id: params.storeId,
    actor_id: params.actorId ?? null,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId ?? null,
    description: params.description,
    metadata: params.metadata ?? {},
  });

  if (error) throw error;
}

function generateInviteCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString(36).slice(-4).toUpperCase();
  return `SR-${random}-${time}`;
}

export async function createRoleInvitation(params: {
  actorId: string;
  email: string;
  fullName: string;
  role: AppRole;
}) {
  const storeId = await getCurrentStoreId(params.actorId);
  if (!storeId) throw new Error('No se encontró tienda activa para crear invitación.');

  if (params.role === 'super_admin') {
    throw new Error('No se puede invitar Super Admin desde tienda. Ese rol se controla desde la plataforma.');
  }

  const inviteCode = generateInviteCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const { data, error } = await supabase
    .from('store_member_invitations')
    .insert({
      store_id: storeId,
      email: params.email.trim().toLowerCase(),
      full_name: params.fullName.trim(),
      role: params.role,
      invite_code: inviteCode,
      status: 'pending',
      created_by: params.actorId,
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (error) throw error;

  await createRoleAuditLog({
    actorId: params.actorId,
    storeId,
    action: 'invite_employee',
    targetType: 'invitation',
    targetId: data.id,
    description: `Creó invitación para ${params.email.trim().toLowerCase()} como ${roleLabel(params.role)}.`,
    metadata: { email: params.email.trim().toLowerCase(), role: params.role },
  });

  return data as RoleInvitation;
}

export async function updateMemberRole(params: {
  actorId: string;
  memberId: string;
  newRole: AppRole;
  memberName: string;
  oldRole?: string | null;
}) {
  if (params.newRole === 'super_admin') {
    throw new Error('El rol Super Admin no se asigna desde esta pantalla.');
  }

  const { data, error } = await supabase
    .from('store_members')
    .update({ role: params.newRole, updated_at: new Date().toISOString() })
    .eq('id', params.memberId)
    .select('store_id, user_id, role')
    .single();

  if (error) throw error;

  await createRoleAuditLog({
    actorId: params.actorId,
    storeId: data.store_id,
    action: 'change_role',
    targetType: 'store_member',
    targetId: params.memberId,
    description: `Cambió el rol de ${params.memberName} a ${roleLabel(params.newRole)}.`,
    metadata: { oldRole: params.oldRole, newRole: params.newRole, userId: data.user_id },
  });

  return data;
}

export async function updateMemberStatus(params: {
  actorId: string;
  memberId: string;
  isActive: boolean;
  memberName: string;
}) {
  const { data, error } = await supabase
    .from('store_members')
    .update({ is_active: params.isActive, updated_at: new Date().toISOString() })
    .eq('id', params.memberId)
    .select('store_id, user_id')
    .single();

  if (error) throw error;

  await createRoleAuditLog({
    actorId: params.actorId,
    storeId: data.store_id,
    action: params.isActive ? 'reactivate_member' : 'deactivate_member',
    targetType: 'store_member',
    targetId: params.memberId,
    description: `${params.isActive ? 'Reactivó' : 'Desactivó'} el acceso de ${params.memberName}.`,
    metadata: { isActive: params.isActive, userId: data.user_id },
  });

  return data;
}

export async function cancelInvitation(params: { actorId: string; invitationId: string; email: string }) {
  const { data, error } = await supabase
    .from('store_member_invitations')
    .update({ status: 'cancelled' })
    .eq('id', params.invitationId)
    .select('store_id')
    .single();

  if (error) throw error;

  await createRoleAuditLog({
    actorId: params.actorId,
    storeId: data.store_id,
    action: 'cancel_invitation',
    targetType: 'invitation',
    targetId: params.invitationId,
    description: `Canceló la invitación de ${params.email}.`,
    metadata: { email: params.email },
  });
}

export async function validateSuperAdminPin(userId: string, pin: string) {
  const storeId = await getCurrentStoreId(userId);
  if (!storeId) return { ok: false, message: 'No se encontró tienda activa.' };

  const { data, error } = await supabase
    .from('store_settings')
    .select('critical_action_pin')
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) throw error;

  const storedPin = String(data?.critical_action_pin ?? '').trim();
  if (!storedPin) {
    return { ok: false, message: 'Todavía no hay PIN configurado en Configuración > Seguridad.' };
  }

  if (String(pin).trim() !== storedPin) {
    return { ok: false, message: 'PIN incorrecto. La acción fue bloqueada.' };
  }

  await createRoleAuditLog({
    actorId: userId,
    storeId,
    action: 'validate_super_admin_pin',
    targetType: 'security',
    description: 'Se validó PIN de Super Admin para una acción crítica.',
    metadata: { validatedAt: new Date().toISOString() },
  });

  return { ok: true, message: 'PIN autorizado.' };
}
