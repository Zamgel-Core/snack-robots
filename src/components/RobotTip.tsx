import React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '../lib/utils';

interface RobotTipProps {
  message: string;
  type?: 'info' | 'success' | 'warning';
  className?: string;
}

export function RobotTip({ message, type = 'info', className }: RobotTipProps) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-[24px] border-4 shadow-xl overflow-hidden relative",
      type === 'info' && "bg-blue-400 border-white text-blue-900",
      type === 'success' && "bg-emerald-400 border-white text-emerald-900",
      type === 'warning' && "bg-orange-400 border-white text-orange-900",
      className
    )}>
      <div className="text-4xl z-10">🤖</div>
      <div className="flex-grow z-10">
        <p className="text-[10px] font-black uppercase opacity-60 mb-1">Robo Blue dice:</p>
        <p className="font-black text-lg leading-tight">{message}</p>
      </div>
      <div className="absolute -right-4 -top-4 opacity-10 text-8xl pointer-events-none">✨</div>
    </div>
  );
}
