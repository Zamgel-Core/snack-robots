import React from 'react';
import { cn } from '../lib/utils';

interface ProgressBarProps {
  current: number;
  target: number;
  color?: 'blue' | 'orange' | 'green';
  showLabels?: boolean;
}

export function ProgressBar({ current, target, color = 'blue', showLabels = true }: ProgressBarProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  
  const colorClasses = {
    blue: 'bg-gradient-to-r from-yellow-300 to-orange-400',
    orange: 'bg-gradient-to-r from-orange-400 to-red-500',
    green: 'bg-gradient-to-r from-emerald-400 to-green-500',
  };

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between text-sm font-bold mb-2 text-white">
          <span>{percentage}%</span>
          <span className="opacity-50">Meta: {target}</span>
        </div>
      )}
      <div className="relative h-12 w-full bg-black/30 rounded-full border border-white/10 overflow-hidden shadow-inner">
        <div 
          className={cn("absolute left-0 top-0 h-full rounded-full shadow-[0_0_20px_rgba(250,204,21,0.5)] transition-all duration-1000 ease-out", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        >
          <div className="w-full h-full animate-pulse opacity-50 bg-white/20"></div>
        </div>
      </div>
    </div>
  );
}
