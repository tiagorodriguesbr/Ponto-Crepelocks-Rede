import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Coffee,
  LogIn,
  LogOut,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileCheck,
  Award,
  ChevronRight,
  TrendingUp,
  Eye,
  X,
  Building2,
  Lock,
  FileText,
  HelpCircle,
  Check
} from 'lucide-react';
import { UserAccount, PunchRecord, Store, PunchType, ScheduleDay, MedicalCertificate, OccurrenceRecord } from '../types';
import { ClockWidget } from './ClockWidget';
import { StorageService } from '../services/storage';

interface EmployeePunchScreenProps {
  currentUser: UserAccount;
  currentStore?: Store;
  punches: PunchRecord[];
  schedules: ScheduleDay[];
  certificates?: MedicalCertificate[];
  occurrences?: OccurrenceRecord[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onPunchRegistered: () => void;
}

export const EmployeePunchScreen: React.FC<EmployeePunchScreenProps> = ({
  currentUser,
  currentStore,
  punches,
  schedules,
  certificates = [],
  occurrences = [],
  activeTab: externalActiveTab,
  onTabChange,
  onPunchRegistered
}) => {
  const [internalTab, setInternalTab] = useState<'bater_ponto' | 'minha_aderencia' | 'atestados'>('bater_ponto');
  const [punchFeedback, setPunchFeedback] = useState<{ message: string; hash?: string } | null>(null);
  const [viewingCert, setViewingCert] = useState<MedicalCertificate | null>(null);

  // Month navigation for schedule and history
  const currentMonth = new Date();
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(
    `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
  );
  const monthOptions = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 2 + index);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: `${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date)} / ${date.getFullYear()}`
    };
  });

  // Synchronize internal and external active tab
  const currentTab = (externalActiveTab === 'bater_ponto' || externalActiveTab === 'minha_aderencia' || externalActiveTab === 'atestados')
    ? externalActiveTab
    : internalTab;

  const handleTabSwitch = (tab: 'bater_ponto' | 'minha_aderencia' | 'atestados') => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPunch = punches.find((p) => p.employeeId === currentUser.id && p.date === todayStr);

  // Determine which step is currently pending
  const hasEntry = Boolean(todayPunch?.entry);
  const hasLunchStart = Boolean(todayPunch?.lunchStart);
  const hasLunchEnd = Boolean(todayPunch?.lunchEnd);
  const hasExit = Boolean(todayPunch?.exit);

  let nextStep: PunchType = 'entry';
  if (!hasEntry) nextStep = 'entry';
  else if (!hasLunchStart) nextStep = 'lunchStart';
  else if (!hasLunchEnd) nextStep = 'lunchEnd';
  else if (!hasExit) nextStep = 'exit';
  else nextStep = 'entry'; // all completed

  const allCompletedToday = hasEntry && hasLunchStart && hasLunchEnd && hasExit;

  // Limitador de Ponto: entrada permitida apenas com até 5 minutos de antecedência
  const todaySchedule = schedules.find((s) => s.employeeId === currentUser.id && s.date === todayStr);
  const scheduledEntryTime = todaySchedule?.shiftStart || currentUser.defaultShiftStart || '08:00';
  
  const now = new Date();
  const nowTotalMins = now.getHours() * 60 + now.getMinutes();
  const [schedH, schedM] = scheduledEntryTime.split(':').map(Number);
  const schedTotalMins = (schedH || 0) * 60 + (schedM || 0);
  const earliestAllowedMins = Math.max(0, schedTotalMins - 5);

  const isEntryLocked = !currentUser.exemptFromPunchClock && nowTotalMins < earliestAllowedMins;
  const allowedH = Math.floor(earliestAllowedMins / 60).toString().padStart(2, '0');
  const allowedM = (earliestAllowedMins % 60).toString().padStart(2, '0');
  const allowedTimeStr = `${allowedH}:${allowedM}`;

  const handlePunch = (type: PunchType) => {
    if (type === 'entry' && isEntryLocked) {
      setPunchFeedback({
        message: `Ponto bloqueado: Seu horário de entrada é às ${scheduledEntryTime}. A batida é liberada a partir das ${allowedTimeStr} (5 minutos de antecedência).`
      });
      return;
    }

    const res = StorageService.registerPunch(currentUser, type);
    setPunchFeedback({
      message: res.message,
      hash: res.punch.hashReceipt
    });
    onPunchRegistered();
  };

  // Calculate monthly stats for this employee
  const myMonthlyPunches = punches.filter(
    (p) => p.employeeId === currentUser.id && p.date.startsWith(selectedMonthYear)
  );

  const totalWorkedMin = myMonthlyPunches.reduce((acc, curr) => acc + (curr.workedMinutes || 0), 0);
  const totalDelayMin = myMonthlyPunches.reduce((acc, curr) => acc + (curr.delayMinutes || 0), 0);
  const totalExtraMin = myMonthlyPunches.reduce((acc, curr) => acc + (curr.extraMinutes || 0), 0);
  const workedDaysCount = myMonthlyPunches.filter((p) => p.entry !== null).length;

  const avgAdherence =
    myMonthlyPunches.length > 0
      ? Math.round(
          myMonthlyPunches.reduce((acc, curr) => acc + (curr.adherencePercentage || 100), 0) /
            myMonthlyPunches.length
        )
      : 100;

  // Certificates for this employee (Apenas para consulta)
  const myCertificates = certificates.filter((c) => c.employeeId === currentUser.id);

  // Helper to resolve schedule for any day in selected month
  const getDayScheduleInfo = (day: number) => {
    const [yearStr, monthStr] = selectedMonthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const dStr = `${yearStr}-${monthStr}-${day < 10 ? '0' + day : day}`;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Dom, 6 = Sab

    const weekDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekDayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = weekDayNames[dayOfWeek];
    const dayShort = weekDayShort[dayOfWeek];

    // Check explicit saved schedule & occurrences
    const explicit = schedules.find((s) => s.employeeId === currentUser.id && s.date === dStr);
    const occ = occurrences.find((o) => o.employeeId === currentUser.id && o.date === dStr);

    let isOff = explicit ? explicit.isOffDay : false;
    let isExtra = explicit ? explicit.isExtraDay : false;
    let shiftStart = explicit ? explicit.shiftStart : currentUser.defaultShiftStart;
    let shiftEnd = explicit ? explicit.shiftEnd : currentUser.defaultShiftEnd;
    let notes = explicit ? (explicit.notes || '') : '';
    let scheduleType = explicit ? explicit.scheduleType : currentUser.scheduleType;

    if (!explicit) {
      if (currentUser.scheduleType === '5x2') {
        isOff = dayOfWeek === 0 || dayOfWeek === 6;
        notes = isOff ? (dayOfWeek === 6 ? 'Folga Sábado (DSR 5x2)' : 'Folga Domingo (DSR 5x2)') : 'Jornada Administrativa';
      } else if (currentUser.scheduleType === '6x1') {
        isOff = dayOfWeek === 0;
        notes = isOff ? 'Descanso Semanal Remunerado (DSR 6x1)' : 'Plantão 6x1';
      } else if (currentUser.scheduleType === '12x36') {
        isOff = day % 2 !== 0;
        notes = isOff ? 'Descanso 36h (Plantão 12x36)' : 'Plantão 12h';
      }
    }

    if (occ) {
      if (occ.type === 'dia_extra') {
        isExtra = true;
        isOff = false;
        notes = `Dia Extra Confirmado: ${occ.reason}`;
      } else if (occ.type === 'folga') {
        isOff = true;
        isExtra = false;
        notes = `Folga Concedida: ${occ.reason}`;
      } else if (occ.type === 'falta_justificada') {
        notes = `Falta Justificada: ${occ.reason}`;
      }
    }

    return {
      dateStr: dStr,
      day,
      dayName,
      dayShort,
      isOffDay: isOff,
      isExtraDay: isExtra,
      shiftStart,
      shiftEnd,
      notes,
      scheduleType
    };
  };

  const daysInSelectedMonth = new Date(
    parseInt(selectedMonthYear.split('-')[0], 10),
    parseInt(selectedMonthYear.split('-')[1], 10),
    0
  ).getDate();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Employee Greeting & Info Banner (Download buttons removed for attendant) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/30">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Olá, {currentUser.name}!
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {currentUser.positionTitle}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Loja: <strong className="text-foreground">{currentStore?.name || 'Crepelocks'}</strong> ({currentStore?.code}) • Escala:{' '}
              <span className="font-semibold text-emerald-400">{currentUser.scheduleType}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border/50">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-right">
            <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Horário Contratual</span>
            <span className="font-bold text-emerald-400">
              {currentUser.defaultShiftStart} às {currentUser.defaultShiftEnd}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-semibold">Portaria MTP 671</span>
          </div>
        </div>
      </div>

      {/* Synchronized Navigation Tabs for Employee */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <button
          onClick={() => handleTabSwitch('bater_ponto')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'bater_ponto'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Meu Ponto Eletrônico</span>
        </button>

        <button
          onClick={() => handleTabSwitch('minha_aderencia')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'minha_aderencia'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Minha Escala & Aderência</span>
        </button>

        <button
          onClick={() => handleTabSwitch('atestados')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'atestados'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Atestados ({myCertificates.length})</span>
        </button>
      </div>

      {/* Banner de Atualizações Recentes de Escala (Dias Extras e Trocas) */}
      {(() => {
        const myExtraShifts = schedules.filter((s) => s.employeeId === currentUser.id && s.isExtraDay && s.date.startsWith(selectedMonthYear));
        const myOccExtraShifts = occurrences.filter((o) => o.employeeId === currentUser.id && o.type === 'dia_extra' && o.date.startsWith(selectedMonthYear));
        const mySwapShifts = schedules.filter((s) => s.employeeId === currentUser.id && s.notes?.includes('Troca de turno') && s.date.startsWith(selectedMonthYear));
        const totalExtras = myExtraShifts.length + myOccExtraShifts.length;
        const totalSwaps = mySwapShifts.length;

        if (totalExtras === 0 && totalSwaps === 0) return null;

        return (
          <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-xs flex items-center justify-between gap-3 text-emerald-200 shadow-md">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Escala Atualizada pela Gerência:</span>
                <span className="text-emerald-300/90 text-[11px]">
                  {totalExtras > 0 ? `⭐ ${totalExtras} dia(s) extra(s) agendado(s). ` : ''}
                  {totalSwaps > 0 ? `🔄 ${totalSwaps} troca(s) de turno confirmada(s). ` : ''}
                  Consulte os detalhes na aba <strong>Minha Escala & Aderência</strong>.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleTabSwitch('minha_aderencia')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0 transition-all shadow"
            >
              Ver Escala
            </button>
          </div>
        );
      })()}

      {/* Feedback Banner upon Punch */}
      {punchFeedback && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 shadow-xl flex items-start justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">{punchFeedback.message}</p>
              {punchFeedback.hash && (
                <p className="text-xs font-mono text-emerald-400/80 mt-1 break-all">
                  Hash de Autenticação Digital: {punchFeedback.hash}
                </p>
              )}
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Comprovante registrado com sucesso no sistema e assinado digitalmente conforme normas do MTP.
              </span>
            </div>
          </div>
          <button
            onClick={() => setPunchFeedback(null)}
            className="text-xs text-zinc-400 hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 1: MEU PONTO ELETRÔNICO (Somente registro e relógio) */}
      {/* ========================================================= */}
      {currentTab === 'bater_ponto' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Relógio Digital Oficial */}
          <ClockWidget storeName={currentStore?.name} />

          {/* Main 4-Punch Button Grid */}
          <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Registro de Ponto Diário</span>
                  {allCompletedToday && (
                    <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      Jornada de Hoje Concluída
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clique no botão correspondente ao seu momento de trabalho. Todos os registros possuem carimbo de data e hora oficial.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Marcação Individual Autenticada</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* STEP 1: Entrada */}
              <div
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  hasEntry
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-inner'
                    : nextStep === 'entry'
                    ? 'bg-zinc-900/90 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      1º Registro
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        hasEntry
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-white">Início de Jornada</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Entrada de turno</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60">
                  {hasEntry ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-300 font-mono font-bold text-base">
                        {todayPunch?.entry?.slice(0, 5)}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Registrado
                      </span>
                    </div>
                  ) : isEntryLocked ? (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          setPunchFeedback({
                            message: `Ponto bloqueado: Seu horário contratual de entrada é às ${scheduledEntryTime}. O ponto só é liberado a partir das ${allowedTimeStr} (5 minutos de antecedência).`
                          });
                        }}
                        className="w-full py-2.5 px-2 rounded-lg text-xs font-bold bg-zinc-800/90 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-not-allowed hover:bg-zinc-800 shadow"
                        title={`Entrada liberada às ${allowedTimeStr}`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Liberado às {allowedTimeStr}</span>
                      </button>
                      <p className="text-[10px] text-amber-400/90 text-center leading-tight">
                        Liberado às {allowedTimeStr} (5 min antes das {scheduledEntryTime})
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePunch('entry')}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5"
                    >
                      <span>Registrar Entrada</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* STEP 2: Saída Almoço */}
              <div
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  hasLunchStart
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-inner'
                    : nextStep === 'lunchStart'
                    ? 'bg-zinc-900/90 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      2º Registro
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        hasLunchStart
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <Coffee className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-white">Saída p/ Almoço</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Pausa refeição / intervalo</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60">
                  {hasLunchStart ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-300 font-mono font-bold text-base">
                        {todayPunch?.lunchStart?.slice(0, 5)}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Registrado
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePunch('lunchStart')}
                      disabled={!hasEntry}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        hasEntry
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/40'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Saída Almoço</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* STEP 3: Retorno Almoço */}
              <div
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  hasLunchEnd
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-inner'
                    : nextStep === 'lunchEnd'
                    ? 'bg-zinc-900/90 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      3º Registro
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        hasLunchEnd
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-white">Retorno do Almoço</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Volta do intervalo</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60">
                  {hasLunchEnd ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-300 font-mono font-bold text-base">
                        {todayPunch?.lunchEnd?.slice(0, 5)}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Registrado
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePunch('lunchEnd')}
                      disabled={!hasLunchStart}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        hasLunchStart
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Retorno Almoço</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* STEP 4: Saída Jornada */}
              <div
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  hasExit
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-inner'
                    : nextStep === 'exit'
                    ? 'bg-zinc-900/90 border-rose-500 ring-2 ring-rose-500/40 shadow-lg'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      4º Registro
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        hasExit
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-white">Fim de Jornada</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Término do expediente</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60">
                  {hasExit ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-300 font-mono font-bold text-base">
                        {todayPunch?.exit?.slice(0, 5)}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Registrado
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePunch('exit')}
                      disabled={!hasLunchEnd}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        hasLunchEnd
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Finalizar Jornada</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Today's cryptographic stamp status box (NO download button) */}
            {todayPunch?.hashReceipt && (
              <div className="mt-6 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Recibo de Ponto Digital Autenticado no Servidor (Portaria 671)</span>
                  </div>
                  <p className="font-mono text-zinc-400 text-[11px] break-all">
                    Chave SHA-256: {todayPunch.hashReceipt}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Terminal / IP: {todayPunch.locationIp || 'PDV Crepelocks Conectado'} • Data: {todayPunch.date} • Registro Homologado
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Espelho Seguro Sincronizado</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: MINHA ESCALA & ADERÊNCIA (Escala mensal completa)  */}
      {/* ========================================================= */}
      {currentTab === 'minha_aderencia' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Monthly KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-card/60 border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Minha Aderência</span>
              <div className="text-3xl font-bold text-emerald-400 mt-1">{avgAdherence}%</div>
              <p className="text-[11px] text-zinc-400 mt-1">Pontualidade na competência</p>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Horas Trabalhadas</span>
              <div className="text-3xl font-bold text-white mt-1">
                {Math.floor(totalWorkedMin / 60)}h {totalWorkedMin % 60}m
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Total apurado em {workedDaysCount} dia(s)</p>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Atrasos Acumulados</span>
              <div className={`text-3xl font-bold mt-1 ${totalDelayMin > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {totalDelayMin} min
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Além do limite de tolerância</p>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Horas Extras</span>
              <div className="text-3xl font-bold text-emerald-400 mt-1">
                {Math.floor(totalExtraMin / 60)}h {totalExtraMin % 60}m
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Crédito de banco de horas</p>
            </div>
          </div>

          {/* Contractual Parameters & CLT Tolerances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-card/40 border-border">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Meu Regime Contratual</span>
              </div>
              <div className="text-xs space-y-1.5 text-zinc-300">
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Tipo de Escala:</span>
                  <span className="font-semibold text-emerald-400">{currentUser.scheduleType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Horário Previsto:</span>
                  <span className="font-medium text-white">
                    {currentUser.defaultShiftStart} às {currentUser.defaultShiftEnd}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Pausa Alimentação / Descanso:</span>
                  <span className="font-medium text-white">{currentUser.lunchDurationMin} minutos</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Regime Jurídico:</span>
                  <span className="font-medium text-emerald-300">CLT com Registro Eletrônico Portaria 671</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-card/40 border-border">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Regras de Tolerância & Pontualidade (CLT)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                De acordo com o Art. 58 § 1º da CLT, não serão descontadas nem computadas como jornada extraordinária as variações de horário no registro de ponto não excedentes a <strong className="text-white">5 minutos</strong> em cada marcação, observado o limite máximo diário de <strong className="text-white">10 minutos</strong>.
              </p>
              <div className="mt-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Escala mensal oficial programada e controlada pela gestão da Crepelocks.</span>
              </div>
            </div>
          </div>

          {/* Grade Mensal Completa da Escala (Todos os dias do mês visíveis) */}
          <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Escala Mensal Completa — {currentUser.scheduleType} ({currentUser.name})</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Confira todos os dias de trabalho, horários contratuais e folgas (DSR) programados para o mês.
                </p>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs pt-1 pb-2">
              <span className="text-zinc-400 font-semibold text-[11px]">Legenda:</span>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px]">Trabalho / Plantão</span>
              </div>
              <div className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-[11px]">Folga Oficial (DSR)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[11px]">Dia Extra / Compensação</span>
              </div>
            </div>

            {/* Visual Calendar Grid (31 dias) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {Array.from({ length: daysInSelectedMonth }, (_, i) => {
                const day = i + 1;
                const info = getDayScheduleInfo(day);
                const isToday = info.dateStr === todayStr;

                return (
                  <div
                    key={day}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isToday
                        ? 'ring-2 ring-emerald-400 bg-emerald-950/40 border-emerald-500/60 shadow-lg'
                        : info.isOffDay
                        ? 'bg-sky-950/20 border-sky-900/40 text-sky-300'
                        : info.isExtraDay
                        ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-extrabold text-white">{day}</span>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">{info.dayShort}</span>
                    </div>

                    {isToday && (
                      <div className="my-0.5">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          HOJE
                        </span>
                      </div>
                    )}

                    <div className="text-[11px] font-bold mt-1.5 truncate">
                      {info.isOffDay ? (
                        <span className="text-sky-400 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                          FOLGA DSR
                        </span>
                      ) : (
                        <span className="text-emerald-400 px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {info.shiftStart}
                        </span>
                      )}
                    </div>

                    <div className="text-[9px] text-zinc-400 mt-1 truncate">
                      {info.isOffDay ? (
                        <span className="text-sky-300/80">Descanso</span>
                      ) : (
                        <span>às {info.shiftEnd}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detalhamento em Lista de Todos os Dias do Mês */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Conferência Dia a Dia da Escala Mensal ({daysInSelectedMonth} dias)
              </h4>
              <div className="overflow-x-auto max-h-72 rounded-xl border border-zinc-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold text-[10px] border-b border-zinc-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Data</th>
                      <th className="py-2 px-3">Dia da Semana</th>
                      <th className="py-2 px-3">Regime</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Horário Previsto</th>
                      <th className="py-2 px-3">Intervalo</th>
                      <th className="py-2 px-3">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                    {Array.from({ length: daysInSelectedMonth }, (_, i) => {
                      const day = i + 1;
                      const info = getDayScheduleInfo(day);
                      const isToday = info.dateStr === todayStr;

                      return (
                        <tr
                          key={day}
                          className={`hover:bg-zinc-800/30 transition-colors ${
                            isToday ? 'bg-emerald-950/20 font-semibold' : ''
                          }`}
                        >
                          <td className="py-1.5 px-3 font-sans text-white">
                            {info.dateStr.split('-').reverse().join('/')}
                            {isToday && (
                              <span className="ml-1.5 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">
                                Hoje
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 font-sans text-zinc-300">{info.dayName}</td>
                          <td className="py-1.5 px-3 font-sans text-zinc-400">{currentUser.scheduleType}</td>
                          <td className="py-1.5 px-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                info.isOffDay
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : info.isExtraDay
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {info.isOffDay ? 'FOLGA (DSR)' : info.isExtraDay ? 'DIA EXTRA' : 'TRABALHO'}
                            </span>
                          </td>
                          <td className="py-1.5 px-3">
                            {info.isOffDay ? '--' : `${info.shiftStart} às ${info.shiftEnd}`}
                          </td>
                          <td className="py-1.5 px-3 font-sans text-zinc-400">
                            {info.isOffDay ? '--' : `${currentUser.lunchDurationMin} min`}
                          </td>
                          <td className="py-1.5 px-3 font-sans text-zinc-400 text-[11px]">
                            {info.notes || (info.isOffDay ? 'Descanso Semanal' : 'Plantão Regular')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 3: ATESTADOS (Apenas para consulta, sem download)     */}
      {/* ========================================================= */}
      {currentTab === 'atestados' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Informative Notice */}
          <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Meus Atestados Médicos & Afastamentos CLT</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Consulta de atestados médicos homologados pela gestão da loja e arquivados no seu prontuário digital.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Apenas para Consulta</span>
              </div>
            </div>

            {/* Notice regarding upload and download restriction */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">
                  Regra de Homologação de Atestados:
                </p>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  A anexação, homologação de horas e lançamento de atestados no sistema é realizada <strong>exclusivamente pelo Gerente de Loja</strong> ou cargos de Diretoria. Caso você necessite apresentar um atestado médico, entregue o documento físico ou envie para a gerência da sua loja para homologação.
                </p>
              </div>
            </div>
          </div>

          {/* Cards of Certificates */}
          <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Atestados Homologados ({myCertificates.length})</span>
              </h4>
              <span className="text-xs text-zinc-400">Visualização em tela permitida</span>
            </div>

            {myCertificates.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto text-zinc-600" />
                <p>Nenhum atestado médico registrado para o seu perfil até o momento.</p>
                <p className="text-[11px] text-zinc-600">
                  Todos os atestados entregues à gerência aparecerão aqui assim que homologados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 rounded-xl border bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Início: {cert.startDate.split('-').reverse().join('/')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {cert.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-3 p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Dias de Afastamento:</span>
                          <span className="font-bold text-white">{cert.daysOff} dia(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Classificação CID:</span>
                          <span className="font-mono text-emerald-400 font-semibold">{cert.cidCode || 'N/I'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Médico / CRM:</span>
                          <span className="text-zinc-300 font-medium truncate max-w-[150px]">
                            {cert.doctorName} ({cert.doctorCrm})
                          </span>
                        </div>
                      </div>

                      {cert.notes && (
                        <p className="text-[11px] text-zinc-400 mt-2 bg-zinc-900/40 p-2 rounded border border-zinc-800/50">
                          {cert.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-500 truncate max-w-[150px]">
                        📄 {cert.fileName}
                      </span>

                      {/* View document on screen modal (NO download) */}
                      <button
                        onClick={() => setViewingCert(cert)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        title="Visualizar documento em tela"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visualizar Atestado</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico Mensal de Registros (Somente Consulta, sem botão de download) */}
          <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Histórico Mensal de Batidas de Ponto</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Visualização somente-leitura dos pontos registrados no mês de {selectedMonthYear}.
                </p>
              </div>

              <span className="text-[11px] text-zinc-500 font-medium px-2.5 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                Auditoria do Colaborador
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Entrada</th>
                    <th className="py-2.5 px-3">Saída Almoço</th>
                    <th className="py-2.5 px-3">Retorno Almoço</th>
                    <th className="py-2.5 px-3">Saída</th>
                    <th className="py-2.5 px-3">Trabalhado</th>
                    <th className="py-2.5 px-3">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {myMonthlyPunches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-zinc-500 font-sans">
                        Nenhum registro encontrado para esta competência.
                      </td>
                    </tr>
                  ) : (
                    myMonthlyPunches.map((punch) => {
                      const workedH = Math.floor(punch.workedMinutes / 60);
                      const workedM = punch.workedMinutes % 60;
                      return (
                        <tr key={punch.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-2 px-3 font-sans font-medium text-white">
                            {punch.date.split('-').reverse().join('/')}
                          </td>
                          <td className="py-2 px-3 text-zinc-300">{punch.entry || '--:--'}</td>
                          <td className="py-2 px-3 text-zinc-400">{punch.lunchStart || '--:--'}</td>
                          <td className="py-2 px-3 text-zinc-400">{punch.lunchEnd || '--:--'}</td>
                          <td className="py-2 px-3 text-zinc-300">{punch.exit || '--:--'}</td>
                          <td className="py-2 px-3 text-emerald-400 font-semibold">
                            {punch.workedMinutes > 0 ? `${workedH}h ${workedM}m` : '--'}
                          </td>
                          <td className="py-2 px-3 font-sans">
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
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Certificate Modal (Consulta em tela, SEM download) */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Consulta de Atestado Médico Digital</span>
              </h3>
              <button onClick={() => setViewingCert(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document representation */}
            <div className="p-5 rounded-xl bg-white text-zinc-900 font-sans shadow-inner border border-zinc-300 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-800">ATESTADO MÉDICO HOMOLOGADO</h4>
                  <p className="text-[10px] text-zinc-500">Documento arquivado no prontuário oficial</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  CRM
                </div>
              </div>

              <div className="text-xs space-y-1.5 text-zinc-800">
                <p>
                  Atesto para os devidos fins legais que o(a) funcionário(a){' '}
                  <strong className="text-zinc-950">{viewingCert.employeeName}</strong> foi atendido(a) na data de{' '}
                  <strong>{viewingCert.startDate.split('-').reverse().join('/')}</strong> e necessita de{' '}
                  <strong className="text-emerald-800">{viewingCert.daysOff} dia(s)</strong> de repouso
                  médico.
                </p>
                <p className="text-[11px] pt-1">
                  <strong>Diagnóstico / CID-10:</strong> {viewingCert.cidCode}
                </p>
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-[11px] text-zinc-600">
                <div>
                  <p className="font-bold text-zinc-900">{viewingCert.doctorName}</p>
                  <p className="text-[10px]">{viewingCert.doctorCrm}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    HOMOLOGADO PELA GESTÃO
                  </span>
                  <p className="text-[9px] text-zinc-400 mt-0.5">Crepelocks Compliance</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-400 space-y-0.5">
              <p>Arquivo: <strong className="text-white">{viewingCert.fileName}</strong> ({viewingCert.fileSizeKb} KB)</p>
              <p className="text-[11px] text-zinc-500">Data de homologação: {viewingCert.uploadedAt}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setViewingCert(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
