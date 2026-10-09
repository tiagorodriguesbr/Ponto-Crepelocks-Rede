import React from 'react';
import {
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle,
  Building2,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  Eye
} from 'lucide-react';
import { UserAccount, PunchRecord, Store, SystemNotification } from '../types';

interface AdminDashboardProps {
  currentUser: UserAccount;
  users: UserAccount[];
  punches: PunchRecord[];
  stores: Store[];
  notifications: SystemNotification[];
  selectedStoreId: string;
  onNavigateTab: (tab: string) => void;
  onMarkNotificationRead: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  users,
  punches,
  stores,
  notifications,
  selectedStoreId,
  onNavigateTab,
  onMarkNotificationRead
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter by store if selected
  const filteredUsers = users.filter((u) =>
    selectedStoreId === 'all' ? true : u.storeId === selectedStoreId
  );
  const employeeIds = new Set(filteredUsers.map((u) => u.id));

  const todayPunches = punches.filter(
    (p) => p.date === todayStr && employeeIds.has(p.employeeId)
  );

  // Operational metrics: only employees who are required to punch clock
  const usersWhoPunch = filteredUsers.filter(
    (u) => u.active && u.role !== 'dono' && !u.exemptFromPunchClock
  );
  const totalEmployees = usersWhoPunch.length;
  const currentlyWorking = todayPunches.filter((p) => p.entry !== null && p.exit === null).length;
  const completedToday = todayPunches.filter((p) => p.exit !== null).length;
  const delayedToday = todayPunches.filter((p) => p.status === 'atraso' || (p.delayMinutes && p.delayMinutes > 10)).length;
  const unauthorizedAbsences = todayPunches.filter((p) => p.status === 'falta_injustificada').length;

  const totalDelaysMinutes = todayPunches.reduce((acc, p) => acc + (p.delayMinutes || 0), 0);
  const totalExtraMinutes = todayPunches.reduce((acc, p) => acc + (p.extraMinutes || 0), 0);

  // Network adherence rate
  const validPunchesWithAdherence = todayPunches.filter((p) => p.expectedMinutes > 0);
  const networkAdherencePct =
    validPunchesWithAdherence.length > 0
      ? Math.round(
          validPunchesWithAdherence.reduce((acc, p) => acc + p.adherencePercentage, 0) /
            validPunchesWithAdherence.length
        )
      : 96;

