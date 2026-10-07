import React from 'react';
import { Palette, Check } from 'lucide-react';
import { ThemeStyle } from '../types';

interface ThemeSelectorProps {
  currentTheme: ThemeStyle;
  onThemeChange: (theme: ThemeStyle) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const themes: { id: ThemeStyle; label: string; desc: string; colorDot: string; bgClass: string }[] = [
    {
      id: 'dark-emerald',
      label: 'Verde Crepelocks',
      desc: 'Escuro esmeralda institucional',
      colorDot: 'bg-emerald-500 ring-emerald-400',
      bgClass: 'bg-emerald-950'
    },
    {
      id: 'dark-obsidian',
      label: 'Preto Grafite',
      desc: 'Dark mode profundo obsidian',
      colorDot: 'bg-zinc-300 ring-zinc-500',
      bgClass: 'bg-zinc-950'
    },
    {
      id: 'light-slate',
      label: 'Claro Corporativo',
      desc: 'Ambiente executivo luminoso',
      colorDot: 'bg-blue-600 ring-blue-300',
      bgClass: 'bg-slate-100'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Alternar tema visual (Verde escuro / Preto / Claro)"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm
          border-emerald-500/30 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/50 hover:border-emerald-400
          dark:text-zinc-200"
      >
        <Palette className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">
          {themes.find((t) => t.id === currentTheme)?.label || 'Tema'}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-50 p-2 border backdrop-blur-md
            bg-zinc-900/95 border-zinc-800 text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 border-b border-zinc-800 mb-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Personalização Visual
              </span>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Alterne entre verde institucional, preto ou claro.
              </p>
            </div>

            <div className="space-y-1">
              {themes.map((theme) => {
                const isSelected = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onThemeChange(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors text-xs ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                        : 'hover:bg-zinc-800/70 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3.5 h-3.5 rounded-full ring-2 ${theme.colorDot}`} />
                      <div>
                        <div className="leading-tight">{theme.label}</div>
                        <div className="text-[10px] text-zinc-400 font-normal">{theme.desc}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
