import React, { useState, useRef } from 'react';
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
  Plus,
  Edit2,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Download,
  Lock,
  Paperclip
} from 'lucide-react';
import { UserAccount, Store, OccurrenceRecord, MedicalCertificate, OccurrenceType } from '../types';
import { StorageService } from '../services/storage';
import {
  canDownloadDocuments,
  canAttachCertificates,
  isGerenteLoja,
  isRestrictedToOwnStore,
  isCargoAcimaDeGerenteLoja
} from '../services/rolePermissions';

interface OccurrencesManagerProps {
  users: UserAccount[];
  stores: Store[];
  occurrences: OccurrenceRecord[];
  certificates: MedicalCertificate[];
  currentUser?: UserAccount;
  onDataUpdated: () => void;
}

export const OccurrencesManager: React.FC<OccurrencesManagerProps> = ({
  users,
  stores,
  occurrences,
  certificates,
  currentUser,
  onDataUpdated
}) => {
  const isManagerOfStore = isGerenteLoja(currentUser);
  const isStoreRestricted = isRestrictedToOwnStore(currentUser);
  const canAttach = canAttachCertificates(currentUser);
  const canDownload = canDownloadDocuments(currentUser);
  const isHigherManagement = isCargoAcimaDeGerenteLoja(currentUser);

  // Read-only applies if user cannot manage occurrences or attach certificates
  const isReadOnly = !canAttach && currentUser?.role !== 'dono';
  const [activeTab, setActiveTab] = useState<'ocorrencias' | 'prontuario'>('ocorrencias');

  // Filters & Search (Gerente de Loja starts filtered to their own store)
  const initialStoreFilter = isStoreRestricted && currentUser?.storeId ? currentUser.storeId : 'all';
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStoreId, setFilterStoreId] = useState<string>(initialStoreFilter);
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all');
  const [filterOccType, setFilterOccType] = useState<string>('all');

  // Available users for this manager (only their store if restricted)
  const availableUsersForCurrentUser = isStoreRestricted && currentUser?.storeId
    ? users.filter((u) => u.storeId === currentUser.storeId)
    : users;

  // Feedback Toast
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // --- CRUD: Ocorrências ---
  const [showNewOccModal, setShowNewOccModal] = useState<boolean>(false);
  const [occEmployeeId, setOccEmployeeId] = useState<string>(users[0]?.id || '');
  const [occDate, setOccDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [occType, setOccType] = useState<OccurrenceType>('folga');
  const [occHoursAbono, setOccHoursAbono] = useState<number>(2);
  const [occReason, setOccReason] = useState<string>('');

  // Editing Occurrence
  const [editingOcc, setEditingOcc] = useState<OccurrenceRecord | null>(null);

  // Deleting Occurrence
  const [occToDelete, setOccToDelete] = useState<OccurrenceRecord | null>(null);

  // --- CRUD: Prontuário / Atestados ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const [showNewCertModal, setShowNewCertModal] = useState<boolean>(false);
  const [certEmployeeId, setCertEmployeeId] = useState<string>(users[0]?.id || '');
  const [certStartDate, setCertStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [certDaysOff, setCertDaysOff] = useState<number>(1);
  const [certCid, setCertCid] = useState<string>('');
  const [certDoctorName, setCertDoctorName] = useState<string>('');
  const [certDoctorCrm, setCertDoctorCrm] = useState<string>('');
  const [certFileName, setCertFileName] = useState<string>('');
  const [certFileBase64, setCertFileBase64] = useState<string>('');
  const [certFileSizeKb, setCertFileSizeKb] = useState<number>(0);
  const [certFileType, setCertFileType] = useState<string>('');
  const [certNotes, setCertNotes] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCertFileName(file.name);
    setCertFileSizeKb(Math.round(file.size / 1024) || 1);
    setCertFileType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setCertFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCertFileName('');
    setCertFileBase64('');
    setCertFileSizeKb(0);
    setCertFileType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setCertFileName(file.name);
    setCertFileSizeKb(Math.round(file.size / 1024) || 1);
    setCertFileType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setCertFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openNewCertModal = () => {
    setCertEmployeeId(availableUsersForCurrentUser[0]?.id || users[0]?.id || '');
    setCertStartDate(new Date().toISOString().split('T')[0]);
    setCertDaysOff(1);
    setCertCid('');
    setCertDoctorName('');
    setCertDoctorCrm('');
    setCertFileName('');
    setCertFileBase64('');
    setCertFileSizeKb(0);
    setCertFileType('');
    setCertNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowNewCertModal(true);
  };

  // Editing Certificate
  const [editingCert, setEditingCert] = useState<MedicalCertificate | null>(null);

  // Deleting Certificate
  const [certToDelete, setCertToDelete] = useState<MedicalCertificate | null>(null);

  // View Certificate Modal
  const [viewingCert, setViewingCert] = useState<MedicalCertificate | null>(null);

  // --- Handlers: Ocorrências ---
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
      registeredBy: currentUser ? `${currentUser.name} (${currentUser.positionTitle || currentUser.role})` : 'Administrador Crepelocks',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });

    setShowNewOccModal(false);
    setOccReason('');
    showFeedback(`Ocorrência lançada com sucesso para ${emp.name}!`);
    onDataUpdated();
  };

  const handleSaveEditOccurrence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOcc) return;

    StorageService.updateOccurrence(editingOcc);
    setEditingOcc(null);
    showFeedback('Ocorrência atualizada com sucesso!');
    onDataUpdated();
  };

  const handleConfirmDeleteOccurrence = () => {
    if (!occToDelete) return;

    StorageService.deleteOccurrence(occToDelete.id);
    setOccToDelete(null);
    showFeedback('Ocorrência excluída com sucesso.');
    onDataUpdated();
  };

  // --- Handlers: Prontuário / Atestados ---
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
      fileName: certFileName || 'atestado_medico.pdf',
      fileBase64: certFileBase64 || undefined,
      fileSizeKb: certFileSizeKb || Math.floor(Math.random() * 180) + 90,
      status: 'aprovado',
      notes: certNotes || 'Atestado conferido e arquivado em prontuário digital.',
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });

    setShowNewCertModal(false);
    setCertCid('');
    setCertDoctorName('');
    setCertDoctorCrm('');
    setCertFileName('');
    setCertFileBase64('');
    setCertFileSizeKb(0);
    setCertFileType('');
    setCertNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showFeedback(`Atestado médico anexado e registrado com sucesso para ${emp.name}!`);
    onDataUpdated();
  };

  const handleSaveEditCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;

    StorageService.updateCertificate(editingCert);
    setEditingCert(null);
    showFeedback('Registro do prontuário médico atualizado com sucesso!');
    onDataUpdated();
  };

  const handleConfirmDeleteCertificate = () => {
    if (!certToDelete) return;

    StorageService.deleteCertificate(certToDelete.id);
    setCertToDelete(null);
    showFeedback('Atestado excluído do prontuário médico.');
    onDataUpdated();
  };

  // Filtered lists
  const filteredOccurrences = occurrences.filter((occ) => {
    if (isStoreRestricted && currentUser?.storeId && occ.storeId !== currentUser.storeId) return false;
    if (filterStoreId !== 'all' && occ.storeId !== filterStoreId) return false;
    if (filterEmployeeId !== 'all' && occ.employeeId !== filterEmployeeId) return false;
    if (filterOccType !== 'all' && occ.type !== filterOccType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = occ.employeeName.toLowerCase().includes(q);
      const matchReason = occ.reason.toLowerCase().includes(q);
      if (!matchName && !matchReason) return false;
    }
    return true;
  });

  const filteredCertificates = certificates.filter((cert) => {
    if (isStoreRestricted && currentUser?.storeId && cert.storeId !== currentUser.storeId) return false;
    if (filterStoreId !== 'all' && cert.storeId !== filterStoreId) return false;
    if (filterEmployeeId !== 'all' && cert.employeeId !== filterEmployeeId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cert.employeeName.toLowerCase().includes(q);
      const matchDoctor = cert.doctorName.toLowerCase().includes(q);
      const matchCid = (cert.cidCode || '').toLowerCase().includes(q);
      if (!matchName && !matchDoctor && !matchCid) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 backdrop-blur-md flex items-center justify-between gap-3 text-emerald-200 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner de Perfil de Gerente de Loja */}
      {isManagerOfStore && (
        <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-md flex items-center gap-3 text-blue-200 text-xs">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <span className="font-bold text-blue-300 block">Perfil: Gerente de Loja ({currentUser?.positionTitle})</span>
            <span>Você pode consultar ocorrências e anexar novos atestados dos colaboradores da sua unidade. O download de arquivos e espelhos é restrito aos cargos corporativos e Diretoria.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Painel Centralizado de Ocorrências & Prontuário Médico</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gestão completa com inserção, edição e exclusão de Folgas, Dias Extras, Faltas Justificadas/Injustificadas, Abonos e Atestados Médicos (PDF).
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setOccEmployeeId(users[0]?.id || '');
                setShowNewOccModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40 hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Ocorrência</span>
            </button>

            <button
              onClick={openNewCertModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center gap-1.5 shadow hover:scale-[1.02]"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inserir Atestado (PDF)</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <button
          onClick={() => setActiveTab('ocorrencias')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'prontuario'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Prontuário Médico Digital & Atestados ({certificates.length})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl border bg-card/60 border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou motivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Store */}
        <div>
          <select
            value={filterStoreId}
            onChange={(e) => setFilterStoreId(e.target.value)}
            disabled={isStoreRestricted}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {!isStoreRestricted && <option value="all">Todas as Lojas</option>}
            {stores
              .filter((s) => !isStoreRestricted || s.id === currentUser?.storeId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
          </select>
        </div>

        {/* Filter Employee */}
        <div>
          <select
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os Colaboradores</option>
            {availableUsersForCurrentUser.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.positionTitle})
              </option>
            ))}
          </select>
        </div>

        {/* Filter Type (for occurrences tab) */}
        {activeTab === 'ocorrencias' ? (
          <div>
            <select
              value={filterOccType}
              onChange={(e) => setFilterOccType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="folga">Folga (DSR)</option>
              <option value="dia_extra">Dia Extra</option>
              <option value="falta_justificada">Falta Justificada</option>
              <option value="falta_injustificada">Falta Injustificada</option>
              <option value="abono_horas">Abono de Horas</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center text-zinc-400 text-[11px] px-2">
            <span>{filteredCertificates.length} atestado(s) no prontuário</span>
          </div>
        )}
      </div>

      {/* TAB 1: OCORRÊNCIAS DE PONTO */}
      {activeTab === 'ocorrencias' && (
        <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Registro de Ocorrências e Eventos da Jornada ({filteredOccurrences.length})</span>
            </h3>
            <span className="text-xs text-zinc-400">
              Ações: Inserir, Alterar e Excluir
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
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {filteredOccurrences.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans">
                      Nenhuma ocorrência encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredOccurrences.map((occ) => {
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
                        <td className="py-2.5 px-3 font-sans text-right">
                          {!isReadOnly ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingOcc(occ)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                title="Editar Ocorrência"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setOccToDelete(occ)}
                                className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Excluir Ocorrência"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500">Auditoria</span>
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
      )}

      {/* TAB 2: PRONTUÁRIO MÉDICO & ATESTADOS */}
      {activeTab === 'prontuario' && (
        <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Prontuário Digital: Atestados Médicos & Afastamentos CLT ({filteredCertificates.length})</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Anotações médicas, laudos, controle de CID e abonos automáticos na folha de ponto.
              </p>
            </div>

            {canAttach && (
              <button
                onClick={openNewCertModal}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-md"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Inserir Novo Atestado</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCertificates.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
                Nenhum atestado encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredCertificates.map((cert) => {
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
                        {store?.name || 'Rede'} • Início: {cert.startDate.split('-').reverse().join('/')}
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
                      <span className="text-[11px] text-zinc-500 truncate max-w-[110px]" title={cert.fileName}>
                        📄 {cert.fileName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingCert(cert)}
                          className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-all"
                          title="Visualizar Atestado em Tela"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ver</span>
                        </button>

                        {/* Download restrito aos cargos acima de Gerente de Loja */}
                        {canDownload && (
                          <button
                            onClick={() => {
                              const blob = new Blob([`COMPROVANTE DE ATESTADO MÉDICO - CREPELOCKS\n\nColaborador: ${cert.employeeName}\nInício: ${cert.startDate}\nDias: ${cert.daysOff}\nCID: ${cert.cidCode}\nMédico: ${cert.doctorName} (${cert.doctorCrm})\nStatus: ${cert.status}\nData de Homologação: ${cert.uploadedAt}\n\nDocumento assinado digitalmente.`], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = cert.fileName || 'atestado_medico.pdf';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              showFeedback(`Download do arquivo ${cert.fileName} realizado com sucesso.`);
                            }}
                            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 transition-all"
                            title="Baixar Arquivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canAttach && (
                          <>
                            <button
                              onClick={() => setEditingCert(cert)}
                              className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all"
                              title="Editar Atestado"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                            </button>

                            <button
                              onClick={() => setCertToDelete(cert)}
                              className="p-1 rounded-lg bg-zinc-800 hover:bg-rose-950/50 text-rose-400 transition-all"
                              title="Excluir Atestado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Lançar Ocorrência */}
      {showNewOccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
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
                  {availableUsersForCurrentUser.map((u) => (
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
                  Salvar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Ocorrência */}
      {editingOcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>Editar Ocorrência de Ponto</span>
              </h3>
              <button onClick={() => setEditingOcc(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOccurrence} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador(a)</label>
                <select
                  value={editingOcc.employeeId}
                  onChange={(e) => {
                    const emp = users.find((u) => u.id === e.target.value);
                    setEditingOcc({
                      ...editingOcc,
                      employeeId: e.target.value,
                      employeeName: emp?.name || editingOcc.employeeName,
                      storeId: emp?.storeId || editingOcc.storeId
                    });
                  }}
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
                    value={editingOcc.date}
                    onChange={(e) => setEditingOcc({ ...editingOcc, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Tipo de Ocorrência</label>
                  <select
                    value={editingOcc.type}
                    onChange={(e) => setEditingOcc({ ...editingOcc, type: e.target.value as OccurrenceType })}
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

              {editingOcc.type === 'abono_horas' && (
                <div>
                  <label className="block text-zinc-400 mb-1">Horas Abonadas</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={editingOcc.hoursAbono || 2}
                    onChange={(e) =>
                      setEditingOcc({ ...editingOcc, hoursAbono: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-400 mb-1">Motivo / Descrição</label>
                <textarea
                  rows={2}
                  required
                  value={editingOcc.reason}
                  onChange={(e) => setEditingOcc({ ...editingOcc, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingOcc(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Ocorrência */}
      {occToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Excluir Ocorrência?</h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Deseja realmente remover a ocorrência de <strong className="text-white">{occToDelete.employeeName}</strong> do dia{' '}
              <strong className="text-white">{occToDelete.date.split('-').reverse().join('/')}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setOccToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOccurrence}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inserir Atestado Médico */}
      {showNewCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
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
                  {availableUsersForCurrentUser.map((u) => (
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

              {/* File upload real selector */}
              <div>
                <label className="block text-zinc-400 mb-1">
                  Arquivo do Atestado (PDF / Imagem / Comprovante Digital)
                </label>
                
                {/* Hidden input element */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="application/pdf,image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                {!certFileName ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`p-4 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 scale-[1.01]'
                        : 'border-zinc-700 bg-zinc-950/60 hover:border-emerald-500 hover:bg-zinc-900/60 text-zinc-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Clique aqui para selecionar o documento do seu computador
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        ou arraste e solte o arquivo aqui (PDF, PNG ou JPG)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Selecionar Arquivo no Computador</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/30 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-white block truncate" title={certFileName}>
                          {certFileName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                          <span>{certFileSizeKb} KB</span>
                          <span>•</span>
                          <span className="uppercase">{certFileType ? certFileType.split('/')[1] : 'PDF/IMG'}</span>
                          <span>•</span>
                          <span className="text-emerald-300">Pronto para salvar</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                        title="Trocar arquivo"
                      >
                        Trocar
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveSelectedFile}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Remover arquivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
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

      {/* Modal: Editar Atestado no Prontuário */}
      {editingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>Editar Atestado no Prontuário</span>
              </h3>
              <button onClick={() => setEditingCert(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCertificate} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador(a)</label>
                <select
                  value={editingCert.employeeId}
                  onChange={(e) => {
                    const emp = users.find((u) => u.id === e.target.value);
                    setEditingCert({
                      ...editingCert,
                      employeeId: e.target.value,
                      employeeName: emp?.name || editingCert.employeeName,
                      storeId: emp?.storeId || editingCert.storeId
                    });
                  }}
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
                    value={editingCert.startDate}
                    onChange={(e) => setEditingCert({ ...editingCert, startDate: e.target.value })}
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
                    value={editingCert.daysOff}
                    onChange={(e) => setEditingCert({ ...editingCert, daysOff: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">CID-10</label>
                  <input
                    type="text"
                    value={editingCert.cidCode || ''}
                    onChange={(e) => setEditingCert({ ...editingCert, cidCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">CRM / CRO</label>
                  <input
                    type="text"
                    value={editingCert.doctorCrm || ''}
                    onChange={(e) => setEditingCert({ ...editingCert, doctorCrm: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Médico / Clínica</label>
                <input
                  type="text"
                  value={editingCert.doctorName}
                  onChange={(e) => setEditingCert({ ...editingCert, doctorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Status de Homologação</label>
                <select
                  value={editingCert.status}
                  onChange={(e) =>
                    setEditingCert({
                      ...editingCert,
                      status: e.target.value as 'aprovado' | 'em_analise' | 'rejeitado'
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-semibold"
                >
                  <option value="aprovado">Aprovado (Horas Abonadas)</option>
                  <option value="em_analise">Em Análise / Perícia</option>
                  <option value="rejeitado">Rejeitado</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Documento Vinculado</label>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !editingCert) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setEditingCert({
                        ...editingCert,
                        fileName: file.name,
                        fileSizeKb: Math.round(file.size / 1024) || 1,
                        fileBase64: reader.result as string
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                  accept="application/pdf,image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs truncate">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-zinc-200 font-medium truncate">{editingCert.fileName || 'atestado.pdf'}</span>
                    <span className="text-zinc-500 text-[10px]">({editingCert.fileSizeKb || 0} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 shrink-0"
                  >
                    Substituir Arquivo
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Atestado */}
      {certToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Excluir Atestado?</h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Deseja remover este atestado de <strong className="text-white">{certToDelete.employeeName}</strong> do prontuário médico? O registro de afastamento correspondente também será desvinculado.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCertToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCertificate}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Certificate Modal */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              {canDownload ? (
                <button
                  onClick={() => {
                    if (viewingCert.fileBase64) {
                      const a = document.createElement('a');
                      a.href = viewingCert.fileBase64;
                      a.download = viewingCert.fileName || 'atestado_medico.pdf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      showFeedback(`Download do arquivo ${viewingCert.fileName} realizado com sucesso.`);
                    } else {
                      const blob = new Blob([`COMPROVANTE DE ATESTADO MÉDICO - CREPELOCKS\n\nColaborador: ${viewingCert.employeeName}\nInício: ${viewingCert.startDate}\nDias: ${viewingCert.daysOff}\nCID: ${viewingCert.cidCode}\nMédico: ${viewingCert.doctorName} (${viewingCert.doctorCrm})\nStatus: ${viewingCert.status}\nData de Homologação: ${viewingCert.uploadedAt}\n\nDocumento assinado digitalmente.`], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = viewingCert.fileName || 'atestado_medico.pdf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showFeedback(`Download do arquivo ${viewingCert.fileName} realizado com sucesso.`);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo ({viewingCert.fileName})</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Download de documentos restrito à Diretoria</span>
                </div>
              )}

              <button
                onClick={() => setViewingCert(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
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
