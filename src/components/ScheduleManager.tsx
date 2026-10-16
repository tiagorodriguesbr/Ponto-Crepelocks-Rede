import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Building2,
  Users,
  CheckCircle,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  Coffee,
  Check,
  X,
  ArrowRightLeft,
  Eye,
  Sliders,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UserAccount, ScheduleDay, Store, ScheduleType } from '../types';
import { StorageService } from '../services/storage';

interface ScheduleManagerProps {
  users: UserAccount[];
  schedules: ScheduleDay[];
  stores: Store[];
  currentUser?: UserAccount;
  onDataUpdated: () => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  users,
  schedules,
  stores,
  currentUser,
  onDataUpdated
}) => {
  const isReadOnly = currentUser?.role !== 'dono' && !currentUser?.permissions?.canEditSchedules;
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  // Fallback to first available employee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    const defaultEmp = users.find((u) => u.role === 'atendente') || users[0];
    return defaultEmp ? defaultEmp.id : '';
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
    new Date(selectedYear, selectedMonth - 1, 1)
  );
  const formattedMonthName = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  const selectedEmployee = users.find((u) => u.id === selectedEmployeeId) || users[0];

  const [scaleChoice, setScaleChoice] = useState<ScheduleType>(
    selectedEmployee?.scheduleType || '6x1'
  );
  const [shiftStartInput, setShiftStartInput] = useState<string>(
    selectedEmployee?.defaultShiftStart || '08:00'
  );
  const [shiftEndInput, setShiftEndInput] = useState<string>(
    selectedEmployee?.defaultShiftEnd || '16:20'
  );

  // For 6x1: single primary day off (0 = Domingo)
  const [weeklyDayOff, setWeeklyDayOff] = useState<number>(0);

  // For 5x2: multiple days off (default 0=Domingo, 6=Sábado)
  const [selectedDaysOff5x2, setSelectedDaysOff5x2] = useState<number[]>([0, 6]);

  // For 12x36: start on day 1 with working or off
  const [cycle12x36StartsWorking, setCycle12x36StartsWorking] = useState<boolean>(true);

  // Apply to all in store option
  const [applyToAllInStore, setApplyToAllInStore] = useState<boolean>(false);

  // Feedback notification
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Modal for editing single day
  const [editingDay, setEditingDay] = useState<ScheduleDay | null>(null);

  // Modal for shift swap between two employees
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [swapEmpA, setSwapEmpA] = useState<string>(selectedEmployee?.id || '');
  const [swapEmpB, setSwapEmpB] = useState<string>('');
  const [swapDate, setSwapDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Filter employees
  const availableEmployees = users.filter((u) =>
    selectedStoreId === 'all' ? true : u.storeId === selectedStoreId
  );

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;

  const weekDayNames = [
    { index: 0, short: 'Dom', full: 'Domingo' },
    { index: 1, short: 'Seg', full: 'Segunda-feira' },
    { index: 2, short: 'Ter', full: 'Terça-feira' },
    { index: 3, short: 'Qua', full: 'Quarta-feira' },
    { index: 4, short: 'Qui', full: 'Quinta-feira' },
    { index: 5, short: 'Sex', full: 'Sexta-feira' },
    { index: 6, short: 'Sáb', full: 'Sábado' }
  ];

  const toggleDayOff5x2 = (dayIdx: number) => {
    if (selectedDaysOff5x2.includes(dayIdx)) {
      if (selectedDaysOff5x2.length === 1) {
        // Keep at least one
        return;
      }
      setSelectedDaysOff5x2(selectedDaysOff5x2.filter((d) => d !== dayIdx));
    } else {
      setSelectedDaysOff5x2([...selectedDaysOff5x2, dayIdx].sort());
    }
  };

  const showFeedback = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4500);
  };

  const handleGenerateAutomated = () => {
    if (!selectedEmployee) return;

    const targets = applyToAllInStore
      ? availableEmployees
      : [selectedEmployee];

    const daysOffToUse = scaleChoice === '5x2'
      ? selectedDaysOff5x2
      : scaleChoice === '6x1'
      ? [weeklyDayOff]
      : [];

    targets.forEach((targetEmp) => {
      StorageService.generateMonthlySchedule(
        targetEmp.id,
        scaleChoice,
        selectedYear,
        selectedMonth,
        shiftStartInput,
        shiftEndInput,
        daysOffToUse,
        cycle12x36StartsWorking
      );

      // Update employee default settings
      StorageService.updateUser({
        ...targetEmp,
        scheduleType: scaleChoice,
        defaultShiftStart: shiftStartInput,
        defaultShiftEnd: shiftEndInput
      });
    });

    const dayOffLabels = daysOffToUse
      .map((idx) => weekDayNames.find((w) => w.index === idx)?.short)
      .join(', ');

    showFeedback(
      `Escala mensal (${scaleChoice}) gerada com sucesso para ${
        applyToAllInStore ? `${targets.length} colaboradores` : selectedEmployee.name
      }! Folgas definidas: ${dayOffLabels || 'Ciclo 36h'}.`
    );

    onDataUpdated();
  };

  const handleSaveDayEdit = () => {
    if (!editingDay) return;
    StorageService.setScheduleDay(editingDay);
    setEditingDay(null);
    showFeedback(`Escala do dia ${editingDay.date.split('-').reverse().join('/')} atualizada.`);
    onDataUpdated();
  };

  const handleExecuteSwap = () => {
    if (!swapEmpA || !swapEmpB || !swapDate) return;

    const list = StorageService.getSchedules();
    const schA = list.find((s) => s.employeeId === swapEmpA && s.date === swapDate);
    const schB = list.find((s) => s.employeeId === swapEmpB && s.date === swapDate);

    const empA = users.find((u) => u.id === swapEmpA);
    const empB = users.find((u) => u.id === swapEmpB);

    if (!empA || !empB) {
      showFeedback('Colaboradores não identificados para a troca.');
      return;
    }

    const targetSchA: ScheduleDay = schA || {
      id: `sch-${empA.id}-${swapDate}`,
      employeeId: empA.id,
      date: swapDate,
      shiftStart: empA.defaultShiftStart,
      shiftEnd: empA.defaultShiftEnd,
      isOffDay: false,
      isExtraDay: false,
      scheduleType: empA.scheduleType,
      notes: 'Horário Contratual'
    };

    const targetSchB: ScheduleDay = schB || {
      id: `sch-${empB.id}-${swapDate}`,
      employeeId: empB.id,
      date: swapDate,
      shiftStart: empB.defaultShiftStart,
      shiftEnd: empB.defaultShiftEnd,
      isOffDay: false,
      isExtraDay: false,
      scheduleType: empB.scheduleType,
      notes: 'Horário Contratual'
    };

    const newSchA: ScheduleDay = {
      ...targetSchA,
      shiftStart: targetSchB.shiftStart,
      shiftEnd: targetSchB.shiftEnd,
      isOffDay: targetSchB.isOffDay,
      notes: `Troca de turno autorizada com ${empB.name}`
    };
    const newSchB: ScheduleDay = {
      ...targetSchB,
      shiftStart: targetSchA.shiftStart,
      shiftEnd: targetSchA.shiftEnd,
      isOffDay: targetSchA.isOffDay,
      notes: `Troca de turno autorizada com ${empA.name}`
    };

    StorageService.setScheduleDay(newSchA);
    StorageService.setScheduleDay(newSchB);

    // Adiciona notificação de troca de escala para auditoria
    StorageService.addNotification({
      id: `notif-swap-${Date.now()}`,
      type: 'escala_modificada',
      employeeId: empA.id,
      employeeName: empA.name,
      storeId: empA.storeId,
      storeName: stores.find((s) => s.id === empA.storeId)?.name || 'Crepelocks',
      title: `Troca de Escala: ${empA.name} ⇄ ${empB.name}`,
      message: `Permuta de horário realizada para a data ${swapDate.split('-').reverse().join('/')}.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      read: false,
      severity: 'info'
    });

    setShowSwapModal(false);
    showFeedback(`Permuta de turno realizada com sucesso entre ${empA.name} e ${empB.name}!`);
    onDataUpdated();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 backdrop-blur-md flex items-center justify-between gap-3 text-emerald-200 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner de Modo Somente Leitura para Gerente */}
      {isReadOnly && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex items-center gap-3 text-amber-200">
          <Eye className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block">Modo Acompanhamento (Perfil Gerente)</span>
            <span>Você tem acesso de consulta às escalas de trabalho da equipe. A geração de escalas e permutas estão sujeitas às permissões configuradas pelo Dono.</span>
          </div>
        </div>
      )}

      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>Gestão & Planejador de Escalas (6x1, 5x2 e 12x36)</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Geração automatizada de escalas completas, múltiplos descansos semanais remunerados (DSR 5x2), plantões 12x36 e permuta rápida.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSwapModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center gap-1.5 shadow"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Troca de Turno Rápida</span>
            </button>
          </div>
        )}
      </div>

      {/* Generator Control Panel */}
      <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Gerador Automático da Escala Mensal</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              Competência: {formattedMonthName} / {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 1: Employee, Scale Model, Shift Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Employee select */}
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Colaborador(a)</label>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                const emp = users.find((u) => u.id === e.target.value);
                if (emp) {
                  setScaleChoice(emp.scheduleType);
                  setShiftStartInput(emp.defaultShiftStart || '08:00');
                  setShiftEndInput(emp.defaultShiftEnd || '16:20');
                  if (emp.scheduleType === '5x2') {
                    setSelectedDaysOff5x2([0, 6]);
                  }
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {availableEmployees.map((emp) => {
                const store = stores.find((s) => s.id === emp.storeId);
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.positionTitle} ({store?.name || 'Rede'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Scale Choice: 6x1, 5x2, 12x36 */}
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Modelo da Escala</label>
            <select
              value={scaleChoice}
              onChange={(e) => {
                const val = e.target.value as ScheduleType;
                setScaleChoice(val);
                if (val === '12x36') {
                  setShiftStartInput('10:00');
                  setShiftEndInput('22:00');
                } else if (val === '6x1') {
                  setShiftStartInput('08:00');
                  setShiftEndInput('16:20');
                  setWeeklyDayOff(0);
                } else if (val === '5x2') {
                  setShiftStartInput('08:00');
                  setShiftEndInput('17:48');
                  setSelectedDaysOff5x2([0, 6]);
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="6x1">Escala 6x1 (6 trab. / 1 folga DSR)</option>
              <option value="5x2">Escala 5x2 (5 trab. / 2 folgas DSR)</option>
              <option value="12x36">Escala 12x36 (Plantão 12h / Folga 36h)</option>
            </select>
          </div>

          {/* Shift Start */}
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Entrada do Turno</label>
            <input
              type="time"
              value={shiftStartInput}
              onChange={(e) => setShiftStartInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Shift End */}
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Saída do Turno</label>
            <input
              type="time"
              value={shiftEndInput}
              onChange={(e) => setShiftEndInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Row 2: Dynamic DSR / Folga Rules tailored for each scale */}
        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
          {scaleChoice === '5x2' && (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-bold text-emerald-400 text-xs block">
                    Definição de Folgas DSR para Escala 5x2 (2 Dias de Folga)
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    A escala 5x2 prevê 2 dias de descanso semanal. Você pode selecionar os dias exatos de folga:
                  </p>
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedDaysOff5x2([0, 6])}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                      selectedDaysOff5x2.includes(0) && selectedDaysOff5x2.includes(6) && selectedDaysOff5x2.length === 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sáb & Dom (Padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDaysOff5x2([0, 1])}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                      selectedDaysOff5x2.includes(0) && selectedDaysOff5x2.includes(1) && selectedDaysOff5x2.length === 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Dom & Seg
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDaysOff5x2([5, 6])}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                      selectedDaysOff5x2.includes(5) && selectedDaysOff5x2.includes(6) && selectedDaysOff5x2.length === 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sex & Sáb
                  </button>
                </div>
              </div>

              {/* Day badges toggle */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {weekDayNames.map((d) => {
                  const isSelected = selectedDaysOff5x2.includes(d.index);
                  return (
                    <button
                      key={d.index}
                      type="button"
                      onClick={() => toggleDayOff5x2(d.index)}
                      className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs uppercase font-extrabold">{d.short}</span>
                      <span className="text-[9px] mt-0.5">
                        {isSelected ? 'FOLGA' : 'TRAB.'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {scaleChoice === '6x1' && (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-bold text-emerald-400 text-xs block">
                    Dia Fixo do Descanso Semanal Remunerado (DSR 6x1)
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    A cada 6 dias de trabalho contínuo, 1 dia de folga é concedido:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {weekDayNames.map((d) => {
                  const isSelected = weeklyDayOff === d.index;
                  return (
                    <button
                      key={d.index}
                      type="button"
                      onClick={() => setWeeklyDayOff(d.index)}
                      className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs uppercase font-extrabold">{d.short}</span>
                      <span className="text-[9px] mt-0.5">
                        {isSelected ? 'DSR FIXO' : 'TRAB.'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {scaleChoice === '12x36' && (
            <div className="space-y-2">
              <span className="font-bold text-emerald-400 text-xs block">
                Ciclo de Plantão 12h / Interjornada 36h
              </span>
              <p className="text-[11px] text-zinc-400">
                Turnos intercalados dia sim, dia não (1 dia de trabalho / 1 dia de folga 36 horas):
              </p>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="radio"
                    name="cycle12x36"
                    checked={cycle12x36StartsWorking}
                    onChange={() => setCycle12x36StartsWorking(true)}
                    className="text-emerald-500"
                  />
                  <span>Iniciar dia 01 trabalhando (Plantão nos dias ímpares: 1, 3, 5, 7...)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="radio"
                    name="cycle12x36"
                    checked={!cycle12x36StartsWorking}
                    onChange={() => setCycle12x36StartsWorking(false)}
                    className="text-emerald-500"
                  />
                  <span>Iniciar dia 01 em folga (Plantão nos dias pares: 2, 4, 6, 8...)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Action Button with Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAllInStore}
              onChange={(e) => setApplyToAllInStore(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Aplicar esta mesma escala para toda a equipe ({availableEmployees.length} colaboradores)</span>
          </label>

          {isReadOnly ? (
            <div className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1.5 self-end">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>Modo Acompanhamento (Geração restrita ao Dono)</span>
            </div>
          ) : (
            <button
              onClick={handleGenerateAutomated}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 hover:scale-[1.02]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Gerar Escala Mensal Completa ({scaleChoice})</span>
            </button>
          )}
        </div>
      </div>

      {/* Monthly Roster Grid View for Selected Employee */}
      <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Calendário de {formattedMonthName}/{selectedYear}: {selectedEmployee?.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700">
                {selectedEmployee?.positionTitle} • Escala {scaleChoice}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Clique em qualquer dia do mês para alterar horários, converter em folga DSR ou adicionar dia extra.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Plantão / Trabalho</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Folga DSR (5x2 / 6x1 / 36h)</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Dia Extra</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {Array.from({ length: daysInMonth }, (_, idx) => {
            const dayNum = idx + 1;
            const dStr = `${selectedYear}-${monthStr}-${dayNum < 10 ? '0' + dayNum : dayNum}`;
            const sch = schedules.find((s) => s.employeeId === selectedEmployee?.id && s.date === dStr);

            const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
            const dayOfWeek = dateObj.getDay();
            const dayOfWeekName = weekDayNames.find((w) => w.index === dayOfWeek)?.short;

            // Compute fallback display if schedule hasn't been saved in DB yet
            let isOff = false;
            let isExtra = false;
            let startT = shiftStartInput;
            let endT = shiftEndInput;
            let noteText: string | undefined = undefined;

            if (sch && sch.scheduleType === scaleChoice) {
              isOff = sch.isOffDay;
              isExtra = sch.isExtraDay;
              startT = sch.shiftStart;
              endT = sch.shiftEnd;
              noteText = sch.notes;
            } else {
              // Dynamic calculation based on selected scale rule
              const empScale = scaleChoice;
              if (empScale === '5x2') {
                isOff = selectedDaysOff5x2.includes(dayOfWeek);
                noteText = isOff ? 'Descanso Semanal (DSR 5x2)' : undefined;
              } else if (empScale === '6x1') {
                isOff = dayOfWeek === weeklyDayOff;
                noteText = isOff ? 'Descanso Semanal (DSR 6x1)' : undefined;
              } else if (empScale === '12x36') {
                isOff = cycle12x36StartsWorking ? dayNum % 2 === 0 : dayNum % 2 !== 0;
                noteText = isOff ? 'Folga 36h Interjornada' : 'Plantão 12h';
              }
            }

            const isToday = dStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dayNum}
                onClick={() => {
                  setEditingDay(
                    sch || {
                      id: `sch-${selectedEmployee?.id}-${dStr}`,
                      employeeId: selectedEmployee?.id || '',
                      date: dStr,
                      shiftStart: startT,
                      shiftEnd: endT,
                      isOffDay: isOff,
                      isExtraDay: isExtra,
                      scheduleType: scaleChoice,
                      notes: noteText
                    }
                  );
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                  isToday
                    ? 'ring-2 ring-emerald-400 bg-emerald-950/40 border-emerald-500/60'
                    : isOff
                    ? 'bg-sky-950/25 border-sky-800/50 hover:border-sky-500/70 shadow-sm'
                    : isExtra
                    ? 'bg-amber-950/25 border-amber-800/50 hover:border-amber-500/70'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-sm">
                    {dayNum} <span className="text-[10px] text-zinc-400 font-normal">({dayOfWeekName})</span>
                  </span>
                  {isToday && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-zinc-950">
                      HOJE
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs font-semibold">
                  {isOff ? (
                    <span className="text-sky-400 block font-bold">FOLGA (DSR)</span>
                  ) : isExtra ? (
                    <span className="text-amber-400 block font-bold">DIA EXTRA</span>
                  ) : (
                    <span className="text-emerald-400 block font-mono text-[11px]">
                      {startT}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-zinc-400 mt-0.5 truncate font-mono">
                  {isOff ? (scaleChoice === '5x2' ? 'Folga 5x2' : 'Folga DSR / 36h') : endT}
                </div>

                {noteText && (
                  <div className="text-[9px] text-zinc-400 mt-1 truncate" title={noteText}>
                    {noteText}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Single Day Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">
                Editar Escala do Dia {editingDay.date.split('-').reverse().join('/')}
              </h3>
              <button onClick={() => setEditingDay(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Type toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingDay({
                      ...editingDay,
                      isOffDay: false,
                      isExtraDay: false,
                      notes: undefined
                    })
                  }
                  className={`flex-1 py-2 rounded-lg font-semibold border ${
                    !editingDay.isOffDay && !editingDay.isExtraDay
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  Trabalho Regular
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingDay({
                      ...editingDay,
                      isOffDay: true,
                      isExtraDay: false,
                      notes: 'Folga DSR Autorizada'
                    })
                  }
                  className={`flex-1 py-2 rounded-lg font-semibold border ${
                    editingDay.isOffDay
                      ? 'bg-sky-600 border-sky-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  Folga (DSR)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingDay({
                      ...editingDay,
                      isOffDay: false,
                      isExtraDay: true,
                      notes: 'Dia Extra de Trabalho'
                    })
                  }
                  className={`flex-1 py-2 rounded-lg font-semibold border ${
                    editingDay.isExtraDay
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  Dia Extra
                </button>
              </div>

              {!editingDay.isOffDay && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-zinc-400 mb-1">Início do Turno</label>
                    <input
                      type="time"
                      value={editingDay.shiftStart}
                      onChange={(e) => setEditingDay({ ...editingDay, shiftStart: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Término do Turno</label>
                    <input
                      type="time"
                      value={editingDay.shiftEnd}
                      onChange={(e) => setEditingDay({ ...editingDay, shiftEnd: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 mb-1">Observações / Motivo</label>
                <input
                  type="text"
                  placeholder="Ex: Folga compensatória referente à dobra"
                  value={editingDay.notes || ''}
                  onChange={(e) => setEditingDay({ ...editingDay, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDayEdit}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Troca de Turno Rápida Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <span>Permuta de Turno (Troca Rápida)</span>
              </h3>
              <button onClick={() => setShowSwapModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Transfira a escala e horários de um colaborador para outro em um dia específico:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Data da Permuta</label>
                <input
                  type="date"
                  value={swapDate}
                  onChange={(e) => setSwapDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Colaborador A</label>
                  <select
                    value={swapEmpA}
                    onChange={(e) => setSwapEmpA(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Colaborador B</label>
                  <select
                    value={swapEmpB}
                    onChange={(e) => setSwapEmpB(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="">Selecione...</option>
                    {users
                      .filter((u) => u.id !== swapEmpA)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowSwapModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteSwap}
                disabled={!swapEmpA || !swapEmpB}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 shadow-md shadow-emerald-950/40"
              >
                Confirmar Permuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
