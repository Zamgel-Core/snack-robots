import React from 'react';
import { mockPurchases } from '../data/mockData';
import { formatCurrency } from '../lib/utils';
import { ShoppingBag, Plus } from 'lucide-react';

export function Purchases() {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end mb-6 text-white">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Compras</h2>
          <p className="text-xl text-blue-200 font-medium mt-2">Registra tu nueva mercancía.</p>
        </div>
        <button className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-orange-400 active:scale-95 transition-all shadow-xl shadow-orange-500/30 uppercase tracking-tight text-sm">
          <Plus className="w-5 h-5" />
          Registrar Compra
        </button>
      </header>

      <div className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl overflow-hidden text-white">
        <div className="p-6 border-b border-white/10 bg-black/10">
          <h3 className="font-black text-xl uppercase tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-yellow-400" /> Historial de Compras
          </h3>
        </div>
        <div className="p-0">
          {mockPurchases.map(purchase => (
            <div key={purchase.id} className="flex justify-between items-center p-6 border-b last:border-0 border-white/10 hover:bg-white/5 transition-colors group">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-[16px] bg-black/20 flex items-center justify-center text-yellow-400 shadow-inner group-hover:bg-black/30 border border-white/10">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-lg">{purchase.description}</p>
                  <p className="text-blue-200 font-bold opacity-80 text-sm">
                    {new Date(purchase.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-2xl text-yellow-300">-{formatCurrency(purchase.totalCost)}</p>
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-80">Costo</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
