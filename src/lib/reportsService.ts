import { supabase } from './supabase';
import { getCurrentStoreId } from './dashboardService';

export type ReportRangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

export type ReportDateRange = {
  preset: ReportRangePreset;
  from: string;
  to: string;
};

export type ReportDailyPoint = {
  date: string;
  sales: number;
  purchases: number;
  profit: number;
  utility: number;
};

export type ReportRankingItem = {
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  profit?: number;
};

export type ReportData = {
  storeId: string | null;
  range: ReportDateRange;
  salesTotal: number;
  purchasesTotal: number;
  grossProfit: number;
  utility: number;
  salesCount: number;
  purchasesCount: number;
  averageTicket: number;
  averagePurchase: number;
  inventoryCost: number;
  inventorySaleValue: number;
  inventoryPotentialProfit: number;
  activeProducts: number;
  lowStockProducts: number;
  daily: ReportDailyPoint[];
  topSoldProducts: ReportRankingItem[];
  topPurchasedProducts: ReportRankingItem[];
  previousSalesTotal: number;
  previousPurchasesTotal: number;
  previousGrossProfit: number;
  previousUtility: number;
  salesChangePercent: number;
  purchasesChangePercent: number;
  utilityChangePercent: number;
};

type SaleRecord = {
  id: string;
  total: number | string | null;
  profit: number | string | null;
  status: string;
  sold_at: string;
};

type PurchaseRecord = {
  id: string;
  supplier: string | null;
  total_cost: number | string | null;
  purchased_at: string;
  status: string;
};

type ProductRecord = {
  id: string;
  name: string;
  stock: number | string | null;
  unit_cost: number | string | null;
  sale_price: number | string | null;
  low_stock_threshold: number | string | null;
  status: string;
};

