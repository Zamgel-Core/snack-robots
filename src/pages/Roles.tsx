import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Crown,
  History,
  KeyRound,
  Lock,
  MailPlus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Store,
  UserCog,
  UserMinus,
  UserPlus,
  UsersRound,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  AppRole,
  CRITICAL_ACTIONS,
  CurrentAccess,
  PERMISSION_MATRIX,
  ROLE_DEFINITIONS,
  RoleAuditLog,
  RoleInvitation,
  StoreMember,
  cancelInvitation,
  createRoleInvitation,
  getCurrentAccess,
  getRoleDefinition,
  listRoleAuditLogs,
  listRoleInvitations,
  listStoreMembers,
  roleLabel,
  updateMemberRole,
  updateMemberStatus,
  validateSuperAdminPin,
} from '../lib/rolesService';

const pillByAccess = {
  full: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/30',
  pin: 'bg-yellow-400/20 text-yellow-200 border-yellow-300/30',
  limited: 'bg-sky-400/20 text-sky-200 border-sky-300/30',
  no: 'bg-red-500/15 text-red-100 border-red-300/25',
};

const labelByAccess = {
  full: 'Completo',
  pin: 'PIN Super Admin',
  limited: 'Limitado',
  no: 'Bloqueado',
};

const tabClasses = 'rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition';

