import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  X,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { getPOSProducts, POSProduct, processSale } from '../lib/posService';
import { useAuth } from '../contexts/AuthContext';

type CartItem = {
  productId: string;
  quantity: number;
};

function money(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function getEmojiForCategory(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes('chicle')) return '🍬';
  if (normalized.includes('gelatina')) return '🍮';
  if (normalized.includes('picante')) return '🌶️';
  if (normalized.includes('mexicano')) return '🥜';
  if (normalized.includes('gomita')) return '🌈';

  return '🍭';
}

export function POS() {
  const { user, profile } = useAuth();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function loadProducts() {
    if (!user?.id) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const result = await getPOSProducts(user.id);
      setStoreId(result.storeId);
      setProducts(result.products);
    } catch (error) {
      console.error(error);
      setErrorMessage('No se pudieron cargar los productos del POS.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const cartItems = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((current) => current.id === item.productId);
        if (!product) return null;

        return {
          ...item,
          product,
        };
      })
      .filter(Boolean) as Array<CartItem & { product: POSProduct }>;
  }, [cart, products]);

  const total = cartItems.reduce(
    (acc, item) => acc + money(item.product.sale_price) * item.quantity,
    0,
  );

  const profit = cartItems.reduce(
    (acc, item) =>
      acc + (money(item.product.sale_price) - money(item.product.unit_cost)) * item.quantity,
    0,
  );

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  function getCartQuantity(productId: string) {
    return cart.find((item) => item.productId === productId)?.quantity ?? 0;
  }

  function addToCart(product: POSProduct) {
    setSuccessMessage('');
    setErrorMessage('');

    const currentQuantity = getCartQuantity(product.id);

    if (currentQuantity >= product.stock) {
      setErrorMessage(`No hay más stock disponible de ${product.name}.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...prev, { productId: product.id, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setSuccessMessage('');
    setErrorMessage('');

    const product = products.find((item) => item.id === productId);
    if (!product) return;

    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId !== productId) return item;

          const nextQuantity = item.quantity + delta;

          if (nextQuantity > product.stock) {
            setErrorMessage(`Solo quedan ${product.stock} piezas de ${product.name}.`);
            return item;
          }

          return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0);
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  async function handleCheckout() {
    if (!user?.id || !storeId || cartItems.length === 0) return;

    try {
      setSelling(true);
      setErrorMessage('');
      setSuccessMessage('');

      const items = cartItems.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      }));

      await processSale(storeId, user.id, items);

      setCart([]);
      setSuccessMessage(`¡Venta registrada! Total: ${formatCurrency(total)}`);
      await loadProducts();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || 'No se pudo registrar la venta.');
    } finally {
      setSelling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 flex items-center gap-4 shadow-2xl">
          <Loader2 className="w-7 h-7 animate-spin text-yellow-300" />
          <div>
            <p className="text-xl font-black">Cargando POS...</p>
            <p className="text-sm text-blue-100 font-semibold">Leyendo productos reales de Supabase</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-4rem)] gap-6 xl:gap-8 pb-6">
      <div className="flex-1 flex flex-col min-h-0">
        <header className="mb-6 text-white flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-yellow-300 bg-yellow-300/10 border border-yellow-300/20 rounded-full px-4 py-2 mb-3">
              <Sparkles className="w-4 h-4" />
              Venta Real
            </p>

            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Vender Snacks
            </h2>
            <p className="text-blue-100 font-medium mt-1">
              Hola {profile?.display_name || 'Usuario'}, toca un producto para agregarlo al carrito.
            </p>
          </div>

          <button
            onClick={loadProducts}
            disabled={selling}
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl px-5 py-3 font-black uppercase tracking-wide text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </header>

        <div className="mb-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-100/70" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar producto o categoría..."
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-[24px] pl-12 pr-5 py-4 text-white placeholder:text-blue-100/50 font-bold outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/20 transition-all"
          />
        </div>

        {errorMessage && (
          <div className="mb-5 bg-red-500/20 border border-red-400/30 rounded-3xl p-4 text-red-50 font-bold flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 bg-green-500/20 border border-green-400/30 rounded-3xl p-4 text-green-50 font-bold flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4 overflow-y-auto pb-8 pr-1 xl:pr-4 min-h-0">
          {filteredProducts.map((product) => {
            const selectedQuantity = getCartQuantity(product.id);
            const available = product.stock - selectedQuantity;

            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={available <= 0 || selling}
                className="bg-white/10 backdrop-blur-md rounded-[24px] p-5 border border-white/20 text-left hover:bg-white/20 transition-all hover:scale-[1.03] active:scale-95 shadow-xl text-white group disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <div className="w-full aspect-square bg-black/20 rounded-2xl mb-4 flex items-center justify-center text-5xl group-hover:bg-black/30 transition-colors shadow-inner relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getEmojiForCategory(product.category)}</span>
                  )}

                  {selectedQuantity > 0 && (
                    <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-black rounded-full w-8 h-8 flex items-center justify-center shadow-xl">
                      {selectedQuantity}
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-base md:text-lg leading-tight mb-1">
                      {product.name}
                    </h3>
                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">
                      {product.category}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-yellow-300 font-black text-2xl">
                      {formatCurrency(money(product.sale_price))}
                    </p>
                    <p className="text-green-300 text-[11px] font-black uppercase tracking-wide">
                      +{formatCurrency(money(product.sale_price) - money(product.unit_cost))} ganancia
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wide">
                      Stock
                    </p>
                    <p className="font-black text-lg">{available}</p>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full bg-white/10 border border-white/20 rounded-[32px] p-10 text-center text-white">
              <Package className="w-14 h-14 mx-auto mb-4 text-blue-100/60" />
              <p className="font-black text-xl">No encontramos productos.</p>
              <p className="text-blue-100 font-semibold mt-2">Prueba con otra búsqueda.</p>
            </div>
          )}
        </div>
      </div>

      <aside className="w-full xl:w-[390px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-2xl flex flex-col min-h-[520px] xl:h-full overflow-hidden text-white">
        <div className="p-6 border-b border-white/10 bg-black/10">
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <ShoppingCart className="text-yellow-300" />
            Carrito
          </h3>
          <p className="text-sm text-blue-100 font-bold mt-1">
            {totalItems} producto{totalItems === 1 ? '' : 's'} seleccionado{totalItems === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-white/50 text-center">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p className="font-black text-lg uppercase tracking-wide">El carrito está vacío</p>
              <p className="font-semibold text-sm mt-2 max-w-[220px]">
                Toca un snack para agregarlo a la venta.
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 items-center bg-black/20 p-4 rounded-[24px] border border-white/10 shadow-inner"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getEmojiForCategory(item.product.category)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-black truncate">{item.product.name}</h4>
                  <p className="text-yellow-300 font-black">
                    {formatCurrency(money(item.product.sale_price))}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1 border border-white/20">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    disabled={selling}
                    className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors disabled:opacity-50"
                  >
                    {item.quantity === 1 ? (
                      <X className="w-4 h-4 text-red-300" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                  </button>

                  <span className="w-6 text-center font-black text-lg">{item.quantity}</span>

                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    disabled={selling || item.quantity >= item.product.stock}
                    className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  disabled={selling}
                  className="p-2 text-white/40 hover:text-red-300 transition-colors disabled:opacity-40"
                  title="Quitar producto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-blue-100 font-black uppercase text-sm tracking-wide">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <div className="flex justify-between text-green-300 font-black uppercase text-sm tracking-wide">
              <span>Ganancia estimada</span>
              <span>{formatCurrency(profit)}</span>
            </div>

            <div className="flex justify-between text-3xl font-black pt-4 border-t border-white/10">
              <span>Total</span>
              <span className="text-yellow-300">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setCart([]);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              disabled={cartItems.length === 0 || selling}
              className="py-4 rounded-[24px] font-black text-white/70 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/50 transition-all uppercase tracking-wide text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>

            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || selling}
              className="py-4 rounded-[24px] font-black uppercase text-white bg-orange-500 hover:bg-orange-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-wide"
            >
              {selling ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {selling ? 'Cobrando...' : 'Cobrar'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
