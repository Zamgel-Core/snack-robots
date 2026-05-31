import React from 'react';
import { StatCard } from '../components/StatCard';
import { RobotTip } from '../components/RobotTip';
import { ProgressBar } from '../components/ProgressBar';
import { DollarSign, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { mockProducts, mockSales } from '../data/mockData';

export function Dashboard() {
  const todaySales = mockSales.reduce((acc, sale) => acc + sale.total, 0);
  const todayProfit = mockSales.reduce((acc, sale) => acc + sale.profit, 0);
  const totalInventory = mockProducts.reduce((acc, p) => acc + p.stock, 0);
  
  const lowStock = mockProducts.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStock = mockProducts.filter(p => p.stock === 0);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">¡Hola Abdiel! 🚀</h2>
          <p className="text-xl text-blue-100 font-medium">Aquí está el resumen de tu negocio hoy.</p>
        </div>
        <div className="hidden md:flex gap-3">
          <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/20 text-right">
            <p className="text-[10px] uppercase font-bold text-yellow-300">Status de Caja</p>
            <p className="text-lg font-black text-white">ABIERTA</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Hoy"
          value={formatCurrency(todaySales)}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Ganancia Hoy"
          value={formatCurrency(todayProfit)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Stock Total"
          value={totalInventory}
          icon={Package}
          color="orange"
          subtitle="piezas disponibles"
        />
        <StatCard
          title="Alertas"
          value={lowStock.length + outOfStock.length}
          icon={AlertTriangle}
          color="red"
          subtitle="productos por revisar"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 p-8 flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <TrendingUp className="text-yellow-400" /> 
                Meta de la semana
              </h3>
              <span className="bg-yellow-400 text-blue-900 text-xs px-3 py-1 rounded-full font-black uppercase tracking-widest">En progreso</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2 text-white">
                <div>
                  <p className="font-bold text-blue-200 uppercase text-sm mb-1">Llegar a $10.00 vendidos</p>
                  <p className="text-3xl font-black">{formatCurrency(todaySales)}</p>
                </div>
              </div>
              <ProgressBar current={todaySales} target={10.00} color="blue" showLabels={false} />
              <p className="text-sm font-semibold text-yellow-300 text-center mt-4">
                ¡Faltan {formatCurrency(Math.max(0, 10 - todaySales))} para la meta!
              </p>
            </div>
          </section>

          <RobotTip 
            message="¡Tus Canel's tienen buen margen y se venden rápido! Podrían ser tu producto estrella de la semana." 
            type="info"
          />
        </div>

        <div className="space-y-6">
          <section className="bg-black/20 backdrop-blur-md rounded-[32px] p-6 border border-white/10 shadow-xl h-full flex flex-col text-white">
            <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-white">Avisos de Stock</h3>
            
            <div className="space-y-4 flex-grow">
              {outOfStock.map(p => (
                <div key={p.id} className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-between">
                  <span className="font-bold text-red-100">{p.name}</span>
                  <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase">Agotado</span>
                </div>
              ))}
              
              {lowStock.map(p => (
                <div key={p.id} className="p-4 bg-orange-400/20 border border-orange-400/30 rounded-2xl flex items-center justify-between">
                  <span className="font-bold text-orange-100">{p.name}</span>
                  <div className="text-right">
                     <span className="block text-sm font-bold text-orange-300">{p.stock} pz</span>
                  </div>
                </div>
              ))}
              
              {lowStock.length === 0 && outOfStock.length === 0 && (
                <div className="text-center p-6 text-white/50 font-medium italic">
                  Todo tu inventario está estable.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
