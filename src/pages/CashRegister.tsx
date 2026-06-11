import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calculator,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { StatCard } from '../components/StatCard';
import { RobotTip } from '../components/RobotTip';
import { useAuth } from '../contexts/AuthContext';
import { CashMovement, getCashRegisterData } from '../lib/cashService';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-US', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function MovementRow({ movement }: { movement: CashMovement }) {
  const isIncome = movement.type === 'income';

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-black/15 border border-white/10 rounded-[24px] text-white">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
            isIncome
              ? 'bg-green-400/15 border-green-300/25 text-green-300'
              : 'bg-orange-400/15 border-orange-300/25 text-orange-300'
          }`}
        >
          {isIncome ? <ArrowDownToLine className="w-6 h-6" /> : <ArrowUpFromLine className="w-6 h-6" />}
        </div>

        <div>
          <p className="text-base font-black uppercase tracking-tight">{movement.label}</p>
          <p className="text-sm text-blue-100 font-semibold mt-1">{movement.description}</p>
          <p className="text-xs text-white/50 font-bold mt-2 flex items-center gap-2 uppercase tracking-wider">
            <Clock3 className="w-3.5 h-3.5" /> {formatDateTime(movement.occurred_at)}
          </p>
        </div>
      </div>

      <p className={`text-2xl font-black ${isIncome ? 'text-green-300' : 'text-orange-300'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(movement.amount)}
      </p>
    </div>
  );
}

export function CashRegister() {
  const { user } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof getCashRegisterData>> | null>(null);
  const [realCash, setRealCash] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function loadCashRegister() {
    if (!user?.id) return;

    try {
      setLoading(true);
      setErrorMessage('');
      const result = await getCashRegisterData(user.id);
      setData(result);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || 'No se pudo cargar la caja.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCashRegister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const expectedCash = data?.expectedCash ?? 0;
  const countedCash = Number(realCash || 0);
  const difference = useMemo(() => countedCash - expectedCash, [countedCash, expectedCash]);
  const hasCountedCash = realCash.trim() !== '';

  function handleCloseCash() {
    if (!hasCountedCash) {
      setSuccessMessage('');
      setErrorMessage('Ingresa el efectivo real contado para calcular el cierre.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage(
      Math.abs(difference) < 0.01
        ? 'Caja cuadrada. El efectivo físico coincide con el sistema.'
        : `Cierre calculado. Diferencia: ${difference >= 0 ? '+' : ''}${formatCurrency(difference)}.`,
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 flex items-center gap-4 shadow-2xl">
          <Loader2 className="w-7 h-7 animate-spin text-yellow-300" />
          <div>
            <p className="text-xl font-black">Cargando caja...</p>
            <p className="text-sm text-blue-100 font-semibold">Leyendo ventas y compras reales</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header className="mb-6 text-white flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Caja</h2>
          <p className="text-xl text-blue-200 font-medium mt-2">
            Control real del efectivo del día.
          </p>
        </div>

        <button
          onClick={loadCashRegister}
          className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-5 py-3 rounded-2xl font-black uppercase tracking-wider active:scale-95 transition-all"
        >
          <RefreshCw className="w-5 h-5" /> Actualizar
        </button>
      </header>

      {errorMessage && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-3xl p-5 text-red-100 font-black flex items-center gap-3">
          <AlertCircle className="w-5 h-5" /> {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/20 border border-green-400/30 rounded-3xl p-5 text-green-100 font-black flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" /> {successMessage}
        </div>
      )}

      <RobotTip
        message="Caja ya calcula entradas desde ventas reales y salidas desde compras reales. El cierre todavía es cálculo visual; después lo guardaremos como sesión cerrada."
        type="warning"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Fondo Inicial" value={formatCurrency(data?.initialCash ?? 0)} icon={Wallet} color="slate" />
        <StatCard
          title="Entradas (Ventas)"
          value={formatCurrency(data?.todaySales ?? 0)}
          icon={ArrowDownToLine}
          color="green"
          subtitle={`${data?.salesCount ?? 0} venta(s) hoy`}
        />
        <StatCard
          title="Salidas (Compras)"
          value={formatCurrency(data?.todayPurchases ?? 0)}
          icon={ArrowUpFromLine}
          color="red"
          subtitle={`${data?.purchasesCount ?? 0} compra(s) hoy`}
        />
        <StatCard title="Efectivo Esperado" value={formatCurrency(expectedCash)} icon={Calculator} color="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <section className="xl:col-span-2 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl overflow-hidden text-white">
          <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Movimientos de Hoy</h3>
              <p className="text-blue-100 font-semibold mt-1">Ventas y compras conectadas a Supabase.</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {(data?.movements ?? []).length === 0 ? (
              <div className="text-center py-14 text-white/55 font-bold">
                Todavía no hay movimientos de caja hoy.
              </div>
            ) : (
              data?.movements.map((movement) => <MovementRow key={`${movement.type}-${movement.id}`} movement={movement} />)
            )}
          </div>
        </section>

        <section className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 p-8 shadow-xl flex flex-col items-center text-center text-white h-fit">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Cierre de Caja</h3>
          <p className="text-blue-100 font-medium mb-8">
            Cuenta el dinero físico y compáralo contra el efectivo esperado por el sistema.
          </p>

          <div className="w-full space-y-6">
            <div className="bg-black/15 border border-white/10 rounded-[24px] p-5 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-300">Esperado</p>
              <p className="text-3xl font-black mt-2">{formatCurrency(expectedCash)}</p>
            </div>

            <div>
              <label className="block text-xs font-black text-yellow-300 mb-2 text-left uppercase tracking-wider">
                Efectivo real en caja:
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-black text-2xl">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={realCash}
                  onChange={(event) => {
                    setRealCash(event.target.value);
                    setSuccessMessage('');
                    setErrorMessage('');
                  }}
                  placeholder="0.00"
                  className="w-full bg-black/20 border border-white/20 rounded-[20px] py-4 pl-10 pr-4 text-2xl font-black focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all text-white placeholder-white/30"
                />
              </div>
            </div>

            {hasCountedCash && (
              <div
                className={`rounded-[24px] p-5 border text-left ${
                  Math.abs(difference) < 0.01
                    ? 'bg-green-400/15 border-green-300/25'
                    : 'bg-orange-400/15 border-orange-300/25'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Diferencia</p>
                <p className="text-3xl font-black mt-2">
                  {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </p>
              </div>
            )}

            <button
              onClick={handleCloseCash}
              className="w-full bg-orange-500 text-white py-4 rounded-[20px] font-black text-lg hover:bg-orange-400 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-xl uppercase tracking-widest shadow-orange-500/30"
            >
              <Calculator className="w-6 h-6" /> Calcular Cierre
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
