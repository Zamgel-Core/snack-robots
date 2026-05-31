import React from 'react';
import { mockGoals } from '../data/mockData';
import { formatCurrency } from '../lib/utils';
import { Target, Star } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';

export function Goals() {
  return (
    <div className="space-y-8 pb-10">
      <header className="mb-6 text-white">
        <h2 className="text-4xl font-black tracking-tight">Metas</h2>
        <p className="text-xl text-blue-200 font-medium mt-2">Apuntando a las estrellas. 🚀</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockGoals.map((goal, index) => {
          const color = index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'orange' : 'green';
          return (
            <div key={goal.id} className="bg-white/10 backdrop-blur-md rounded-[32px] p-6 border border-white/20 shadow-xl hover:bg-white/20 transition-all text-white flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                  color === 'blue' ? 'bg-blue-500/50' : color === 'orange' ? 'bg-orange-500/50' : 'bg-emerald-500/50'
                }`}>
                  <Target className="w-6 h-6" />
                </div>
                <div className="bg-black/20 text-white font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border border-white/10">
                  {goal.type === 'profit' ? 'Ganancia' : 'Ventas'}
                </div>
              </div>
              
              <h3 className="font-black text-xl mb-1 leading-tight flex-grow">{goal.title}</h3>
              <p className="text-blue-200 font-bold mb-6 text-sm">
                Progreso: {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
              </p>
              
              <ProgressBar current={goal.current} target={goal.target} color={color} showLabels={false} />
            </div>
          );
        })}

        <button className="bg-black/10 backdrop-blur-md rounded-[32px] p-6 border-2 border-dashed border-white/20 hover:border-white/50 hover:bg-white/5 transition-colors flex flex-col items-center justify-center text-white/50 hover:text-white group min-h-[250px]">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
            <Star className="w-8 h-8" />
          </div>
          <span className="font-black uppercase tracking-tight">Añadir nueva meta</span>
        </button>
      </div>
    </div>
  );
}
