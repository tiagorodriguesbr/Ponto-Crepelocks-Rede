import React from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  FileCheck,
  Check,
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationDrawerProps {
  notifications: SystemNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onNavigateToTab
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-zinc-900 border-l border-zinc-800 text-zinc-100 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Central de Alertas & Notificações</h3>
              <p className="text-[11px] text-zinc-400">
                {unreadCount > 0 ? `${unreadCount} alerta(s) não lido(s)` : 'Tudo em dia'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-zinc-950/60 border-b border-zinc-800/80 flex justify-between items-center text-xs">
            <span className="text-zinc-400 text-[11px]">Alertas automáticos de pontualidade</span>
            <button
              onClick={onMarkAllRead}
              className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px]"
            >
              Marcar todos como lidos
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Nenhuma notificação registrada.
            </div>
          ) : (
            notifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-2 ${
                    notif.read
                      ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400'
                      : notif.severity === 'error'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200 shadow-md shadow-rose-950/20'
                      : notif.severity === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 shadow-md shadow-amber-950/20'
                      : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {notif.severity === 'error' ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : notif.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <h4 className="font-bold text-white text-xs">{notif.title}</h4>
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => onMarkRead(notif.id)}
                        className="text-[10px] text-zinc-400 hover:text-white"
                        title="Marcar como lido"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] leading-relaxed text-zinc-300">{notif.message}</p>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{notif.storeName}</span>
                    <span>{notif.timestamp}</span>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      if (notif.type === 'atraso' || notif.type === 'ausencia') {
                        onNavigateToTab('aderencia');
                      } else if (notif.type === 'atestado_novo') {
                        onNavigateToTab('ocorrencias');
                      } else if (notif.type === 'escala_modificada') {
                        onNavigateToTab('escalas');
                      } else if (notif.type === 'ponto_pendente') {
                        onNavigateToTab('aderencia');
                      } else {
                        onNavigateToTab('dashboard');
                      }
                    }}
                    className="w-full mt-1 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Ver no Painel Operacional</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
