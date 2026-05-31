import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import candyWallpaper from '../assets/wallpapers/snack-robots-pattern.png';

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex overflow-hidden font-sans text-white p-6 gap-6 select-none relative">
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay"
        style={{ backgroundImage: `url(${candyWallpaper})`, backgroundSize: '150px' }}
      />
      
      <div className="relative z-10 flex w-full h-full gap-6">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col bg-transparent">
          <div className="w-full max-w-7xl mx-auto h-full overflow-y-auto no-scrollbar relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
