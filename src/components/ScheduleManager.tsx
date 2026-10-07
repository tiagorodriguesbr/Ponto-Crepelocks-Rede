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
  ArrowRightLeft
} from 'lucide-react';
import { UserAccount, ScheduleDay, Store, ScheduleType } from '../types';
import { StorageService } from '../services/storage';

interface ScheduleManagerProps {
  users: UserAccount[];
  schedules: ScheduleDay[];
  stores: Store[];
  onDataUpdated: () => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  users,
  schedules,
  stores,
  onDataUpdated
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    users.find((u) => u.role === 'atendente')?.id || users[0].id
  );
  const [selectedYear] = useState<number>(2026);
  const [selectedMonth] = useState<number>(10); // Outubro
  const [scaleChoice, setScaleChoice] = useState<ScheduleType>('6x1');
  const [shiftStartInput, setShiftStartInput] = useState<string>('08:00');
  const [shiftEndInput, setShiftEndInput] = useState<string>('16:20');
  const [weeklyDayOff, setWeeklyDayOff] = useState<number>(0); // 0 = Domingo

  // Modal for editing single day
  const [editingDay, setEditingDay] = useState<ScheduleDay | null>(null);

  // Modal for shift swap between two employees
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [swapEmpA, setSwapEmpA] = useState<string>(selectedEmployeeId);
  const [swapEmpB, setSwapEmpB] = useState<string>('');
  const [swapDate, setSwapDate] = useState<string>('2026-10-06');

  const selectedEmployee = users.find((u) => u.id === selectedEmployeeId);

  // Filter employees
  const availableEmployees = users.filter((u) =>
    selectedStoreId === 'all' ? true : u.storeId === selectedStoreId
  );

  const daysInMonth = 31;
  const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;

  const handleGenerateAutomated = () => {
    if (!selectedEmployee) return;

    StorageService.generateMonthlySchedule(
      selectedEmployee.id,
      scaleChoice,
      selectedYear,
      selectedMonth,
      shiftStartInput,
      shiftEndInput,
      weeklyDayOff
    );

    // Also update employee's default schedule type if different
    if (selectedEmployee.scheduleType !== scaleChoice) {
      StorageService.updateUser({
        ...selectedEmployee,
        scheduleType: scaleChoice,
        defaultShiftStart: shiftStartInput,
        defaultShiftEnd: shiftEndInput
      });
    }

    onDataUpdated();
  };

  const handleSaveDayEdit = () => {
    if (!editingDay) return;
    StorageService.setScheduleDay(editingDay);
    setEditingDay(null);
    onDataUpdated();
  };

  const handleExecuteSwap = () => {
    if (!swapEmpA || !swapEmpB || !swapDate) return;

    const list = StorageService.getSchedules();
    const schA = list.find((s) => s.employeeId === swapEmpA && s.date === swapDate);
    const schB = list.find((s) => s.employeeId === swapEmpB && s.date === swapDate);

    const empAName = users.find((u) => u.id === swapEmpA)?.name || 'Colaborador A';
    const empBName = users.find((u) => u.id === swapEmpB)?.name || 'Colaborador B';

    if (schA && schB) {
      // Swap properties
      const newSchA: ScheduleDay = {
        ...schA,
        shiftStart: schB.shiftStart,
        shiftEnd: schB.shiftEnd,
        isOffDay: schB.isOffDay,
        notes: `Troca de turno autorizada com ${empBName}`
      };
      const newSchB: ScheduleDay = {
        ...schB,
        shiftStart: schA.shiftStart,
        shiftEnd: schA.shiftEnd,
        isOffDay: schA.isOffDay,
        notes: `Troca de turno autorizada com ${empAName}`
      };

      StorageService.setScheduleDay(newSchA);
      StorageService.setScheduleDay(newSchB);
      setShowSwapModal(false);
      onDataUpdated();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>Gestão & Planejador de Escalas (6x1 e 12x36)</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Geração automatizada de escalas rotativas, plantões 12x36, troca de turnos e definição de folgas (DSR).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSwapModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Troca de Turno Rápida</span>
          </button>
        </div>
      </div>

      {/* Generator Control Panel */}
      <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Gerador Automático da Escala Mensal</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Competência: Outubro / 2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Employee select */}
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Colaborador(a)</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                const emp = users.find((u) => u.id === e.target.value);
                if (emp) {
                  setScaleChoice(emp.scheduleType);
                  setShiftStartInput(emp.defaultShiftStart);
                  setShiftEndInput(emp.defaultShiftEnd);
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {availableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.positionTitle})
                </option>
              ))}
            </select>
          </div>

          {/* Scale Choice: 6x1 or 12x36 */}
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
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="6x1">Escala 6x1 (6 trab. / 1 folga)</option>
              <option value="12x36">Escala 12x36 (Plantão 12h / Folga 36h)</option>
              <option value="5x2">Escala 5x2 (Seg a Sex)</option>
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

          {/* Weekly Day Off if 6x1 */}
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">
              {scaleChoice === '6x1' ? 'Dia Fixo da Folga DSR' : 'Regra de Folga'}
            </label>
            <select
              value={weeklyDayOff}
              onChange={(e) => setWeeklyDayOff(parseInt(e.target.value, 10))}
              disabled={scaleChoice === '12x36'}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value={0}>Domingo (DSR)</option>
              <option value={1}>Segunda-feira</option>
              <option value={2}>Terça-feira</option>
              <option value={3}>Quarta-feira</option>
              <option value={4}>Quinta-feira</option>
              <option value={5}>Sexta-feira</option>
              <option value={6}>Sábado</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateAutomated}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 shadow-md shadow-emerald-950/40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Gerar Escala Mensal Completa ({scaleChoice})</span>
          </button>
        </div>
      </div>

      {/* Monthly Roster Grid View for Selected Employee */}
      <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Calendário da Escala: {selectedEmployee?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700">
                {selectedEmployee?.scheduleType}
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Clique em qualquer dia para alterar horários, trocar folga por trabalho ou adicionar dia extra.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Plantão / Trabalho</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Folga DSR / 36h</span>
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
            const sch = schedules.find((s) => s.employeeId === selectedEmployeeId && s.date === dStr);

            const isOff = sch?.isOffDay;
            const isExtra = sch?.isExtraDay;
            const isToday = dStr === '2026-10-06';

            return (
              <div
                key={dayNum}
                onClick={() => {
                  setEditingDay(
                    sch || {
                      id: `sch-${selectedEmployeeId}-${dStr}`,
                      employeeId: selectedEmployeeId,
                      date: dStr,
                      shiftStart: shiftStartInput,
                      shiftEnd: shiftEndInput,
                      isOffDay: false,
                      isExtraDay: false,
                      scheduleType: scaleChoice
                    }
                  );
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                  isToday
                    ? 'ring-2 ring-emerald-400 bg-emerald-950/40 border-emerald-500/60'
                    : isOff
                    ? 'bg-sky-950/20 border-sky-900/40 hover:border-sky-500/50'
                    : isExtra
                    ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-500/50'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-sm">{dayNum}</span>
                  {isToday && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-zinc-950">
                      HOJE
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs font-semibold">
                  {isOff ? (
                    <span className="text-sky-400 block font-bold">FOLGA</span>
                  ) : isExtra ? (
                    <span className="text-amber-400 block font-bold">DIA EXTRA</span>
                  ) : (
                    <span className="text-emerald-400 block font-mono text-[11px]">
                      {sch?.shiftStart || shiftStartInput}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-zinc-400 mt-0.5 truncate font-mono">
                  {isOff ? 'DSR / 36h' : `${sch?.shiftEnd || shiftEndInput}`}
                </div>

                {sch?.notes && (
                  <div className="text-[9px] text-amber-300 mt-1 truncate" title={sch.notes}>
                    {sch.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Single Day Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
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
                      isExtraDay: false
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
                      isExtraDay: false
                    })
                  }
                  className={`flex-1 py-2 rounded-lg font-semibold border ${
                    editingDay.isOffDay
                      ? 'bg-sky-600 border-sky-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  Folga (DSR / 36h)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingDay({
                      ...editingDay,
                      isOffDay: false,
                      isExtraDay: true
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
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-zinc-400 mb-1">Horário de Entrada</label>
                    <input
                      type="time"
                      value={editingDay.shiftStart}
                      onChange={(e) =>
                        setEditingDay({ ...editingDay, shiftStart: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Horário de Saída</label>
                    <input
                      type="time"
                      value={editingDay.shiftEnd}
                      onChange={(e) =>
                        setEditingDay({ ...editingDay, shiftEnd: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 mb-1">Observações da Escala</label>
                <input
                  type="text"
                  placeholder="Ex: Cobertura de plantão, DSR compensatório"
                  value={editingDay.notes || ''}
                  onChange={(e) => setEditingDay({ ...editingDay, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setEditingDay(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDayEdit}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alteração</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast Shift Swap Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <span>Troca de Turno entre Colaboradores</span>
              </h3>
              <button onClick={() => setShowSwapModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Permite permutar a escala e turnos de dois colaboradores na mesma data sem criar retrabalho.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Data da Troca</label>
                <input
                  type="date"
                  value={swapDate}
                  onChange={(e) => setSwapDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Colaborador A</label>
                <select
                  value={swapEmpA}
                  onChange={(e) => setSwapEmpA(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.positionTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Colaborador B</label>
                <select
                  value={swapEmpB}
                  onChange={(e) => setSwapEmpB(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value="">Selecione o segundo colaborador...</option>
                  {users
                    .filter((u) => u.id !== swapEmpA)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.positionTitle})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowSwapModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                disabled={!swapEmpB}
                onClick={handleExecuteSwap}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Troca de Turno</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