function AccessPill({ value }: { value: keyof typeof pillByAccess }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${pillByAccess[value]}`}>
      {labelByAccess[value]}
    </span>
  );
}

function RoleIcon({ role }: { role: string }) {
  if (role === 'super_admin') return <Crown className="h-7 w-7" />;
  if (role === 'store_admin') return <Store className="h-7 w-7" />;
  return <UsersRound className="h-7 w-7" />;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2 text-blue-200">
        <Icon className="h-4 w-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.22em]">{label}</p>
      </div>
      <p className="text-2xl font-black text-yellow-300">{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: AppRole | string }) {
  const info = getRoleDefinition(role);
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-100">
      <RoleIcon role={info.role} />
      <span>{info.title}</span>
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function PinModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: (pin: string) => void;
  loading: boolean;
}) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (open) setPin('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] border border-yellow-300/30 bg-[#24115f] p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/20 text-yellow-300">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase">{title}</h3>
            <p className="mt-1 text-sm font-bold text-blue-100">{description}</p>
          </div>
        </div>

        <label className="text-[10px] font-black uppercase tracking-[0.28em] text-yellow-300">PIN de Super Admin</label>
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          type="password"
          placeholder="Ej. 1234"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-lg font-black outline-none ring-yellow-300/60 focus:ring-2"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest">
            Cancelar
          </button>
          <button
            disabled={loading || !pin.trim()}
            onClick={() => onConfirm(pin)}
            className="rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/30 disabled:opacity-50"
          >
            Autorizar
          </button>
        </div>
      </div>
    </div>
  );
}

export function Roles() {
  const { profile, user } = useAuth();
  const [access, setAccess] = useState<CurrentAccess | null>(null);
  const [members, setMembers] = useState<StoreMember[]>([]);
  const [invitations, setInvitations] = useState<RoleInvitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<RoleAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'invite' | 'audit'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', role: 'staff' as AppRole });
  const [pinState, setPinState] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: null | (() => Promise<void>);
  }>({ open: false, title: '', description: '', action: null });

  const activeRole = useMemo(() => {
    if (profile?.global_role === 'super_admin') return 'super_admin';
    return access?.storeRole || profile?.global_role || 'staff';
  }, [access?.storeRole, profile?.global_role]);

  const roleInfo = getRoleDefinition(activeRole);
  const canManageDirectly = profile?.global_role === 'super_admin';
  const canRequestPin = access?.isStoreAdmin && !canManageDirectly;
  const activeMembers = members.filter((member) => member.is_active).length;
  const pendingInvites = invitations.filter((item) => item.status === 'pending').length;

  async function loadData() {
    if (!user?.id) return;
    setLoading(true);
    setError('');

    try {
      const [accessData, membersData, invitesData, auditData] = await Promise.all([
        getCurrentAccess(user.id, profile?.global_role),
        listStoreMembers(user.id, profile?.global_role),
        listRoleInvitations(user.id),
        listRoleAuditLogs(user.id),
      ]);

      setAccess(accessData);
      setMembers(membersData);
      setInvitations(invitesData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar Roles. Si acabas de actualizar, corre primero el SQL de SR_UPDATE_014.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.global_role]);

  function runProtectedAction(title: string, description: string, action: () => Promise<void>) {
    setSuccess('');
    setError('');

    if (canManageDirectly) {
      action();
      return;
    }

    if (canRequestPin) {
      setPinState({ open: true, title, description, action });
      return;
    }

    setError('Tu rol no tiene permiso para realizar esta acción.');
  }

  async function confirmPin(pin: string) {
    if (!user?.id || !pinState.action) return;
    setSaving(true);
    setError('');

    try {
      const result = await validateSuperAdminPin(user.id, pin);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      await pinState.action();
      setPinState({ open: false, title: '', description: '', action: null });
    } catch (err) {
      console.error(err);
      setError('No se pudo validar el PIN o ejecutar la acción.');
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!user?.id) return;

    if (!inviteForm.email.trim() || !inviteForm.fullName.trim()) {
      setError('Nombre y correo son obligatorios para generar una invitación.');
      return;
    }

    runProtectedAction('Invitar empleado', 'Crear usuarios o invitaciones requiere autorización administrativa.', async () => {
      setSaving(true);
      try {
        const invitation = await createRoleInvitation({
          actorId: user.id,
          email: inviteForm.email,
          fullName: inviteForm.fullName,
          role: inviteForm.role,
        });
        setInviteForm({ fullName: '', email: '', role: 'staff' });
        setSuccess(`Invitación creada. Código: ${invitation.invite_code}`);
        await loadData();
      } finally {
        setSaving(false);
      }
    });
  }

  function handleRoleChange(member: StoreMember, newRole: AppRole) {
    if (!user?.id || member.role === newRole) return;

    runProtectedAction('Cambiar rol', `Cambiar el rol de ${member.display_name} requiere autorización superior.`, async () => {
      setSaving(true);
      try {
        await updateMemberRole({
          actorId: user.id,
          memberId: member.id,
          newRole,
          memberName: member.display_name,
          oldRole: member.role,
        });
        setSuccess(`Rol actualizado para ${member.display_name}.`);
        await loadData();
      } finally {
        setSaving(false);
      }
    });
  }

  function handleStatusChange(member: StoreMember, isActive: boolean) {
    if (!user?.id) return;

    runProtectedAction(isActive ? 'Reactivar acceso' : 'Desactivar acceso', `${isActive ? 'Reactivar' : 'Desactivar'} a ${member.display_name} es una acción crítica.`, async () => {
      setSaving(true);
      try {
        await updateMemberStatus({ actorId: user.id, memberId: member.id, isActive, memberName: member.display_name });
        setSuccess(`${member.display_name} fue ${isActive ? 'reactivado' : 'desactivado'}.`);
        await loadData();
      } finally {
        setSaving(false);
      }
    });
  }

  function handleCancelInvitation(invitation: RoleInvitation) {
    if (!user?.id) return;

    runProtectedAction('Cancelar invitación', `Cancelar la invitación de ${invitation.email} requiere autorización.`, async () => {
      setSaving(true);
      try {
        await cancelInvitation({ actorId: user.id, invitationId: invitation.id, email: invitation.email });
        setSuccess('Invitación cancelada.');
        await loadData();
      } finally {
        setSaving(false);
      }
    });
  }

  return (
    <div className="space-y-8 pb-10 text-white">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-yellow-300">Centro de permisos</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">Roles y permisos</h2>
          <p className="mt-2 text-xl font-medium text-blue-200">
            Administra empleados reales, permisos por rol y acciones críticas protegidas con PIN.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/30 transition hover:bg-orange-400 disabled:opacity-60 lg:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </header>

      <div className="rounded-[28px] border-4 border-white/80 bg-sky-400/90 p-4 shadow-xl">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🤖</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Robo Blue dice:</p>
            <p className="text-sm font-black text-blue-900">
              Store Admin puede operar fuerte, pero cambios delicados usan PIN de Super Admin para evitar errores como en POS comerciales.
            </p>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-3xl border border-red-300/40 bg-red-500/20 px-5 py-4 text-sm font-black text-red-100">{error}</div> : null}
      {success ? <div className="rounded-3xl border border-emerald-300/40 bg-emerald-500/20 px-5 py-4 text-sm font-black text-emerald-100">{success}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <StatCard label="Rol activo" value={roleInfo.title} icon={ShieldCheck} />
        <StatCard label="Empleados activos" value={`${activeMembers}`} icon={UsersRound} />
        <StatCard label="Invitaciones" value={`${pendingInvites} pendiente(s)`} icon={MailPlus} />
        <StatCard label="PIN requerido" value="Acciones críticas" icon={KeyRound} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-[28px] border border-white/15 bg-white/10 p-2 shadow-xl backdrop-blur-md">
        {[
          ['overview', 'Resumen'],
          ['employees', 'Empleados'],
          ['invite', 'Invitar'],
          ['audit', 'Auditoría'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`${tabClasses} ${activeTab === key ? 'bg-white text-blue-700 shadow-xl' : 'text-blue-100 hover:bg-white/10'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <>
          <section className={`rounded-[32px] border bg-gradient-to-br p-6 shadow-2xl ${roleInfo.tone}`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-yellow-300">
                  <RoleIcon role={roleInfo.role} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-300">Tu acceso actual</p>
                  <h3 className="mt-1 text-3xl font-black uppercase">{roleInfo.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm font-bold text-blue-100">{roleInfo.description}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/15 bg-black/20 p-4 text-sm font-black text-blue-100">
                <p className="text-[10px] uppercase tracking-[0.22em] text-blue-200">Ideal para</p>
                <p className="mt-2 text-white">{roleInfo.idealFor}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {ROLE_DEFINITIONS.map((role) => (
              <article key={role.role} className={`rounded-[32px] border bg-gradient-to-br p-6 shadow-2xl ${role.tone}`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-yellow-300">
                      <RoleIcon role={role.role} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-yellow-300">{role.badge}</p>
                      <h3 className="text-2xl font-black uppercase">{role.title}</h3>
                    </div>
                  </div>
                  {role.role === activeRole ? <CheckCircle2 className="h-6 w-6 text-emerald-300" /> : null}
                </div>
                <p className="min-h-[54px] text-sm font-bold text-blue-100">{role.shortDescription}</p>
                <div className="mt-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Puede hacer</p>
                  {role.canDo.map((item) => (
                    <div key={item} className="flex gap-2 text-sm font-bold text-blue-100">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-200">Límites</p>
                  {role.limitations.map((item) => (
                    <div key={item} className="flex gap-2 text-sm font-bold text-blue-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-300">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Matriz de permisos</h3>
                <p className="mt-1 text-sm font-bold text-blue-200">Mapa base para saber qué puede hacer cada rol.</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/15">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 border-b border-white/10 bg-white/10 p-4 text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">
                <span>Módulo / acción</span>
                <span>Super Admin</span>
                <span>Store Admin</span>
                <span>Staff</span>
              </div>
              {PERMISSION_MATRIX.map((row) => (
                <div key={row.key} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-3 border-b border-white/5 p-4 last:border-b-0">
                  <div>
                    <p className="font-black uppercase text-white">{row.module}</p>
                    <p className="mt-1 text-xs font-bold text-blue-200/80">{row.description}</p>
                  </div>
                  <AccessPill value={row.super_admin} />
                  <AccessPill value={row.store_admin} />
                  <AccessPill value={row.staff} />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {activeTab === 'employees' ? (
        <section className="rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-black uppercase">Empleados de la tienda</h3>
              <p className="text-sm font-bold text-blue-200">Cambia roles, activa/desactiva acceso y deja auditoría automática.</p>
            </div>
            <button onClick={() => setActiveTab('invite')} className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/30">
              <UserPlus className="h-4 w-4" /> Invitar
            </button>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className={`grid grid-cols-1 gap-4 rounded-3xl border p-4 md:grid-cols-[1.5fr_220px_160px] md:items-center ${member.is_active ? 'border-white/10 bg-black/15' : 'border-red-300/20 bg-red-500/10'}`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-lg font-black uppercase shadow-xl shadow-orange-500/20">
                    {member.display_name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{member.display_name}</p>
                    <p className="text-xs font-bold text-blue-200">ID: {member.user_id.slice(0, 8)} · {member.is_active ? 'Activo' : 'Desactivado'}</p>
                    <p className="text-[11px] font-bold text-blue-200/70">Creado: {formatDate(member.created_at)}</p>
                  </div>
                </div>

                <select
                  value={member.role}
                  disabled={saving || member.global_role === 'super_admin'}
                  onChange={(event) => handleRoleChange(member, event.target.value as AppRole)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white outline-none disabled:opacity-60"
                >
                  <option className="text-black" value="store_admin">Store Admin</option>
                  <option className="text-black" value="staff">Staff / Cajero</option>
                  {member.role === 'super_admin' ? <option className="text-black" value="super_admin">Super Admin</option> : null}
                </select>

                <button
                  disabled={saving || member.user_id === user?.id || member.global_role === 'super_admin'}
                  onClick={() => handleStatusChange(member, !member.is_active)}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-40 ${member.is_active ? 'bg-red-500/20 text-red-100 border border-red-300/25' : 'bg-emerald-500/20 text-emerald-100 border border-emerald-300/25'}`}
                >
                  {member.is_active ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {member.is_active ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'invite' ? (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_460px]">
          <form onSubmit={handleInvite} className="rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                <MailPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase">Invitar empleado</h3>
                <p className="text-sm font-bold text-blue-200">Por ahora genera una invitación interna con código. Después conectamos envío de correo.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-200">Nombre</span>
                <input value={inviteForm.fullName} onChange={(event) => setInviteForm((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Ej. Maria Lopez" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-bold outline-none ring-yellow-300/60 focus:ring-2" />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-200">Correo</span>
                <input value={inviteForm.email} onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))} type="email" placeholder="empleado@email.com" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-bold outline-none ring-yellow-300/60 focus:ring-2" />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {(['staff', 'store_admin'] as AppRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setInviteForm((prev) => ({ ...prev, role }))}
                  className={`rounded-3xl border p-4 text-left transition ${inviteForm.role === role ? 'border-yellow-300/70 bg-yellow-400/15' : 'border-white/10 bg-black/15 hover:bg-white/10'}`}
                >
                  <RoleBadge role={role} />
                  <p className="mt-3 text-sm font-bold text-blue-100">{getRoleDefinition(role).shortDescription}</p>
                </button>
              ))}
            </div>

            <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/30 disabled:opacity-60">
              <MailPlus className="h-4 w-4" /> Generar invitación
            </button>
          </form>

          <div className="rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <h3 className="text-xl font-black uppercase">Invitaciones recientes</h3>
            <div className="mt-5 space-y-3">
              {invitations.length ? invitations.map((invitation) => (
                <div key={invitation.id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{invitation.full_name || invitation.email}</p>
                      <p className="text-xs font-bold text-blue-200">{invitation.email}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${invitation.status === 'pending' ? 'bg-yellow-400/20 text-yellow-100' : 'bg-white/10 text-blue-100'}`}>{invitation.status}</span>
                  </div>
                  <div className="mt-3 rounded-xl bg-black/20 p-3 text-xs font-black text-yellow-100">Código: {invitation.invite_code}</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <RoleBadge role={invitation.role} />
                    {invitation.status === 'pending' ? (
                      <button onClick={() => handleCancelInvitation(invitation)} className="text-xs font-black uppercase tracking-widest text-red-100 hover:text-red-200">
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </div>
              )) : <p className="text-sm font-bold text-blue-200">Todavía no hay invitaciones.</p>}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'audit' ? (
        <section className="rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase">Auditoría de roles</h3>
              <p className="text-sm font-bold text-blue-200">Registro de invitaciones, cambios de rol, desactivaciones y validaciones PIN.</p>
            </div>
          </div>

          <div className="space-y-3">
            {auditLogs.length ? auditLogs.map((log) => (
              <div key={log.id} className="flex gap-4 rounded-3xl border border-white/10 bg-black/15 p-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-yellow-300">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black uppercase text-white">{log.action.replaceAll('_', ' ')}</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-100">{log.actor_name}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-blue-100">{log.description}</p>
                  <p className="mt-1 text-xs font-bold text-blue-200/70">{formatDate(log.created_at)}</p>
                </div>
              </div>
            )) : <p className="text-sm font-bold text-blue-200">Todavía no hay actividad registrada.</p>}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[32px] border border-yellow-300/25 bg-yellow-400/10 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/20 text-yellow-300">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Acciones que deben pedir PIN de Super Admin</h3>
              <p className="mt-1 text-sm font-bold text-yellow-100/80">El Store Admin puede operar con poder avanzado, pero estas acciones deben tener autorización superior.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {CRITICAL_ACTIONS.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-yellow-300/15 bg-black/15 p-4">
                <Lock className="h-5 w-5 shrink-0 text-yellow-300" />
                <p className="text-sm font-black text-yellow-50">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Siguiente etapa</h3>
              <p className="mt-1 text-sm font-bold text-blue-200">Después conectamos bloqueo por ruta y PIN en acciones reales.</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              'Bloquear rutas según permisos reales.',
              'Pedir PIN al cambiar precios o desactivar productos.',
              'Auditar ventas canceladas, cambios de inventario y cierre de caja.',
              'Convertir invitaciones en flujo completo de alta de usuario.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm font-bold text-blue-100">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PinModal
        open={pinState.open}
        title={pinState.title}
        description={pinState.description}
        loading={saving}
        onCancel={() => setPinState({ open: false, title: '', description: '', action: null })}
        onConfirm={confirmPin}
      />
    </div>
  );
}
