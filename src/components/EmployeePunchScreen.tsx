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
  Download,
  Lock,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { UserAccount, PunchRecord, Store, PunchType, ScheduleDay } from '../types';
import { ClockWidget } from './ClockWidget';
import { StorageService } from '../services/storage';
import { PayrollExportService } from '../services/payrollExport';

interface EmployeePunchScreenProps {
  currentUser: UserAccount;
  currentStore?: Store;
  punches: PunchRecord[];
  schedules: ScheduleDay[];
  onPunchRegistered: () => void;
}

export const EmployeePunchScreen: React.FC<EmployeePunchScreenProps> = ({
  currentUser,
  currentStore,
  punches,
  schedules,
  onPunchRegistered
}) => {
  const [punchFeedback, setPunchFeedback] = useState<{ message: string; hash?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'bater_ponto' | 'minha_aderencia' | 'meu_historico'>('bater_ponto');

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

  const handlePunch = (type: PunchType) => {
    const res = StorageService.registerPunch(currentUser, type);
    setPunchFeedback({
      message: res.message,
      hash: res.punch.hashReceipt
    });
    onPunchRegistered();
    setTimeout(() => {
      // Keep feedback visible or let user close
    }, 4000);
  };

  // Calculate monthly stats for this employee
  const currentMonth = '2026-10';
  const myMonthlyPunches = punches.filter(
    (p) => p.employeeId === currentUser.id && p.date.startsWith(currentMonth)
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

  // Schedule for today
  const todaySchedule = schedules.find(
    (s) => s.employeeId === currentUser.id && s.date === todayStr
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Employee Greeting & Info Banner */}
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
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-right">
            <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Regime de Ponto</span>
            <span className="font-bold text-emerald-400">
              {currentUser.defaultShiftStart} às {currentUser.defaultShiftEnd}
            </span>
          </div>
          <button
            onClick={() =>
              PayrollExportService.exportIndividualPdf(currentUser, punches, currentStore, currentMonth)
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baixar Meu Espelho (PDF)</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* Clock Widget */}
      <ClockWidget storeName={currentStore?.name} />

      {/* Navigation Tabs for Employee */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <button
          onClick={() => setActiveTab('bater_ponto')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'bater_ponto'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Bater Ponto Agora</span>
        </button>

        <button
          onClick={() => setActiveTab('minha_aderencia')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'minha_aderencia'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Minha Aderência & Escala</span>
        </button>

        <button
          onClick={() => setActiveTab('meu_historico')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'meu_historico'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Meus Registros do Mês</span>
        </button>
      </div>

      {/* Feedback Banner upon Punch */}
      {punchFeedback && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 shadow-xl flex items-start justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">{punchFeedback.message}</p>
              {punchFeedback.hash && (
                <p className="text-xs font-mono text-emerald-400/80 mt-1 break-all">
                  Comprovante Digital: {punchFeedback.hash}
                </p>
              )}
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Comprovante gerado e autenticado digitalmente em conformidade com a Portaria 671 MTP.
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

      {/* TAB 1: BATER PONTO */}
      {activeTab === 'bater_ponto' && (
        <div className="space-y-6">
          {/* Main 4-Punch Button Grid */}
          <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Registro de Ponto Diário</span>
                  {allCompletedToday && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      Jornada Concluída Hoje
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clique no botão correspondente ao seu momento de trabalho. Todos os registros possuem carimbo criptográfico.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consulta & Registro Exclusivo</span>
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
                  <p className="text-[11px] text-zinc-400 mt-0.5">Pausa refeição / descanso</p>
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

            {/* Today's cryptographic stamp receipt box */}
            {todayPunch?.hashReceipt && (
              <div className="mt-6 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Recibo de Ponto Digital Autenticado (Portaria 671)</span>
                  </div>
                  <p className="font-mono text-zinc-400 text-[11px] break-all">
                    Chave SHA-256: {todayPunch.hashReceipt}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Terminal / IP: {todayPunch.locationIp || 'PDV Crepelocks Conectado'} • Data:{' '}
                    {todayPunch.date}
                  </p>
                </div>

                <button
                  onClick={() =>
                    PayrollExportService.exportIndividualPdf(currentUser, punches, currentStore, currentMonth)
                  }
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 shrink-0 self-start md:self-center"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Baixar Comprovante</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Schedule & Tolerance Disclaimer Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-card/40 border-border">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Minha Escala Prevista Hoje</span>
              </div>
              <div className="text-xs space-y-1.5 text-zinc-300">
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Modalidade:</span>
                  <span className="font-semibold text-emerald-400">{currentUser.scheduleType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Horário Contratual:</span>
                  <span className="font-medium">
                    {currentUser.defaultShiftStart} às {currentUser.defaultShiftEnd}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Intervalo de Refeição:</span>
                  <span className="font-medium">{currentUser.lunchDurationMin} minutos</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Status na Escala:</span>
                  <span className="font-medium text-emerald-300">
                    {todaySchedule?.isOffDay ? 'Folga Oficial' : 'Plantão / Trabalho'}
                  </span>
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
                <span>Seu perfil é estritamente de consulta e registro. Ajustes pontuais são feitos pela Gerência.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MINHA ADERÊNCIA & ESCALA */}
      {activeTab === 'minha_aderencia' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-card/60 border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Minha Aderência</span>
              <div className="text-3xl font-bold text-emerald-400 mt-1">{avgAdherence}%</div>
              <p className="text-[11px] text-zinc-400 mt-1">Pontualidade no mês corrente</p>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Horas Trabalhadas</span>
              <div className="text-3xl font-bold text-white mt-1">
                {Math.floor(totalWorkedMin / 60)}h {totalWorkedMin % 60}m
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Acumulado em {workedDaysCount} dias</p>
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

          {/* Schedule Calendar for this employee */}
          <div className="p-5 rounded-2xl border bg-card/60 border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Minha Grade de Escala deste Mês ({currentUser.scheduleType})</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Visualização oficial dos dias de trabalho e folgas programadas pela gerência.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300">
                Outubro / 2026
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const dStr = `2026-10-${day < 10 ? '0' + day : day}`;
                const sch = schedules.find((s) => s.employeeId === currentUser.id && s.date === dStr);
                const isToday = dStr === todayStr;

                const isOff = sch?.isOffDay;
                const isExtra = sch?.isExtraDay;

                return (
                  <div
                    key={day}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isToday
                        ? 'ring-2 ring-emerald-400 bg-emerald-950/40 border-emerald-500/60'
                        : isOff
                        ? 'bg-blue-950/20 border-blue-900/40 text-blue-300'
                        : isExtra
                        ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">{day}</span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>
                    <div className="text-[10px] mt-1 font-semibold truncate">
                      {isOff ? (
                        <span className="text-sky-400">FOLGA</span>
                      ) : (
                        <span className="text-emerald-400">{currentUser.defaultShiftStart}</span>
                      )}
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-0.5 truncate">
                      {isOff ? 'DSR' : currentUser.defaultShiftEnd}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEU HISTÓRICO DO MÊS */}
      {activeTab === 'meu_historico' && (
        <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Espelho de Registros Mensais</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Visualização somente-leitura dos pontos registrados e ocorrências aprovadas.
              </p>
            </div>

            <button
              onClick={() =>
                PayrollExportService.exportIndividualPdf(currentUser, punches, currentStore, currentMonth)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
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
      )}
    </div>
  );
};
