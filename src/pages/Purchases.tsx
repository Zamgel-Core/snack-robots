import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  PackagePlus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, cn } from "../lib/utils";
import type { InventoryProduct } from "../lib/inventoryService";
import {
  getPurchaseProducts,
  getPurchases,
  registerPurchase,
  type PurchaseFormItem,
  type PurchaseRecord,
} from "../lib/purchasesService";

type PurchaseLine = PurchaseFormItem & {
  local_id: string;
};

function getTodayInputValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

const emptyLine = (): PurchaseLine => ({
  local_id: crypto.randomUUID(),
  product_id: "",
  quantity: 1,
  unit_cost: 0,
});

export function Purchases() {
  const { user } = useAuth();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(getTodayInputValue());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseLine[]>([emptyLine()]);
  const [expandedPurchases, setExpandedPurchases] = useState<Record<string, boolean>>({});

  const loadPurchasesModule = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setErrorMessage("");
      const [productsResult, purchasesResult] = await Promise.all([
        getPurchaseProducts(user.id),
        getPurchases(user.id),
      ]);

      setProducts(productsResult.products ?? []);
      setPurchases(purchasesResult.purchases ?? []);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "No se pudo cargar Compras. Verifica que el SQL SR_UPDATE_001 esté aplicado en Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPurchasesModule();
  }, [loadPurchasesModule]);

  const productsById = useMemo(() => {
    return products.reduce<Record<string, InventoryProduct>>((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
  }, [products]);

  const selectedProductIds = useMemo(() => {
    return items.map((item) => item.product_id).filter(Boolean);
  }, [items]);

  const duplicatedProductIds = useMemo(() => {
    return selectedProductIds.filter((productId, index) => selectedProductIds.indexOf(productId) !== index);
  }, [selectedProductIds]);

  const purchaseTotal = useMemo(() => {
    return items.reduce(
      (acc, item) => acc + Number(item.quantity || 0) * Number(item.unit_cost || 0),
      0,
    );
  }, [items]);

  const monthTotal = useMemo(() => {
    const now = new Date();
    return purchases.reduce((acc, purchase) => {
      const purchaseDate = new Date(purchase.purchased_at);
      const sameMonth =
        purchaseDate.getMonth() === now.getMonth() &&
        purchaseDate.getFullYear() === now.getFullYear();

      return sameMonth ? acc + Number(purchase.total_cost ?? 0) : acc;
    }, 0);
  }, [purchases]);

  const unitsPurchased = useMemo(() => {
    return purchases.reduce((acc, purchase) => {
      return (
        acc +
        (purchase.purchase_items ?? []).reduce(
          (itemAcc, item) => itemAcc + Number(item.quantity ?? 0),
          0,
        )
      );
    }, 0);
  }, [purchases]);

  function resetForm() {
    setSupplier("");
    setPurchasedAt(getTodayInputValue());
    setNotes("");
    setItems([emptyLine()]);
  }

  function updateLine(localId: string, values: Partial<PurchaseLine>) {
    setItems((current) =>
      current.map((item) =>
        item.local_id === localId
          ? {
              ...item,
              ...values,
            }
          : item,
      ),
    );
  }

  function addLine() {
    setItems((current) => [...current, emptyLine()]);
  }

  function togglePurchaseDetails(purchaseId: string) {
    setExpandedPurchases((current) => ({
      ...current,
      [purchaseId]: !current[purchaseId],
    }));
  }

  function removeLine(localId: string) {
    setItems((current) => {
      if (current.length === 1) return current;
      return current.filter((item) => item.local_id !== localId);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    const cleanSupplier = supplier.trim();
    if (!cleanSupplier) {
      setErrorMessage("Agrega el proveedor antes de guardar la compra.");
      return;
    }

    const cleanItems = items
      .map((item) => ({
        product_id: item.product_id,
        quantity: Math.floor(Number(item.quantity || 0)),
        unit_cost: Number(item.unit_cost || 0),
      }))
      .filter((item) => item.product_id);

    if (cleanItems.length === 0) {
      setErrorMessage("Agrega al menos un producto a la compra.");
      return;
    }

    if (duplicatedProductIds.length > 0) {
      setErrorMessage("Hay productos repetidos. Une cantidades o elimina la línea duplicada.");
      return;
    }

    const invalidItem = cleanItems.find((item) => item.quantity <= 0 || item.unit_cost <= 0);
    if (invalidItem) {
      setErrorMessage("Cada producto debe tener cantidad y costo unitario mayores a 0.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await registerPurchase(user.id, {
        supplier: cleanSupplier,
        purchased_at: purchasedAt,
        notes,
        items: cleanItems,
      });

      setSuccessMessage("Compra registrada. El stock y el historial ya fueron actualizados.");
      resetForm();
      setIsFormOpen(false);
      await loadPurchasesModule();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "No se pudo registrar la compra.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-white font-black text-xl">
        Cargando compras reales...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-5 text-white lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Compras</h2>
          <p className="mt-2 text-xl font-medium text-blue-200">
            Registra mercancía real y actualiza inventario automáticamente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen((current) => !current)}
          className="flex items-center justify-center gap-2 rounded-[20px] bg-orange-500 px-6 py-3 text-sm font-black uppercase tracking-tighter text-white shadow-xl shadow-orange-500/30 transition-all hover:scale-105 hover:bg-orange-400 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          {isFormOpen ? "Cerrar" : "Registrar Compra"}
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-white/15 bg-white/10 px-5 py-4 text-white shadow-lg backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200">
            Compras registradas
          </p>
          <p className="mt-1 text-3xl font-black text-yellow-300">
            {purchases.length}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/15 bg-white/10 px-5 py-4 text-white shadow-lg backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200">
            Invertido este mes
          </p>
          <p className="mt-1 text-3xl font-black text-orange-300">
            {formatCurrency(monthTotal)}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/15 bg-white/10 px-5 py-4 text-white shadow-lg backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200">
            Piezas compradas
          </p>
          <p className="mt-1 text-3xl font-black text-green-300">
            {unitsPurchased}
          </p>
        </div>
      </section>

      {(successMessage || errorMessage) && (
        <section
          className={cn(
            "rounded-3xl border px-5 py-4 font-black",
            errorMessage
              ? "border-red-400/30 bg-red-500/20 text-red-100"
              : "border-green-400/30 bg-green-500/20 text-green-100",
          )}
        >
          {errorMessage || successMessage}
        </section>
      )}

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] border border-white/20 bg-white/10 p-6 text-white shadow-xl backdrop-blur-md"
        >
          <div className="mb-6 flex flex-col gap-2">
            <h3 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
              <PackagePlus className="h-7 w-7 text-yellow-300" />
              Nueva compra
            </h3>
            <p className="font-bold text-blue-200">
              Cada producto agregado aumentará stock y creará movimiento de inventario.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Proveedor
              </span>
              <input
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
                placeholder="Ej. Costco, Sam's, Dulcería..."
                required
                className="w-full rounded-[20px] border border-white/20 bg-black/20 px-4 py-3 font-bold text-white outline-none placeholder:text-blue-200/50 focus:border-yellow-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Fecha
              </span>
              <input
                type="datetime-local"
                value={purchasedAt}
                onChange={(event) => setPurchasedAt(event.target.value)}
                className="w-full rounded-[20px] border border-white/20 bg-black/20 px-4 py-3 font-bold text-white outline-none focus:border-yellow-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Notas
              </span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Opcional"
                className="w-full rounded-[20px] border border-white/20 bg-black/20 px-4 py-3 font-bold text-white outline-none placeholder:text-blue-200/50 focus:border-yellow-400"
              />
            </label>
          </div>

          <div className="mt-6 space-y-3">
            {items.map((item, index) => {
              const selectedProduct = productsById[item.product_id];
              const lineTotal = Number(item.quantity || 0) * Number(item.unit_cost || 0);
              const isDuplicated = Boolean(item.product_id && duplicatedProductIds.includes(item.product_id));

              return (
                <div
                  key={item.local_id}
                  className={cn(
                    "grid grid-cols-1 gap-3 rounded-[24px] border bg-black/20 p-4 lg:grid-cols-[1.4fr_0.55fr_0.65fr_0.7fr_auto] lg:items-end",
                    isDuplicated ? "border-red-400/60" : "border-white/10",
                  )}
                >
                  <label className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                      Producto #{index + 1}
                    </span>
                    <select
                      value={item.product_id}
                      onChange={(event) =>
                        updateLine(item.local_id, { product_id: event.target.value })
                      }
                      className="w-full rounded-[18px] border border-white/20 bg-white/10 px-4 py-3 font-black text-white outline-none focus:border-yellow-400"
                    >
                      <option className="text-slate-900" value="">
                        Seleccionar producto
                      </option>
                      {products.map((product) => (
                        <option className="text-slate-900" key={product.id} value={product.id}>
                          📦 {product.name} — Existencias: {product.stock}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                      Cantidad
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateLine(item.local_id, {
                          quantity: Number(event.target.value || 1),
                        })
                      }
                      className="w-full rounded-[18px] border border-white/20 bg-white/10 px-4 py-3 font-black text-white outline-none focus:border-yellow-400"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                      Costo unitario
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(event) =>
                        updateLine(item.local_id, {
                          unit_cost: Number(event.target.value || 0),
                        })
                      }
                      className="w-full rounded-[18px] border border-white/20 bg-white/10 px-4 py-3 font-black text-white outline-none focus:border-yellow-400"
                    />
                  </label>

                  <div className="rounded-[18px] border border-yellow-400/20 bg-yellow-400/10 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-200">
                      Total línea
                    </p>
                    <p className="text-xl font-black text-yellow-300">
                      {formatCurrency(lineTotal)}
                    </p>
                    {selectedProduct && (
                      <p className="text-[11px] font-bold text-blue-100/80">
                        {selectedProduct.category} · Stock actual {selectedProduct.stock}
                      </p>
                    )}
                    {isDuplicated && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-black text-red-100">
                        <AlertTriangle className="h-3.5 w-3.5" /> Producto duplicado
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(item.local_id)}
                    disabled={items.length === 1}
                    className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-4 text-red-100 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Quitar producto"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={addLine}
              className="flex items-center justify-center gap-2 rounded-[18px] border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-tight text-white transition-colors hover:bg-white/15"
            >
              <Plus className="h-5 w-5" />
              Agregar producto
            </button>

            <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4 lg:min-w-[330px]">
              <div className="flex items-center justify-between gap-4">
                <span className="font-black uppercase tracking-wider text-blue-200">
                  Total compra
                </span>
                <span className="text-3xl font-black text-yellow-300">
                  {formatCurrency(purchaseTotal)}
                </span>
              </div>

              <button
                type="submit"
                disabled={saving || products.length === 0 || purchaseTotal <= 0 || duplicatedProductIds.length > 0}
                className="flex items-center justify-center gap-2 rounded-[18px] bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-tight text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
                Guardar compra
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-[32px] border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-md">
        <div className="border-b border-white/10 bg-black/10 p-6">
          <h3 className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
            <ShoppingBag className="h-6 w-6 text-yellow-400" /> Historial de Compras
          </h3>
        </div>

        <div className="divide-y divide-white/10">
          {purchases.map((purchase) => {
            const purchaseItems = purchase.purchase_items ?? [];
            const itemCount = purchaseItems.reduce(
              (acc, item) => acc + Number(item.quantity ?? 0),
              0,
            );
            const isExpanded = Boolean(expandedPurchases[purchase.id]);

            return (
              <article key={purchase.id} className="p-6 transition-colors hover:bg-white/5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10 bg-black/20 text-yellow-400 shadow-inner">
                      <ShoppingBag className="h-6 w-6" />
                    </div>

                    <div>
                      <h4 className="text-lg font-black">
                        {purchase.supplier || "Compra sin proveedor"}
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm font-bold text-blue-200/90">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(purchase.purchased_at).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4" />
                          {itemCount} pieza(s)
                        </span>
                        {purchase.notes && (
                          <span className="flex items-center gap-1">
                            <Store className="h-4 w-4" />
                            {purchase.notes}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePurchaseDetails(purchase.id)}
                        className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-100 transition-colors hover:bg-white/15"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {isExpanded ? "Ocultar detalle" : "Ver detalle"}
                      </button>

                      {isExpanded && (
                        <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
                          <div className="grid grid-cols-[1.4fr_0.45fr_0.55fr_0.65fr] gap-2 border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-200">
                            <span>Producto</span>
                            <span>Cant.</span>
                            <span>Costo</span>
                            <span>Total</span>
                          </div>
                          <div className="divide-y divide-white/10">
                            {purchaseItems.map((item) => (
                              <div
                                key={item.id}
                                className="grid grid-cols-[1.4fr_0.45fr_0.55fr_0.65fr] gap-2 px-4 py-3 text-sm font-bold text-blue-50"
                              >
                                <span>{item.products?.name || "Producto"}</span>
                                <span>{item.quantity}</span>
                                <span>{formatCurrency(Number(item.unit_cost ?? 0))}</span>
                                <span className="font-black text-yellow-300">
                                  {formatCurrency(Number(item.total_cost ?? 0))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-3xl font-black text-yellow-300">
                      {formatCurrency(Number(purchase.total_cost ?? 0))}
                    </p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 opacity-80">
                      Costo total
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

          {purchases.length === 0 && (
            <div className="p-10 text-center text-blue-100">
              <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-yellow-300" />
              <p className="font-black">Todavía no hay compras registradas.</p>
              <p className="mt-1 font-bold text-blue-200/80">
                Registra la primera compra para alimentar inventario real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
