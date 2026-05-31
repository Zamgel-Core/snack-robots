import React from 'react';
import { mockProducts } from '../data/mockData';
import { formatCurrency } from '../lib/utils';
import { Package, Plus, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Inventory() {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end mb-6 text-white">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Inventario</h2>
          <p className="text-xl text-blue-200 font-medium mt-2">Administra tus snacks y precios.</p>
        </div>
        <button className="bg-orange-500 text-white px-6 py-3 rounded-[20px] font-black flex items-center gap-2 hover:bg-orange-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/30 uppercase tracking-tighter text-sm">
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </header>

      <div className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl overflow-hidden text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-white/10 text-blue-200 uppercase text-[10px] tracking-widest font-black">
                <th className="p-6">Producto</th>
                <th className="p-6">Categoría</th>
                <th className="p-6 text-right">Stock</th>
                <th className="p-6 text-right">Costo / pz</th>
                <th className="p-6 text-right">Precio Venta</th>
                <th className="p-6 text-right">Ganancia</th>
                <th className="p-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 relative">
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black/20 border border-white/10 rounded-[16px] flex items-center justify-center text-xl shadow-inner group-hover:bg-black/30 transition-colors">
                        🍬
                      </div>
                      <div>
                        <p className="font-black text-lg">{product.name}</p>
                        <p className="text-xs text-blue-200 opacity-80 font-medium leading-tight">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {product.category}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn(
                        "font-black text-lg px-3 py-1 rounded-[12px] border",
                        product.stock > 10 ? "text-white bg-white/10 border-white/20" :
                        product.stock > 0 ? "text-yellow-300 bg-yellow-500/20 border-yellow-500/30" : "text-red-300 bg-red-500/20 border-red-500/30"
                      )}>
                        {product.stock}
                      </span>
                      {product.stock <= 5 && product.stock > 0 && <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider">Bajo</span>}
                      {product.stock === 0 && <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">Agotado</span>}
                    </div>
                  </td>
                  <td className="p-6 text-right font-bold text-blue-200">
                    {formatCurrency(product.costPerPiece)}
                  </td>
                  <td className="p-6 text-right">
                    <span className="font-black text-white text-xl">{formatCurrency(product.price)}</span>
                  </td>
                  <td className="p-6 text-right">
                    <span className="font-black text-green-400 text-lg">{formatCurrency(product.profitPerPiece)}</span>
                  </td>
                  <td className="p-6 text-center">
                    <button className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-2xl transition-colors border border-transparent hover:border-white/20">
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
