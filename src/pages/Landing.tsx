import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, TrendingUp, Trophy, LineChart, Wallet, BookOpen, Star } from 'lucide-react';
import { mockProducts } from '../data/mockData';
import { formatCurrency } from '../lib/utils';
import mainLogo from '../assets/logos/snack-robots-logo.png';
import typographyLogo from '../assets/logos/snack-robots-text.png';
import candyWallpaper from '../assets/wallpapers/snack-robots-pattern.png';

export function Landing() {
  const featuredProducts = mockProducts.slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white font-sans overflow-x-hidden selection:bg-yellow-400 selection:text-blue-900 relative">
      {/* Background Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay z-0"
        style={{ backgroundImage: `url(${candyWallpaper})`, backgroundSize: '200px' }}
      />

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10 w-full">
        
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-16 bg-white/10 backdrop-blur-md rounded-full px-8 py-4 border border-white/20 shadow-xl">
          <div className="flex items-center gap-3">
             <img src={typographyLogo} alt="Snack Robots" className="h-12 object-contain" />
          </div>
          <Link to="/login" className="bg-white text-blue-700 px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-white/20">
            Entrar al Portal
          </Link>
        </nav>

        {/* Hero */}
        <section className="text-center py-10 md:py-20 flex flex-col items-center relative">
          
          {/* Subtle floating decorative elements */}
          <div className="absolute top-10 left-10 text-4xl opacity-50 animate-bounce" style={{animationDuration: '3s'}}>🍬</div>
          <div className="absolute bottom-10 right-10 text-4xl opacity-50 animate-bounce" style={{animationDuration: '4s'}}>🍫</div>
          <div className="absolute top-1/2 right-20 text-3xl opacity-50 animate-bounce" style={{animationDuration: '2.5s'}}>🍭</div>
          <div className="absolute bottom-20 left-20 text-3xl opacity-50 animate-bounce" style={{animationDuration: '3.5s'}}>🍿</div>

          {/* Main Logo with subtle float */}
          <div className="relative mb-8 transform hover:scale-105 transition-transform duration-500 hover:-rotate-1">
             <img 
               src={mainLogo} 
               alt="Snack Robots Official Logo" 
               className="h-64 md:h-80 w-auto object-contain drop-shadow-2xl relative z-10"
               style={{ animation: 'float 6s ease-in-out infinite' }}
             />
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 uppercase drop-shadow-lg text-white">Snack Robots</h1>
          <p className="text-2xl md:text-3xl font-black text-yellow-300 opacity-90 italic uppercase tracking-widest mb-8 drop-shadow">Sweet Treats, Great Taste!</p>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
            El sistema de ventas más divertido y moderno. Todo el control de tus snacks en un solo lugar. 
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login" className="bg-orange-500 text-white px-8 py-5 rounded-[24px] font-black text-xl uppercase tracking-tighter shadow-[0_10px_40px_rgba(249,115,22,0.4)] hover:bg-orange-400 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 border-2 border-orange-400 hover:border-white/50 group">
              Entrar al Portal <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#conoce-mas" className="bg-white/10 backdrop-blur-md text-white px-8 py-5 rounded-[24px] font-black text-xl uppercase tracking-tighter shadow-xl hover:bg-white/20 transition-all border border-white/20">
              Conocer Más
            </a>
          </div>
        </section>

        {/* Conoce Snack Robots */}
        <section id="conoce-mas" className="py-20 border-t border-white/10 scroll-mt-20">
          <div className="bg-black/20 backdrop-blur-md rounded-[48px] p-8 md:p-16 border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none group-hover:scale-105 transition-transform duration-1000" />
            
            <div className="max-w-3xl mx-auto text-center relative z-10 mb-16">
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">Conoce Snack Robots</h2>
               <p className="text-xl md:text-2xl text-blue-100 leading-relaxed font-medium">
                Snack Robots nació como un emprendimiento creado por <span className="text-yellow-300 font-bold">Abdiel</span> para aprender ventas, ahorro, reinversión y emprendimiento desde pequeño.
               </p>
               <p className="text-lg text-blue-200 mt-6 font-medium opacity-80">
                La plataforma ayuda a controlar inventario, ventas, ganancias y metas mientras convierte el aprendizaje en una experiencia interactiva y divertida.
               </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {[
                { icon: <Wallet />, title: 'Vender', desc: 'Aprende a registrar y sumar tus ingresos diarios.' },
                { icon: <Package />, title: 'Administrar', desc: 'Controla tu inventario como un profesional.' },
                { icon: <TrendingUp />, title: 'Reinvertir', desc: 'Usa tus ganancias para hacer crecer tu negocio.' },
                { icon: <Trophy />, title: 'Ahorrar', desc: 'Cumple tus metas y logra grandes medallas.' }
              ].map((feature, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md rounded-[32px] p-6 border border-white/20 text-center hover:bg-white/20 transition-all hover:-translate-y-2 shadow-xl">
                  <div className="w-16 h-16 mx-auto bg-blue-500/30 rounded-2xl flex items-center justify-center text-blue-300 mb-6 border border-blue-400/30">
                    {feature.icon}
                  </div>
                  <h3 className="font-black uppercase tracking-wider mb-2">{feature.title}</h3>
                  <p className="text-sm font-medium text-blue-200">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-20 border-t border-white/10">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-center mb-16 drop-shadow">Productos Estrella</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, i) => {
              const emojis = ['🍬', '🍫', '🍭', '🌶️'];
              return (
              <div key={product.id} className="bg-white/10 backdrop-blur-md rounded-[32px] p-6 border border-white/20 text-center hover:bg-white/20 transition-all hover:scale-105 shadow-xl group flex flex-col h-full transform hover:-rotate-1">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-black/20 to-black/40 rounded-[28px] mb-6 flex items-center justify-center text-6xl shadow-inner group-hover:scale-110 transition-transform duration-300 border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {emojis[i % emojis.length]}
                </div>
                <h3 className="font-black text-xl mb-1 leading-tight flex-grow">{product.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="px-3 py-1 bg-black/20 inline-block rounded-full text-[10px] uppercase font-black tracking-widest text-blue-200 border border-white/10">
                    {product.category}
                  </span>
                </div>
                <div className="bg-black/30 rounded-2xl py-3 border border-white/5">
                  <p className="text-[10px] uppercase font-bold text-blue-200 opacity-80 mb-1">Precio sugerido</p>
                  <p className="text-yellow-400 font-black text-3xl">{formatCurrency(product.price)}</p>
                </div>
              </div>
            )})}
          </div>
        </section>

        {/* Control Center Mockups Section */}
        <section className="py-20 border-t border-white/10">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-center mb-6">Poderoso Control Center</h2>
          <p className="text-xl text-blue-200 text-center mb-16 max-w-2xl mx-auto font-medium">Una plataforma profesional diseñada especialmente para ser fácil de usar.</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Mockup 1 - Dashboard */}
            <div className="bg-white/10 backdrop-blur-xl rounded-[40px] p-6 border border-white/20 shadow-2xl transform hover:-translate-y-2 transition-transform overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <LineChart className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-2 mb-6 opacity-70">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Vista Principal</h4>
                    <p className="text-2xl font-black">Dashboard</p>
                  </div>
                  <div className="bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold">ABIERTA</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-yellow-300 font-bold uppercase mb-1">Ventas Hoy</p>
                    <p className="text-2xl font-black">$45.00</p>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-green-300 font-bold uppercase mb-1">Ganancia Neta</p>
                    <p className="text-2xl font-black">$22.50</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup 2 - POS */}
            <div className="bg-black/20 backdrop-blur-xl rounded-[40px] p-6 border border-white/10 shadow-2xl transform hover:-translate-y-2 transition-transform overflow-hidden relative">
               <div className="absolute bottom-0 right-0 p-8 opacity-10">
                <Package className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-2 mb-6 opacity-70">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Caja Registradora</h4>
                    <p className="text-2xl font-black">Punto de Venta</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-16 bg-white/10 rounded-2xl border border-white/5 flex items-center px-4 gap-3">
                       <span className="text-2xl">🍫</span> <div className="h-2 bg-white/20 rounded w-20"></div>
                    </div>
                    <div className="h-16 bg-white/10 rounded-2xl border border-white/5 flex items-center px-4 gap-3">
                       <span className="text-2xl">🍬</span> <div className="h-2 bg-white/20 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="w-1/3 bg-orange-500/20 rounded-2xl border border-orange-500/30 p-4 flex flex-col justify-between">
                    <div className="h-2 bg-orange-200/50 rounded w-12 mb-4"></div>
                    <div className="text-xl font-black text-orange-300">$18.50</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10 pt-16 pb-8 relative z-10 w-full backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 text-center flex flex-col items-center">
          <img src={typographyLogo} alt="Snack Robots" className="h-16 mb-4 object-contain opacity-100" />
          <p className="text-lg font-black text-yellow-300 opacity-90 italic uppercase tracking-widest mb-12 drop-shadow">Sweet Treats, Great Taste!</p>
          
          <div className="w-full flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-8 mt-8">
            <p className="font-bold text-white/50 uppercase tracking-widest text-xs mb-4 md:mb-0">© 2026 Snack Robots.</p>
            <p className="font-bold text-white/50 uppercase tracking-widest text-xs">Houston, Texas</p>
          </div>
        </div>
      </footer>
      
      {/* Required for custom floating keyframe */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}} />
    </div>
  );
}