  // Unread urgent notifications
  const criticalAlerts = notifications.filter((n) => !n.read && (n.severity === 'error' || n.severity === 'warning'));

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Gerente Monitoring Mode Notice */}
      {currentUser.role === 'gerente' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300 block">
                {currentUser.permissions?.canManageEmployees || currentUser.permissions?.canEditSchedules
                  ? 'Painel Gerencial (Acesso com Gestão Autorizada)'
                  : 'Modo Acompanhamento (Perfil Gerente)'}
              </span>
              <span>
                {currentUser.permissions?.canManageEmployees || currentUser.permissions?.canEditSchedules
                  ? 'Acesso aos painéis operacionais com permissões específicas concedidas pela diretoria.'
                  : 'Acesso aos painéis de monitoramento em tempo real igual ao Dono. Sem permissão de modificação de dados.'}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider shrink-0 self-start sm:self-center">
            {currentUser.permissions?.canManageEmployees || currentUser.permissions?.canEditSchedules
              ? 'Gestão Habilitada'
              : 'Somente Acompanhamento'}
          </span>
        </div>
      )}

      {/* Top Banner Alert if any critical absent or delay */}
      {criticalAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 backdrop-blur-md shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-100 flex items-center gap-2">
                Atenção Gerencial: {criticalAlerts.length} Ocorrência(s) Crítica(s) Detectada(s)
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                {criticalAlerts[0].title}: {criticalAlerts[0].message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('aderencia')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Resolver no Painel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Present Now */}
        <div className="p-4 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Presentes Agora</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">
              {currentlyWorking} <span className="text-sm font-normal text-zinc-400">/ {totalEmployees}</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {completedToday} já finalizaram expediente
            </p>
          </div>
        </div>

        {/* Aderência Geral */}
        <div className="p-4 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Aderência à Escala</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-400">{networkAdherencePct}%</div>
            <p className="text-[11px] text-zinc-400 mt-1">Pontualidade média calculada</p>
          </div>
        </div>

        {/* Atrasos Hoje */}
        <div className="p-4 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Atrasos Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold ${delayedToday > 0 ? 'text-amber-400' : 'text-white'}`}>
              {delayedToday}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {totalDelaysMinutes > 0 ? `${totalDelaysMinutes} min acumulados` : 'Nenhum atraso'}
            </p>
          </div>
        </div>

        {/* Ausências Não Autorizadas */}
        <div className="p-4 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Ausências / Faltas</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold ${unauthorizedAbsences > 0 ? 'text-rose-400' : 'text-white'}`}>
              {unauthorizedAbsences}
            </div>
            <p className="text-[11px] text-rose-400/90 mt-1">Sem comunicação prévia</p>
          </div>
        </div>

        {/* Horas Extras */}
        <div className="p-4 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Horas Extras Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">
              {Math.floor(totalExtraMinutes / 60)}h {totalExtraMinutes % 60}m
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Impacto em banco de horas</p>
          </div>
        </div>
      </div>

      {/* Main Row: Live Feed across Stores & Performance by Unit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Punch Stream (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold text-white">Monitoramento de Ponto em Tempo Real</h3>
            </div>
            <button
              onClick={() => onNavigateTab('aderencia')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Ver Auditoria Completa</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayPunches.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Nenhum registro para hoje ainda.</p>
            ) : (
              todayPunches.map((punch) => {
                const emp = users.find((u) => u.id === punch.employeeId);
                const store = stores.find((s) => s.id === emp?.storeId);

                return (
                  <div
                    key={punch.id}
                    className="p-3.5 rounded-xl border bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-bold text-sm shadow">
                        {emp?.name.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{emp?.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                            {emp?.scheduleType}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {store?.name || 'Loja Crepelocks'} • Previsto: {punch.scheduledStart} às {punch.scheduledEnd}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Punch badges */}
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span
                          className={`px-2 py-1 rounded ${
                            punch.entry ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'
                          }`}
                          title="Entrada"
                        >
                          E: {punch.entry ? punch.entry.slice(0, 5) : '--:--'}
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            punch.lunchStart ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-zinc-800 text-zinc-500'
                          }`}
                          title="Saída Almoço"
                        >
                          A: {punch.lunchStart ? punch.lunchStart.slice(0, 5) : '--:--'}
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            punch.lunchEnd ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'
                          }`}
                          title="Volta Almoço"
                        >
                          R: {punch.lunchEnd ? punch.lunchEnd.slice(0, 5) : '--:--'}
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            punch.exit ? 'bg-rose-950 text-rose-300 border border-rose-500/30' : 'bg-zinc-800 text-zinc-500'
                          }`}
                          title="Saída Fim de Turno"
                        >
                          S: {punch.exit ? punch.exit.slice(0, 5) : '--:--'}
                        </span>
                      </div>

                      {/* Status pill */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          punch.status === 'regular'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : punch.status === 'atraso'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : punch.status === 'falta_injustificada'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {punch.statusLabel || punch.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Store Performance Breakdown (1 col) */}
        <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Desempenho por Loja</span>
            </h3>
            <button
              onClick={() => onNavigateTab('lojas')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Gerenciar
            </button>
          </div>

          <div className="space-y-3">
            {stores.map((store) => {
              const storeEmployees = users.filter((u) => u.storeId === store.id && u.active);
              const storePunches = todayPunches.filter((p) =>
                storeEmployees.some((e) => e.id === p.employeeId)
              );

              const storeDelays = storePunches.filter((p) => p.status === 'atraso').length;
              const storePunctuality = storeDelays === 0 ? 100 : Math.max(70, 100 - storeDelays * 15);

              return (
                <div
                  key={store.id}
                  className="p-3 rounded-xl border bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="font-bold text-white block">{store.name}</span>
                      <span className="text-[10px] text-zinc-400">
                        {store.code} • {storeEmployees.length} colaboradores
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {storePunctuality}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        storePunctuality >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${storePunctuality}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2">
                    <span>Gerente: {store.managerName || 'Não atribuído'}</span>
                    <span className={storeDelays > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                      {storeDelays > 0 ? `${storeDelays} atraso(s)` : 'Sem atrasos'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('escalas')}
              className="w-full py-2.5 rounded-xl border border-dashed border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Gerador de Escalas 6x1 e 12x36</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
