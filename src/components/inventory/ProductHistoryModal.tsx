import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  History,
  Loader2,
  ShoppingCart,
  X,
} from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";
import {
  getProductMovements,
  type InventoryMovement,
  type InventoryProduct,
} from "../../lib/inventoryService";
import { useAuth } from "../../contexts/AuthContext";

type ProductHistoryModalProps = {
  isOpen: boolean;
  product: InventoryProduct | null;
  onClose: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getMovementCopy(movement: InventoryMovement) {
  if (movement.movement_type === "sale") {
    return {
      label: "Venta",
      description: "Salida por venta POS",
      icon: ShoppingCart,
      color: "text-red-200",
      bg: "bg-red-500/15 border-red-400/25",
    };
  }

  if (movement.movement_type === "purchase") {
    return {
      label: "Compra / Alta",
      description: "Entrada de inventario",
      icon: ArrowUpCircle,
      color: "text-green-200",
      bg: "bg-green-500/15 border-green-400/25",
    };
  }

  if (movement.movement_type === "loss") {
    return {
      label: "Pérdida",
      description: "Producto dañado, perdido o vencido",
      icon: ArrowDownCircle,
      color: "text-orange-200",
      bg: "bg-orange-500/15 border-orange-400/25",
    };
  }

  return {
    label: "Ajuste manual",
    description: "Corrección de inventario",
    icon: Boxes,
    color: "text-yellow-200",
    bg: "bg-yellow-500/15 border-yellow-400/25",
  };
}

export function ProductHistoryModal({
  isOpen,
  product,
  onClose,
}: ProductHistoryModalProps) {
  const { user } = useAuth();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadMovements() {
      if (!isOpen || !product || !user?.id) return;

      try {
        setLoading(true);
        setErrorMessage("");
        const data = await getProductMovements(user.id, product.id);
        setMovements(data);
      } catch (error) {
        console.error(error);
        setErrorMessage("No se pudo cargar el historial del producto.");
      } finally {
        setLoading(false);
      }
    }

    loadMovements();
  }, [isOpen, product, user?.id]);

  const totals = useMemo(() => {
    return movements.reduce(
      (acc, movement) => {
        const qty = Number(movement.quantity ?? 0);
        if (qty > 0) acc.in += qty;
        if (qty < 0) acc.out += Math.abs(qty);
        return acc;
      },
      { in: 0, out: 0 },
    );
  }, [movements]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar historial"
      />

      <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[36px] border border-white/20 bg-gradient-to-br from-blue-950/95 via-indigo-950/95 to-purple-950/95 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-blue-950/90 px-7 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300">
              Inventario
            </p>
            <h3 className="flex items-center gap-3 text-3xl font-black tracking-tight">
              <History className="h-7 w-7 text-orange-400" />
              Historial
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-7">
          <section className="rounded-[28px] border border-white/10 bg-white/10 p-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Boxes className="h-7 w-7 text-yellow-300" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-2xl font-black leading-tight">{product.name}</p>
                <p className="mt-1 text-sm font-bold text-blue-200">
                  Stock actual: {product.stock} pz · Precio: {formatCurrency(Number(product.sale_price ?? 0))}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-[24px] border border-green-400/20 bg-green-500/10 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-green-200">
                Entradas
              </p>
              <p className="mt-2 text-3xl font-black text-green-200">+{totals.in}</p>
            </div>
            <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-red-200">
                Salidas
              </p>
              <p className="mt-2 text-3xl font-black text-red-200">-{totals.out}</p>
            </div>
          </section>

          {errorMessage && (
            <div className="rounded-2xl border border-red-300/30 bg-red-500/20 px-5 py-3 text-sm font-bold text-red-100">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-[28px] border border-white/10 bg-white/10 p-8 font-black text-blue-100">
              <Loader2 className="h-6 w-6 animate-spin text-yellow-300" />
              Cargando historial...
            </div>
          ) : movements.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-8 text-center">
              <History className="mx-auto mb-3 h-10 w-10 text-blue-200/60" />
              <p className="font-black text-blue-100">Este producto aún no tiene movimientos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => {
                const copy = getMovementCopy(movement);
                const Icon = copy.icon;
                const qty = Number(movement.quantity ?? 0);

                return (
                  <article
                    key={movement.id}
                    className={cn(
                      "rounded-[24px] border p-5 shadow-inner",
                      copy.bg,
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("rounded-2xl bg-black/20 p-3", copy.color)}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg font-black">{copy.label}</p>
                            <p className="text-sm font-bold text-blue-100/75">
                              {copy.description}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p
                              className={cn(
                                "text-2xl font-black",
                                qty >= 0 ? "text-green-200" : "text-red-200",
                              )}
                            >
                              {qty > 0 ? `+${qty}` : qty}
                            </p>
                            <p className="text-xs font-black uppercase tracking-widest text-blue-100/60">
                              {formatDate(movement.created_at)}
                            </p>
                          </div>
                        </div>

                        {movement.note && (
                          <p className="mt-3 rounded-2xl bg-black/15 px-4 py-3 text-sm font-bold text-white/85">
                            {movement.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
