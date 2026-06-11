import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Download,
  Loader2,
  Package,
  PieChart,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  WalletCards,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { StatCard } from '../components/StatCard';
import { RobotTip } from '../components/RobotTip';
import { useAuth } from '../contexts/AuthContext';
import {
  ReportData,
  ReportDateRange,
  ReportRangePreset,
  getDefaultReportDateRange,
  getReportsData,
} from '../lib/reportsService';

function formatRangeLabel(range: ReportDateRange) {
  const from = new Date(`${range.from}T00:00:00`);
  const to = new Date(`${range.to}T00:00:00`);
  const formatter = new Intl.DateTimeFormat('es-US', { day: '2-digit', month: 'short', year: 'numeric' });

  if (range.from === range.to) return formatter.format(from);
  return `${formatter.format(from)} - ${formatter.format(to)}`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('es-US', { day: '2-digit', month: 'short' }).format(new Date(`${value}T00:00:00`));
}

function safePercent(value: number) {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

function formatTrend(value: number) {
  if (!Number.isFinite(value)) return '0.0%';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

function TrendBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const positive = value >= 0;
  const good = inverse ? !positive : positive;
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${
      good ? 'bg-green-300/15 text-green-200 border-green-300/25' : 'bg-red-400/15 text-red-200 border-red-300/25'
    }`}>
      <Icon className="w-3.5 h-3.5" />
      {formatTrend(value)} vs periodo anterior
    </span>
  );
}

function getPresetLabel(preset: ReportRangePreset) {
  const labels: Record<ReportRangePreset, string> = {
    today: 'Hoy',
    yesterday: 'Ayer',
    week: '7 días',
    month: 'Mes',
    year: 'Año',
    custom: 'Custom',
  };
  return labels[preset];
}

function downloadReportsExcel(data: ReportData) {
  const escapeHtml = (value: unknown) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const metricRows = [
    ['Periodo', formatRangeLabel(data.range)],
    ['Ventas totales', data.salesTotal],
    ['Compras totales', data.purchasesTotal],
    ['Ganancia bruta', data.grossProfit],
    ['Utilidad estimada', data.utility],
    ['Número de ventas', data.salesCount],
    ['Número de compras', data.purchasesCount],
    ['Ticket promedio', data.averageTicket],
    ['Compra promedio', data.averagePurchase],
    ['Costo de inventario', data.inventoryCost],
    ['Ventas periodo anterior', data.previousSalesTotal],
    ['Compras periodo anterior', data.previousPurchasesTotal],
    ['Utilidad periodo anterior', data.previousUtility],
    ['Cambio ventas', formatTrend(data.salesChangePercent)],
    ['Cambio compras', formatTrend(data.purchasesChangePercent)],
    ['Cambio utilidad', formatTrend(data.utilityChangePercent)],
    ['Valor venta inventario', data.inventorySaleValue],
    ['Ganancia potencial inventario', data.inventoryPotentialProfit],
  ];

  const table = (title: string, headers: string[], rows: unknown[][]) => `
    <h2>${escapeHtml(title)}</h2>
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
          .join('')}
      </tbody>
    </table>
  `;

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #1d4ed8; }
          h2 { margin-top: 28px; color: #4c1d95; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
          th { background: #2563eb; color: white; text-align: left; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; }
          .money { mso-number-format: '"$"#,##0.00'; }
        </style>
      </head>
      <body>
        <h1>Snack Robots - Reporte financiero PRO</h1>
        <p><strong>Generado:</strong> ${escapeHtml(new Date().toLocaleString('es-US'))}</p>
        <p><strong>Lectura rápida:</strong> ventas menos compras de mercancía = utilidad estimada del periodo.</p>
        ${table('Resumen', ['Métrica', 'Valor'], metricRows)}
        ${table(
          'Ventas / Compras por día',
          ['Fecha', 'Ventas', 'Compras', 'Ganancia bruta', 'Utilidad'],
          data.daily.map((day) => [day.date, day.sales, day.purchases, day.profit, day.utility]),
        )}
        ${table(
          'Productos más vendidos',
          ['Producto', 'Cantidad', 'Ingresos', 'Ganancia'],
          data.topSoldProducts.map((item) => [item.productName, item.quantity, item.total, item.profit ?? 0]),
        )}
        ${table(
          'Productos más comprados',
          ['Producto', 'Cantidad', 'Costo'],
          data.topPurchasedProducts.map((item) => [item.productName, item.quantity, item.total]),
        )}
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `snack-robots-reportes-${data.range.from}-${data.range.to}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

function MiniBarChart({ data }: { data: ReportData['daily'] }) {
  const max = Math.max(1, ...data.map((day) => Math.max(day.sales, day.purchases, Math.abs(day.utility))));
  const visible = data.slice(-14);

  if (visible.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-white/50 font-black uppercase tracking-widest">
        Sin datos para graficar todavía.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[720px] h-80 flex items-end gap-3 pt-10">
        {visible.map((day) => {
          const salesHeight = Math.max(4, (day.sales / max) * 210);
          const purchasesHeight = Math.max(4, (day.purchases / max) * 210);
          const utilityHeight = Math.max(4, (Math.abs(day.utility) / max) * 210);
          const utilityPositive = day.utility >= 0;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-2">
              <div className="w-full flex items-end justify-center gap-1 h-[220px]">
                <div
                  title={`Ventas ${formatCurrency(day.sales)}`}
                  className="w-4 rounded-t-xl bg-green-300/80 border border-green-200/30"
                  style={{ height: `${salesHeight}px` }}
                />
                <div
                  title={`Compras ${formatCurrency(day.purchases)}`}
                  className="w-4 rounded-t-xl bg-orange-300/80 border border-orange-200/30"
                  style={{ height: `${purchasesHeight}px` }}
                />
                <div
                  title={`Utilidad ${formatCurrency(day.utility)}`}
                  className={`w-4 rounded-t-xl border ${utilityPositive ? 'bg-yellow-300/85 border-yellow-200/30' : 'bg-red-400/85 border-red-200/30'}`}
                  style={{ height: `${utilityHeight}px` }}
                />
              </div>
              <span className="text-[10px] font-black text-white/60 uppercase whitespace-nowrap">{formatShortDate(day.date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingTable({
  title,
  subtitle,
  icon,
  items,
  totalLabel,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: ReportData['topSoldProducts'];
  totalLabel: string;
}) {
  const visibleItems = items.slice(0, 5);
  const maxQuantity = Math.max(1, ...visibleItems.map((item) => item.quantity));

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[32px] shadow-xl overflow-hidden text-white">
      <div className="p-6 border-b border-white/10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-yellow-300/15 text-yellow-300 border border-yellow-300/20 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight">{title}</h3>
          <p className="text-sm text-blue-100 font-semibold">{subtitle}</p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {visibleItems.length === 0 ? (
          <div className="p-10 text-center text-white/50 font-black uppercase tracking-widest">Sin datos en este periodo.</div>
        ) : (
          visibleItems.map((item, index) => {
            const progress = Math.max(6, (item.quantity / maxQuantity) * 100);

            return (
              <div key={item.productId} className="bg-black/15 border border-white/10 rounded-3xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center font-black text-yellow-300 shrink-0">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-base truncate">{item.productName}</p>
                      <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">{item.quantity} pieza(s)</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-yellow-300">{formatCurrency(item.total)}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/45">{totalLabel}</p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function Reports() {
  const { user } = useAuth();
  const [range, setRange] = useState<ReportDateRange>(() => getDefaultReportDateRange('today'));
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadReports(nextRange = range) {
    if (!user?.id) return;

    try {
      setLoading(true);
      setErrorMessage('');
      const result = await getReportsData(user.id, nextRange);
      setData(result);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || 'No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, range.from, range.to]);

  const margin = useMemo(() => {
    if (!data?.salesTotal) return 0;
    return (data.grossProfit / data.salesTotal) * 100;
  }, [data]);

  const utilityStatus = (data?.utility ?? 0) >= 0;
  const bestDay = useMemo(() => {
    if (!data?.daily.length) return null;
    return [...data.daily].sort((a, b) => b.sales - a.sales)[0];
  }, [data]);

  function handlePreset(preset: ReportRangePreset) {
    setRange(getDefaultReportDateRange(preset));
  }

  function handleCustomDate(field: 'from' | 'to', value: string) {
    setRange((current) => ({ ...current, preset: 'custom', [field]: value }));
  }

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin mr-3" />
        <span className="font-black text-xl">Cargando reportes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10 text-white">
      <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div>
          <p className="text-yellow-300 text-xs font-black uppercase tracking-[0.35em] flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Centro de análisis
          </p>
          <h2 className="text-4xl font-black tracking-tight mt-2">Reportes</h2>
          <p className="text-xl text-blue-200 font-medium mt-2">Ventas, compras, utilidad, rankings e inventario en tiempo real.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => data && downloadReportsExcel(data)}
            disabled={!data}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 border border-white/20 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-wide transition-all"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            type="button"
            onClick={() => loadReports(range)}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-wide shadow-lg shadow-orange-900/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </header>

      <RobotTip>
        Reportes cruza ventas completadas, compras activas e inventario actual. Esta versión ya sirve para tomar decisiones rápidas; después podemos pulir PDF y gráficas más avanzadas.
      </RobotTip>

      {errorMessage && (
        <div className="bg-red-500/20 border border-red-300/30 rounded-3xl p-4 flex items-center gap-3 text-red-50 font-bold">
          <AlertCircle className="w-5 h-5" /> {errorMessage}
        </div>
      )}

      <section className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[30px] p-5 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h3 className="font-black uppercase tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-yellow-300" /> Periodo del reporte
            </h3>
            <p className="text-sm text-blue-100 font-semibold mt-1">{data ? formatRangeLabel(data.range) : formatRangeLabel(range)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['today', 'yesterday', 'week', 'month', 'year'] as ReportRangePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all ${
                  range.preset === preset ? 'bg-yellow-300 text-blue-950' : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {getPresetLabel(preset)}
              </button>
            ))}
            <input
              type="date"
              value={range.from}
              onChange={(event) => handleCustomDate('from', event.target.value)}
              className="bg-black/20 border border-white/15 rounded-2xl px-4 py-2 text-sm font-bold outline-none focus:border-yellow-300/70"
            />
            <input
              type="date"
              value={range.to}
              onChange={(event) => handleCustomDate('to', event.target.value)}
              className="bg-black/20 border border-white/15 rounded-2xl px-4 py-2 text-sm font-bold outline-none focus:border-yellow-300/70"
            />
          </div>
        </div>
      </section>

      {data && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard title="Ventas" value={formatCurrency(data.salesTotal)} icon={ShoppingCart} color="green" />
            <StatCard title="Compras" value={formatCurrency(data.purchasesTotal)} icon={ShoppingBag} color="orange" />
            <StatCard title="Ganancia bruta" value={formatCurrency(data.grossProfit)} icon={TrendingUp} color="blue" />
            <StatCard title="Utilidad" value={formatCurrency(data.utility)} icon={utilityStatus ? Target : TrendingDown} color={utilityStatus ? 'purple' : 'red'} />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-white/10 border border-white/15 rounded-3xl p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Ventas</p>
              <p className="text-3xl font-black mt-2">{data.salesCount}</p>
              <p className="text-xs text-white/45 font-bold mt-1">tickets</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-3xl p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Compras</p>
              <p className="text-3xl font-black mt-2">{data.purchasesCount}</p>
              <p className="text-xs text-white/45 font-bold mt-1">registros</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-3xl p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Ticket promedio</p>
              <p className="text-3xl font-black mt-2 text-green-300">{formatCurrency(data.averageTicket)}</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-3xl p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Compra promedio</p>
              <p className="text-3xl font-black mt-2 text-orange-300">{formatCurrency(data.averagePurchase)}</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-3xl p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Margen bruto</p>
              <p className="text-3xl font-black mt-2 text-yellow-300">{safePercent(margin)}</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-3xl p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Mejor día</p>
              <p className="text-xl font-black mt-2 text-white">{bestDay ? formatShortDate(bestDay.date) : '—'}</p>
              <p className="text-xs text-yellow-300 font-black mt-1">{bestDay ? formatCurrency(bestDay.sales) : formatCurrency(0)}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white/10 border border-white/15 rounded-[28px] p-5 shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Comparativo de ventas</p>
              <div className="flex items-end justify-between gap-4 mt-3">
                <div>
                  <p className="text-3xl font-black text-green-300">{formatCurrency(data.salesTotal)}</p>
                  <p className="text-xs font-bold text-white/45 mt-1">Antes: {formatCurrency(data.previousSalesTotal)}</p>
                </div>
                <TrendBadge value={data.salesChangePercent} />
              </div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-[28px] p-5 shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Control de compras</p>
              <div className="flex items-end justify-between gap-4 mt-3">
                <div>
                  <p className="text-3xl font-black text-orange-300">{formatCurrency(data.purchasesTotal)}</p>
                  <p className="text-xs font-bold text-white/45 mt-1">Antes: {formatCurrency(data.previousPurchasesTotal)}</p>
                </div>
                <TrendBadge value={data.purchasesChangePercent} inverse />
              </div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-[28px] p-5 shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Comparativo de utilidad</p>
              <div className="flex items-end justify-between gap-4 mt-3">
                <div>
                  <p className={`text-3xl font-black ${data.utility >= 0 ? 'text-yellow-300' : 'text-red-300'}`}>{formatCurrency(data.utility)}</p>
                  <p className="text-xs font-bold text-white/45 mt-1">Antes: {formatCurrency(data.previousUtility)}</p>
                </div>
                <TrendBadge value={data.utilityChangePercent} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[32px] shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-yellow-300" /> Gráfica rápida
                  </h3>
                  <p className="text-sm text-blue-100 font-semibold">Verde: ventas · Naranja: compras · Amarillo/Rojo: utilidad</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                  <span className="px-3 py-2 rounded-full bg-green-300/15 text-green-200 border border-green-300/20">Ventas</span>
                  <span className="px-3 py-2 rounded-full bg-orange-300/15 text-orange-200 border border-orange-300/20">Compras</span>
                  <span className="px-3 py-2 rounded-full bg-yellow-300/15 text-yellow-200 border border-yellow-300/20">Utilidad</span>
                </div>
              </div>
              <div className="px-5 pb-5">
                <MiniBarChart data={data.daily} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[32px] shadow-xl p-6 space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <PieChart className="w-6 h-6 text-yellow-300" /> Inventario
              </h3>
              <div className="bg-black/15 border border-white/10 rounded-3xl p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Costo actual</p>
                <p className="text-3xl font-black mt-2">{formatCurrency(data.inventoryCost)}</p>
              </div>
              <div className="bg-black/15 border border-white/10 rounded-3xl p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Valor a precio venta</p>
                <p className="text-3xl font-black mt-2 text-green-300">{formatCurrency(data.inventorySaleValue)}</p>
              </div>
              <div className="bg-green-400/10 border border-green-300/20 rounded-3xl p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-green-100">Ganancia potencial</p>
                <p className="text-3xl font-black mt-2 text-green-300">{formatCurrency(data.inventoryPotentialProfit)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/15 border border-white/10 rounded-3xl p-4">
                  <p className="text-xs font-black uppercase text-white/50">Activos</p>
                  <p className="text-2xl font-black text-yellow-300 mt-1">{data.activeProducts}</p>
                </div>
                <div className="bg-black/15 border border-white/10 rounded-3xl p-4">
                  <p className="text-xs font-black uppercase text-white/50">Stock bajo</p>
                  <p className="text-2xl font-black text-orange-300 mt-1">{data.lowStockProducts}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RankingTable
              title="Más vendidos"
              subtitle="Productos con mayor salida en el periodo."
              icon={<Trophy className="w-6 h-6" />}
              items={data.topSoldProducts}
              totalLabel="ingresos"
            />
            <RankingTable
              title="Más comprados"
              subtitle="Mercancía con mayor entrada en compras."
              icon={<Package className="w-6 h-6" />}
              items={data.topPurchasedProducts}
              totalLabel="costo"
            />
          </section>

          <section className="bg-gradient-to-br from-blue-500/15 to-purple-500/15 backdrop-blur-md border border-white/15 rounded-[32px] shadow-xl p-7">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="text-yellow-300 text-xs font-black uppercase tracking-[0.35em] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Lectura rápida
                </p>
                <h3 className="text-2xl font-black mt-2">Resumen ejecutivo</h3>
                <p className="text-blue-100 font-semibold mt-2 max-w-3xl">
                  En este periodo se vendieron {formatCurrency(data.salesTotal)}, se invirtieron {formatCurrency(data.purchasesTotal)} en mercancía y la utilidad estimada quedó en {formatCurrency(data.utility)}. La fórmula actual es: ganancia bruta de ventas menos compras de mercancía del periodo.
                </p>
              </div>
              <div className="bg-black/20 border border-white/10 rounded-3xl p-5 min-w-[240px]">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 flex items-center gap-2">
                  <WalletCards className="w-4 h-4" /> Salud financiera
                </p>
                <p className={`text-3xl font-black mt-2 ${utilityStatus ? 'text-green-300' : 'text-red-300'}`}>
                  {utilityStatus ? 'Positiva' : 'Negativa'}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
