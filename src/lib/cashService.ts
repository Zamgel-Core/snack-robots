import { supabase } from './supabase';
import { getCurrentStoreId } from './dashboardService';

export type CashRangePreset = 'today' | 'week' | 'month' | 'custom';

export type CashDateRange = {
  preset: CashRangePreset;
  from: string;
  to: string;
};

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

export type CashMovementType = 'income' | 'expense';
export type CashMovementSource = 'sale' | 'purchase' | 'manual_expense' | 'adjustment';

export type CashMovement = {
  id: string;
  type: CashMovementType;
  source: CashMovementSource;
  label: string;
  description: string;
  amount: number;
  profit?: number;
  occurred_at: string;
  reference_id?: string;
  metadata?: Record<string, string | number | null | undefined>;
};

export type CashRegisterData = {
  storeId: string | null;
  initialCash: number;
  range: CashDateRange;
  incomeTotal: number;
  expenseTotal: number;
  purchaseExpenseTotal: number;
  manualExpenseTotal: number;
  adjustmentTotal: number;
  netTotal: number;
  expectedCash: number;
  salesCount: number;
  purchasesCount: number;
  averageSale: number;
  averagePurchase: number;
  grossProfit: number;
  estimatedUtility: number;
  movements: CashMovement[];
};

export type CashClosePayload = {
  userId: string;
  range: CashDateRange;
  openingCash: number;
  countedCash: number;
  expectedCash: number;
  difference: number;
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  salesCount: number;
  purchasesCount: number;
  notes?: string;
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

export function getDefaultCashDateRange(preset: CashRangePreset = 'today'): CashDateRange {
  const now = new Date();
  let from = startOfLocalDay(now);
  const to = endOfLocalDay(now);

  if (preset === 'week') {
    from = startOfLocalDay(now);
    from.setDate(now.getDate() - 6);
  }

  if (preset === 'month') {
    from = startOfLocalDay(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  return {
    preset,
    from: toInputDate(from),
    to: toInputDate(to),
  };
}

function dateInputToStartIso(value: string) {
  return startOfLocalDay(new Date(`${value}T00:00:00`)).toISOString();
}

function dateInputToEndIso(value: string) {
  return endOfLocalDay(new Date(`${value}T00:00:00`)).toISOString();
}

export async function getCashRegisterData(
  userId: string,
  range: CashDateRange = getDefaultCashDateRange(),
  initialCash = 5,
): Promise<CashRegisterData> {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    return {
      storeId: null,
      initialCash,
      range,
      incomeTotal: 0,
      expenseTotal: 0,
      purchaseExpenseTotal: 0,
      manualExpenseTotal: 0,
      adjustmentTotal: 0,
      netTotal: 0,
      expectedCash: initialCash,
      salesCount: 0,
      purchasesCount: 0,
      averageSale: 0,
      averagePurchase: 0,
      grossProfit: 0,
      estimatedUtility: 0,
      movements: [],
    };
  }

  const fromIso = dateInputToStartIso(range.from);
  const toIso = dateInputToEndIso(range.to);

  const [salesResult, purchasesResult] = await Promise.all([
    supabase
      .from('sales')
      .select('id, store_id, total, profit, status, sold_at, created_at')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .gte('sold_at', fromIso)
      .lte('sold_at', toIso)
      .order('sold_at', { ascending: false }),

    supabase
      .from('purchases')
      .select('id, store_id, supplier, total_cost, purchased_at, notes, status, created_at')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .gte('purchased_at', fromIso)
      .lte('purchased_at', toIso)
      .order('purchased_at', { ascending: false }),
  ]);

  if (salesResult.error) throw salesResult.error;
  if (purchasesResult.error) throw purchasesResult.error;

  const sales = (salesResult.data ?? []) as CashSaleRecord[];
  const purchases = (purchasesResult.data ?? []) as CashPurchaseRecord[];

  const incomeTotal = sales.reduce((acc, sale) => acc + toMoney(sale.total), 0);
  const purchaseExpenseTotal = purchases.reduce((acc, purchase) => acc + toMoney(purchase.total_cost), 0);
  const manualExpenseTotal = 0;
  const adjustmentTotal = 0;
  const expenseTotal = purchaseExpenseTotal + manualExpenseTotal;
  const grossProfit = sales.reduce((acc, sale) => acc + toMoney(sale.profit), 0);
  const estimatedUtility = grossProfit - expenseTotal + adjustmentTotal;
  const netTotal = incomeTotal - expenseTotal + adjustmentTotal;

  const saleMovements: CashMovement[] = sales.map((sale) => ({
    id: sale.id,
    type: 'income',
    source: 'sale',
    label: 'Venta registrada',
    description: `Venta #${sale.id.slice(0, 8)}`,
    amount: toMoney(sale.total),
    profit: toMoney(sale.profit),
    occurred_at: sale.sold_at,
    reference_id: sale.id,
    metadata: {
      estado: sale.status,
      ganancia: toMoney(sale.profit),
    },
  }));

  const purchaseMovements: CashMovement[] = purchases.map((purchase) => ({
    id: purchase.id,
    type: 'expense',
    source: 'purchase',
    label: 'Compra de mercancía',
    description: purchase.supplier || purchase.notes || `Compra #${purchase.id.slice(0, 8)}`,
    amount: toMoney(purchase.total_cost),
    occurred_at: purchase.purchased_at,
    reference_id: purchase.id,
    metadata: {
      proveedor: purchase.supplier,
      notas: purchase.notes,
      estado: purchase.status,
    },
  }));

  const movements = [...saleMovements, ...purchaseMovements].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );

  return {
    storeId,
    initialCash,
    range,
    incomeTotal,
    expenseTotal,
    purchaseExpenseTotal,
    manualExpenseTotal,
    adjustmentTotal,
    netTotal,
    expectedCash: initialCash + netTotal,
    salesCount: sales.length,
    purchasesCount: purchases.length,
    averageSale: sales.length ? incomeTotal / sales.length : 0,
    averagePurchase: purchases.length ? purchaseExpenseTotal / purchases.length : 0,
    grossProfit,
    estimatedUtility,
    movements,
  };
}

export async function closeCashSession(payload: CashClosePayload) {
  const storeId = await getCurrentStoreId(payload.userId);
  if (!storeId) throw new Error('No se encontró una tienda activa para cerrar caja.');

  const { error } = await supabase.from('cash_sessions').insert({
    store_id: storeId,
    opened_at: dateInputToStartIso(payload.range.from),
    closed_at: new Date().toISOString(),
    opening_cash: payload.openingCash,
    expected_cash: payload.expectedCash,
    counted_cash: payload.countedCash,
    difference: payload.difference,
    income_total: payload.incomeTotal,
    expense_total: payload.expenseTotal,
    net_total: payload.netTotal,
    sales_count: payload.salesCount,
    purchases_count: payload.purchasesCount,
    status: 'closed',
    notes: payload.notes?.trim() || null,
    closed_by: payload.userId,
  });

  if (error) throw error;
}
