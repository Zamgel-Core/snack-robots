import { supabase } from "./supabase";
import { getCurrentStoreId } from "./dashboardService";
import type { InventoryProduct } from "./inventoryService";

export type PurchaseFormItem = {
  product_id: string;
  quantity: number;
  unit_cost: number;
};

export type PurchaseRecord = {
  id: string;
  store_id: string;
  supplier: string | null;
  notes: string | null;
  total_cost: number | string;
  purchased_at: string;
  status: "active" | "cancelled";
  created_by: string | null;
  created_at: string;
  updated_at?: string;
  purchase_items?: PurchaseItemRecord[];
};

export type PurchaseItemRecord = {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number | string;
  total_cost: number | string;
  created_at?: string;
  products?: Pick<InventoryProduct, "id" | "name" | "category" | "image_url" | "stock"> | null;
};

export async function getPurchaseProducts(userId: string) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    return { storeId: null, products: [] as InventoryProduct[] };
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) throw error;

  return { storeId, products: (data ?? []) as InventoryProduct[] };
}

export async function getPurchases(userId: string) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    return { storeId: null, purchases: [] as PurchaseRecord[] };
  }

  const { data, error } = await supabase
    .from("purchases")
    .select(
      `
        *,
        purchase_items (
          id,
          purchase_id,
          product_id,
          quantity,
          unit_cost,
          total_cost,
          created_at,
          products (
            id,
            name,
            category,
            image_url,
            stock
          )
        )
      `,
    )
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("purchased_at", { ascending: false })
    .limit(75);

  if (error) throw error;

  return { storeId, purchases: (data ?? []) as PurchaseRecord[] };
}

export async function registerPurchase(
  userId: string,
  values: {
    supplier: string;
    purchased_at: string;
    notes: string;
    items: PurchaseFormItem[];
  },
) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error("No se encontró una tienda activa para este usuario.");
  }

  const cleanSupplier = values.supplier.trim();
  if (!cleanSupplier) {
    throw new Error("Agrega el proveedor de la compra.");
  }

  const cleanItems = values.items
    .map((item) => ({
      product_id: item.product_id,
      quantity: Math.floor(Number(item.quantity || 0)),
      unit_cost: Number(item.unit_cost || 0),
    }))
    .filter((item) => item.product_id);

  if (cleanItems.length === 0) {
    throw new Error("Agrega al menos un producto a la compra.");
  }

  const repeatedProduct = cleanItems.find((item, index) => {
    return cleanItems.findIndex((candidate) => candidate.product_id === item.product_id) !== index;
  });

  if (repeatedProduct) {
    throw new Error("Hay productos repetidos en la misma compra. Une cantidades o elimina duplicados.");
  }

  const invalidItem = cleanItems.find((item) => item.quantity <= 0 || item.unit_cost <= 0);
  if (invalidItem) {
    throw new Error("Cada producto debe tener cantidad y costo unitario mayores a 0.");
  }

  const { data, error } = await supabase.rpc("register_purchase", {
    p_store_id: storeId,
    p_created_by: userId,
    p_supplier: cleanSupplier,
    p_purchased_at: values.purchased_at
      ? new Date(values.purchased_at).toISOString()
      : new Date().toISOString(),
    p_notes: values.notes.trim() || null,
    p_items: cleanItems,
  });

  if (error) throw error;

  return data as string;
}
