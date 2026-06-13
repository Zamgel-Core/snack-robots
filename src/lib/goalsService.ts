import { supabase } from './supabase';
import { getCurrentStoreId } from './dashboardService';

export type GoalKind = 'sales' | 'profit' | 'items' | 'monthly' | 'inventory';

export type SmartGoal = {
  id: string;
  title: string;
  subtitle: string;
  kind: GoalKind;
  period: 'Hoy' | 'Mes' | 'General';
  current: number;
  target: number;
  suffix?: string;
  money?: boolean;
  icon: string;
  color: 'blue' | 'orange' | 'green';
};

export type SmartAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  current: number;
  money?: boolean;
  unlockedAt?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
};

export type GoalsDashboardData = {
  storeId: string | null;
  goals: SmartGoal[];
  achievements: SmartAchievement[];
  stats: {
    todaySales: number;
    todayProfit: number;
    todayItems: number;
    monthSales: number;
    monthProfit: number;
    totalSales: number;
    totalProfit: number;
    totalItems: number;
    totalSalesCount: number;
    completedGoals: number;
    unlockedAchievements: number;
    dailyScore: number;
  };
};

type SaleRow = {
  id: string;
  total: number | string | null;
  profit: number | string | null;
  sold_at: string;
};

type SaleItemRow = {
  quantity: number | string | null;
  sales?: {
    id: string;
    store_id: string;
    status: string;
    sold_at: string;
  } | null;
};

type ProductRow = {
  stock: number | string | null;
  low_stock_threshold: number | string | null;
  status: string | null;
};

