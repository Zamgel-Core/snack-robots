import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { canAccess, getEffectiveRole, PermissionKey, roleLabel } from '../lib/permissions';

function AccessDenied({ permission }: { permission: PermissionKey }) {
  const { profile } = useAuth();
  const role = getEffectiveRole(profile);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl text-center">
        <div className="mx-auto mb-5 w-20 h-20 rounded-3xl bg-red-500/20 border border-red-300/40 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-yellow-300" />
        </div>
        <p className="text-yellow-300 text-xs font-black uppercase tracking-[0.35em] mb-3">
          Acceso protegido
        </p>
        <h1 className="text-4xl font-black mb-3">No tienes permiso para este módulo</h1>
        <p className="text-blue-100 font-semibold leading-relaxed mb-6">
          Tu rol actual es <span className="text-yellow-300 font-black">{roleLabel(role)}</span>. Este apartado está bloqueado para proteger información sensible y evitar cambios no autorizados.
        </p>
        <div className="rounded-3xl bg-cyan-400/20 border-2 border-cyan-200/80 p-4 text-left mb-6">
          <div className="flex items-start gap-3">
            <Bot className="w-8 h-8 text-white flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-blue-800/70">Robo Blue dice:</p>
              <p className="text-sm font-black text-blue-950">
                Pide a un Super Admin que te cambie el rol o autorice la acción con PIN cuando aplique.
              </p>
            </div>
          </div>
        </div>
        <a
          href="/portal"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 transition font-black shadow-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al Dashboard
        </a>
      </div>
    </div>
  );
}

export function AccessGuard({
  permission,
  children,
  redirect = false,
}: {
  permission: PermissionKey;
  children: React.ReactNode;
  redirect?: boolean;
}) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white font-black text-xl">
        Validando permisos...
      </div>
    );
  }

  if (!canAccess(profile, permission)) {
    if (redirect) return <Navigate to="/portal" state={{ from: location }} replace />;
    return <AccessDenied permission={permission} />;
  }

  return <>{children}</>;
}
