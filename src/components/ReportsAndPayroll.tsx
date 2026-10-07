import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Printer,
  Building2,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { UserAccount, PunchRecord, Store, OccurrenceRecord } from '../types';
import { PayrollExportService } from '../services/payrollExport';

interface ReportsAndPayrollProps {
  users: UserAccount[];
  punches: PunchRecord[];
  stores: Store[];
  occurrences: OccurrenceRecord[];
}

export const ReportsAndPayroll: React.FC<ReportsAndPayrollProps> = ({
  users,
  punches,
  stores,
  occurrences
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  const filteredUsers = users.filter((u) => {
    if (selectedStore !== 'all' && u.storeId !== selectedStore) return false;
    if (selectedEmployeeId !== 'all' && u.id !== selectedEmployeeId) return false;
    return true;
  });

  const monthPunches = punches.filter((p) => p.date.startsWith(selectedMonth));

  // Compute aggregated stats for selected filters
  const userSummaries = filteredUsers.map((user) => {
    const userPunches = monthPunches.filter((p) => p.employeeId === user.id);
    const store = stores.find((s) => s.id === user.storeId);

    const workedMin = userPunches.reduce((acc, p) => acc + (p.workedMinutes || 0), 0);
    const delayMin = userPunches.reduce((acc, p) => acc + (p.delayMinutes || 0), 0);
    const extraMin = userPunches.reduce((acc, p) => acc + (p.extraMinutes || 0), 0);
    const workedDays = userPunches.filter((p) => p.entry !== null).length;
    const justifiedAbsences = occurrences.filter(
      (o) => o.employeeId === user.id && o.type === 'falta_justificada' && o.date.startsWith(selectedMonth)
    ).length;
    const unjustifiedAbsences = occurrences.filter(
      (o) => o.employeeId === user.id && o.type === 'falta_injustificada' && o.date.startsWith(selectedMonth)
    ).length;

    const adherence =
      userPunches.length > 0
        ? Math.round(
            userPunches.reduce((acc, p) => acc + (p.adherencePercentage || 100), 0) / userPunches.length
          )
        : 100;

    return {
      user,
      store,
      workedMin,
      delayMin,
      extraMin,
      workedDays,
      justifiedAbsences,
      unjustifiedAbsences,
      adherence
    };
  });

  const totalNetworkWorkedMin = userSummaries.reduce((acc, s) => acc + s.workedMin, 0);
  const totalNetworkExtraMin = userSummaries.reduce((acc, s) => acc + s.extraMin, 0);
  const totalNetworkDelayMin = userSummaries.reduce((acc, s) => acc + s.delayMin, 0);

  const handleExportAllPdf = () => {
    // Export individual PDFs for all filtered employees
    filteredUsers.forEach((u) => {
      const store = stores.find((s) => s.id === u.storeId);
      PayrollExportService.exportIndividualPdf(u, punches, store, selectedMonth);
    });
  };

  const handleExportCsv = () => {
    PayrollExportService.exportPayrollCsv(users, punches, stores, selectedMonth);
  };

  const handleExportAfdt = () => {
    PayrollExportService.exportAfdtTxt(users, punches, selectedMonth);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Fechamento Mensal de Folha & Relatórios em PDF / CSV</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Geração de espelhos de ponto oficiais, integração contábil com folha de pagamento e compliance Portaria MTP 671.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-all flex items-center gap-1.5 shadow"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV (Folha)</span>
          </button>

          <button
            onClick={handleExportAfdt}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-all flex items-center gap-1.5 shadow"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Exportar AFDT (MTP 671)</span>
          </button>

          <button
            onClick={handleExportAllPdf}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Espelhos (PDF)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card/60 border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Horas Trabalhadas</span>
          <div className="text-3xl font-extrabold text-white mt-1">
            {Math.floor(totalNetworkWorkedMin / 60)}h {totalNetworkWorkedMin % 60}m
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Na competência {selectedMonth}</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Horas Extras a Pagar</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            {Math.floor(totalNetworkExtraMin / 60)}h {totalNetworkExtraMin % 60}m
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Crédito folha 50% / 100%</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Descontos de Atraso</span>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">
            {Math.floor(totalNetworkDelayMin / 60)}h {totalNetworkDelayMin % 60}m
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Acima da tolerância de 10 min</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total de Colaboradores</span>
          <div className="text-3xl font-extrabold text-white mt-1">{filteredUsers.length}</div>
          <p className="text-[11px] text-emerald-400 mt-1">Registros auditados e validados</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl border bg-card/60 border-border flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 font-medium">Competência:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 font-medium">Loja:</span>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todas as Unidades Crepelocks</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 font-medium">Colaborador:</span>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os Colaboradores</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Closure Table per Employee */}
      <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold text-[10px] border-b border-zinc-800">
              <tr>
                <th className="py-3 px-3">Colaborador(a)</th>
                <th className="py-3 px-3">Loja / Escala</th>
                <th className="py-3 px-3">Dias Trab.</th>
                <th className="py-3 px-3">Total Horas</th>
                <th className="py-3 px-3">Horas Extras</th>
                <th className="py-3 px-3">Atrasos (min)</th>
                <th className="py-3 px-3">Faltas (Just/Inj)</th>
                <th className="py-3 px-3">Aderência</th>
                <th className="py-3 px-3 text-right">Espelho PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {userSummaries.map((summary) => {
                const totH = Math.floor(summary.workedMin / 60);
                const totM = summary.workedMin % 60;
                const extH = Math.floor(summary.extraMin / 60);
                const extM = summary.extraMin % 60;

                return (
                  <tr key={summary.user.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-white text-xs">{summary.user.name}</div>
                      <div className="text-[10px] text-zinc-400 font-normal">
                        {summary.user.positionTitle} • CPF: {summary.user.cpf}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <div className="text-zinc-200">{summary.store?.name}</div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        {summary.user.scheduleType}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-zinc-300 font-bold">{summary.workedDays} dias</td>

                    <td className="py-3 px-3 text-white font-bold">
                      {totH}h {totM.toString().padStart(2, '0')}m
                    </td>

                    <td className="py-3 px-3 text-emerald-400 font-semibold">
                      {summary.extraMin > 0 ? `+${extH}h ${extM}m` : '0h 00m'}
                    </td>

                    <td className="py-3 px-3">
                      <span className={summary.delayMin > 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                        {summary.delayMin} min
                      </span>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sky-400 text-[11px]" title="Atestados / Justificadas">
                          {summary.justifiedAbsences} just.
                        </span>
                        <span className="text-zinc-600">/</span>
                        <span
                          className={`text-[11px] ${
                            summary.unjustifiedAbsences > 0 ? 'text-rose-400 font-bold' : 'text-zinc-500'
                          }`}
                          title="Faltas Injustificadas (Desconto DSR)"
                        >
                          {summary.unjustifiedAbsences} inj.
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`font-bold ${
                          summary.adherence >= 95
                            ? 'text-emerald-400'
                            : summary.adherence >= 80
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {summary.adherence}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-sans">
                      <button
                        onClick={() =>
                          PayrollExportService.exportIndividualPdf(
                            summary.user,
                            punches,
                            summary.store,
                            selectedMonth
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold inline-flex items-center gap-1 border border-zinc-700 transition-all"
                        title="Baixar Espelho Mensal de Ponto em PDF"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
