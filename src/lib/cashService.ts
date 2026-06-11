import { supabase } from './supabase';
import { getCurrentStoreId } from './dashboardService';

export type CashSaleRecord = {
  id: string;
  store_id: string;
  total: number | string;
  profit: number | string | null;
  status: string;
  sold_at: string;
  created_at?: string | null;
};

export type CashPurchaseRecord = {
  id: string;
  store_id: string;
  supplier: string | null;
  total_cost: number | string;
  purchased_at: string;
  notes: string | null;
  status: string;
  created_at?: string | null;
};

export type CashMovement = {
  id: string;
  type: 'income' | 'expense';
  label: string;
  description: string;
  amount: number;
  occurred_at: string;
};

export type CashRegisterData = {
  storeId: string | null;
  initialCash: number;
  todaySales: number;
  todayPurchases: number;
  expectedCash: number;
  salesCount: number;
  purchasesCount: number;
  movements: CashMovement[];
};

function toMoney(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function startOfLocalDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function getCashRegisterData(userId: string): Promise<CashRegisterData> {
  const storeId = await getCurrentStoreId(userId);
  const initialCash = 5;

  if (!storeId) {
    return {
      storeId: null,
      initialCash,
      todaySales: 0,
      todayPurchases: 0,
      expectedCash: initialCash,
      salesCount: 0,
      purchasesCount: 0,
      movements: [],
    };
  }

  const todayIso = startOfLocalDay().toISOString();

  const [salesResult, purchasesResult] = await Promise.all([
    supabase
      .from('sales')
      .select('id, store_id, total, profit, status, sold_at, created_at')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .gte('sold_at', todayIso)
      .order('sold_at', { ascending: false }),

    supabase
      .from('purchases')
      .select('id, store_id, supplier, total_cost, purchased_at, notes, status, created_at')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .gte('purchased_at', todayIso)
      .order('purchased_at', { ascending: false }),
  ]);

  if (salesResult.error) throw salesResult.error;
  if (purchasesResult.error) throw purchasesResult.error;

  const sales = (salesResult.data ?? []) as CashSaleRecord[];
  const purchases = (purchasesResult.data ?? []) as CashPurchaseRecord[];

  const todaySales = sales.reduce((acc, sale) => acc + toMoney(sale.total), 0);
  const todayPurchases = purchases.reduce(
    (acc, purchase) => acc + toMoney(purchase.total_cost),
    0,
  );

  const saleMovements: CashMovement[] = sales.map((sale) => ({
    id: sale.id,
    type: 'income',
    label: 'Venta registrada',
    description: `Venta #${sale.id.slice(0, 8)}`,
    amount: toMoney(sale.total),
    occurred_at: sale.sold_at,
  }));

  const purchaseMovements: CashMovement[] = purchases.map((purchase) => ({
    id: purchase.id,
    type: 'expense',
    label: 'Compra de mercancía',
    description: purchase.supplier || purchase.notes || `Compra #${purchase.id.slice(0, 8)}`,
    amount: toMoney(purchase.total_cost),
    occurred_at: purchase.purchased_at,
  }));

  const movements = [...saleMovements, ...purchaseMovements]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, 25);

  return {
    storeId,
    initialCash,
    todaySales,
    todayPurchases,
    expectedCash: initialCash + todaySales - todayPurchases,
    salesCount: sales.length,
    purchasesCount: purchases.length,
    movements,
  };
}
