import React from "react";
import { AlertTriangle, Archive, RotateCcw, X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { InventoryProduct } from "../../lib/inventoryService";

type ProductStatusAction = "deactivate" | "reactivate";

type ProductStatusConfirmModalProps = {
  isOpen: boolean;
  product: InventoryProduct | null;
  action: ProductStatusAction;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ProductStatusConfirmModal({
  isOpen,
  product,
  action,
  isLoading = false,
  onCancel,
  onConfirm,
}: ProductStatusConfirmModalProps) {
  if (!isOpen || !product) return null;

  const isDeactivate = action === "deactivate";
  const stock = Number(product.stock ?? 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={isLoading ? undefined : onCancel}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-[36px] border border-white/20 bg-gradient-to-br from-blue-950/95 via-indigo-950/95 to-purple-950/95 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl border",
                isDeactivate
                  ? "border-red-300/30 bg-red-500/20 text-red-200"
                  : "border-green-300/30 bg-green-500/20 text-green-200",
              )}
            >
              {isDeactivate ? <Archive className="h-6 w-6" /> : <RotateCcw className="h-6 w-6" />}
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-yellow-300">
                Inventario
              </p>
              <h3 className="text-2xl font-black tracking-tight">
                {isDeactivate ? "Desactivar producto" : "Reactivar producto"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/80 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-7 py-6">
          <p className="text-lg font-black leading-snug">
            {isDeactivate
              ? `¿Seguro que quieres desactivar "${product.name}"?`
              : `¿Quieres reactivar "${product.name}"?`}
          </p>

          <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm font-bold text-blue-100">
            {isDeactivate ? (
              <p>
                Ya no aparecerá en Inventario activo ni en el POS, pero sus ventas históricas y movimientos se conservarán.
              </p>
            ) : (
              <p>
                Volverá a aparecer como producto activo en Inventario y en el POS si tiene stock disponible.
              </p>
            )}
          </div>

          {isDeactivate && stock > 0 && (
            <div className="flex gap-3 rounded-[24px] border border-yellow-400/30 bg-yellow-400/15 p-5 text-yellow-100">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-300" />
              <div>
                <p className="font-black uppercase tracking-wide text-yellow-300">Atención</p>
                <p className="mt-1 text-sm font-bold">
                  Este producto todavía tiene {stock} pieza{stock === 1 ? "" : "s"} en inventario.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-7 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-[20px] border border-white/10 bg-white/10 px-6 py-3 text-sm font-black uppercase tracking-tight text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "rounded-[20px] px-6 py-3 text-sm font-black uppercase tracking-tight text-white shadow-xl transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
              isDeactivate
                ? "bg-red-500 shadow-red-500/25 hover:bg-red-400"
                : "bg-green-500 shadow-green-500/25 hover:bg-green-400",
            )}
          >
            {isLoading
              ? "Procesando..."
              : isDeactivate
                ? "Sí, desactivar"
                : "Sí, reactivar"}
          </button>
        </div>
      </div>
    </div>
  );
}
