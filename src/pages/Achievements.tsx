import React from 'react';
import { mockAchievements } from '../data/mockData';
import { Trophy, CheckCircle, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export function Achievements() {
  return (
    <div className="space-y-8 pb-10">
      <header className="mb-6 text-white">
        <h2 className="text-4xl font-black tracking-tight">Logros</h2>
        <p className="text-xl text-blue-200 font-medium mt-2">Medallas y reconocimiento.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockAchievements.map((achievement) => (
          <div 
            key={achievement.id} 
            className={cn(
              "flex items-center gap-4 bg-black/20 p-6 rounded-[32px] border transition-all hover:bg-black/30 shadow-xl",
              achievement.unlocked ? "border-white/20" : "border-white/5 grayscale opacity-60"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-3xl",
              achievement.unlocked ? "bg-yellow-400/20 text-yellow-300" : "bg-white/10 text-white/50"
            )}>
              {achievement.unlocked ? (achievement.icon === 'party-popper' ? '🎉' : achievement.icon === 'coin' ? '💰' : achievement.icon === 'trending-up' ? '📈' : '🏆') : <Lock className="w-6 h-6" />}
            </div>
            <div className="flex-1 text-white">
              <div className="flex justify-between items-start mb-1 text-white">
                <h3 className="font-black uppercase tracking-tight">{achievement.title}</h3>
                {achievement.unlocked && <CheckCircle className="text-yellow-400 w-5 h-5 flex-shrink-0" />}
              </div>
              <p className="text-xs opacity-70 font-medium">{achievement.description}</p>
              {achievement.unlocked && achievement.unlockedAt && (
                <p className="text-[10px] font-black text-yellow-300 mt-2 uppercase tracking-widest opacity-80">
                  Desbloqueado: {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
