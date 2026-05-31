import React from 'react';
import { formatCurrency } from '../lib/utils';
import { mockProducts, mockSales, mockPurchases } from '../data/mockData';
import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';

export function Reports() {
  const totalSalesValue = mockSales.reduce((acc, sale) => acc + sale.total, 0);
  const totalProfitValue = mockSales.reduce((acc, sale) => acc + sale.profit, 0);
  const totalInvCost = mockProducts.reduce((acc, p) => acc + (p.stock * p.costPerPiece), 0);
  const potentialProfit = mockProducts.reduce((acc, p) => acc + (p.stock * p.profitPerPiece), 0);
  const initialInvestment = mockPurchases.reduce((acc, p) => acc + p.totalCost, 0);

  return (
    <div className="space-y-8 pb-10">
      <header className="mb-6 text-white">
        <h2 className="text-4xl font-black tracking-tight">Reportes</h2>
        <p className="text-xl text-blue-200 font-medium mt-2">Visión general del negocio.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-md rounded-[32px] p-8 border border-white/20 shadow-xl text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 pointer-events-none group-hover:scale-105 transition-transform duration-1000" />
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-300">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-black text-xl uppercase tracking-tight">Salud del Negocio</h3>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="font-bold text-blue-100 uppercase text-xs tracking-wider">Inversión Inicial</span>
              <span className="font-black text-lg">{formatCurrency(initialInvestment)}</span>
            </div>
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="font-bold text-blue-100 uppercase text-xs tracking-wider">Ventas Totales</span>
              <span className="font-black text-lg text-blue-300">{formatCurrency(totalSalesValue)}</span>
            </div>
            <div className="flex justify-between items-center bg-green-500/20 p-4 rounded-2xl border border-green-500/30">
              <span className="font-bold text-green-300 uppercase text-xs tracking-wider">Ganancia Neta</span>
              <span className="font-black text-xl text-green-400">{formatCurrency(totalProfitValue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-[32px] p-8 border border-white/20 shadow-xl text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 pointer-events-none group-hover:scale-105 transition-transform duration-1000" />
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-300">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-black text-xl uppercase tracking-tight">Valor del Inventario</h3>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="font-bold text-orange-100 uppercase text-xs tracking-wider">Capital Atorado (Costo)</span>
              <span className="font-black text-lg">{formatCurrency(totalInvCost)}</span>
            </div>
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="font-bold text-orange-100 uppercase text-xs tracking-wider">Valor de Venta Total</span>
              <span className="font-black text-lg text-orange-300">{formatCurrency(totalInvCost + potentialProfit)}</span>
            </div>
            <div className="flex justify-between items-center bg-green-500/20 p-4 rounded-2xl border border-green-500/30">
              <span className="font-bold text-green-300 uppercase text-xs tracking-wider">Ganancia Potencial</span>
              <span className="font-black text-xl text-green-400">{formatCurrency(potentialProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/10 backdrop-blur-md border border-white/10 text-center p-16 rounded-[32px] text-white/50 shadow-inner">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="font-bold text-lg uppercase tracking-widest">Gráficas detalladas estarán disponibles muy pronto.</p>
      </div>

    </div>
  );
}
