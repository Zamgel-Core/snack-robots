import React, { useEffect, useMemo, useState } from "react";
import { X, Boxes, Plus, Minus, RotateCcw } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  adjustProductStock,
  type InventoryProduct,
} from "../../lib/inventoryService";
import { useAuth } from "../../contexts/AuthContext";

type StockAdjustmentModalProps = {
  isOpen: boolean;
  product: InventoryProduct | null;
  onClose: () => void;
  onSaved: () => void;
};

type Mode = "add" | "remove" | "set";

export function StockAdjustmentModal({
  isOpen,
  product,
  onClose,
  onSaved,
}: StockAdjustmentModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("add");
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentStock = Number(product?.stock ?? 0);

  const newStock = useMemo(() => {
    if (mode === "add") return currentStock + amount;
    if (mode === "remove") return currentStock - amount;
    return amount;
  }, [amount, currentStock, mode]);

  const difference = newStock - currentStock;

  useEffect(() => {
    if (!isOpen) return;
    setMode("add");
    setAmount(1);
    setNote("");
    setErrorMessage("");
    setSaving(false);
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage("");

    if (!user) {
      setErrorMessage("No hay usuario activo.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setErrorMessage("El valor no puede ser negativo.");
      return;
    }

    if (mode !== "set" && amount <= 0) {
      setErrorMessage("La cantidad debe ser mayor a cero.");
      return;
    }

    if (newStock < 0) {
      setErrorMessage(`No puedes quitar más de ${currentStock} pieza(s).`);
      return;
    }

    if (!note.trim()) {
      setErrorMessage("Escribe una nota para explicar el ajuste.");
      return;
    }

    if (difference === 0) {
      setErrorMessage("El stock quedaría igual. No hay cambios por guardar.");
      return;
    }

    try {
      setSaving(true);
      await adjustProductStock(user.id, product, newStock, note);
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo ajustar el stock.");
    } finally {
      setSaving(false);
    }
  }

  const options: { value: Mode; label: string; icon: React.ElementType }[] = [
    { value: "add", label: "Agregar", icon: Plus },
    { value: "remove", label: "Quitar", icon: Minus },
    { value: "set", label: "Fijar total", icon: RotateCcw },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
        aria-label="Cerrar modal"
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[36px] border border-white/20 bg-gradient-to-br from-blue-950/95 via-indigo-950/95 to-purple-950/95 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-blue-950/90 px-7 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300">
              Inventario
            </p>
            <h3 className="flex items-center gap-3 text-3xl font-black tracking-tight">
              <Boxes className="h-7 w-7 text-orange-400" />
              Ajustar Stock
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-60"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-7">
          {errorMessage && (
            <div className="rounded-2xl border border-red-300/30 bg-red-500/20 px-5 py-3 text-sm font-bold text-red-100">
              {errorMessage}
            </div>
          )}

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5">
            <p className="text-sm font-black uppercase tracking-widest text-blue-200">
              Producto
            </p>
            <div className="mt-3 flex items-center gap-4">
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
              <div>
                <p className="text-2xl font-black">{product.name}</p>
                <p className="text-sm font-bold text-blue-200">
                  Stock actual: {currentStock} pz
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {options.map((option) => {
              const Icon = option.icon;
              const isActive = mode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black uppercase transition-all",
                    isActive
                      ? "border-yellow-400 bg-yellow-400 text-blue-950"
                      : "border-white/10 bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-200">
              {mode === "set" ? "Nuevo stock total" : "Cantidad"}
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(event) => {
                const value = Math.floor(Number(event.target.value) || 0);
                setAmount(Math.max(0, value));
              }}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-2xl font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-blue-200">
                Actual
              </p>
              <p className="mt-2 text-3xl font-black">{currentStock}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-blue-200">
                Cambio
              </p>
              <p
                className={cn(
                  "mt-2 text-3xl font-black",
                  difference >= 0 ? "text-green-300" : "text-red-300",
                )}
              >
                {difference > 0 ? `+${difference}` : difference}
              </p>
            </div>
            <div className="rounded-[24px] border border-yellow-400/20 bg-yellow-500/15 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-yellow-200">
                Nuevo stock
              </p>
              <p className="mt-2 text-3xl font-black text-yellow-200">
                {newStock}
              </p>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-200">
              Nota del ajuste <span className="text-yellow-300">*</span>
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                mode === "add"
                  ? "Ej. Compra nueva en Costco/Sam's, reposición..."
                  : mode === "remove"
                    ? "Ej. Producto dañado, vencido, perdido..."
                    : "Ej. Conteo físico, corrección de inventario..."
              }
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            />
          </label>

          <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-black uppercase tracking-tight transition-colors hover:bg-white/20 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || newStock < 0}
              className="rounded-2xl bg-orange-500 px-7 py-3 font-black uppercase tracking-tight shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar Ajuste"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
