import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  ShoppingBag, 
  Calculator, 
  BarChart3, 
  Target, 
  Trophy, 
  Settings,
  Bot
} from 'lucide-react';
import { cn } from '../lib/utils';
import typographyLogo from '../assets/logos/snack-robots-text.png';

const links = [
  { name: 'Dashboard', to: '/portal', icon: LayoutDashboard },
  { name: 'Vender', to: '/portal/pos', icon: ShoppingCart },
  { name: 'Inventario', to: '/portal/inventory', icon: Package },
  { name: 'Compras', to: '/portal/purchases', icon: ShoppingBag },
  { name: 'Caja', to: '/portal/register', icon: Calculator },
  { name: 'Reportes', to: '/portal/reports', icon: BarChart3 },
  { name: 'Metas', to: '/portal/goals', icon: Target },
  { name: 'Logros', to: '/portal/achievements', icon: Trophy },
  { name: 'Configuración', to: '/portal/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <nav className="w-[240px] flex flex-col gap-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 shadow-2xl flex-shrink-0 relative overflow-y-auto">
      <div className="flex flex-col items-center gap-2 mb-8 text-center">
        <div className="w-full h-20 flex items-center justify-center mb-1">
          <img src={typographyLogo} alt="Snack Robots" className="h-full object-contain drop-shadow-xl" />
        </div>
        <div>
          <p className="text-[10px] font-black text-yellow-300 opacity-90 italic uppercase tracking-widest drop-shadow">Sweet Treats, Great Taste!</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 flex-grow">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/portal'}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                isActive 
                  ? "bg-white text-blue-700 shadow-xl" 
                  : "text-white hover:bg-white/10 opacity-80 hover:opacity-100"
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "opacity-70")} />
                  {link.name}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto p-4 bg-black/20 rounded-2xl border border-white/5 mt-4">
        <p className="text-[10px] uppercase font-bold text-blue-200 tracking-widest mb-1">Rol Actual</p>
        <p className="font-black text-sm uppercase">Abdiel (Admin)</p>
      </div>
    </nav>
  );
}
