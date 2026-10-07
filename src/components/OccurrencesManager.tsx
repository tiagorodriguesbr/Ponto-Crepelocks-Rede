import React, { useState } from 'react';
import {
  FileText,
  FilePlus,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileCheck,
  Eye,
  Trash2,
  Clock,
  ShieldCheck,
  X,
  Plus
} from 'lucide-react';
import { UserAccount, Store, OccurrenceRecord, MedicalCertificate, OccurrenceType } from '../types';
import { StorageService } from '../services/storage';

interface OccurrencesManagerProps {
  users: UserAccount[];
  stores: Store[];
  occurrences: OccurrenceRecord[];
  certificates: MedicalCertificate[];
  onDataUpdated: () => void;
}

export const OccurrencesManager: React.FC<OccurrencesManagerProps> = ({
  users,
  stores,
  occurrences,
  certificates,
  onDataUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'ocorrencias' | 'prontuario'>('ocorrencias');

  // New Occurrence Form State
  const [showNewOccModal, setShowNewOccModal] = useState<boolean>(false);
  const [occEmployeeId, setOccEmployeeId] = useState<string>(users[0]?.id || '');
  const [occDate, setOccDate] = useState<string>('2026-10-06');
  const [occType, setOccType] = useState<OccurrenceType>('folga');
  const [occHoursAbono, setOccHoursAbono] = useState<number>(2);
  const [occReason, setOccReason] = useState<string>('');

  // New Certificate Form State
  const [showNewCertModal, setShowNewCertModal] = useState<boolean>(false);
  const [certEmployeeId, setCertEmployeeId] = useState<string>(users[0]?.id || '');
  const [certStartDate, setCertStartDate] = useState<string>('2026-10-06');
  const [certDaysOff, setCertDaysOff] = useState<number>(1);
  const [certCid, setCertCid] = useState<string>('');
  const [certDoctorName, setCertDoctorName] = useState<string>('');
  const [certDoctorCrm, setCertDoctorCrm] = useState<string>('');
  const [certFileName, setCertFileName] = useState<string>('atestado_medico.pdf');
  const [certNotes, setCertNotes] = useState<string>('');

  // View Certificate Modal
  const [viewingCert, setViewingCert] = useState<MedicalCertificate | null>(null);

  const handleCreateOccurrence = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = users.find((u) => u.id === occEmployeeId);
    if (!emp) return;

    StorageService.addOccurrence({
      id: `occ-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      storeId: emp.storeId,
      date: occDate,
      type: occType,
      hoursAbono: occType === 'abono_horas' ? occHoursAbono : undefined,
      reason: occReason || 'Registrado via painel administrativo centralizado.',
      registeredBy: 'Administrador Crepelocks',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });

    setShowNewOccModal(false);
    setOccReason('');
    onDataUpdated();
  };

  const handleCreateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = users.find((u) => u.id === certEmployeeId);
    if (!emp) return;

    StorageService.addCertificate({
      id: `cert-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      storeId: emp.storeId,
      startDate: certStartDate,
      daysOff: certDaysOff,
      cidCode: certCid || 'Z00.0 - Exame médico geral',
      doctorName: certDoctorName || 'Dr. Médico Plantonista',
      doctorCrm: certDoctorCrm || 'CRM/SP 000.000',
      fileName: certFileName || 'atestado_colaborador.pdf',
      fileSizeKb: Math.floor(Math.random() * 180) + 90,
      status: 'aprovado',
      notes: certNotes || 'Atestado conferido e arquivado em prontuário digital.',
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });

    setShowNewCertModal(false);
    setCertCid('');
    setCertDoctorName('');
    setCertDoctorCrm('');
    setCertNotes('');
    onDataUpdated();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Painel Centralizado de Ocorrências & Prontuário Médico</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gestão unificada de Folgas, Dias Extras, Faltas Justificadas/Injustificadas, Abonos e Upload de Atestados em PDF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewOccModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lançar Ocorrência</span>
          </button>

          <button
            onClick={() => setShowNewCertModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Subir Atestado (PDF)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <button
          onClick={() => setActiveTab('ocorrencias')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ocorrencias'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Ocorrências de Ponto ({occurrences.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prontuario')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'prontuario'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Prontuário Médico Digital & Atestados ({certificates.length})</span>
        </button>
      </div>

      {/* TAB 1: OCORRÊNCIAS DE PONTO */}
      {activeTab === 'ocorrencias' && (
        <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Registro de Ocorrências e Eventos da Jornada</span>
            </h3>
            <span className="text-xs text-zinc-400">
              Impactam diretamente o cálculo de horas e o espelho mensal
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Colaborador</th>
                  <th className="py-2.5 px-3">Loja</th>
                  <th className="py-2.5 px-3">Tipo de Ocorrência</th>
                  <th className="py-2.5 px-3">Motivo / Justificativa</th>
                  <th className="py-2.5 px-3">Registrado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {occurrences.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans">
                      Nenhuma ocorrência registrada até o momento.
                    </td>
                  </tr>
                ) : (
                  occurrences.map((occ) => {
                    const store = stores.find((s) => s.id === occ.storeId);
                    return (
                      <tr key={occ.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-medium text-white">
                          {occ.date.split('-').reverse().join('/')}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-bold text-zinc-200">
                          {occ.employeeName}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-zinc-400">
                          {store?.name || 'Crepelocks'}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              occ.type === 'folga'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : occ.type === 'dia_extra'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : occ.type === 'falta_justificada'
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                : occ.type === 'falta_injustificada'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {occ.type === 'folga'
                              ? 'FOLGA (DSR)'
                              : occ.type === 'dia_extra'
                              ? 'DIA EXTRA'
                              : occ.type === 'falta_justificada'
                              ? 'FALTA JUSTIFICADA'
                              : occ.type === 'falta_injustificada'
                              ? 'FALTA INJUSTIFICADA'
                              : `ABONO (${occ.hoursAbono}h)`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-zinc-300 max-w-xs truncate" title={occ.reason}>
                          {occ.reason}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-zinc-400 text-[11px]">
                          {occ.registeredBy}
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

      {/* TAB 2: PRONTUÁRIO MÉDICO & ATESTADOS */}
      {activeTab === 'prontuario' && (
        <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Prontuário Digital: Atestados Médicos & Afastamentos CLT</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Armazenamento de laudos em PDF, comprovação de CID e abono automático na folha de ponto.
              </p>
            </div>

            <button
              onClick={() => setShowNewCertModal(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Inserir Novo Atestado</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => {
              const store = stores.find((s) => s.id === cert.storeId);
              return (
                <div
                  key={cert.id}
                  className="p-4 rounded-xl border bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{cert.employeeName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {cert.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {store?.name} • Início: {cert.startDate.split('-').reverse().join('/')}
                    </p>

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
                        <span className="text-zinc-300 font-medium truncate max-w-[140px]">
                          {cert.doctorName} ({cert.doctorCrm})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500 truncate max-w-[140px]">
                      📄 {cert.fileName}
                    </span>
                    <button
                      onClick={() => setViewingCert(cert)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Visualizar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Lançar Ocorrência */}
      {showNewOccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Lançar Ocorrência de Ponto</span>
              </h3>
              <button onClick={() => setShowNewOccModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOccurrence} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador(a)</label>
                <select
                  value={occEmployeeId}
                  onChange={(e) => setOccEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.positionTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Data da Ocorrência</label>
                  <input
                    type="date"
                    required
                    value={occDate}
                    onChange={(e) => setOccDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Tipo de Ocorrência</label>
                  <select
                    value={occType}
                    onChange={(e) => setOccType(e.target.value as OccurrenceType)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-semibold"
                  >
                    <option value="folga">Folga (DSR / Compensatória)</option>
                    <option value="dia_extra">Dia Extra (Hora Extra)</option>
                    <option value="falta_justificada">Falta Justificada</option>
                    <option value="falta_injustificada">Falta Injustificada</option>
                    <option value="abono_horas">Abono de Horas</option>
                  </select>
                </div>
              </div>

              {occType === 'abono_horas' && (
                <div>
                  <label className="block text-zinc-400 mb-1">Horas Abonadas (ex: 2h)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={occHoursAbono}
                    onChange={(e) => setOccHoursAbono(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-400 mb-1">Motivo / Descrição</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Folga concedida em virtude de dobra no domingo anterior."
                  value={occReason}
                  onChange={(e) => setOccReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewOccModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                >
                  Registrar no Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Subir Atestado Médico */}
      {showNewCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Inserir Atestado Médico no Prontuário</span>
              </h3>
              <button onClick={() => setShowNewCertModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador(a)</label>
                <select
                  value={certEmployeeId}
                  onChange={(e) => setCertEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.positionTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Data de Início</label>
                  <input
                    type="date"
                    required
                    value={certStartDate}
                    onChange={(e) => setCertStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Dias de Afastamento</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={certDaysOff}
                    onChange={(e) => setCertDaysOff(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">CID-10 (Código Diagnóstico)</label>
                  <input
                    type="text"
                    placeholder="Ex: J06.9 ou A09"
                    value={certCid}
                    onChange={(e) => setCertCid(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">CRM / CRO do Médico</label>
                  <input
                    type="text"
                    placeholder="Ex: CRM-SP 123456"
                    value={certDoctorCrm}
                    onChange={(e) => setCertDoctorCrm(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Nome do Médico / Unidade Hospitalar</label>
                <input
                  type="text"
                  placeholder="Ex: Dra. Larissa Prado - Hospital Santa Joana"
                  value={certDoctorName}
                  onChange={(e) => setCertDoctorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              {/* File upload simulator */}
              <div>
                <label className="block text-zinc-400 mb-1">Arquivo do Atestado (PDF / Imagem)</label>
                <div className="p-3 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 text-center cursor-pointer hover:border-emerald-500 transition-colors">
                  <Upload className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <span className="text-zinc-300 font-medium block">
                    {certFileName}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    PDF carregado e assinado digitalmente (Prontuário Crepelocks)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewCertModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                >
                  Salvar no Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Certificate Modal */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Visualizador de Prontuário Médico Digital</span>
              </h3>
              <button onClick={() => setViewingCert(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated PDF document visual card */}
            <div className="p-5 rounded-xl bg-white text-zinc-900 font-sans shadow-inner border border-zinc-300 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-800">ATESTADO MÉDICO OFICIAL</h4>
                  <p className="text-[10px] text-zinc-500">Documento comprobatório de dispensa laboral</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  CRM
                </div>
              </div>

              <div className="text-xs space-y-1.5 text-zinc-800">
                <p>
                  Atesto para os devidos fins que o(a) funcionário(a){' '}
                  <strong className="text-zinc-950">{viewingCert.employeeName}</strong> foi atendido(a) nesta
                  unidade de saúde na data de{' '}
                  <strong>{viewingCert.startDate.split('-').reverse().join('/')}</strong> e necessita de{' '}
                  <strong className="text-emerald-800">{viewingCert.daysOff} dia(s)</strong> de repouso
                  médico.
                </p>
                <p className="text-[11px] pt-1">
                  <strong>Diagnóstico (CID-10):</strong> {viewingCert.cidCode}
                </p>
              </div>

              <div className="pt-4 border-t flex items-center justify-between text-[11px] text-zinc-600">
                <div>
                  <p className="font-bold text-zinc-900">{viewingCert.doctorName}</p>
                  <p className="text-[10px]">{viewingCert.doctorCrm}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    AUTENTICADO DIGITALMENTE
                  </span>
                  <p className="text-[9px] text-zinc-400 mt-0.5">Crepelocks Compliance RH</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-400">
              <p>Arquivo arquivado: <strong className="text-white">{viewingCert.fileName}</strong> ({viewingCert.fileSizeKb} KB)</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Data do upload: {viewingCert.uploadedAt}</p>
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
