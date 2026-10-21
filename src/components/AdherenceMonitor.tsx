import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Calendar,
  Building2,
  Edit3,
  Check,
  X,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import { UserAccount, PunchRecord, Store } from '../types';
import { StorageService } from '../services/storage';

interface AdherenceMonitorProps {
  users: UserAccount[];
  punches: PunchRecord[];
  stores: Store[];
  currentUser?: UserAccount;
  onDataUpdated: () => void;
}

export const AdherenceMonitor: React.FC<AdherenceMonitorProps> = ({
  users,
  punches,
  stores,
  currentUser,
  onDataUpdated
}) => {
  const isReadOnly = currentUser?.role !== 'dono' && !currentUser?.permissions?.canApproveOccurrences;
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Adjustment Modal State
  const [adjustingPunch, setAdjustingPunch] = useState<PunchRecord | null>(null);
  const [editEntry, setEditEntry] = useState<string>('');
  const [editLunchStart, setEditLunchStart] = useState<string>('');
  const [editLunchEnd, setEditLunchEnd] = useState<string>('');
  const [editExit, setEditExit] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Filter punches
  const filteredPunches = punches.filter((p) => {
    if (selectedDate && p.date !== selectedDate) return false;

    const emp = users.find((u) => u.id === p.employeeId);
    if (!emp) return false;

    if (selectedStore !== 'all' && emp.storeId !== selectedStore) return false;
    if (selectedSchedule !== 'all' && emp.scheduleType !== selectedSchedule) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchPos = emp.positionTitle.toLowerCase().includes(q);
      if (!matchName && !matchPos) return false;
    }

    return true;
  });

  // Calculate automated metrics
  const totalItems = filteredPunches.length;
  const delayedItems = filteredPunches.filter((p) => p.status === 'atraso' || (p.delayMinutes && p.delayMinutes > 10));
  const onTimeItems = filteredPunches.filter((p) => p.status === 'regular' || (p.entry && (!p.delayMinutes || p.delayMinutes <= 10)));
  const absentItems = filteredPunches.filter((p) => p.status === 'falta_injustificada');

  const avgAdherence =
    totalItems > 0
      ? Math.round(
          filteredPunches.reduce((acc, p) => acc + (p.adherencePercentage || 100), 0) / totalItems
        )
      : 100;

  const handleOpenAdjust = (p: PunchRecord) => {
    setAdjustingPunch(p);
    setEditEntry(p.entry ? p.entry.slice(0, 5) : '');
    setEditLunchStart(p.lunchStart ? p.lunchStart.slice(0, 5) : '');
    setEditLunchEnd(p.lunchEnd ? p.lunchEnd.slice(0, 5) : '');
    setEditExit(p.exit ? p.exit.slice(0, 5) : '');
    setAdjustReason(p.notes || 'Ajuste operacional autorizado pela gerência');
  };

  const handleSaveAdjust = () => {
    if (!adjustingPunch) return;
    const allPunches = StorageService.getPunches();
    const updated = allPunches.map((p) => {
      if (p.id === adjustingPunch.id) {
        const patched: PunchRecord = {
          ...p,
          entry: editEntry ? `${editEntry}:00` : null,
          lunchStart: editLunchStart ? `${editLunchStart}:00` : null,
          lunchEnd: editLunchEnd ? `${editLunchEnd}:00` : null,
          exit: editExit ? `${editExit}:00` : null,
          notes: adjustReason,
          approvedAdjustment: true
        };
        StorageService.recalculatePunchMetrics(patched);
        return patched;
      }
      return p;
    });

    StorageService.savePunches(updated);
    setAdjustingPunch(null);
    onDataUpdated();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Banner de Modo Somente Leitura para Gerente */}
      {isReadOnly && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex items-center gap-3 text-amber-200">
          <Eye className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block">Modo Acompanhamento (Perfil Gerente)</span>
            <span>Você tem acesso de consulta ao monitoramento de pontualidade e atrasos da equipe em tempo real. Ajustes de horários de ponto são restritos ao Dono.</span>
          </div>
        </div>
      )}

      {/* Title & Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Painel Centralizado de Aderência à Escala</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Cálculo automatizado de pontualidade, tolerâncias CLT, atrasos e permissão para ajustes pontuais gerenciais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Índice Geral: {avgAdherence}%</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card/60 border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Pontualidade Global</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{avgAdherence}%</div>
          <p className="text-[11px] text-zinc-400 mt-1">Comparativo previsto vs. realizado</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Dentro da Tolerância CLT</span>
          <div className="text-3xl font-extrabold text-white mt-1">{onTimeItems.length}</div>
          <p className="text-[11px] text-emerald-400 mt-1">Entrada regular (até 10 min)</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Atrasos Críticos Detectados</span>
          <div className={`text-3xl font-extrabold mt-1 ${delayedItems.length > 0 ? 'text-amber-400' : 'text-white'}`}>
            {delayedItems.length}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Necessitam justificativa ou ajuste</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Ausências Não Autorizadas</span>
          <div className={`text-3xl font-extrabold mt-1 ${absentItems.length > 0 ? 'text-rose-400' : 'text-white'}`}>
            {absentItems.length}
          </div>
          <p className="text-[11px] text-rose-400 mt-1">Sem registro de ponto nem atestado</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border bg-card/60 border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Store select */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todas as Lojas</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Schedule select */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedSchedule}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todas as Escalas</option>
              <option value="6x1">Escala 6x1</option>
              <option value="12x36">Escala 12x36</option>
              <option value="5x2">Escala 5x2 (Adm)</option>
            </select>
          </div>

          {/* Date select */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar colaborador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 w-48 sm:w-56"
          />
        </div>
      </div>

      {/* Main Adherence Table */}
      <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold text-[10px] border-b border-zinc-800">
              <tr>
                <th className="py-3 px-3">Colaborador / Loja</th>
                <th className="py-3 px-3">Escala</th>
                <th className="py-3 px-3">Horário Previsto</th>
                <th className="py-3 px-3">Entrada Real</th>
                <th className="py-3 px-3">Intervalo Almoço</th>
                <th className="py-3 px-3">Saída Real</th>
                <th className="py-3 px-3">Atraso</th>
                <th className="py-3 px-3">Pontualidade</th>
                <th className="py-3 px-3">Situação</th>
                <th className="py-3 px-3 text-right">Ajuste Pontual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredPunches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-500 font-sans">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPunches.map((punch) => {
                  const emp = users.find((u) => u.id === punch.employeeId);
                  const store = stores.find((s) => s.id === emp?.storeId);

                  return (
                    <tr key={punch.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-white text-xs">{emp?.name || 'Desconhecido'}</div>
                        <div className="text-[10px] text-zinc-400 font-normal">
                          {store?.name || 'Sede'} • {emp?.positionTitle}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                          {emp?.scheduleType || '6x1'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        {punch.scheduledStart} - {punch.scheduledEnd}
                      </td>
                      <td className="py-2.5 px-3">
                        {punch.entry ? (
                          <span className="text-emerald-400 font-bold">{punch.entry.slice(0, 5)}</span>
                        ) : (
                          <span className="text-zinc-500">--:--</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {punch.lunchStart ? (
                          <div className="flex flex-col">
                            <span className="text-amber-300 font-bold text-xs">
                              {punch.lunchStart.slice(0, 5)} {punch.lunchEnd ? `→ ${punch.lunchEnd.slice(0, 5)}` : '(Em pausa)'}
                            </span>
                            {punch.lunchStart && punch.lunchEnd && (
                              <span className="text-[10px] text-zinc-400 font-normal">
                                {(() => {
                                  const [sh, sm] = punch.lunchStart.split(':').map(Number);
                                  const [eh, em] = punch.lunchEnd.split(':').map(Number);
                                  const diff = (eh * 60 + em) - (sh * 60 + sm);
                                  return `${diff > 0 ? diff : diff + 1440} min`;
                                })()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500">--:--</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {punch.exit ? (
                          <span className="text-emerald-400 font-bold">{punch.exit.slice(0, 5)}</span>
                        ) : (
                          <span className="text-zinc-500">--:--</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        {punch.delayMinutes > 0 ? (
                          <span className="text-amber-400 font-bold">+{punch.delayMinutes} min</span>
                        ) : (
                          <span className="text-zinc-500">0 min</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              punch.adherencePercentage >= 95
                                ? 'text-emerald-400'
                                : punch.adherencePercentage >= 80
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {punch.adherencePercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            punch.status === 'regular'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : punch.status === 'atraso'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : punch.status === 'folga'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : punch.status === 'falta_justificada'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {punch.statusLabel || punch.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        {isReadOnly ? (
                          <span className="text-[11px] text-zinc-500 italic">Visualização</span>
                        ) : (
                          <button
                            onClick={() => handleOpenAdjust(punch)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition-all inline-flex items-center gap-1 border border-zinc-700"
                          >
                            <Edit3 className="w-3 h-3 text-emerald-400" />
                            <span>Ajustar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Manager Adjustment */}
      {adjustingPunch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Ajuste Pontual de Ponto (Gestão RH)</span>
              </h3>
              <button
                onClick={() => setAdjustingPunch(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Como administrador, você pode ajustar horários pontuais por motivo justificado (ex: esquecimento de marcação, problemas técnicos). O ajuste ficará auditado no prontuário.
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Entrada (HH:mm)</label>
                  <input
                    type="time"
                    value={editEntry}
                    onChange={(e) => setEditEntry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Saída Almoço (HH:mm)</label>
                  <input
                    type="time"
                    value={editLunchStart}
                    onChange={(e) => setEditLunchStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Retorno Almoço (HH:mm)</label>
                  <input
                    type="time"
                    value={editLunchEnd}
                    onChange={(e) => setEditLunchEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Saída Turno (HH:mm)</label>
                  <input
                    type="time"
                    value={editExit}
                    onChange={(e) => setEditExit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Justificativa do Ajuste</label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex: Falha temporária no leitor biométrico, autorizado pelo Gerente Carlos."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setAdjustingPunch(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAdjust}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Ajuste Gerencial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
