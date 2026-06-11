import { supabase } from './supabase';
import { getCurrentStoreId } from './dashboardService';

export type POSProduct = {
  id: string;
  store_id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  package_cost: number | string;
  pieces_per_package: number;
  unit_cost: number | string;
  sale_price: number | string;
  stock: number;
  low_stock_threshold: number;
  status: string;
};

export type CartSaleItem = {
  product_id: string;
  quantity: number;
};

export async function getPOSProducts(userId: string) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error('No se encontró una tienda activa para este usuario.');
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .gt('stock', 0)
    .order('name', { ascending: true });

  if (error) throw error;

  return {
    storeId,
    products: (data ?? []) as POSProduct[],
  };
}

export async function processSale(
  storeId: string,
  userId: string,
  items: CartSaleItem[],
) {
  const { data, error } = await supabase.rpc('process_sale', {
    p_store_id: storeId,
    p_sold_by: userId,
    p_items: items,
  });

  if (error) throw error;

  return data as string;
}
