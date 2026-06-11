import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeDollarSign,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Filter,
  Loader2,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { StatCard } from '../components/StatCard';
import { RobotTip } from '../components/RobotTip';
import { useAuth } from '../contexts/AuthContext';
import {
  CashDateRange,
  CashMovement,
  CashRangePreset,
  closeCashSession,
  getCashRegisterData,
  getDefaultCashDateRange,
} from '../lib/cashService';

const INITIAL_CASH_STORAGE_KEY = 'snack-robots:cash-initial-amount';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-US', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatFullDateTime(value: string) {
  return new Intl.DateTimeFormat('es-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatRangeLabel(range: CashDateRange) {
  const from = new Date(`${range.from}T00:00:00`);
  const to = new Date(`${range.to}T00:00:00`);
  const formatter = new Intl.DateTimeFormat('es-US', { day: '2-digit', month: 'short', year: 'numeric' });

  if (range.from === range.to) return formatter.format(from);
  return `${formatter.format(from)} - ${formatter.format(to)}`;
}

function movementMatchesSearch(movement: CashMovement, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;

  return [movement.label, movement.description, movement.source, movement.type, movement.reference_id]
    .join(' ')
    .toLowerCase()
    .includes(normalized);
}

function getMovementSourceLabel(source: CashMovement['source']) {
  const labels: Record<CashMovement['source'], string> = {
    sale: 'Venta',
    purchase: 'Compra',
    manual_expense: 'Gasto',
    adjustment: 'Ajuste',
  };
  return labels[source];
}