function money(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function clampPercent(current: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function isUnlocked(current: number, target: number) {
  return current >= target;
}

export async function getGoalsDashboardData(userId: string): Promise<GoalsDashboardData> {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    return {
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
  }

  const todayStart = startOfDay().toISOString();
  const todayEnd = endOfDay().toISOString();
  const monthStart = startOfMonth().toISOString();

  const [salesResult, todayItemsResult, monthItemsResult, allItemsResult, productsResult] = await Promise.all([
    supabase
      .from('sales')
      .select('id, total, profit, sold_at')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .order('sold_at', { ascending: false }),

    supabase
      .from('sale_items')
      .select('quantity, sales!inner(id, store_id, status, sold_at)')
      .eq('sales.store_id', storeId)
      .eq('sales.status', 'completed')
      .gte('sales.sold_at', todayStart)
      .lte('sales.sold_at', todayEnd),

    supabase
      .from('sale_items')
      .select('quantity, sales!inner(id, store_id, status, sold_at)')
      .eq('sales.store_id', storeId)
      .eq('sales.status', 'completed')
      .gte('sales.sold_at', monthStart),

    supabase
      .from('sale_items')
      .select('quantity, sales!inner(id, store_id, status, sold_at)')
      .eq('sales.store_id', storeId)
      .eq('sales.status', 'completed'),

    supabase
      .from('products')
      .select('stock, low_stock_threshold, status')
      .eq('store_id', storeId),
  ]);

  if (salesResult.error) throw salesResult.error;
  if (todayItemsResult.error) throw todayItemsResult.error;
  if (monthItemsResult.error) throw monthItemsResult.error;
  if (allItemsResult.error) throw allItemsResult.error;
  if (productsResult.error) throw productsResult.error;

  const sales = (salesResult.data ?? []) as SaleRow[];
  const todayItemsRows = (todayItemsResult.data ?? []) as SaleItemRow[];
  const monthItemsRows = (monthItemsResult.data ?? []) as SaleItemRow[];
  const allItemsRows = (allItemsResult.data ?? []) as SaleItemRow[];
  const products = (productsResult.data ?? []) as ProductRow[];

  const todaySalesRows = sales.filter((sale) => {
    const value = new Date(sale.sold_at).getTime();
    return value >= new Date(todayStart).getTime() && value <= new Date(todayEnd).getTime();
  });

  const monthSalesRows = sales.filter((sale) => new Date(sale.sold_at).getTime() >= new Date(monthStart).getTime());

  const todaySales = todaySalesRows.reduce((acc, sale) => acc + money(sale.total), 0);
  const todayProfit = todaySalesRows.reduce((acc, sale) => acc + money(sale.profit), 0);
  const monthSales = monthSalesRows.reduce((acc, sale) => acc + money(sale.total), 0);
  const monthProfit = monthSalesRows.reduce((acc, sale) => acc + money(sale.profit), 0);
  const totalSales = sales.reduce((acc, sale) => acc + money(sale.total), 0);
  const totalProfit = sales.reduce((acc, sale) => acc + money(sale.profit), 0);
  const todayItems = todayItemsRows.reduce((acc, item) => acc + Number(item.quantity ?? 0), 0);
  const monthItems = monthItemsRows.reduce((acc, item) => acc + Number(item.quantity ?? 0), 0);
  const totalItems = allItemsRows.reduce((acc, item) => acc + Number(item.quantity ?? 0), 0);

  const activeProducts = products.filter((product) => product.status === 'active');
  const lowStockProducts = activeProducts.filter((product) => {
    const stock = Number(product.stock ?? 0);
    const threshold = Number(product.low_stock_threshold ?? 5);
    return stock > 0 && stock <= threshold;
  }).length;
  const outOfStockProducts = activeProducts.filter((product) => Number(product.stock ?? 0) <= 0).length;
  const healthyInventory = Math.max(0, activeProducts.length - lowStockProducts - outOfStockProducts);

  const goals: SmartGoal[] = [
    {
      id: 'daily-sales',
      title: 'Venta diaria',
      subtitle: 'Objetivo principal del día.',
      kind: 'sales',
      period: 'Hoy',
      current: todaySales,
      target: 50,
      money: true,
      icon: '💰',
      color: 'blue',
    },
    {
      id: 'daily-profit',
      title: 'Utilidad diaria',
      subtitle: 'Ganancia estimada por ventas.',
      kind: 'profit',
      period: 'Hoy',
      current: todayProfit,
      target: 25,
      money: true,
      icon: '📈',
      color: 'green',
    },
    {
      id: 'daily-items',
      title: 'Productos vendidos',
      subtitle: 'Piezas vendidas durante el día.',
      kind: 'items',
      period: 'Hoy',
      current: todayItems,
      target: 40,
      suffix: 'pz',
      icon: '🍬',
      color: 'orange',
    },
    {
      id: 'monthly-sales',
      title: 'Venta mensual',
      subtitle: 'Meta grande para crecimiento.',
      kind: 'monthly',
      period: 'Mes',
      current: monthSales,
      target: 1000,
      money: true,
      icon: '🚀',
      color: 'blue',
    },
    {
      id: 'inventory-health',
      title: 'Inventario saludable',
      subtitle: 'Productos activos sin stock bajo.',
      kind: 'inventory',
      period: 'General',
      current: healthyInventory,
      target: Math.max(1, activeProducts.length),
      suffix: 'productos',
      icon: '📦',
      color: 'green',
    },
  ];

  const achievements: SmartAchievement[] = [
    {
      id: 'first-sale',
      title: 'Primera venta',
      description: 'Registra tu primera venta real en Snack Robots.',
      icon: '🎉',
      current: sales.length,
      target: 1,
      progress: clampPercent(sales.length, 1),
      unlocked: isUnlocked(sales.length, 1),
      unlockedAt: sales.length ? sales[sales.length - 1].sold_at : undefined,
      tier: 'bronze',
    },
    {
      id: 'ten-sales',
      title: 'Primeras 10 ventas',
      description: 'Completa 10 ventas para validar el flujo comercial.',
      icon: '🧾',
      current: sales.length,
      target: 10,
      progress: clampPercent(sales.length, 10),
      unlocked: isUnlocked(sales.length, 10),
      tier: 'bronze',
    },
    {
      id: 'hundred-dollars',
      title: 'Primeros $100',
      description: 'Alcanza $100 en ventas acumuladas.',
      icon: '💵',
      current: totalSales,
      target: 100,
      money: true,
      progress: clampPercent(totalSales, 100),
      unlocked: isUnlocked(totalSales, 100),
      tier: 'silver',
    },
    {
      id: 'five-hundred-dollars',
      title: 'Ruta a $500',
      description: 'Acumula $500 vendidos en el negocio.',
      icon: '🏆',
      current: totalSales,
      target: 500,
      money: true,
      progress: clampPercent(totalSales, 500),
      unlocked: isUnlocked(totalSales, 500),
      tier: 'gold',
    },
    {
      id: 'hundred-items',
      title: '100 snacks vendidos',
      description: 'Vende 100 piezas en total.',
      icon: '🍭',
      current: totalItems,
      target: 100,
      progress: clampPercent(totalItems, 100),
      unlocked: isUnlocked(totalItems, 100),
      tier: 'silver',
    },
    {
      id: 'positive-month',
      title: 'Mes con utilidad',
      description: 'Mantén utilidad mensual positiva.',
      icon: '📊',
      current: Math.max(0, monthProfit),
      target: 1,
      money: true,
      progress: monthProfit > 0 ? 100 : 0,
      unlocked: monthProfit > 0,
      tier: 'bronze',
    },
    {
      id: 'inventory-master',
      title: 'Inventario controlado',
      description: 'Mantén todos tus productos activos fuera de stock bajo.',
      icon: '💎',
      current: healthyInventory,
      target: Math.max(1, activeProducts.length),
      progress: clampPercent(healthyInventory, Math.max(1, activeProducts.length)),
      unlocked: activeProducts.length > 0 && healthyInventory === activeProducts.length,
      tier: 'diamond',
    },
  ];

  const completedGoals = goals.filter((goal) => goal.current >= goal.target).length;
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;
  const dailyScore = Math.round(goals.slice(0, 3).reduce((acc, goal) => acc + clampPercent(goal.current, goal.target), 0) / 3);

  return {
    storeId,
    goals,
    achievements,
    stats: {
      todaySales,
      todayProfit,
      todayItems,
      monthSales,
      monthProfit,
      totalSales,
      totalProfit,
      totalItems,
      totalSalesCount: sales.length,
      completedGoals,
      unlockedAchievements,
      dailyScore,
    },
  };
}
