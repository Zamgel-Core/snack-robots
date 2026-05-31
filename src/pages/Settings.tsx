import React from 'react';
import { Settings as SettingsIcon, User, Store, Smartphone, Database } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-8 pb-10">
      <header className="mb-6 text-white">
        <h2 className="text-4xl font-black tracking-tight">Configuración</h2>
        <p className="text-xl text-blue-200 font-medium mt-2">Ajustes del sistema.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-white">
        <div className="space-y-6">
          <section className="bg-white/10 backdrop-blur-md rounded-[32px] p-8 border border-white/20 shadow-xl">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Store className="text-yellow-400" />
              Datos del Negocio
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-blue-200 mb-2 uppercase tracking-wider">Nombre del Negocio</label>
                <input type="text" defaultValue="Snack Robots" className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 font-bold text-white focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-200 mb-2 uppercase tracking-wider">Moneda</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 font-bold text-white focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 appearance-none">
                  <option value="USD">Dólar Estadounidense (USD)</option>
                  <option value="MXN">Peso Mexicano (MXN)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white/10 backdrop-blur-md rounded-[32px] p-8 border border-white/20 shadow-xl">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <User className="text-orange-400" />
              Usuario Actual
            </h3>
            <div className="flex items-center gap-4 mb-6 p-4 bg-black/20 rounded-2xl border border-white/5">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-2xl text-white font-black shadow-lg">
                A
              </div>
              <div>
                <p className="font-black text-xl">Abdiel</p>
                <p className="font-bold text-orange-300 text-sm uppercase tracking-wider">Administrador</p>
              </div>
            </div>
            <button className="w-full py-3 rounded-2xl border border-white/20 font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-widest text-xs">
              Cambiar Rol a Super Admin
            </button>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white/10 backdrop-blur-md rounded-[32px] p-8 border border-white/20 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent pointer-events-none" />
            <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-blue-300 uppercase tracking-tight">
              <Smartphone className="w-6 h-6" />
              Convertir en App
            </h3>
            <p className="text-blue-100 font-medium mb-6">Instala Snack Robots en tu tablet para usarla sin internet y como una app nativa.</p>
            <button className="w-full py-4 rounded-2xl bg-black/20 font-bold text-blue-200/50 cursor-not-allowed border border-white/10 border-dashed uppercase tracking-widest text-xs">
              Próximamente (PWA)
            </button>
          </section>

          <section className="bg-white/10 backdrop-blur-md rounded-[32px] p-8 border border-white/20 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent pointer-events-none" />
            <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-green-300 uppercase tracking-tight">
              <Database className="w-6 h-6" />
              Conectar a la Nube
            </h3>
            <p className="text-blue-100 font-medium mb-6">Guarda tus datos de forma segura en internet para no perderlos nunca.</p>
            <button className="w-full py-4 rounded-2xl bg-black/20 font-bold text-green-200/50 cursor-not-allowed border border-white/10 border-dashed uppercase tracking-widest text-xs">
              Conectar Supabase (Próximamente)
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
