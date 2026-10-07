import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, MapPin, Wifi } from 'lucide-react';

interface ClockWidgetProps {
  storeName?: string;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ storeName = 'Crepelocks Shopping Sul' }) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  const formattedDate = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border bg-black/20 backdrop-blur-md border-emerald-500/20 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-baseline gap-1 font-mono font-bold tracking-tight text-white text-3xl sm:text-4xl">
            <span>{hours}</span>
            <span className="text-emerald-400 animate-ping duration-1000">:</span>
            <span>{minutes}</span>
            <span className="text-zinc-500 text-xl font-normal">:{seconds}</span>
          </div>
          <p className="text-xs text-zinc-400 capitalize tracking-wide mt-0.5">{formattedDate}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">Portaria MTP 671</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/70 border border-zinc-700/50 text-zinc-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span className="truncate max-w-[150px]">{storeName}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/70 border border-zinc-700/50 text-emerald-400">
          <Wifi className="w-3.5 h-3.5" />
          <span>Sincronizado</span>
        </div>
      </div>
    </div>
  );
};
