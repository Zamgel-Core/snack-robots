import { supabase } from "./supabase";

export async function getCurrentStoreId(userId: string) {
  const { data, error } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.store_id ?? null;
}

export async function getDashboardData(userId: string) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    return {
      storeId: null,
      todaySales: 0,
      todayProfit: 0,
      totalInventory: 0,
      lowStock: [],
      outOfStock: [],
      products: [],
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { data: products, error: productsError },
    { data: sales, error: salesError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("name", { ascending: true }),

    supabase
      .from("sales")
      .select("total, profit")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("sold_at", today.toISOString()),
  ]);

  if (productsError) throw productsError;
  if (salesError) throw salesError;

  const productList = products ?? [];
  const saleList = sales ?? [];

  const todaySales = saleList.reduce(
    (acc, sale) => acc + Number(sale.total ?? 0),
    0,
  );
  const todayProfit = saleList.reduce(
    (acc, sale) => acc + Number(sale.profit ?? 0),
    0,
  );
  const totalInventory = productList.reduce(
    (acc, product) => acc + Number(product.stock ?? 0),
    0,
  );

  const lowStock = productList.filter(
    (product) =>
      Number(product.stock ?? 0) > 0 &&
      Number(product.stock ?? 0) <= Number(product.low_stock_threshold ?? 5),
  );

  const outOfStock = productList.filter(
    (product) => Number(product.stock ?? 0) === 0,
  );

  return {
    storeId,
    todaySales,
    todayProfit,
    totalInventory,
    lowStock,
    outOfStock,
    products: productList,
  };
}
