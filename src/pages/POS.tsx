import React, { useState } from 'react';
import { mockProducts } from '../data/mockData';
import { formatCurrency } from '../lib/utils';
import { ShoppingCart, Plus, Minus, X, CheckCircle2 } from 'lucide-react';

export function POS() {
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartItems = cart.map(item => {
    const product = mockProducts.find(p => p.id === item.productId)!;
    return { ...item, product };
  });

  const total = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const profit = cartItems.reduce((acc, item) => acc + (item.product.profitPerPiece * item.quantity), 0);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-8">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col h-full">
        <header className="mb-6 text-white">
          <h2 className="text-3xl font-black tracking-tight">Vender Snacks</h2>
          <p className="text-blue-200 font-medium">Toca un producto para agregarlo.</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-8 pr-4">
          {mockProducts.filter(p => p.stock > 0).map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product.id)}
              className="bg-white/10 backdrop-blur-md rounded-[24px] p-5 border border-white/20 text-left hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-xl text-white group"
            >
              <div className="w-full aspect-square bg-black/20 rounded-2xl mb-4 flex items-center justify-center text-4xl group-hover:bg-black/30 transition-colors shadow-inner">
                🍬
              </div>
              <h3 className="font-bold text-lg leading-tight mb-1">{product.name}</h3>
              <p className="text-yellow-300 font-black text-xl">{formatCurrency(product.price)}</p>
              <p className="text-[10px] font-bold text-blue-200 mt-2 uppercase tracking-wide">Stock: {product.stock}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[380px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-2xl flex flex-col h-full overflow-hidden text-white">
        <div className="p-6 border-b border-white/10 bg-black/10">
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <ShoppingCart className="text-yellow-400" />
            Carrito
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/50">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p className="font-bold text-lg uppercase tracking-wide">El carrito está vacío</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.productId} className="flex gap-4 items-center bg-black/20 p-4 rounded-[24px] border border-white/10 shadow-inner">
                <div className="flex-1">
                  <h4 className="font-bold">{item.product.name}</h4>
                  <p className="text-yellow-300 font-black">{formatCurrency(item.product.price)}</p>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-1 border border-white/20">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors">
                    {item.quantity === 1 ? <X className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4" />}
                  </button>
                  <span className="w-6 text-center font-bold text-lg">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-blue-200 font-bold uppercase text-sm tracking-wide">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-green-400 font-bold uppercase text-sm tracking-wide">
              <span>Ganancia estimada</span>
              <span>{formatCurrency(profit)}</span>
            </div>
            <div className="flex justify-between text-3xl font-black pt-4 border-t border-white/10">
              <span>Total</span>
              <span className="text-yellow-400">{formatCurrency(total)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setCart([])}
              className="py-4 rounded-[24px] font-bold text-white/70 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all uppercase tracking-wide text-xs"
            >
              Cancelar
            </button>
            <button 
              className="py-4 rounded-[24px] font-black uppercase text-white bg-orange-500 hover:bg-orange-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-wide"
              disabled={cartItems.length === 0}
              onClick={() => {
                alert('¡Venta registrada con éxito! (Modo Mock)');
                setCart([]);
              }}
            >
              <CheckCircle2 className="w-5 h-5" />
              Cobrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
