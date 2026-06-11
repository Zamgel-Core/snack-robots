import { supabase } from "./supabase";
import { getCurrentStoreId } from "./dashboardService";

export type ProductFormValues = {
  name: string;
  category: string;
  description: string;
  image_url?: string;
  package_cost: number;
  pieces_per_package: number;
  sale_price: number;
  stock: number;
  low_stock_threshold: number;
};

export type InventoryProduct = {
  id: string;
  store_id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  package_cost: number;
  pieces_per_package: number;
  unit_cost: number;
  sale_price: number;
  stock: number;
  low_stock_threshold: number;
  status: "active" | "inactive" | "sold_out";
  created_at?: string;
  updated_at?: string;
};

export async function getInventoryProducts(
  userId: string,
  options: { includeInactive?: boolean } = {},
) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    return { storeId: null, products: [] as InventoryProduct[] };
  }

  let query = supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  if (!options.includeInactive) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;

  if (error) throw error;

  return { storeId, products: (data ?? []) as InventoryProduct[] };
}

export async function uploadProductImage(userId: string, file: File) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error("No se encontró una tienda activa para este usuario.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
  const filePath = `${storeId}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function createProduct(userId: string, values: ProductFormValues) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error("No se encontró una tienda activa para este usuario.");
  }

  const cleanValues = {
    name: values.name.trim(),
    category: values.category.trim(),
    description: values.description.trim() || null,
    image_url: values.image_url?.trim() || null,
    package_cost: Number(values.package_cost || 0),
    pieces_per_package: Math.max(1, Number(values.pieces_per_package || 1)),
    sale_price: Number(values.sale_price || 0),
    stock: Math.max(0, Number(values.stock || 0)),
    low_stock_threshold: Math.max(0, Number(values.low_stock_threshold || 0)),
  };

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      ...cleanValues,
      status: "active",
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (productError) throw productError;

  if (product && cleanValues.stock > 0) {
    const unitCost =
      cleanValues.pieces_per_package > 0
        ? cleanValues.package_cost / cleanValues.pieces_per_package
        : 0;

    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        store_id: storeId,
        product_id: product.id,
        movement_type: "purchase",
        quantity: cleanValues.stock,
        unit_cost: unitCost,
        unit_price: cleanValues.sale_price,
        created_by: userId,
        note: "Producto agregado desde Inventario",
      });

    if (movementError) throw movementError;
  }

  return product as InventoryProduct;
}

export async function updateProduct(
  userId: string,
  productId: string,
  values: ProductFormValues,
) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error("No se encontró una tienda activa para este usuario.");
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      name: values.name.trim(),
      category: values.category.trim(),
      description: values.description.trim() || null,
      image_url: values.image_url?.trim() || null,
      package_cost: Number(values.package_cost || 0),
      pieces_per_package: Math.max(1, Number(values.pieces_per_package || 1)),
      sale_price: Number(values.sale_price || 0),
      low_stock_threshold: Math.max(0, Number(values.low_stock_threshold || 0)),
      updated_by: userId,
    })
    .eq("id", productId)
    .eq("store_id", storeId)
    .select("*")
    .single();

  if (error) throw error;

  return data as InventoryProduct;
}

export async function adjustProductStock(
  userId: string,
  product: InventoryProduct,
  newStock: number,
  note: string,
) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error("No se encontró una tienda activa para este usuario.");
  }

  const safeNewStock = Math.max(0, Math.floor(Number(newStock || 0)));
  const currentStock = Number(product.stock ?? 0);
  const difference = safeNewStock - currentStock;

  if (difference === 0) {
    return product;
  }

  const { data: updatedProduct, error: updateError } = await supabase
    .from("products")
    .update({
      stock: safeNewStock,
      updated_by: userId,
    })
    .eq("id", product.id)
    .eq("store_id", storeId)
    .select("*")
    .single();

  if (updateError) throw updateError;

  const { error: movementError } = await supabase
    .from("inventory_movements")
    .insert({
      store_id: storeId,
      product_id: product.id,
      movement_type: "adjustment",
      quantity: difference,
      unit_cost: Number(product.unit_cost ?? 0),
      unit_price: Number(product.sale_price ?? 0),
      created_by: userId,
      note: note.trim() || "Ajuste manual de inventario",
    });

  if (movementError) throw movementError;

  return updatedProduct as InventoryProduct;
}

export async function deactivateProduct(userId: string, productId: string) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error("No se encontró una tienda activa para este usuario.");
  }

  const { error } = await supabase
    .from("products")
    .update({
      status: "inactive",
      updated_by: userId,
    })
    .eq("id", productId)
    .eq("store_id", storeId);

  if (error) throw error;
}


export async function reactivateProduct(userId: string, productId: string) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error("No se encontró una tienda activa para este usuario.");
  }

  const { error } = await supabase
    .from("products")
    .update({
      status: "active",
      updated_by: userId,
    })
    .eq("id", productId)
    .eq("store_id", storeId);

  if (error) throw error;
}

export type InventoryMovement = {
  id: string;
  store_id: string;
  product_id: string;
  movement_type: "purchase" | "sale" | "adjustment" | "return" | "loss";
  quantity: number;
  unit_cost: number | null;
  unit_price: number | null;
  note: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
};

export async function getProductMovements(userId: string, productId: string) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error("No se encontró una tienda activa para este usuario.");
  }

  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []) as InventoryMovement[];
}
