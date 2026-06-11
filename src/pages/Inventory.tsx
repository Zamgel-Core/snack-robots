import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency, cn } from "../lib/utils";
import {
  Archive,
  Boxes,
  Edit2,
  History,
  Package,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  deactivateProduct,
  getInventoryProducts,
  reactivateProduct,
  type InventoryProduct,
} from "../lib/inventoryService";
import { ProductModal } from "../components/inventory/ProductModal";
import { ProductStatusConfirmModal } from "../components/inventory/ProductStatusConfirmModal";
import { StockAdjustmentModal } from "../components/inventory/StockAdjustmentModal";
import { ProductHistoryModal } from "../components/inventory/ProductHistoryModal";

type StatusFilter = "active" | "inactive" | "all";
type StatusAction = "deactivate" | "reactivate";

export function Inventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [selectedProduct, setSelectedProduct] =
    useState<InventoryProduct | null>(null);
  const [stockProduct, setStockProduct] = useState<InventoryProduct | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<InventoryProduct | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [statusProduct, setStatusProduct] = useState<InventoryProduct | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction>("deactivate");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  const loadInventory = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setErrorMessage("");
      const data = await getInventoryProducts(user.id, { includeInactive: true });
      setProducts(data.products ?? []);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo cargar el inventario.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "active"),
    [products],
  );

  const inactiveProducts = useMemo(
    () => products.filter((product) => product.status !== "active"),
    [products],
  );

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      products.map((product) => product.category).filter(Boolean),
    );
    return Array.from(uniqueCategories).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.category?.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.status === "active") ||
        (statusFilter === "inactive" && product.status !== "active");

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  function openCreateModal() {
    setSelectedProduct(null);
    setProductModalMode("create");
    setIsProductModalOpen(true);
  }

  function openEditModal(product: InventoryProduct) {
    setSelectedProduct(product);
    setProductModalMode("edit");
    setIsProductModalOpen(true);
  }

  function openStockModal(product: InventoryProduct) {
    setStockProduct(product);
    setIsStockModalOpen(true);
  }

  function openHistoryModal(product: InventoryProduct) {
    setHistoryProduct(product);
    setIsHistoryModalOpen(true);
  }

  function openStatusModal(product: InventoryProduct, action: StatusAction) {
    setStatusProduct(product);
    setStatusAction(action);
    setIsStatusModalOpen(true);
  }

  function closeStatusModal() {
    if (actionLoadingId) return;
    setStatusProduct(null);
    setIsStatusModalOpen(false);
  }

  async function handleStatusConfirm() {
    if (!user || !statusProduct) return;

    try {
      setActionLoadingId(statusProduct.id);
      setErrorMessage("");
      setSuccessMessage("");

      if (statusAction === "deactivate") {
        await deactivateProduct(user.id, statusProduct.id);
        setSuccessMessage(`"${statusProduct.name}" fue desactivado.`);
        setStatusFilter("active");
      } else {
        await reactivateProduct(user.id, statusProduct.id);
        setSuccessMessage(`"${statusProduct.name}" fue reactivado.`);
        setStatusFilter("active");
      }

      setIsStatusModalOpen(false);
      setStatusProduct(null);
      await loadInventory();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        statusAction === "deactivate"
          ? "No se pudo desactivar el producto."
          : "No se pudo reactivar el producto.",
      );
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleSaved(message = "Inventario actualizado.") {
    setSuccessMessage(message);
    await loadInventory();
  }

  if (loading) {
    return (
      <div className="text-white font-black text-xl">
        Cargando inventario real...
      </div>
    );
  }

  if (errorMessage && products.length === 0) {
    return (
      <div className="bg-red-500/20 border border-red-400/30 rounded-3xl p-6 text-red-100 font-bold">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-5 mb-6 text-white">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Inventario</h2>
          <p className="text-xl text-blue-200 font-medium mt-2">
            Administra tus snacks, precios y stock real.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-orange-500 text-white px-6 py-3 rounded-[20px] font-black flex items-center justify-center gap-2 hover:bg-orange-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/30 uppercase tracking-tighter text-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[28px] border border-white/15 bg-white/10 px-5 py-4 text-white shadow-lg backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200">
            Productos activos
          </p>
          <p className="mt-1 text-3xl font-black text-green-300">
            {activeProducts.length}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/15 bg-white/10 px-5 py-4 text-white shadow-lg backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200">
            Productos desactivados
          </p>
          <p className="mt-1 text-3xl font-black text-red-200">
            {inactiveProducts.length}
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

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_auto_auto] gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar producto, categoría o descripción..."
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-[22px] pl-12 pr-4 py-4 text-white font-bold placeholder:text-blue-200/60 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
          />
        </div>

        <div className="relative min-w-[230px]">
          <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="w-full appearance-none bg-white/10 backdrop-blur-md border border-white/20 rounded-[22px] pl-12 pr-4 py-4 text-white font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
          >
            <option className="text-slate-900" value="all">
              Todas las categorías
            </option>
            {categories.map((category) => (
              <option className="text-slate-900" key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[230px]">
          <Archive className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="w-full appearance-none bg-white/10 backdrop-blur-md border border-white/20 rounded-[22px] pl-12 pr-4 py-4 text-white font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
          >
            <option className="text-slate-900" value="active">
              Activos
            </option>
            <option className="text-slate-900" value="inactive">
              Desactivados
            </option>
            <option className="text-slate-900" value="all">
              Todos
            </option>
          </select>
        </div>
      </section>

      <div className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl overflow-hidden text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-white/10 text-blue-200 uppercase text-[10px] tracking-widest font-black">
                <th className="p-6">Producto</th>
                <th className="p-6">Categoría</th>
                <th className="p-6 text-right">Estado</th>
                <th className="p-6 text-right">Stock</th>
                <th className="p-6 text-right">Costo / pz</th>
                <th className="p-6 text-right">Precio Venta</th>
                <th className="p-6 text-right">Ganancia</th>
                <th className="p-6 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 relative">
              {filteredProducts.map((product) => {
                const unitCost = Number(product.unit_cost ?? 0);
                const salePrice = Number(product.sale_price ?? 0);
                const profit = salePrice - unitCost;
                const stock = Number(product.stock ?? 0);
                const lowStockThreshold = Number(
                  product.low_stock_threshold ?? 5,
                );
                const isActive = product.status === "active";

                return (
                  <tr
                    key={product.id}
                    className={cn(
                      "hover:bg-white/5 transition-colors group",
                      !isActive && "opacity-60",
                    )}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black/20 border border-white/10 rounded-[16px] flex items-center justify-center text-xl shadow-inner group-hover:bg-black/30 transition-colors overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-yellow-300" />
                          )}
                        </div>

                        <div>
                          <p className="font-black text-lg">{product.name}</p>
                          <p className="text-xs text-blue-200 opacity-80 font-medium leading-tight max-w-[320px]">
                            {product.description || "Sin descripción"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-6">
                      <span className="px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>

                    <td className="p-6 text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                          isActive
                            ? "border-green-400/30 bg-green-500/20 text-green-200"
                            : "border-red-400/30 bg-red-500/20 text-red-200",
                        )}
                      >
                        {isActive ? "Activo" : "Desactivado"}
                      </span>
                    </td>

                    <td className="p-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            "font-black text-lg px-3 py-1 rounded-[12px] border",
                            stock > lowStockThreshold
                              ? "text-white bg-white/10 border-white/20"
                              : stock > 0
                                ? "text-yellow-300 bg-yellow-500/20 border-yellow-500/30"
                                : "text-red-300 bg-red-500/20 border-red-500/30",
                          )}
                        >
                          {stock}
                        </span>

                        {stock <= lowStockThreshold && stock > 0 && (
                          <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider">
                            Bajo
                          </span>
                        )}

                        {stock === 0 && (
                          <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">
                            Agotado
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-6 text-right font-bold text-blue-200">
                      {formatCurrency(unitCost)}
                    </td>

                    <td className="p-6 text-right">
                      <span className="font-black text-white text-xl">
                        {formatCurrency(salePrice)}
                      </span>
                    </td>

                    <td className="p-6 text-right">
                      <span
                        className={cn(
                          "font-black text-lg",
                          profit >= 0 ? "text-green-400" : "text-red-300",
                        )}
                      >
                        {formatCurrency(profit)}
                      </span>
                    </td>

                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          title="Editar producto"
                          className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-colors border border-transparent hover:border-white/20"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openStockModal(product)}
                          title="Ajustar stock"
                          className="p-3 text-yellow-200/80 hover:text-yellow-200 hover:bg-yellow-400/10 rounded-2xl transition-colors border border-transparent hover:border-yellow-400/20"
                        >
                          <Boxes className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openHistoryModal(product)}
                          title="Ver historial"
                          className="p-3 text-blue-100/80 hover:text-blue-100 hover:bg-blue-400/10 rounded-2xl transition-colors border border-transparent hover:border-blue-400/20"
                        >
                          <History className="w-5 h-5" />
                        </button>

                        {isActive ? (
                          <button
                            type="button"
                            disabled={actionLoadingId === product.id}
                            onClick={() => openStatusModal(product, "deactivate")}
                            title="Desactivar producto"
                            className="p-3 text-red-200/70 hover:text-red-200 hover:bg-red-500/10 rounded-2xl transition-colors border border-transparent hover:border-red-400/20 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoadingId === product.id}
                            onClick={() => openStatusModal(product, "reactivate")}
                            title="Reactivar producto"
                            className="p-3 text-green-200/80 hover:text-green-200 hover:bg-green-500/10 rounded-2xl transition-colors border border-transparent hover:border-green-400/20 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-blue-100 font-bold"
                  >
                    No encontramos productos con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        mode={productModalMode}
        product={selectedProduct}
        onClose={() => setIsProductModalOpen(false)}
        onSaved={handleSaved}
      />

      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        product={stockProduct}
        onClose={() => setIsStockModalOpen(false)}
        onSaved={handleSaved}
      />

      <ProductHistoryModal
        isOpen={isHistoryModalOpen}
        product={historyProduct}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      <ProductStatusConfirmModal
        isOpen={isStatusModalOpen}
        product={statusProduct}
        action={statusAction}
        isLoading={Boolean(actionLoadingId)}
        onCancel={closeStatusModal}
        onConfirm={handleStatusConfirm}
      />
    </div>
  );
}