function MovementRow({ movement, onOpen }: { movement: CashMovement; onOpen: (movement: CashMovement) => void }) {
  const isIncome = movement.type === 'income';

  return (
    <button
      type="button"
      onClick={() => onOpen(movement)}
      className="w-full group flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 bg-black/15 border border-white/10 rounded-[26px] text-white hover:bg-black/25 hover:border-yellow-300/30 transition-all text-left"
    >
      <div className="flex items-start gap-4 min-w-0">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
            isIncome
              ? 'bg-green-400/15 border-green-300/25 text-green-300'
              : 'bg-orange-400/15 border-orange-300/25 text-orange-300'
          }`}
        >
          {isIncome ? <ArrowDownToLine className="w-6 h-6" /> : <ArrowUpFromLine className="w-6 h-6" />}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-black uppercase tracking-tight">{movement.label}</p>
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                isIncome
                  ? 'bg-green-400/10 border-green-300/20 text-green-200'
                  : 'bg-orange-400/10 border-orange-300/20 text-orange-200'
              }`}
            >
              {getMovementSourceLabel(movement.source)}
            </span>
          </div>

          <p className="text-sm text-blue-100 font-semibold mt-1 truncate">{movement.description}</p>
          <p className="text-xs text-white/50 font-bold mt-2 flex items-center gap-2 uppercase tracking-wider">
            <Clock3 className="w-3.5 h-3.5" /> {formatDateTime(movement.occurred_at)}
          </p>
        </div>
      </div>

      <div className="text-left lg:text-right shrink-0">
        <p className={`text-2xl font-black ${isIncome ? 'text-green-300' : 'text-orange-300'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(movement.amount)}
        </p>
        {movement.profit !== undefined && (
          <p className="text-[10px] font-black uppercase tracking-widest text-white/45 mt-1">
            Ganancia: {formatCurrency(movement.profit)}
          </p>
        )}
      </div>
    </button>
  );
}

function MovementDetailModal({ movement, onClose }: { movement: CashMovement | null; onClose: () => void }) {
  if (!movement) return null;

  const isIncome = movement.type === 'income';
  const metadataEntries = Object.entries(movement.metadata ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gradient-to-br from-blue-700 via-purple-700 to-purple-900 border border-white/20 rounded-[32px] shadow-2xl text-white overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <p className="text-yellow-300 text-xs font-black uppercase tracking-[0.25em]">Detalle de movimiento</p>
            <h3 className="text-3xl font-black mt-2">{movement.label}</h3>
            <p className="text-blue-100 font-semibold mt-1">{movement.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-black/20 border border-white/10 rounded-3xl p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">Tipo</p>
            <p className={`text-2xl font-black mt-2 ${isIncome ? 'text-green-300' : 'text-orange-300'}`}>
              {isIncome ? 'Entrada' : 'Salida'} · {getMovementSourceLabel(movement.source)}
            </p>
          </div>

          <div className="bg-black/20 border border-white/10 rounded-3xl p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">Monto</p>
            <p className={`text-2xl font-black mt-2 ${isIncome ? 'text-green-300' : 'text-orange-300'}`}>
              {isIncome ? '+' : '-'}{formatCurrency(movement.amount)}
            </p>
          </div>

          <div className="bg-black/20 border border-white/10 rounded-3xl p-5 sm:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">Fecha y hora</p>
            <p className="text-xl font-black mt-2">{formatFullDateTime(movement.occurred_at)}</p>
          </div>

          {movement.reference_id && (
            <div className="bg-black/20 border border-white/10 rounded-3xl p-5 sm:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">Referencia</p>
              <p className="text-sm font-black mt-2 break-all">{movement.reference_id}</p>
            </div>
          )}

          {movement.profit !== undefined && (
            <div className="bg-green-400/10 border border-green-300/20 rounded-3xl p-5 sm:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-green-100">Ganancia de venta</p>
              <p className="text-2xl font-black mt-2 text-green-300">{formatCurrency(movement.profit)}</p>
            </div>
          )}

          {metadataEntries.length > 0 && (
            <div className="bg-black/20 border border-white/10 rounded-3xl p-5 sm:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-3">Datos adicionales</p>
              <div className="space-y-2">
                {metadataEntries.map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                    <span className="font-black uppercase tracking-wider text-blue-100">{key}</span>
                    <span className="font-bold text-white/85 text-left sm:text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CashRegister() {
  const { user } = useAuth();
  const [range, setRange] = useState<CashDateRange>(() => getDefaultCashDateRange('today'));
  const [initialCashInput, setInitialCashInput] = useState(() => localStorage.getItem(INITIAL_CASH_STORAGE_KEY) ?? '5.00');
  const [data, setData] = useState<Awaited<ReturnType<typeof getCashRegisterData>> | null>(null);
  const [realCash, setRealCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const initialCash = Number(initialCashInput || 0);

  async function loadCashRegister(nextRange = range, nextInitialCash = initialCash) {
    if (!user?.id) return;

    try {
      setLoading(true);
      setErrorMessage('');
      const result = await getCashRegisterData(user.id, nextRange, Number.isFinite(nextInitialCash) ? nextInitialCash : 0);
      setData(result);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || 'No se pudo cargar la caja.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCashRegister(range, initialCash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, range.from, range.to]);

  const expectedCash = data?.expectedCash ?? 0;
  const countedCash = Number(realCash || 0);
  const difference = useMemo(() => countedCash - expectedCash, [countedCash, expectedCash]);
  const hasCountedCash = realCash.trim() !== '';

  const filteredMovements = useMemo(() => {
    return (data?.movements ?? []).filter((movement) => {
      const matchesType = movementFilter === 'all' || movement.type === movementFilter;
      return matchesType && movementMatchesSearch(movement, search);
    });
  }, [data?.movements, movementFilter, search]);

  const incomePercentage = useMemo(() => {
    const income = data?.incomeTotal ?? 0;
    const expense = data?.expenseTotal ?? 0;
    const total = income + expense;
    if (total <= 0) return 50;
    return Math.round((income / total) * 100);
  }, [data?.incomeTotal, data?.expenseTotal]);

  const timelineGroups = useMemo(() => {
    return filteredMovements.reduce<Record<string, CashMovement[]>>((groups, movement) => {
      const key = new Intl.DateTimeFormat('es-US', { weekday: 'long', day: '2-digit', month: 'long' }).format(
        new Date(movement.occurred_at),
      );
      groups[key] = groups[key] ?? [];
      groups[key].push(movement);
      return groups;
    }, {});
  }, [filteredMovements]);

  function handlePresetChange(preset: CashRangePreset) {
    const nextRange = getDefaultCashDateRange(preset);
    setRange(nextRange);
    setSuccessMessage('');
    setErrorMessage('');
  }

  function saveInitialCash() {
    const normalized = Number(initialCashInput || 0);
    if (!Number.isFinite(normalized) || normalized < 0) {
      setSuccessMessage('');
      setErrorMessage('El fondo inicial debe ser un número válido mayor o igual a cero.');
      return;
    }

    localStorage.setItem(INITIAL_CASH_STORAGE_KEY, normalized.toFixed(2));
    setInitialCashInput(normalized.toFixed(2));
    setSuccessMessage(`Fondo inicial actualizado a ${formatCurrency(normalized)}.`);
    setErrorMessage('');
    loadCashRegister(range, normalized);
  }

  async function handleCloseCash() {
    if (!user?.id || !data) return;

    if (!hasCountedCash) {
      setSuccessMessage('');
      setErrorMessage('Ingresa el efectivo real contado para cerrar caja.');
      return;
    }

    try {
      setClosing(true);
      setErrorMessage('');
      await closeCashSession({
        userId: user.id,
        range,
        openingCash: data.initialCash,
        countedCash,
        expectedCash,
        difference,
        incomeTotal: data.incomeTotal,
        expenseTotal: data.expenseTotal,
        netTotal: data.netTotal,
        salesCount: data.salesCount,
        purchasesCount: data.purchasesCount,
        notes: closeNotes,
      });

      setSuccessMessage(
        Math.abs(difference) < 0.01
          ? 'Caja cerrada y guardada. El efectivo físico coincide con el sistema.'
          : `Caja cerrada y guardada. Diferencia: ${difference >= 0 ? '+' : ''}${formatCurrency(difference)}.`,
      );
      setRealCash('');
      setCloseNotes('');
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || 'No se pudo guardar el cierre de caja. Revisa el SQL de cash_sessions.');
    } finally {
      setClosing(false);
    }
  }

  function exportExcel() {
    if (!data) return;

    const exportDate = new Intl.DateTimeFormat('es-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date());

    const escapeHtml = (value: unknown) =>
      String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const money = (value: number) =>
      Number(value || 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      });

    const signedMoney = (movement: CashMovement) => `${movement.type === 'income' ? '+' : '-'}${money(movement.amount)}`;

    const summaryRows = [
      ['Periodo', formatRangeLabel(range)],
      ['Fecha de exportación', exportDate],
      ['Fondo inicial', money(data.initialCash)],
      ['Entradas', money(data.incomeTotal)],
      ['Salidas', money(data.expenseTotal)],
      ['Compras', money(data.purchaseExpenseTotal)],
      ['Gastos manuales', money(data.manualExpenseTotal)],
      ['Ajustes', money(data.adjustmentTotal)],
      ['Balance neto', money(data.netTotal)],
      ['Caja esperada', money(data.expectedCash)],
      ['Utilidad estimada', money(data.estimatedUtility)],
      ['Ventas registradas', data.salesCount],
      ['Compras registradas', data.purchasesCount],
      ['Ticket promedio', money(data.averageSale)],
      ['Compra promedio', money(data.averagePurchase)],
      ['Movimientos exportados', filteredMovements.length],
    ];

    const movementRows = filteredMovements.map((movement, index) => {
      const happenedAt = new Date(movement.occurred_at);
      const date = new Intl.DateTimeFormat('es-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(happenedAt);
      const time = new Intl.DateTimeFormat('es-US', { hour: 'numeric', minute: '2-digit' }).format(happenedAt);

      return `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(date)}</td>
          <td>${escapeHtml(time)}</td>
          <td class="${movement.type === 'income' ? 'income' : 'expense'}">${movement.type === 'income' ? 'Entrada' : 'Salida'}</td>
          <td>${escapeHtml(getMovementSourceLabel(movement.source))}</td>
          <td>${escapeHtml(movement.label)}</td>
          <td>${escapeHtml(movement.description)}</td>
          <td class="money ${movement.type === 'income' ? 'income' : 'expense'}">${escapeHtml(signedMoney(movement))}</td>
          <td class="money income">${movement.profit !== undefined ? escapeHtml(money(movement.profit)) : '-'}</td>
          <td>${escapeHtml(movement.reference_id ?? movement.id)}</td>
        </tr>`;
    });

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #1f2937;
            }
            .title {
              background: #2563eb;
              color: #ffffff;
              font-size: 22px;
              font-weight: 800;
              padding: 14px;
            }
            .subtitle {
              background: #4f46e5;
              color: #ffffff;
              font-weight: 700;
              padding: 10px 14px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 22px;
            }
            th {
              background: #312e81;
              color: #ffffff;
              font-weight: 800;
              padding: 10px;
              border: 1px solid #c7d2fe;
              text-align: left;
            }
            td {
              padding: 9px;
              border: 1px solid #dbeafe;
              vertical-align: top;
            }
            .section {
              background: #facc15;
              color: #1e1b4b;
              font-size: 16px;
              font-weight: 800;
              padding: 10px;
              border: 1px solid #d97706;
            }
            .label {
              background: #eef2ff;
              font-weight: 800;
              width: 260px;
            }
            .money {
              text-align: right;
              font-weight: 800;
              mso-number-format: Currency;
            }
            .income {
              color: #047857;
              font-weight: 800;
            }
            .expense {
              color: #dc2626;
              font-weight: 800;
            }
            .center {
              text-align: center;
            }
            .note {
              color: #64748b;
              font-size: 12px;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <div class="title">Snack Robots — Reporte de Caja</div>
          <div class="subtitle">${escapeHtml(formatRangeLabel(range))}</div>

          <table>
            <tr><td colspan="2" class="section">Resumen financiero</td></tr>
            ${summaryRows
              .map(
                ([label, value]) => `
                  <tr>
                    <td class="label">${escapeHtml(label)}</td>
                    <td>${escapeHtml(value)}</td>
                  </tr>`,
              )
              .join('')}
          </table>

          <table>
            <tr><td colspan="2" class="section">Salidas separadas</td></tr>
            <tr><td class="label">Compras</td><td class="money expense">${escapeHtml(money(data.purchaseExpenseTotal))}</td></tr>
            <tr><td class="label">Gastos manuales</td><td class="money expense">${escapeHtml(money(data.manualExpenseTotal))}</td></tr>
            <tr><td class="label">Ajustes</td><td class="money">${escapeHtml(money(data.adjustmentTotal))}</td></tr>
          </table>

          <table>
            <tr><td colspan="10" class="section">Detalle de movimientos</td></tr>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Origen</th>
              <th>Movimiento</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Ganancia</th>
              <th>Referencia</th>
            </tr>
            ${movementRows.length ? movementRows.join('') : '<tr><td colspan="10" class="center note">No hay movimientos para este periodo.</td></tr>'}
          </table>

          <p class="note">Generado automáticamente desde Snack Robots. Los montos negativos corresponden a salidas de caja.</p>
        </body>
      </html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snack-robots-caja-pro-${range.from}-${range.to}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) {
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
      <MovementDetailModal movement={selectedMovement} onClose={() => setSelectedMovement(null)} />

      <header className="mb-6 text-white flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-yellow-300 font-black uppercase tracking-[0.2em] text-xs mb-2">
            <Sparkles className="w-4 h-4" /> Control financiero pro
          </p>
          <h2 className="text-4xl font-black tracking-tight">Caja</h2>
          <p className="text-xl text-blue-200 font-medium mt-2">
            Entradas, salidas, utilidad, timeline y cierre auditable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportExcel}
            disabled={filteredMovements.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed border border-white/20 text-white px-5 py-3 rounded-2xl font-black uppercase tracking-wider active:scale-95 transition-all"
          >
            <Download className="w-5 h-5" /> Exportar Excel
          </button>
          <button
            onClick={() => loadCashRegister(range, initialCash)}
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-3 rounded-2xl font-black uppercase tracking-wider active:scale-95 transition-all shadow-xl shadow-orange-500/25"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
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
        message="Caja ya cruza ventas y compras reales. El cierre ahora se guarda como sesión en cash_sessions para auditoría. Los gastos manuales quedan preparados para el siguiente paso."
        type="info"
      />

      <section className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl p-5 text-white">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-5">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-yellow-300" /> Periodo de caja
            </h3>
            <p className="text-sm text-blue-100 font-semibold mt-1">{formatRangeLabel(range)}</p>
          </div>

          <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
            <div className="flex flex-wrap gap-2">
              {([
                ['today', 'Hoy'],
                ['week', '7 días'],
                ['month', 'Mes'],
              ] as [CashRangePreset, string][]).map(([preset, label]) => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-4 py-3 rounded-2xl font-black uppercase tracking-wider text-xs border transition-all ${
                    range.preset === preset
                      ? 'bg-yellow-300 text-blue-950 border-yellow-200 shadow-lg shadow-yellow-300/20'
                      : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="date"
                value={range.from}
                onChange={(event) => setRange((current) => ({ ...current, preset: 'custom', from: event.target.value }))}
                className="bg-black/20 border border-white/20 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-yellow-400"
              />
              <input
                type="date"
                value={range.to}
                onChange={(event) => setRange((current) => ({ ...current, preset: 'custom', to: event.target.value }))}
                className="bg-black/20 border border-white/20 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl p-5 text-white">
        <div className="flex flex-col xl:flex-row xl:items-end gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-yellow-300" /> Fondo inicial configurable
            </h3>
            <p className="text-sm text-blue-100 font-semibold mt-1">
              Define el efectivo con el que inicia la caja para calcular el cierre esperado.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 xl:w-[430px]">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-black text-xl">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={initialCashInput}
                onChange={(event) => setInitialCashInput(event.target.value)}
                className="w-full bg-black/20 border border-white/20 rounded-2xl py-3 pl-9 pr-4 text-white font-black focus:outline-none focus:border-yellow-400"
              />
            </div>
            <button
              type="button"
              onClick={saveInitialCash}
              className="bg-yellow-300 text-blue-950 px-5 py-3 rounded-2xl font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-yellow-300/20"
            >
              Guardar fondo
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
        <StatCard title="Fondo Inicial" value={formatCurrency(data?.initialCash ?? 0)} icon={Wallet} color="slate" />
        <StatCard
          title="Entradas"
          value={formatCurrency(data?.incomeTotal ?? 0)}
          icon={ArrowDownToLine}
          color="green"
          subtitle={`${data?.salesCount ?? 0} venta(s)`}
        />
        <StatCard
          title="Compras"
          value={formatCurrency(data?.purchaseExpenseTotal ?? 0)}
          icon={ArrowUpFromLine}
          color="red"
          subtitle={`${data?.purchasesCount ?? 0} compra(s)`}
        />
        <StatCard
          title="Utilidad"
          value={formatCurrency(data?.estimatedUtility ?? 0)}
          icon={Target}
          color={(data?.estimatedUtility ?? 0) >= 0 ? 'green' : 'red'}
          subtitle={`Ganancia ventas: ${formatCurrency(data?.grossProfit ?? 0)}`}
        />
        <StatCard
          title="Balance Neto"
          value={formatCurrency(data?.netTotal ?? 0)}
          icon={BadgeDollarSign}
          color={(data?.netTotal ?? 0) >= 0 ? 'green' : 'red'}
          subtitle="Entradas - salidas"
        />
        <StatCard title="Caja Esperada" value={formatCurrency(expectedCash)} icon={Calculator} color="blue" />
      </div>

      <section className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-5">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Resumen visual</h3>
            <p className="text-blue-100 font-semibold mt-1">Relación entre entradas, compras y utilidad del periodo.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-right">
            <div className="bg-green-400/10 border border-green-300/20 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-200">Ticket promedio</p>
              <p className="font-black text-green-300">{formatCurrency(data?.averageSale ?? 0)}</p>
            </div>
            <div className="bg-orange-400/10 border border-orange-300/20 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-200">Compra promedio</p>
              <p className="font-black text-orange-300">{formatCurrency(data?.averagePurchase ?? 0)}</p>
            </div>
            <div className="bg-red-400/10 border border-red-300/20 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-100">Gastos manuales</p>
              <p className="font-black text-red-200">{formatCurrency(data?.manualExpenseTotal ?? 0)}</p>
            </div>
            <div className="bg-yellow-400/10 border border-yellow-300/20 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-100">Ajustes</p>
              <p className="font-black text-yellow-300">{formatCurrency(data?.adjustmentTotal ?? 0)}</p>
            </div>
          </div>
        </div>

        <div className="h-5 rounded-full bg-orange-400/25 overflow-hidden border border-white/10">
          <div className="h-full bg-green-300 rounded-full transition-all" style={{ width: `${incomePercentage}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] uppercase tracking-widest font-black text-white/60">
          <span>Entradas {incomePercentage}%</span>
          <span>Salidas {100 - incomePercentage}%</span>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <section className="xl:col-span-2 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl overflow-hidden text-white">
          <div className="p-6 border-b border-white/10 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Timeline de movimientos</h3>
                <p className="text-blue-100 font-semibold mt-1">Click en cualquier movimiento para ver auditoría y referencia.</p>
              </div>
              <span className="bg-black/20 border border-white/10 px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest">
                {filteredMovements.length} visible(s)
              </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar movimiento, proveedor, venta o referencia..."
                  className="w-full bg-black/20 border border-white/20 rounded-2xl pl-12 pr-4 py-3 font-bold text-white placeholder-white/35 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="flex gap-2 bg-black/20 border border-white/10 rounded-2xl p-1">
                {([
                  ['all', 'Todos'],
                  ['income', 'Entradas'],
                  ['expense', 'Salidas'],
                ] as ['all' | 'income' | 'expense', string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setMovementFilter(value)}
                    className={`px-4 py-2 rounded-xl font-black uppercase tracking-wider text-xs transition-all ${
                      movementFilter === value ? 'bg-white text-blue-700' : 'text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-7">
            {filteredMovements.length === 0 ? (
              <div className="text-center py-14 text-white/55 font-bold">
                <Filter className="w-10 h-10 mx-auto mb-3 text-yellow-300" />
                No hay movimientos con esos filtros.
              </div>
            ) : (
              Object.entries(timelineGroups).map(([dateLabel, movements]) => (
                <div key={dateLabel} className="relative pl-6 border-l border-white/15">
                  <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-yellow-300 border-4 border-purple-700" />
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-yellow-300 mb-4">{dateLabel}</h4>
                  <div className="space-y-4">
                    {movements.map((movement) => (
                      <MovementRow key={`${movement.type}-${movement.id}`} movement={movement} onOpen={setSelectedMovement} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 p-6 shadow-xl text-white">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center justify-center gap-2">
              <ReceiptText className="w-6 h-6 text-yellow-300" /> Salidas separadas
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-orange-400/10 border border-orange-300/20 rounded-2xl p-4">
                <span className="font-black uppercase tracking-wider text-sm">Compras</span>
                <span className="font-black text-orange-300">{formatCurrency(data?.purchaseExpenseTotal ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between bg-red-400/10 border border-red-300/20 rounded-2xl p-4">
                <span className="font-black uppercase tracking-wider text-sm">Gastos</span>
                <span className="font-black text-red-200">{formatCurrency(data?.manualExpenseTotal ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between bg-yellow-400/10 border border-yellow-300/20 rounded-2xl p-4">
                <span className="font-black uppercase tracking-wider text-sm">Ajustes</span>
                <span className="font-black text-yellow-300">{formatCurrency(data?.adjustmentTotal ?? 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 p-8 shadow-xl flex flex-col items-center text-center text-white h-fit">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-2">
              <PiggyBank className="w-6 h-6 text-yellow-300" /> Cierre de Caja
            </h3>
            <p className="text-blue-100 font-medium mb-8">
              Cuenta el dinero físico, agrega una nota si hace falta y guarda el cierre para auditoría.
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

              <div>
                <label className="block text-xs font-black text-yellow-300 mb-2 text-left uppercase tracking-wider">
                  Nota del cierre:
                </label>
                <textarea
                  value={closeNotes}
                  onChange={(event) => setCloseNotes(event.target.value)}
                  placeholder="Ej. Todo cuadrado, faltante explicado, sobrante contado..."
                  rows={3}
                  className="w-full bg-black/20 border border-white/20 rounded-[20px] p-4 font-bold focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all text-white placeholder-white/30 resize-none"
                />
              </div>

              <button
                onClick={handleCloseCash}
                disabled={closing}
                className="w-full bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-[20px] font-black text-lg hover:bg-orange-400 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-xl uppercase tracking-widest shadow-orange-500/30"
              >
                {closing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Calculator className="w-6 h-6" />}
                Guardar cierre
              </button>

              <div className="bg-black/15 border border-white/10 rounded-2xl p-4 text-left text-xs text-white/60 font-bold leading-relaxed">
                <FileText className="w-4 h-4 inline mr-1 text-yellow-300" />
                Se guardará usuario, periodo, fondo inicial, ingresos, salidas, esperado, contado y diferencia.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
