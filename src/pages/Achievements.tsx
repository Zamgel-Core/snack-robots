import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Lock, RefreshCw, Sparkles, Trophy } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { RobotTip } from '../components/RobotTip';
import { useAuth } from '../contexts/AuthContext';
import { getGoalsDashboardData, GoalsDashboardData, SmartAchievement } from '../lib/goalsService';
import { cn, formatCurrency } from '../lib/utils';

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

function formatAchievementValue(achievement: SmartAchievement, value: number) {
  if (achievement.money) return formatCurrency(value);
  return Math.round(value).toLocaleString('en-US');
}

function tierClasses(tier: SmartAchievement['tier']) {
  if (tier === 'diamond') return 'from-cyan-300/30 to-blue-500/20 text-cyan-200 border-cyan-300/30';
  if (tier === 'gold') return 'from-yellow-300/30 to-orange-500/20 text-yellow-200 border-yellow-300/30';
  if (tier === 'silver') return 'from-slate-200/25 to-blue-300/10 text-slate-100 border-slate-200/25';
  return 'from-orange-300/25 to-amber-700/20 text-orange-100 border-orange-300/25';
}

function AchievementCard({ achievement }: { achievement: SmartAchievement }) {
  return (
    <div className={cn(
      'group relative overflow-hidden rounded-[32px] border p-6 shadow-xl transition-all hover:-translate-y-1',
      achievement.unlocked ? `bg-gradient-to-br ${tierClasses(achievement.tier)}` : 'border-white/10 bg-black/20 text-white/60 grayscale',
    )}>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <div className={cn(
          'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-3xl shadow-lg',
          achievement.unlocked ? 'bg-white/20' : 'bg-white/10',
        )}>
          {achievement.unlocked ? achievement.icon : <Lock className="h-7 w-7" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">{achievement.tier}</p>
              <h3 className="text-xl font-black uppercase leading-tight text-white">{achievement.title}</h3>
            </div>
            {achievement.unlocked && <CheckCircle className="h-6 w-6 flex-shrink-0 text-yellow-300" />}
          </div>

          <p className="min-h-[40px] text-sm font-bold text-white/75">{achievement.description}</p>

          <div className="mt-5 rounded-3xl bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-widest">
              <span>{formatAchievementValue(achievement, achievement.current)}</span>
              <span className="text-white/50">Meta: {formatAchievementValue(achievement, achievement.target)}</span>
            </div>
            <ProgressBar current={achievement.current} target={achievement.target} color={achievement.unlocked ? 'green' : 'blue'} showLabels={false} />
          </div>

          {achievement.unlocked && achievement.unlockedAt && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-yellow-200/80">
              Desbloqueado: {new Date(achievement.unlockedAt).toLocaleDateString('es-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Achievements() {
  const { user } = useAuth();
  const [data, setData] = useState<GoalsDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
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
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los logros.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const visibleAchievements = useMemo(() => {
    if (filter === 'unlocked') return data.achievements.filter((achievement) => achievement.unlocked);
    if (filter === 'locked') return data.achievements.filter((achievement) => !achievement.unlocked);
    return data.achievements;
  }, [data.achievements, filter]);

  const nextAchievement = useMemo(() => {
    return data.achievements
      .filter((achievement) => !achievement.unlocked)
      .sort((a, b) => b.progress - a.progress)[0];
  }, [data.achievements]);

  return (
    <div className="space-y-8 pb-10 text-white">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-300">Sala de trofeos</p>
          <h2 className="text-4xl font-black tracking-tight">Logros</h2>
          <p className="mt-2 text-lg font-medium text-blue-200">Medallas automáticas según ventas, piezas, utilidad e inventario.</p>
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
        Robo Orange dice: Los logros se desbloquean solos. No hay que registrarlos a mano; el sistema lee el avance real.
      </RobotTip>

      {error && (
        <div className="rounded-3xl border border-red-300/30 bg-red-500/20 p-4 text-sm font-bold text-red-50">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-white/15 bg-white/90 p-5 text-blue-950 shadow-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500"><Trophy className="h-4 w-4" /> Desbloqueados</div>
          <p className="mt-2 text-3xl font-black">{data.stats.unlockedAchievements}/{data.achievements.length}</p>
        </div>
        <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-yellow-300"><Sparkles className="h-4 w-4" /> Ventas totales</div>
          <p className="mt-2 text-3xl font-black text-yellow-300">{formatCurrency(data.stats.totalSales)}</p>
        </div>
        <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-300"><CheckCircle className="h-4 w-4" /> Piezas vendidas</div>
          <p className="mt-2 text-3xl font-black text-emerald-300">{data.stats.totalItems}</p>
        </div>
      </section>

      {nextAchievement && (
        <section className="rounded-[32px] border border-yellow-300/30 bg-yellow-300/10 p-6 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-300">Próximo logro</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-black">{nextAchievement.icon} {nextAchievement.title}</h3>
              <p className="text-sm font-bold text-yellow-50/80">Avance actual: {nextAchievement.progress}%</p>
            </div>
            <div className="min-w-[240px] rounded-3xl bg-black/20 p-4">
              <ProgressBar current={nextAchievement.current} target={nextAchievement.target} color="orange" showLabels={false} />
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-white/15 bg-white/10 p-2 shadow-xl backdrop-blur-md">
        {[
          ['all', 'Todos'],
          ['unlocked', 'Desbloqueados'],
          ['locked', 'Bloqueados'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value as typeof filter)}
            className={cn(
              'rounded-2xl px-4 py-2 text-xs font-black uppercase transition',
              filter === value ? 'bg-white text-blue-700 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[32px] border border-white/10 bg-white/10" />
          ))
        ) : (
          visibleAchievements.map((achievement) => <AchievementCard key={achievement.id} achievement={achievement} />)
        )}
      </section>
    </div>
  );
}
