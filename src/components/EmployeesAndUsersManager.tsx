import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Building2,
  Lock,
  Check,
  X,
  Edit2,
  ShieldCheck,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Globe,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { UserAccount, Store, Role, ScheduleType, UserPermissions } from '../types';
import { StorageService } from '../services/storage';

interface EmployeesAndUsersManagerProps {
  users: UserAccount[];
  stores: Store[];
  currentUser: UserAccount;
  onDataUpdated: () => void;
}

export const EmployeesAndUsersManager: React.FC<EmployeesAndUsersManagerProps> = ({
  users,
  stores,
  currentUser,
  onDataUpdated
}) => {
  const isReadOnly = currentUser.role === 'gerente';
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // New user form state
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('123456');
  const [role, setRole] = useState<Role>('atendente');
  const [storeId, setStoreId] = useState<string>(stores[0]?.id || 'store-1');
  const [hasAccessToAllStores, setHasAccessToAllStores] = useState<boolean>(false);
  const [positionTitle, setPositionTitle] = useState<string>('Atendente de Balcão & Crepeira');
  const [cpf, setCpf] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('6x1');
  const [defaultShiftStart, setDefaultShiftStart] = useState<string>('08:00');
  const [defaultShiftEnd, setDefaultShiftEnd] = useState<string>('16:20');
  const [lunchDurationMin, setLunchDurationMin] = useState<number>(60);
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [exemptFromPunchClock, setExemptFromPunchClock] = useState<boolean>(false);

  // Granular permissions
  const [permissions, setPermissions] = useState<UserPermissions>({
    canEditSchedules: false,
    canApproveOccurrences: false,
    canManageEmployees: false,
    canViewFinancialReports: false,
    canUploadCertificates: false,
    canExportPayroll: false,
    canEditStores: false
  });

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === 'dono') {
      setPositionTitle('Diretor / Dono');
      setStoreId('all');
      setHasAccessToAllStores(true);
      setScheduleType('5x2');
      setDefaultShiftStart('09:00');
      setDefaultShiftEnd('18:00');
      setExemptFromPunchClock(true); // Dono nunca bate ponto
      setPermissions({
        canEditSchedules: true,
        canApproveOccurrences: true,
        canManageEmployees: true,
        canViewFinancialReports: true,
        canUploadCertificates: true,
        canExportPayroll: true,
        canEditStores: true
      });
    } else if (newRole === 'gerente') {
      setPositionTitle('Gerente de Loja');
      setScheduleType('6x1');
      setDefaultShiftStart('08:00');
      setDefaultShiftEnd('16:20');
      setStoreId('all'); // Padrão: vinculado a todas as lojas
      setHasAccessToAllStores(true);
      setExemptFromPunchClock(true); // Padrão: Cargo de Confiança (o Dono pode alterar para bater ponto)
      // Gerente tem acesso de acompanhamento aos painéis (sem poder modificar)
      setPermissions({
        canEditSchedules: false,
        canApproveOccurrences: false,
        canManageEmployees: false,
        canViewFinancialReports: true,
        canUploadCertificates: false,
        canExportPayroll: true,
        canEditStores: false
      });
    } else {
      setPositionTitle('Atendente de Balcão & Crepeira');
      setStoreId(stores[0]?.id || 'store-1');
      setHasAccessToAllStores(false);
      setScheduleType('6x1');
      setDefaultShiftStart('08:00');
      setDefaultShiftEnd('16:20');
      setExemptFromPunchClock(false);
      setPermissions({
        canEditSchedules: false,
        canApproveOccurrences: false,
        canManageEmployees: false,
        canViewFinancialReports: false,
        canUploadCertificates: false,
        canExportPayroll: false,
        canEditStores: false
      });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const colors = [
      'from-emerald-500 to-teal-700',
      'from-rose-500 to-pink-600',
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-violet-600',
      'from-amber-500 to-orange-600'
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const isAllStores = role === 'dono' || storeId === 'all' || hasAccessToAllStores;
    const isExempt = role === 'dono' ? true : exemptFromPunchClock;

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name,
      email: email.trim().toLowerCase(),
      passwordHash: password,
      role,
      storeId: isAllStores ? 'all' : storeId,
      hasAccessToAllStores: isAllStores,
      positionTitle,
      cpf: cpf || '000.000.000-00',
      phone: phone || '(11) 90000-0000',
      admissionDate: new Date().toISOString().split('T')[0],
      scheduleType,
      defaultShiftStart,
      defaultShiftEnd,
      lunchDurationMin,
      active: true,
      mfaEnabled,
      exemptFromPunchClock: isExempt,
      avatarColor,
      permissions
    };

    StorageService.addUser(newUser);

    // Auto-generate initial schedule for current month if required to clock in
    if (!newUser.exemptFromPunchClock) {
      StorageService.generateMonthlySchedule(
        newUser.id,
        scheduleType,
        2026,
        10,
        defaultShiftStart,
        defaultShiftEnd
      );
    }

    setShowAddModal(false);
    resetForm();
    onDataUpdated();
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Enforce business rules: Dono never punches clock
    if (editingUser.role === 'dono') {
      editingUser.exemptFromPunchClock = true;
      editingUser.hasAccessToAllStores = true;
      editingUser.storeId = 'all';
    } else if (editingUser.storeId === 'all') {
      editingUser.hasAccessToAllStores = true;
    }

    StorageService.updateUser(editingUser);
    setEditingUser(null);
    onDataUpdated();
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('123456');
    setRole('atendente');
    setStoreId(stores[0]?.id || 'store-1');
    setHasAccessToAllStores(false);
    setExemptFromPunchClock(false);
    setCpf('');
    setPhone('');
    setPositionTitle('Atendente de Balcão & Crepeira');
    setScheduleType('6x1');
    setDefaultShiftStart('08:00');
    setDefaultShiftEnd('16:20');
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStore !== 'all') {
      const isLinkedToAll = u.hasAccessToAllStores || u.storeId === 'all' || u.role === 'dono';
      if (!isLinkedToAll && u.storeId !== filterStore) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Banner de Modo Somente Leitura para Gerente */}
      {isReadOnly && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex items-center gap-3 text-amber-200">
          <Eye className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block">Modo Acompanhamento (Perfil Gerente)</span>
            <span>Você tem acesso aos painéis de acompanhamento em tempo real. Criações, edições e alterações são restritas exclusivamente ao perfil Dono.</span>
          </div>
        </div>
      )}

      {/* Banner Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Colaboradores, Perfis & Níveis de Permissão</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gestão da equipe Crepelocks: Dono (não bate ponto e controle total), Gerente (acompanhamento dos painéis, com ou sem ponto como cargo de confiança) e Atendentes.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 shadow-md shadow-emerald-950/40"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Acesso / Colaborador</span>
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card/60 border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-medium">Filtrar por Cargo:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os Cargos</option>
            <option value="dono">Dono (Não Bate Ponto)</option>
            <option value="gerente">Gerente de Loja</option>
            <option value="atendente">Atendente</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-medium">Filtrar por Loja:</span>
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todas as Lojas</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold text-[10px] border-b border-zinc-800">
              <tr>
                <th className="py-3 px-3">Colaborador</th>
                <th className="py-3 px-3">Login / E-mail</th>
                <th className="py-3 px-3">Senha</th>
                <th className="py-3 px-3">Cargo & Perfil</th>
                <th className="py-3 px-3">Vínculo com Loja</th>
                <th className="py-3 px-3">Regime de Ponto</th>
                <th className="py-3 px-3">Escala</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredUsers.map((user) => {
                const isAllStores = user.hasAccessToAllStores || user.storeId === 'all' || user.role === 'dono';
                const store = stores.find((s) => s.id === user.storeId);
                const isPasswordShown = showPasswordMap[user.id];

                return (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                            user.avatarColor || 'from-emerald-500 to-teal-700'
                          } flex items-center justify-center text-white font-bold text-xs shrink-0 shadow`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{user.name}</div>
                          <div className="text-[10px] text-zinc-400 font-normal">
                            CPF: {user.cpf || 'Não informado'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-sans text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        <span>{user.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-300">
                          {isPasswordShown ? user.passwordHash : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="text-zinc-500 hover:text-zinc-300"
                          title={isPasswordShown ? 'Ocultar' : 'Exibir'}
                        >
                          {isPasswordShown ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === 'dono'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : user.role === 'gerente'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {user.role === 'dono'
                          ? '👑 DONO (TOTAL)'
                          : user.role === 'gerente'
                          ? 'GERENTE (ACOMPANHAMENTO)'
                          : 'ATENDENTE'}
                      </span>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">
                        {user.positionTitle}
                      </p>
                    </td>

                    <td className="py-3 px-3 font-sans text-zinc-300">
                      {isAllStores ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                          <Globe className="w-3 h-3" /> Todas as Lojas (Rede + Futuras)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-zinc-300 text-[11px]">
                          <Building2 className="w-3 h-3 text-zinc-500" />
                          {store?.name || 'Unidade'} ({store?.code || 'LJ'})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {user.role === 'dono' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          👑 Não Bate Ponto
                        </span>
                      ) : user.role === 'gerente' ? (
                        user.exemptFromPunchClock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            🛡️ Confiança (Não Bate Ponto)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            ⏱️ Bate Ponto Diário
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          ⏱️ Bate Ponto Obrigatório
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {user.role === 'dono' || (user.role === 'gerente' && user.exemptFromPunchClock) ? (
                        <span className="text-[10px] text-zinc-500">Horário Livre</span>
                      ) : (
                        <>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                            {user.scheduleType}
                          </span>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {user.defaultShiftStart} - {user.defaultShiftEnd}
                          </p>
                        </>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-sans">
                      {isReadOnly ? (
                        <span className="text-[11px] text-zinc-500 italic">Visualização</span>
                      ) : (
                        <button
                          onClick={() => setEditingUser(user)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition-all inline-flex items-center gap-1 border border-zinc-700"
                        >
                          <Edit2 className="w-3 h-3 text-emerald-400" />
                          <span>Editar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Cadastrar Novo Acesso / Funcionário Crepelocks</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Oliveira"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">E-mail de Acesso (Login)</label>
                  <input
                    type="email"
                    required
                    placeholder="maria@crepelocks.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                  <span className="text-[10px] text-zinc-500">Pode ser corporativo institucional</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Senha Inicial</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Nível / Cargo</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as Role)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-bold"
                  >
                    <option value="atendente">Atendente (Apenas Bater Ponto)</option>
                    <option value="gerente">Gerente de Loja</option>
                    <option value="dono">Dono (Acesso Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Vínculo com Loja</label>
                  <select
                    value={storeId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStoreId(val);
                      setHasAccessToAllStores(val === 'all');
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-semibold"
                  >
                    <option value="all" className="bg-zinc-900 text-emerald-400 font-bold">
                      🌐 TODAS as Lojas (Rede Global + Lojas Futuras)
                    </option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                        🏬 {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    {storeId === 'all'
                      ? '⭐ Vinculado a todas as lojas atuais e a qualquer nova loja que você cadastrar depois.'
                      : 'Vinculado exclusivamente a esta unidade.'}
                  </span>
                </div>
              </div>

              {/* Regime de Ponto do Gerente (Decisão do Dono) */}
              {role === 'gerente' && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      Regime de Ponto do Gerente (Decisão do Dono)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Art. 62, II da CLT</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Como Dono, escolha se o gerente é isento de bater ponto como cargo de confiança ou se deve registrar ponto normalmente:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div
                      onClick={() => setExemptFromPunchClock(true)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                        exemptFromPunchClock
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="regimePontoGerente"
                        checked={exemptFromPunchClock}
                        onChange={() => setExemptFromPunchClock(true)}
                        className="mt-0.5 text-emerald-500"
                      />
                      <div>
                        <span className="font-bold block text-emerald-400">🛡️ Cargo de Confiança (Não Bate Ponto)</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          Isento de registro de jornada diária. Não gera alertas de atraso ou ausência.
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => setExemptFromPunchClock(false)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                        !exemptFromPunchClock
                          ? 'bg-amber-500/10 border-amber-500 text-white'
                          : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="regimePontoGerente"
                        checked={!exemptFromPunchClock}
                        onChange={() => setExemptFromPunchClock(false)}
                        className="mt-0.5 text-amber-500"
                      />
                      <div>
                        <span className="font-bold block text-amber-400">⏱️ Bate Ponto Obrigatório</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          O gerente terá a aba "Bater Ponto" para registrar entrada, almoço e saída.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {role === 'dono' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Perfil de Dono:</strong> Isento de registro de ponto (não bate ponto) e vinculado automaticamente a todas as lojas da rede.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Título do Cargo</label>
                  <input
                    type="text"
                    value={positionTitle}
                    onChange={(e) => setPositionTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              {/* Schedule options */}
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] block">
                  Configuração Padrão da Escala
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Escala Padrão</label>
                    <select
                      value={scheduleType}
                      onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    >
                      <option value="6x1">Escala 6x1</option>
                      <option value="12x36">Escala 12x36</option>
                      <option value="5x2">Escala 5x2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Entrada Padrão</label>
                    <input
                      type="time"
                      value={defaultShiftStart}
                      onChange={(e) => setDefaultShiftStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Saída Padrão</label>
                    <input
                      type="time"
                      value={defaultShiftEnd}
                      onChange={(e) => setDefaultShiftEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Granular permissions checkboxes */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                <span className="text-zinc-300 font-bold text-xs flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Permissões Específicas do Perfil</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditSchedules}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canEditSchedules: e.target.checked })
                      }
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Criar e Alterar Escalas</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canApproveOccurrences}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canApproveOccurrences: e.target.checked })
                      }
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Aprovar Ocorrências & Abonos</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canUploadCertificates}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canUploadCertificates: e.target.checked })
                      }
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Subir e Gerenciar Atestados</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canExportPayroll}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canExportPayroll: e.target.checked })
                      }
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Exportar Folha (PDF/CSV)</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageEmployees}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageEmployees: e.target.checked })
                      }
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Criar / Gerenciar Usuários</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditStores}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canEditStores: e.target.checked })
                      }
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Gerenciar Lojas da Rede</span>
                  </label>
                </div>
              </div>

              {/* MFA Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white block">Autenticação Multifator (MFA)</span>
                    <span className="text-[11px] text-zinc-500">
                      Exigir código OTP adicional no login para segurança máxima
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mfaEnabled}
                  onChange={(e) => setMfaEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                >
                  Criar Colaborador & Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>Editar Acesso: {editingUser.name}</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Alterar Senha</label>
                  <input
                    type="text"
                    required
                    value={editingUser.passwordHash}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, passwordHash: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Cargo / Função</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value as Role })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="atendente">Atendente</option>
                    <option value="gerente">Gerente de Loja</option>
                    <option value="dono">Dono (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Vínculo com Loja</label>
                  <select
                    value={editingUser.storeId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingUser({
                        ...editingUser,
                        storeId: val,
                        hasAccessToAllStores: val === 'all'
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-semibold"
                  >
                    <option value="all" className="bg-zinc-900 text-emerald-400 font-bold">
                      🌐 TODAS as Lojas (Rede Global + Futuras)
                    </option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        🏬 {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Regime de Ponto para Gerente na Edição */}
              {editingUser.role === 'gerente' && (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      Regime de Ponto do Gerente (Cargo de Confiança)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Art. 62, II da CLT</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div
                      onClick={() => setEditingUser({ ...editingUser, exemptFromPunchClock: true })}
                      className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${
                        editingUser.exemptFromPunchClock
                          ? 'bg-emerald-500/15 border-emerald-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={Boolean(editingUser.exemptFromPunchClock)}
                        onChange={() => setEditingUser({ ...editingUser, exemptFromPunchClock: true })}
                        className="text-emerald-500"
                      />
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-400 block">🛡️ Cargo de Confiança</span>
                        <span className="text-[10px] text-zinc-500 block">Não bate ponto</span>
                      </div>
                    </div>

                    <div
                      onClick={() => setEditingUser({ ...editingUser, exemptFromPunchClock: false })}
                      className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${
                        !editingUser.exemptFromPunchClock
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={!editingUser.exemptFromPunchClock}
                        onChange={() => setEditingUser({ ...editingUser, exemptFromPunchClock: false })}
                        className="text-amber-500"
                      />
                      <div>
                        <span className="text-[11px] font-semibold text-amber-400 block">⏱️ Bate Ponto Diário</span>
                        <span className="text-[10px] text-zinc-500 block">Registra horários</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingUser.role === 'dono' && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Perfil Dono é isento de bater ponto e vinculado a todas as lojas.</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Escala</label>
                  <select
                    value={editingUser.scheduleType}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        scheduleType: e.target.value as ScheduleType
                      })
                    }
                    className="w-full px-2 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="6x1">6x1</option>
                    <option value="12x36">12x36</option>
                    <option value="5x2">5x2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Entrada</label>
                  <input
                    type="time"
                    value={editingUser.defaultShiftStart}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, defaultShiftStart: e.target.value })
                    }
                    className="w-full px-2 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Saída</label>
                  <input
                    type="time"
                    value={editingUser.defaultShiftEnd}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, defaultShiftEnd: e.target.value })
                    }
                    className="w-full px-2 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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
    </div>
  );
};
