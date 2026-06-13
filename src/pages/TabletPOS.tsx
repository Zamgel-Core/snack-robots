import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Maximize2, RefreshCw, ShieldCheck } from 'lucide-react';
import { POS } from './POS';
import candyWallpaper from '../assets/wallpapers/snack-robots-pattern.png';
import typographyLogo from '../assets/logos/snack-robots-text.png';

export function TabletPOS() {
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-4 text-white select-none relative">
      <div
        className="pointer-events-none absolute inset-0 opacity-5 mix-blend-overlay"
        style={{ backgroundImage: `url(${candyWallpaper})`, backgroundSize: '150px' }}
      />

      <div className="relative z-10 flex h-[calc(100vh-2rem)] flex-col gap-4">
        <header className="flex shrink-0 items-center justify-between gap-4 rounded-[28px] border border-white/20 bg-white/10 px-5 py-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-40 shrink-0 flex items-center">
              <img src={typographyLogo} alt="Snack Robots" className="h-full w-full object-contain drop-shadow-xl" />
            </div>

            <div className="hidden md:block min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-300">Terminal POS</p>
              <p className="truncate text-sm font-bold text-blue-100">Modo tablet optimizado para venta rápida</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-green-300/20 bg-green-400/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-green-200">
              <ShieldCheck className="h-4 w-4" />
              App instalada / lista
            </div>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-wide transition hover:bg-white/20 active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              Recargar
            </button>

            <Link
              to="/portal"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-wide text-blue-700 shadow-xl transition hover:scale-[1.02] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Portal
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-black/10 p-4 shadow-2xl backdrop-blur-sm tablet-pos-shell">
          <POS />
        </main>

        <div className="pointer-events-none fixed bottom-4 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100 backdrop-blur-xl md:flex">
          <Maximize2 className="h-4 w-4 text-yellow-300" />
          Para mejor experiencia: instala la PWA y usa la tablet en horizontal
        </div>
      </div>
    </div>
  );
}
