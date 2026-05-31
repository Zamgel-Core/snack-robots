import React from 'react';
import { formatCurrency } from '../lib/utils';
import { StatCard } from '../components/StatCard';
import { RobotTip } from '../components/RobotTip';
import { Calculator, Wallet, DollarSign, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { mockSales, mockPurchases } from '../data/mockData';

export function CashRegister() {
  const initialCash = 5.00;
  const todaysSales = mockSales.reduce((acc, sale) => acc + sale.total, 0);
  const todaysPurchases = 0; // mockPurchases logic here if wanted by day
  const expectedCash = initialCash + todaysSales - todaysPurchases;

  return (
    <div className="space-y-8 pb-10">
      <header className="mb-6 text-white">
        <h2 className="text-4xl font-black tracking-tight">Caja</h2>
        <p className="text-xl text-blue-200 font-medium mt-2">Control del efectivo.</p>
      </header>

      <RobotTip 
        message="Recuerda: El dinero en la caja de ventas totales no es todo ganancia. ¡Guarda siempre para volver a comprar mercancía!"
        type="warning"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Fondo Inicial"
          value={formatCurrency(initialCash)}
          icon={Wallet}
          color="slate"
        />
        <StatCard
          title="Entradas (Ventas)"
          value={formatCurrency(todaysSales)}
          icon={ArrowDownToLine}
          color="green"
        />
        <StatCard
          title="Salidas (Compras)"
          value={formatCurrency(todaysPurchases)}
          icon={ArrowUpFromLine}
          color="red"
        />
        <StatCard
          title="Efectivo Esperado"
          value={formatCurrency(expectedCash)}
          icon={Calculator}
          color="blue"
        />
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 p-8 shadow-xl flex flex-col items-center text-center mt-8 text-white">
        <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Cierre de Caja</h3>
        <p className="text-blue-100 font-medium mb-8 max-w-md">
          Cuenta el dinero físico que tienes en tu caja y regístralo aquí para asegurar que cuadre con el sistema.
        </p>
        
        <div className="w-full max-w-sm space-y-6">
          <div>
            <label className="block text-xs font-bold text-yellow-300 mb-2 flex justify-start uppercase tracking-wider">Efectivo real en caja:</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-black text-2xl">$</span>
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full bg-black/20 border border-white/20 rounded-[20px] py-4 pl-10 pr-4 text-2xl font-black focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all text-white placeholder-white/30"
              />
            </div>
          </div>
          
          <button className="w-full bg-orange-500 text-white py-4 rounded-[20px] font-black text-lg hover:bg-orange-400 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-xl uppercase tracking-widest shadow-orange-500/30">
            <Calculator className="w-6 h-6" /> Realizar Cierre
          </button>
        </div>
      </div>
    </div>
  );
}
