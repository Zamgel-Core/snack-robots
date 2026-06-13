import React, { useEffect, useMemo, useState } from 'react';
import { Target, Trophy, RefreshCw, TrendingUp, Zap, PackageCheck } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { RobotTip } from '../components/RobotTip';
import { useAuth } from '../contexts/AuthContext';
import { getGoalsDashboardData, SmartGoal, GoalsDashboardData } from '../lib/goalsService';
import { cn, formatCurrency } from '../lib/utils';

function formatGoalValue(goal: SmartGoal, value: number) {
  if (goal.money) return formatCurrency(value);
  return `${Math.round(value)}${goal.suffix ? ` ${goal.suffix}` : ''}`;
}

function goalPercent(goal: SmartGoal) {
  if (!goal.target) return 0;
  return Math.min(100, Math.round((goal.current / goal.target) * 100));
}

function GoalCard({ goal }: { goal: SmartGoal }) {
  const percent = goalPercent(goal);
  const completed = percent >= 100;

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/10 p-6 text-white shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/15">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg',
            goal.color === 'blue' && 'bg-blue-500/40',
            goal.color === 'orange' && 'bg-orange-500/40',
            goal.color === 'green' && 'bg-emerald-500/40',
          )}>
            {goal.icon}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-yellow-300">{goal.period}</p>
            <h3 className="text-xl font-black leading-tight">{goal.title}</h3>
          </div>
        </div>

        <span className={cn(
          'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest',
          completed ? 'bg-emerald-400 text-emerald-950' : 'bg-black/25 text-white/80',
        )}>
          {completed ? 'Cumplida' : `${percent}%`}
        </span>
      </div>

      <p className="relative mt-4 min-h-[36px] text-sm font-bold text-blue-100/90">{goal.subtitle}</p>

      <div className="relative my-5 rounded-3xl bg-black/20 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Actual</p>
            <p className="text-2xl font-black text-yellow-300">{formatGoalValue(goal, goal.current)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Meta</p>
            <p className="text-lg font-black text-white">{formatGoalValue(goal, goal.target)}</p>
          </div>
        </div>
      </div>

      <ProgressBar current={goal.current} target={goal.target} color={goal.color} showLabels={false} />
    </div>
  );
}

const emptyData: GoalsDashboardData = {
  storeId: null,
  goals: [],
  achievements: [],
  stats: {
    todaySales: 0,
    todayProfit: 0,
    todayItems: 0,
    monthSales: 0,
    monthProfit: 0,
    totalSales: 0,
    totalProfit: 0,
    totalItems: 0,
    totalSalesCount: 0,
    completedGoals: 0,
    unlockedAchievements: 0,
    dailyScore: 0,
  },
};

export function Goals() {
  const { user } = useAuth();
  const [data, setData] = useState<GoalsDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const result = await getGoalsDashboardData(user.id);
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las metas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const nextGoal = useMemo(() => {
    return data.goals
      .filter((goal) => goal.current < goal.target)
      .sort((a, b) => goalPercent(b) - goalPercent(a))[0];
  }, [data.goals]);

  return (
    <div className="space-y-8 pb-10 text-white">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-300">Centro de objetivos</p>
          <h2 className="text-4xl font-black tracking-tight">Metas</h2>
          <p className="mt-2 text-lg font-medium text-blue-200">Objetivos automáticos conectados a ventas, utilidad e inventario real.</p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase shadow-lg shadow-orange-500/30 transition hover:bg-orange-400 disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Actualizar
        </button>
      </header>

      <RobotTip>
        Robo Blue dice: Las metas se calculan solas con datos reales. Cuando vendas más, el progreso sube automáticamente.
      </RobotTip>

      {error && (
        <div className="rounded-3xl border border-red-300/30 bg-red-500/20 p-4 text-sm font-bold text-red-50">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-white/15 bg-white/90 p-5 text-blue-950 shadow-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500"><Target className="h-4 w-4" /> Score del día</div>
          <p className="mt-2 text-3xl font-black">{data.stats.dailyScore}%</p>
        </div>
        <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-yellow-300"><TrendingUp className="h-4 w-4" /> Ventas hoy</div>
          <p className="mt-2 text-3xl font-black text-yellow-300">{formatCurrency(data.stats.todaySales)}</p>
        </div>
        <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-300"><Zap className="h-4 w-4" /> Utilidad hoy</div>
          <p className="mt-2 text-3xl font-black text-emerald-300">{formatCurrency(data.stats.todayProfit)}</p>
        </div>
        <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-300"><Trophy className="h-4 w-4" /> Logros</div>
          <p className="mt-2 text-3xl font-black text-orange-300">{data.stats.unlockedAchievements}/{data.achievements.length}</p>
        </div>
      </section>

      {nextGoal && (
        <section className="rounded-[32px] border border-yellow-300/30 bg-yellow-300/10 p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-300">Siguiente objetivo recomendado</p>
              <h3 className="mt-1 text-2xl font-black">{nextGoal.icon} {nextGoal.title}</h3>
              <p className="mt-1 text-sm font-bold text-yellow-50/80">Vas en {goalPercent(nextGoal)}%. Te faltan {formatGoalValue(nextGoal, Math.max(0, nextGoal.target - nextGoal.current))}.</p>
            </div>
            <div className="min-w-[220px] rounded-3xl bg-black/20 p-4">
              <ProgressBar current={nextGoal.current} target={nextGoal.target} color={nextGoal.color} showLabels={false} />
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-[32px] border border-white/10 bg-white/10" />
          ))
        ) : (
          data.goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
        )}
      </section>

      <section className="rounded-[32px] border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <PackageCheck className="h-6 w-6 text-yellow-300" />
          <div>
            <h3 className="text-xl font-black uppercase">Lectura rápida</h3>
            <p className="text-sm font-bold text-blue-100/80">
              Hoy vendiste {formatCurrency(data.stats.todaySales)}, generaste {formatCurrency(data.stats.todayProfit)} de utilidad estimada y moviste {data.stats.todayItems} pieza(s).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