function toMoney(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfLocalDay(date = new Date()) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function dateInputToStartIso(value: string) {
  return startOfLocalDay(new Date(`${value}T00:00:00`)).toISOString();
}

function dateInputToEndIso(value: string) {
  return endOfLocalDay(new Date(`${value}T00:00:00`)).toISOString();
}

function dateKey(value: string) {
  return toInputDate(new Date(value));
}

export function getDefaultReportDateRange(preset: ReportRangePreset = 'today'): ReportDateRange {
  const now = new Date();
  let from = startOfLocalDay(now);
  let to = endOfLocalDay(now);

  if (preset === 'yesterday') {
    from = startOfLocalDay(now);
    from.setDate(now.getDate() - 1);
    to = endOfLocalDay(from);
  }

  if (preset === 'week') {
    from = startOfLocalDay(now);
    from.setDate(now.getDate() - 6);
  }

  if (preset === 'month') {
    from = startOfLocalDay(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  if (preset === 'year') {
    from = startOfLocalDay(new Date(now.getFullYear(), 0, 1));
  }

  return {
    preset,
    from: toInputDate(from),
    to: toInputDate(to),
  };
}

function buildDailyPoints(sales: SaleRecord[], purchases: PurchaseRecord[], range: ReportDateRange) {
  const points = new Map<string, ReportDailyPoint>();
  const cursor = startOfLocalDay(new Date(`${range.from}T00:00:00`));
  const end = startOfLocalDay(new Date(`${range.to}T00:00:00`));

  while (cursor.getTime() <= end.getTime()) {
    const key = toInputDate(cursor);
    points.set(key, { date: key, sales: 0, purchases: 0, profit: 0, utility: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const sale of sales) {
    const key = dateKey(sale.sold_at);
    const point = points.get(key) ?? { date: key, sales: 0, purchases: 0, profit: 0, utility: 0 };
    point.sales += toMoney(sale.total);
    point.profit += toMoney(sale.profit);
    points.set(key, point);
  }

  for (const purchase of purchases) {
    const key = dateKey(purchase.purchased_at);
    const point = points.get(key) ?? { date: key, sales: 0, purchases: 0, profit: 0, utility: 0 };
    point.purchases += toMoney(purchase.total_cost);
    points.set(key, point);
  }

  return Array.from(points.values()).map((point) => ({
    ...point,
    utility: point.profit - point.purchases,
  }));
}

async function getTopSoldProducts(storeId: string, fromIso: string, toIso: string): Promise<ReportRankingItem[]> {
  const { data, error } = await supabase
    .from('sale_items')
    .select(
      `
        product_id,
        quantity,
        unit_price,
        total,
        profit,
        products ( id, name ),
        sales!inner ( store_id, status, sold_at )
      `,
    )
    .eq('sales.store_id', storeId)
    .eq('sales.status', 'completed')
    .gte('sales.sold_at', fromIso)
    .lte('sales.sold_at', toIso);

  if (error) {
    console.warn('No se pudo cargar ranking de productos vendidos:', error.message);
    return [];
  }

  const grouped = new Map<string, ReportRankingItem>();

  for (const row of (data ?? []) as any[]) {
    const productId = row.product_id ?? row.products?.id ?? 'sin-producto';
    const current = grouped.get(productId) ?? {
      productId,
      productName: row.products?.name ?? 'Producto eliminado',
      quantity: 0,
      total: 0,
      profit: 0,
    };

    const quantity = Number(row.quantity ?? 0);
    const lineTotal = row.total !== undefined && row.total !== null
      ? toMoney(row.total)
      : quantity * toMoney(row.unit_price ?? row.price);

    current.quantity += quantity;
    current.total += lineTotal;
    current.profit = toMoney(current.profit) + toMoney(row.profit);
    grouped.set(productId, current);
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
    .slice(0, 8);
}

async function getTopPurchasedProducts(storeId: string, fromIso: string, toIso: string): Promise<ReportRankingItem[]> {
  const { data, error } = await supabase
    .from('purchase_items')
    .select(
      `
        product_id,
        quantity,
        unit_cost,
        total_cost,
        products ( id, name ),
        purchases!inner ( store_id, status, purchased_at )
      `,
    )
    .eq('purchases.store_id', storeId)
    .eq('purchases.status', 'active')
    .gte('purchases.purchased_at', fromIso)
    .lte('purchases.purchased_at', toIso);

  if (error) {
    console.warn('No se pudo cargar ranking de productos comprados:', error.message);
    return [];
  }

  const grouped = new Map<string, ReportRankingItem>();

  for (const row of (data ?? []) as any[]) {
    const productId = row.product_id ?? row.products?.id ?? 'sin-producto';
    const current = grouped.get(productId) ?? {
      productId,
      productName: row.products?.name ?? 'Producto eliminado',
      quantity: 0,
      total: 0,
    };

    const quantity = Number(row.quantity ?? 0);
    const lineTotal = row.total_cost !== undefined && row.total_cost !== null
      ? toMoney(row.total_cost)
      : quantity * toMoney(row.unit_cost);

    current.quantity += quantity;
    current.total += lineTotal;
    grouped.set(productId, current);
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
    .slice(0, 8);
}


function getPreviousIsoRange(range: ReportDateRange) {
  const from = startOfLocalDay(new Date(`${range.from}T00:00:00`));
  const to = endOfLocalDay(new Date(`${range.to}T00:00:00`));
  const days = Math.max(1, Math.round((startOfLocalDay(to).getTime() - from.getTime()) / 86400000) + 1);
  const previousTo = endOfLocalDay(new Date(from));
  previousTo.setDate(previousTo.getDate() - 1);
  const previousFrom = startOfLocalDay(new Date(previousTo));
  previousFrom.setDate(previousFrom.getDate() - days + 1);

  return {
    fromIso: previousFrom.toISOString(),
    toIso: previousTo.toISOString(),
  };
}

function percentChange(current: number, previous: number) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export async function getReportsData(
  userId: string,
  range: ReportDateRange = getDefaultReportDateRange(),
): Promise<ReportData> {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    return {
      storeId: null,
      range,
      salesTotal: 0,
      purchasesTotal: 0,
      grossProfit: 0,
      utility: 0,
      salesCount: 0,
      purchasesCount: 0,
      averageTicket: 0,
      averagePurchase: 0,
      inventoryCost: 0,
      inventorySaleValue: 0,
      inventoryPotentialProfit: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      daily: [],
      topSoldProducts: [],
      topPurchasedProducts: [],
      previousSalesTotal: 0,
      previousPurchasesTotal: 0,
      previousGrossProfit: 0,
      previousUtility: 0,
      salesChangePercent: 0,
      purchasesChangePercent: 0,
      utilityChangePercent: 0,
    };
  }

  const fromIso = dateInputToStartIso(range.from);
  const toIso = dateInputToEndIso(range.to);

  const previousRange = getPreviousIsoRange(range);

  const [
    salesResult,
    purchasesResult,
    productsResult,
    previousSalesResult,
    previousPurchasesResult,
    soldRanking,
    purchasedRanking,
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('id, total, profit, status, sold_at')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .gte('sold_at', fromIso)
      .lte('sold_at', toIso)
      .order('sold_at', { ascending: true }),

    supabase
      .from('purchases')
      .select('id, supplier, total_cost, purchased_at, status')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .gte('purchased_at', fromIso)
      .lte('purchased_at', toIso)
      .order('purchased_at', { ascending: true }),

    supabase
      .from('products')
      .select('id, name, stock, unit_cost, sale_price, low_stock_threshold, status')
      .eq('store_id', storeId),

    supabase
      .from('sales')
      .select('id, total, profit, status, sold_at')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .gte('sold_at', previousRange.fromIso)
      .lte('sold_at', previousRange.toIso),

    supabase
      .from('purchases')
      .select('id, supplier, total_cost, purchased_at, status')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .gte('purchased_at', previousRange.fromIso)
      .lte('purchased_at', previousRange.toIso),

    getTopSoldProducts(storeId, fromIso, toIso),
    getTopPurchasedProducts(storeId, fromIso, toIso),
  ]);

  if (salesResult.error) throw salesResult.error;
  if (purchasesResult.error) throw purchasesResult.error;
  if (productsResult.error) throw productsResult.error;
  if (previousSalesResult.error) throw previousSalesResult.error;
  if (previousPurchasesResult.error) throw previousPurchasesResult.error;

  const sales = (salesResult.data ?? []) as SaleRecord[];
  const purchases = (purchasesResult.data ?? []) as PurchaseRecord[];
  const products = (productsResult.data ?? []) as ProductRecord[];
  const previousSales = (previousSalesResult.data ?? []) as SaleRecord[];
  const previousPurchases = (previousPurchasesResult.data ?? []) as PurchaseRecord[];

  const salesTotal = sales.reduce((acc, sale) => acc + toMoney(sale.total), 0);
  const grossProfit = sales.reduce((acc, sale) => acc + toMoney(sale.profit), 0);
  const purchasesTotal = purchases.reduce((acc, purchase) => acc + toMoney(purchase.total_cost), 0);
  const utility = grossProfit - purchasesTotal;
  const previousSalesTotal = previousSales.reduce((acc, sale) => acc + toMoney(sale.total), 0);
  const previousGrossProfit = previousSales.reduce((acc, sale) => acc + toMoney(sale.profit), 0);
  const previousPurchasesTotal = previousPurchases.reduce((acc, purchase) => acc + toMoney(purchase.total_cost), 0);
  const previousUtility = previousGrossProfit - previousPurchasesTotal;

  const activeProducts = products.filter((product) => product.status === 'active');
  const inventoryCost = activeProducts.reduce((acc, product) => acc + Number(product.stock ?? 0) * toMoney(product.unit_cost), 0);
  const inventorySaleValue = activeProducts.reduce((acc, product) => acc + Number(product.stock ?? 0) * toMoney(product.sale_price), 0);
  const inventoryPotentialProfit = inventorySaleValue - inventoryCost;
  const lowStockProducts = activeProducts.filter((product) => {
    const stock = Number(product.stock ?? 0);
    const threshold = Number(product.low_stock_threshold ?? 5);
    return stock > 0 && stock <= threshold;
  }).length;

  return {
    storeId,
    range,
    salesTotal,
    purchasesTotal,
    grossProfit,
    utility,
    salesCount: sales.length,
    purchasesCount: purchases.length,
    averageTicket: sales.length ? salesTotal / sales.length : 0,
    averagePurchase: purchases.length ? purchasesTotal / purchases.length : 0,
    inventoryCost,
    inventorySaleValue,
    inventoryPotentialProfit,
    activeProducts: activeProducts.length,
    lowStockProducts,
    daily: buildDailyPoints(sales, purchases, range),
    topSoldProducts: soldRanking,
    topPurchasedProducts: purchasedRanking,
    previousSalesTotal,
    previousPurchasesTotal,
    previousGrossProfit,
    previousUtility,
    salesChangePercent: percentChange(salesTotal, previousSalesTotal),
    purchasesChangePercent: percentChange(purchasesTotal, previousPurchasesTotal),
    utilityChangePercent: percentChange(utility, previousUtility),
  };
}
