import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  PackagePlus,
  DollarSign,
  Boxes,
  ImagePlus,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  type InventoryProduct,
  type ProductFormValues,
} from "../../lib/inventoryService";
import { useAuth } from "../../contexts/AuthContext";

type ProductModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  product?: InventoryProduct | null;
  onClose: () => void;
  onSaved: () => void;
};

const initialValues: ProductFormValues = {
  name: "",
  category: "Dulces",
  description: "",
  image_url: "",
  package_cost: 0,
  pieces_per_package: 1,
  sale_price: 0,
  stock: 0,
  low_stock_threshold: 5,
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getValuesFromProduct(product?: InventoryProduct | null): ProductFormValues {
  if (!product) return initialValues;

  return {
    name: product.name ?? "",
    category: product.category ?? "Dulces",
    description: product.description ?? "",
    image_url: product.image_url ?? "",
    package_cost: Number(product.package_cost ?? 0),
    pieces_per_package: Number(product.pieces_per_package ?? 1),
    sale_price: Number(product.sale_price ?? 0),
    stock: Number(product.stock ?? 0),
    low_stock_threshold: Number(product.low_stock_threshold ?? 5),
  };
}

export function ProductModal({
  isOpen,
  mode,
  product,
  onClose,
  onSaved,
}: ProductModalProps) {
  const { user } = useAuth();
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditMode = mode === "edit";

  const unitCost = useMemo(() => {
    if (values.pieces_per_package <= 0) return 0;
    return values.package_cost / values.pieces_per_package;
  }, [values.package_cost, values.pieces_per_package]);

  const profit = values.sale_price - unitCost;
  const potentialRevenue = values.sale_price * values.stock;
  const potentialProfit = profit * values.stock;
  const displayImage = previewUrl || values.image_url;

  useEffect(() => {
    if (!isOpen) return;

    setValues(getValuesFromProduct(product));
    setSelectedImage(null);
    setPreviewUrl("");
    setErrorMessage("");
    setSaving(false);
  }, [isOpen, product]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  function updateField<K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Selecciona un archivo de imagen válido.");
      return;
    }

    const maxSizeMb = 5;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMessage(`La imagen debe pesar menos de ${maxSizeMb} MB.`);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setErrorMessage("");
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearSelectedImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null);
    setPreviewUrl("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage("");

    if (!user) {
      setErrorMessage("No hay usuario activo.");
      return;
    }

    if (!values.name.trim()) {
      setErrorMessage("Escribe el nombre del producto.");
      return;
    }

    if (!values.category.trim()) {
      setErrorMessage("Escribe la categoría del producto.");
      return;
    }

    if (values.pieces_per_package <= 0) {
      setErrorMessage("Las piezas por paquete deben ser mayores a 0.");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = values.image_url?.trim() || "";

      if (selectedImage) {
        imageUrl = await uploadProductImage(user.id, selectedImage);
      }

      const payload = {
        ...values,
        image_url: imageUrl,
      };

      if (isEditMode && product?.id) {
        await updateProduct(user.id, product.id, payload);
      } else {
        await createProduct(user.id, payload);
      }

      setValues(initialValues);
      clearSelectedImage();
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        isEditMode
          ? "No se pudo actualizar el producto."
          : "No se pudo guardar el producto.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
        aria-label="Cerrar modal"
      />

      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[36px] border border-white/20 bg-gradient-to-br from-blue-950/95 via-indigo-950/95 to-purple-950/95 text-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-blue-950/90 backdrop-blur-xl px-7 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300">
              Inventario
            </p>
            <h3 className="flex items-center gap-3 text-3xl font-black tracking-tight">
              <PackagePlus className="h-7 w-7 text-orange-400" />
              {isEditMode ? "Editar Producto" : "Nuevo Producto"}
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

          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Nombre
              </span>
              <input
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ej. Skittles"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Categoría
              </span>
              <input
                value={values.category}
                onChange={(event) => updateField("category", event.target.value)}
                placeholder="Dulces"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Descripción
              </span>
              <textarea
                value={values.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Descripción corta del producto"
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              />
            </label>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-black/15 p-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
              <div className="h-48 overflow-hidden rounded-[24px] border border-dashed border-white/20 bg-white/5">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="Vista previa del producto"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                    <ImagePlus className="mb-3 h-12 w-12 text-blue-200" />
                    <p className="text-sm font-black uppercase text-blue-100">
                      Foto del producto
                    </p>
                    <p className="mt-1 text-xs text-blue-200/70">
                      JPG, PNG o WEBP
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                    Subir imagen
                  </span>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black uppercase tracking-tight shadow-xl shadow-orange-500/20 transition-colors hover:bg-orange-400">
                      <Upload className="h-5 w-5" />
                      {displayImage ? "Cambiar foto" : "Seleccionar foto"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>

                    {(selectedImage || values.image_url) && (
                      <button
                        type="button"
                        onClick={() => {
                          clearSelectedImage();
                          updateField("image_url", "");
                        }}
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black uppercase transition-colors hover:bg-white/20"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {selectedImage && (
                    <p className="text-xs font-bold text-green-200">
                      Lista para subir: {selectedImage.name}
                    </p>
                  )}
                </label>

                <label className="block space-y-2">
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-200">
                    <LinkIcon className="h-4 w-4" /> Imagen URL opcional
                  </span>
                  <input
                    value={values.image_url}
                    onChange={(event) => {
                      clearSelectedImage();
                      updateField("image_url", event.target.value);
                    }}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  />
                  <p className="text-xs font-medium text-blue-200/70">
                    Puedes subir una foto o pegar una URL. Si subes foto, se guardará en Supabase Storage.
                  </p>
                </label>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Costo paquete
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.package_cost}
                onChange={(event) =>
                  updateField("package_cost", toNumber(event.target.value))
                }
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Piezas paquete
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={values.pieces_per_package}
                onChange={(event) =>
                  updateField(
                    "pieces_per_package",
                    Math.max(1, Math.floor(toNumber(event.target.value))),
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Precio venta
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.sale_price}
                onChange={(event) =>
                  updateField("sale_price", toNumber(event.target.value))
                }
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                {isEditMode ? "Stock actual" : "Stock inicial"}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={values.stock}
                disabled={isEditMode}
                onChange={(event) =>
                  updateField(
                    "stock",
                    Math.max(0, Math.floor(toNumber(event.target.value))),
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {isEditMode && (
                <p className="text-[11px] font-bold text-blue-200/70">
                  Usa “Ajustar stock” desde la tabla para registrar movimientos.
                </p>
              )}
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200">
                Stock bajo
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={values.low_stock_threshold}
                onChange={(event) =>
                  updateField(
                    "low_stock_threshold",
                    Math.max(0, Math.floor(toNumber(event.target.value))),
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-black outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              />
            </label>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-200">
                <Boxes className="h-4 w-4" /> Costo por pieza
              </div>
              <p className="text-2xl font-black">{formatCurrency(unitCost)}</p>
            </div>

            <div className="rounded-[24px] border border-green-400/20 bg-green-500/15 p-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-green-200">
                <DollarSign className="h-4 w-4" /> Ganancia por pieza
              </div>
              <p className="text-2xl font-black text-green-300">
                {formatCurrency(profit)}
              </p>
            </div>

            <div className="rounded-[24px] border border-yellow-400/20 bg-yellow-500/15 p-5">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-yellow-200">
                Potencial inventario
              </p>
              <p className="text-sm font-bold text-yellow-100">
                Venta: {formatCurrency(potentialRevenue)}
              </p>
              <p className="text-sm font-bold text-yellow-100">
                Ganancia: {formatCurrency(potentialProfit)}
              </p>
            </div>
          </section>

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
              disabled={saving}
              className="rounded-2xl bg-orange-500 px-7 py-3 font-black uppercase tracking-tight shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? isEditMode
                  ? "Actualizando..."
                  : "Guardando..."
                : isEditMode
                  ? "Actualizar Producto"
                  : "Guardar Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
