import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'orange' | 'red' | 'yellow' | 'green' | 'slate';
  subtitle?: string;
  className?: string;
}

const colorStyles = {
  blue: 'bg-blue-50 text-brand-blue border-blue-100',
  orange: 'bg-orange-50 text-brand-orange border-orange-100',
  red: 'bg-red-50 text-brand-red border-red-100',
  yellow: 'bg-yellow-50 text-brand-yellow border-yellow-100',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-100',
};

const iconBgStyles = {
  blue: 'bg-blue-100',
  orange: 'bg-orange-100',
  red: 'bg-red-100',
  yellow: 'bg-yellow-100',
  green: 'bg-emerald-100',
  slate: 'bg-slate-200',
};

export function StatCard({ title, value, color = 'blue', subtitle, className }: StatCardProps) {
  const isRed = color === 'red';
  
  return (
    <div className={cn(
      "p-5 rounded-[24px] shadow-xl transition-transform hover:scale-[1.02]",
      isRed ? "bg-red-500 text-white" : "bg-white/90 backdrop-blur-md text-blue-900",
      className
    )}>
      <p className={cn("text-xs font-bold uppercase mb-1", isRed ? "opacity-80" : "opacity-60")}>
        {title}
      </p>
      <p className={cn("text-3xl font-black tracking-tight", isRed && "underline")}>
        {value} {title === 'Stock Total' && <span className="text-lg opacity-40">pzs</span>}
      </p>
      {subtitle && (
        <p className={cn("text-[10px] font-bold mt-1", isRed ? "" : "opacity-80")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
