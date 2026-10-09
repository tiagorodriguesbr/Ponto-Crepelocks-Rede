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
  Trash2,
  ShieldCheck,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Globe,
  Clock,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Search,
  UserX,
  FileText,
  Download,
  Calendar,
  RotateCcw,
  Sparkles,
  Calculator
} from 'lucide-react';
import { UserAccount, Store, Role, ScheduleType, UserPermissions, DismissedEmployee, SeveranceReason } from '../types';
import { StorageService } from '../services/storage';
import { PayrollCalculatorService } from '../services/payrollCalculator';
import { SeveranceExportService } from '../services/severanceExport';

export const calculateProbationDates = (
  admissionStr: string,
  daysInitial: number = 45,
  isExtended: boolean = false,
  daysExtension: number = 45
) => {
  try {
    const [y, m, d] = (admissionStr || '2026-08-01').split('-').map(Number);
    const admDate = new Date(y, (m || 1) - 1, d || 1);

    const p1Date = new Date(admDate);
    p1Date.setDate(p1Date.getDate() + (daysInitial || 45));
    const p1EndStr = p1Date.toISOString().split('T')[0];

    const totalDays = (daysInitial || 45) + (isExtended ? (daysExtension || 45) : 0);
    const p2Date = new Date(admDate);
    p2Date.setDate(p2Date.getDate() + totalDays);
    const finalEndStr = p2Date.toISOString().split('T')[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const isOver90Days = totalDays > 90;
    const isExpiredAndConverted = !isOver90Days && todayStr > finalEndStr;

    return {
      p1EndStr,
      finalEndStr,
      totalDays,
      isOver90Days,
      isExpiredAndConverted
    };
  } catch {
    return {
      p1EndStr: '',
      finalEndStr: '',
      totalDays: 90,
      isOver90Days: false,
      isExpiredAndConverted: false
    };
  }
};

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
  const canManageUsers = currentUser.role === 'dono' || Boolean(currentUser.permissions?.canManageEmployees);
  const isReadOnly = !canManageUsers;

  const [mainTab, setMainTab] = useState<'ativos' | 'desligados'>('ativos');
  const [dismissedEmployees, setDismissedEmployees] = useState<DismissedEmployee[]>(() =>
    StorageService.getDismissedEmployees()
  );

  // Modal de Desligamento / Rescisão
  const [dismissingEmployee, setDismissingEmployee] = useState<UserAccount | null>(null);
  const [dismissalDate, setDismissalDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dismissalReason, setDismissalReason] = useState<SeveranceReason>('termino_experiencia');
  const [dismissalOtherDiscounts, setDismissalOtherDiscounts] = useState<string>('0');
  const [dismissalNotes, setDismissalNotes] = useState<string>('');

  // Ver Detalhes e Excluir Histórico de Rescisão
  const [viewingSeverance, setViewingSeverance] = useState<DismissedEmployee | null>(null);
  const [dismissedToDelete, setDismissedToDelete] = useState<DismissedEmployee | null>(null);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Form state for New User / Add Modal
  const [addName, setAddName] = useState<string>('');
  const [addEmail, setAddEmail] = useState<string>('');
  const [addPassword, setAddPassword] = useState<string>('123456');
  const [addRole, setAddRole] = useState<Role>('gerente');
  // Store link: 'all' (todas atuais e futuras) or 'single' (loja específica)
  const [addStoreLinkType, setAddStoreLinkType] = useState<'all' | 'single'>('all');
  const [addSelectedStoreId, setAddSelectedStoreId] = useState<string>(stores[0]?.id || 'store-1');
  const [addPayrollStoreId, setAddPayrollStoreId] = useState<string>(stores.find((s) => s.id === 'store-botafogo')?.id || stores[0]?.id || 'store-1');
  
  // Data de Admissão, Tipo de Contrato & Experiência
  const [addAdmissionDate, setAddAdmissionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [addContractType, setAddContractType] = useState<'experiencia' | 'indeterminado'>('experiencia');
  const [addProbationDaysInitial, setAddProbationDaysInitial] = useState<number>(45);
  const [addProbationExtended, setAddProbationExtended] = useState<boolean>(false);
  const [addProbationDaysExtension, setAddProbationDaysExtension] = useState<number>(45);

  // Regime de ponto: exemptFromPunchClock = true (cargo de confiança - não bate ponto) or false (bate ponto)
  const [addExemptFromPunch, setAddExemptFromPunch] = useState<boolean>(true);
  // Painéis: modo acompanhamento (sem modificar) ou permissões personalizadas
  const [addAccompanimentMode, setAddAccompanimentMode] = useState<boolean>(true);
  const [addPositionTitle, setAddPositionTitle] = useState<string>('Gerente de Loja');
  const [addCpf, setAddCpf] = useState<string>('');
  const [addPhone, setAddPhone] = useState<string>('');
  const [addScheduleType, setAddScheduleType] = useState<ScheduleType>('6x1');
  const [addDefaultShiftStart, setAddDefaultShiftStart] = useState<string>('08:00');
  const [addDefaultShiftEnd, setAddDefaultShiftEnd] = useState<string>('16:20');
  const [addLunchDurationMin, setAddLunchDurationMin] = useState<number>(60);
  const [addMfaEnabled, setAddMfaEnabled] = useState<boolean>(false);
  const [addPermissions, setAddPermissions] = useState<UserPermissions>({
    canEditSchedules: false,
    canApproveOccurrences: false,
    canManageEmployees: false,
    canViewFinancialReports: true,
    canUploadCertificates: false,
    canExportPayroll: true,
    canEditStores: false
  });

  // Edit user form state
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editRole, setEditRole] = useState<Role>('gerente');
  const [editStoreLinkType, setEditStoreLinkType] = useState<'all' | 'single'>('all');
  const [editSelectedStoreId, setEditSelectedStoreId] = useState<string>('');
  const [editPayrollStoreId, setEditPayrollStoreId] = useState<string>(stores[0]?.id || 'store-1');

  // Data de Admissão, Tipo de Contrato & Experiência na Edição
  const [editAdmissionDate, setEditAdmissionDate] = useState<string>('');
  const [editContractType, setEditContractType] = useState<'experiencia' | 'indeterminado'>('experiencia');
  const [editProbationDaysInitial, setEditProbationDaysInitial] = useState<number>(45);
  const [editProbationExtended, setEditProbationExtended] = useState<boolean>(false);
  const [editProbationDaysExtension, setEditProbationDaysExtension] = useState<number>(45);

  const CREPELOCKS_CARGOS = [
    { title: 'Atendente', role: 'atendente' as Role, exempt: false, schedule: '6x1' as ScheduleType, allStores: false, badge: 'Operacional' },
    { title: 'Gerente de Loja', role: 'gerente' as Role, exempt: false, schedule: '6x1' as ScheduleType, allStores: false, badge: 'Gestão Loja' },
    { title: 'Gerente de Vendas', role: 'gerente' as Role, exempt: false, schedule: '6x1' as ScheduleType, allStores: true, badge: 'Comercial' },
    { title: 'Gerente de Marketing', role: 'gerente' as Role, exempt: true, schedule: '5x2' as ScheduleType, allStores: true, badge: 'Marketing' },
    { title: 'Auxiliar Administrativo', role: 'atendente' as Role, exempt: false, schedule: '5x2' as ScheduleType, allStores: false, badge: 'Administrativo' },
    { title: 'Diretor Financeiro', role: 'dono' as Role, exempt: true, schedule: '5x2' as ScheduleType, allStores: true, badge: 'CFO' },
    { title: 'Diretor Operacional', role: 'dono' as Role, exempt: true, schedule: '5x2' as ScheduleType, allStores: true, badge: 'COO' },
    { title: 'Diretor Executivo', role: 'dono' as Role, exempt: true, schedule: '5x2' as ScheduleType, allStores: true, badge: 'CEO' },
    { title: 'Dono (Proprietário)', role: 'dono' as Role, exempt: true, schedule: '5x2' as ScheduleType, allStores: true, badge: 'Proprietário' }
  ];

  const applyCargoPresetInAdd = (cargo: typeof CREPELOCKS_CARGOS[0]) => {
    setAddPositionTitle(cargo.title);
    handleRoleChangeInAdd(cargo.role);
    if (cargo.role === 'dono') {
      setAddStoreLinkType('all');
      setAddExemptFromPunch(true);
      setAddScheduleType('5x2');
    } else {
      setAddStoreLinkType(cargo.allStores ? 'all' : 'single');
      setAddExemptFromPunch(cargo.exempt);
      setAddScheduleType(cargo.schedule);
      if (cargo.schedule === '5x2') {
        setAddDefaultShiftStart('08:00');
        setAddDefaultShiftEnd('17:48');
      }
    }
  };

  const applyCargoPresetInEdit = (cargo: typeof CREPELOCKS_CARGOS[0]) => {
    setEditPositionTitle(cargo.title);
    setEditRole(cargo.role);
    if (cargo.role === 'dono') {
      setEditStoreLinkType('all');
      setEditExemptFromPunch(true);
      setEditScheduleType('5x2');
    } else {
      setEditStoreLinkType(cargo.allStores ? 'all' : 'single');
      setEditExemptFromPunch(cargo.exempt);
      setEditScheduleType(cargo.schedule);
      if (cargo.schedule === '5x2') {
        setEditDefaultShiftStart('08:00');
        setEditDefaultShiftEnd('17:48');
      }
    }
  };
  const [editExemptFromPunch, setEditExemptFromPunch] = useState<boolean>(true);
  const [editAccompanimentMode, setEditAccompanimentMode] = useState<boolean>(true);
  const [editPositionTitle, setEditPositionTitle] = useState<string>('');
  const [editCpf, setEditCpf] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editScheduleType, setEditScheduleType] = useState<ScheduleType>('6x1');
  const [editDefaultShiftStart, setEditDefaultShiftStart] = useState<string>('08:00');
  const [editDefaultShiftEnd, setEditDefaultShiftEnd] = useState<string>('16:20');
  const [editLunchDurationMin, setEditLunchDurationMin] = useState<number>(60);
  const [editMfaEnabled, setEditMfaEnabled] = useState<boolean>(false);
  const [editPermissions, setEditPermissions] = useState<UserPermissions>({
    canEditSchedules: false,
    canApproveOccurrences: false,
    canManageEmployees: false,
    canViewFinancialReports: true,
    canUploadCertificates: false,
    canExportPayroll: true,
    canEditStores: false
  });

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const resetAddForm = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword('123456');
    setAddRole('gerente');
    setAddStoreLinkType('all');
    setAddSelectedStoreId(stores[0]?.id || 'store-1');
    setAddPayrollStoreId(stores.find((s) => s.id === 'store-botafogo')?.id || stores[0]?.id || 'store-1');
    setAddAdmissionDate(new Date().toISOString().split('T')[0]);
    setAddContractType('experiencia');
    setAddProbationDaysInitial(45);
    setAddProbationExtended(false);
    setAddProbationDaysExtension(45);
    setAddExemptFromPunch(true);
    setAddAccompanimentMode(true);
    setAddPositionTitle('Gerente de Loja');
    setAddCpf('');
    setAddPhone('');
    setAddScheduleType('6x1');
    setAddDefaultShiftStart('08:00');
    setAddDefaultShiftEnd('16:20');
    setAddLunchDurationMin(60);
    setAddMfaEnabled(false);
    setAddPermissions({
      canEditSchedules: false,
      canApproveOccurrences: false,
      canManageEmployees: false,
      canViewFinancialReports: true,
      canUploadCertificates: false,
      canExportPayroll: true,
      canEditStores: false
    });
  };

  const handleRoleChangeInAdd = (newRole: Role) => {
    setAddRole(newRole);
    if (newRole === 'dono') {
      setAddPositionTitle('Diretor / Dono');
      setAddStoreLinkType('all');
      setAddExemptFromPunch(true); // Dono nunca bate ponto
      setAddAccompanimentMode(false);
      setAddPermissions({
        canEditSchedules: true,
        canApproveOccurrences: true,
        canManageEmployees: true,
        canViewFinancialReports: true,
        canUploadCertificates: true,
        canExportPayroll: true,
        canEditStores: true
      });
    } else if (newRole === 'gerente') {
      setAddPositionTitle('Gerente de Loja');
      setAddStoreLinkType('all'); // Padrão: vinculado a todas as lojas
      setAddExemptFromPunch(true); // Padrão: Cargo de Confiança (Dono pode alterar para bater ponto)
      setAddAccompanimentMode(true); // Padrão: Acompanhamento sem poder modificar
      setAddPermissions({
        canEditSchedules: false,
        canApproveOccurrences: false,
        canManageEmployees: false,
        canViewFinancialReports: true,
        canUploadCertificates: false,
        canExportPayroll: true,
        canEditStores: false
      });
    } else {
      setAddPositionTitle('Atendente de Balcão & Crepeira');
      setAddStoreLinkType('single');
      setAddExemptFromPunch(false); // Atendente bate ponto obrigatório
      setAddAccompanimentMode(false);
      setAddPermissions({
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

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword(user.passwordHash);
    setEditRole(user.role);

    const isAllStores = user.hasAccessToAllStores === true || user.storeId === 'all' || user.role === 'dono';
    setEditStoreLinkType(isAllStores ? 'all' : 'single');
    setEditSelectedStoreId(!isAllStores ? user.storeId : (stores[0]?.id || 'store-1'));
    setEditPayrollStoreId(user.payrollStoreId || (!isAllStores ? user.storeId : stores.find((s) => s.id === 'store-botafogo')?.id || stores[0]?.id || 'store-1'));

    // Regime de ponto
    setEditExemptFromPunch(user.role === 'dono' ? true : Boolean(user.exemptFromPunchClock));

    // Determina se está no modo acompanhamento (sem permissões de alteração)
    const perms = user.permissions || {
      canEditSchedules: false,
      canApproveOccurrences: false,
      canManageEmployees: false,
      canViewFinancialReports: true,
      canUploadCertificates: false,
      canExportPayroll: true,
      canEditStores: false
    };
    setEditPermissions(perms);
    const hasAnyModificationPerm = perms.canEditSchedules || perms.canApproveOccurrences || perms.canManageEmployees || perms.canEditStores;
    setEditAccompanimentMode(!hasAnyModificationPerm && user.role === 'gerente');

    setEditPositionTitle(user.positionTitle || (user.role === 'dono' ? 'Diretor' : user.role === 'gerente' ? 'Gerente de Loja' : 'Atendente'));
    setEditCpf(user.cpf || '');
    setEditPhone(user.phone || '');
    setEditScheduleType(user.scheduleType || '6x1');
    setEditDefaultShiftStart(user.defaultShiftStart || '08:00');
    setEditDefaultShiftEnd(user.defaultShiftEnd || '16:20');
    setEditLunchDurationMin(user.lunchDurationMin || 60);
    setEditMfaEnabled(Boolean(user.mfaEnabled));
    setEditAdmissionDate(user.admissionDate || new Date().toISOString().split('T')[0]);
    setEditContractType(user.contractType || 'experiencia');
    setEditProbationDaysInitial(user.probationDaysInitial || 45);
    setEditProbationExtended(Boolean(user.probationExtended));
    setEditProbationDaysExtension(user.probationDaysExtension || 45);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) {
      showToast('Preencha os campos obrigatórios (Nome e E-mail).');
      return;
    }

    const emailClean = addEmail.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === emailClean);
    if (existing) {
      showToast('Já existe um usuário com este e-mail.');
      return;
    }

    const colors = [
      'from-emerald-500 to-teal-700',
      'from-rose-500 to-pink-600',
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-violet-600',
      'from-amber-500 to-orange-600'
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const isAllStores = addRole === 'dono' || addStoreLinkType === 'all';
    // Dono nunca bate ponto; Gerente/Atendente segue a escolha dinâmica
    const isExempt = addRole === 'dono' ? true : addExemptFromPunch;

    // Se estiver em modo acompanhamento, garante que permissões de modificação fiquem false
    const finalPermissions: UserPermissions = addRole === 'dono'
      ? {
          canEditSchedules: true,
          canApproveOccurrences: true,
          canManageEmployees: true,
          canViewFinancialReports: true,
          canUploadCertificates: true,
          canExportPayroll: true,
          canEditStores: true
        }
      : addAccompanimentMode
      ? {
          canEditSchedules: false,
          canApproveOccurrences: false,
          canManageEmployees: false,
          canViewFinancialReports: true,
          canUploadCertificates: false,
          canExportPayroll: true,
          canEditStores: false
        }
      : addPermissions;

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: addName.trim(),
      email: emailClean,
      passwordHash: addPassword.trim() || '123456',
      role: addRole,
      storeId: isAllStores ? 'all' : addSelectedStoreId,
      payrollStoreId: isAllStores ? addPayrollStoreId : addSelectedStoreId,
      hasAccessToAllStores: isAllStores,
      positionTitle: addPositionTitle.trim() || (addRole === 'dono' ? 'Diretor' : addRole === 'gerente' ? 'Gerente de Loja' : 'Atendente'),
      cpf: addCpf.trim() || '000.000.000-00',
      phone: addPhone.trim() || '(11) 90000-0000',
      admissionDate: addAdmissionDate || new Date().toISOString().split('T')[0],
      contractType: addContractType,
      scheduleType: addScheduleType,
      defaultShiftStart: addDefaultShiftStart,
      defaultShiftEnd: addDefaultShiftEnd,
      lunchDurationMin: addLunchDurationMin,
      active: true,
      mfaEnabled: addMfaEnabled,
      exemptFromPunchClock: isExempt,
      avatarColor,
      permissions: finalPermissions,
      ...(addContractType === 'experiencia'
        ? {
            probationDaysInitial: addProbationDaysInitial,
            probationExtended: addProbationExtended,
            ...(addProbationExtended ? { probationDaysExtension: addProbationDaysExtension } : {})
          }
        : {})
    };

    StorageService.addUser(newUser);

    // Auto-generate initial schedule for the current month if required to clock in
    if (!newUser.exemptFromPunchClock) {
      const today = new Date();
      StorageService.generateMonthlySchedule(
        newUser.id,
        addScheduleType,
        today.getFullYear(),
        today.getMonth() + 1,
        addDefaultShiftStart,
        addDefaultShiftEnd
      );
    }

    setShowAddModal(false);
    resetAddForm();
    onDataUpdated();
    showToast(`Colaborador ${newUser.name} cadastrado com sucesso!`);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const isAllStores = editRole === 'dono' || editStoreLinkType === 'all';
    const isExempt = editRole === 'dono' ? true : editExemptFromPunch;

    const finalPermissions: UserPermissions = editRole === 'dono'
      ? {
          canEditSchedules: true,
          canApproveOccurrences: true,
          canManageEmployees: true,
          canViewFinancialReports: true,
          canUploadCertificates: true,
          canExportPayroll: true,
          canEditStores: true
        }
      : editAccompanimentMode
      ? {
          canEditSchedules: false,
          canApproveOccurrences: false,
          canManageEmployees: false,
          canViewFinancialReports: true,
          canUploadCertificates: false,
          canExportPayroll: true,
          canEditStores: false
        }
      : editPermissions;

    const updated: UserAccount = {
      ...editingUser,
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      passwordHash: editPassword.trim() || editingUser.passwordHash,
      role: editRole,
      storeId: isAllStores ? 'all' : editSelectedStoreId,
      payrollStoreId: isAllStores ? editPayrollStoreId : editSelectedStoreId,
      hasAccessToAllStores: isAllStores,
      exemptFromPunchClock: isExempt,
      positionTitle: editPositionTitle.trim(),
      cpf: editCpf.trim(),
      phone: editPhone.trim(),
      admissionDate: editAdmissionDate || editingUser.admissionDate || new Date().toISOString().split('T')[0],
      contractType: editContractType,
      scheduleType: editScheduleType,
      defaultShiftStart: editDefaultShiftStart,
      defaultShiftEnd: editDefaultShiftEnd,
      lunchDurationMin: editLunchDurationMin,
      mfaEnabled: editMfaEnabled,
      permissions: finalPermissions,
      ...(editContractType === 'experiencia'
        ? {
            probationDaysInitial: editProbationDaysInitial,
            probationExtended: editProbationExtended,
            ...(editProbationExtended ? { probationDaysExtension: editProbationDaysExtension } : {})
          }
        : {})
    };

    if (editContractType !== 'experiencia') {
      delete updated.probationDaysInitial;
      delete updated.probationExtended;
      delete updated.probationDaysExtension;
    } else if (!editProbationExtended) {
      delete updated.probationDaysExtension;
    }

    StorageService.updateUser(updated);
    setEditingUser(null);
    onDataUpdated();
    showToast(`Dados de ${updated.name} atualizados com sucesso!`);
  };

  // Funções de Rescisão / Desligamento
  const handleOpenDismissalModal = (emp: UserAccount) => {
    setDismissingEmployee(emp);
    setDismissalDate(new Date().toISOString().split('T')[0]);
    setDismissalReason(emp.contractType === 'experiencia' ? 'termino_experiencia' : 'sem_justa_causa');
    setDismissalOtherDiscounts('0');
    setDismissalNotes('');
  };

  const handleConfirmDismissal = () => {
    if (!dismissingEmployee) return;

    const baseSalary = StorageService.getPayrollConfigs().find((c) => c.employeeId === dismissingEmployee.id)?.baseSalary || 2000;
    const storeObj = stores.find((s) => s.id === (dismissingEmployee.payrollStoreId || dismissingEmployee.storeId)) || stores[0];

    const calculation = PayrollCalculatorService.calculateSeverance({
      employee: dismissingEmployee,
      baseSalary,
      admissionDate: dismissingEmployee.admissionDate || '2026-08-01',
      dismissalDate,
      reason: dismissalReason,
      contractType: dismissingEmployee.contractType || 'experiencia',
      probationDaysInitial: dismissingEmployee.probationDaysInitial || 45,
      probationExtended: dismissingEmployee.probationExtended,
      probationDaysExtension: dismissingEmployee.probationDaysExtension || 45,
      otherDiscounts: parseFloat(dismissalOtherDiscounts.replace(',', '.')) || 0,
      storeName: storeObj.name,
      payrollStoreId: storeObj.id
    });

    const recordToSave: DismissedEmployee = {
      ...calculation,
      notes: dismissalNotes.trim() || undefined
    };

    // Salva no banco de desligados e remove dos ativos
    StorageService.addDismissedEmployee(recordToSave);

    // Gera e faz download imediato do TRCT em PDF
    SeveranceExportService.generateSeverancePdf(recordToSave, storeObj);

    setDismissedEmployees(StorageService.getDismissedEmployees());
    setDismissingEmployee(null);
    onDataUpdated();
    showToast(`Colaborador ${dismissingEmployee.name} desligado com sucesso. TRCT em PDF baixado automaticamente!`);
  };

  const handleReactivateDismissed = (item: DismissedEmployee) => {
    StorageService.reactivateDismissedEmployee(item.id);
    setDismissedEmployees(StorageService.getDismissedEmployees());
    onDataUpdated();
    showToast(`Colaborador ${item.employeeName} reativado e retornado à equipe ativa.`);
  };

  const handleDeleteDismissed = (id: string) => {
    StorageService.deleteDismissedEmployee(id);
    setDismissedEmployees(StorageService.getDismissedEmployees());
    setDismissedToDelete(null);
    showToast('Registro de rescisão excluído do histórico.');
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;

    if (userToDelete.id === currentUser.id) {
      showToast('Ação bloqueada: você não pode excluir a sua própria conta conectada.');
      setUserToDelete(null);
      return;
    }

    const deletedName = userToDelete.name;
    StorageService.deleteUser(userToDelete.id);
    setUserToDelete(null);
    if (editingUser?.id === userToDelete.id) {
      setEditingUser(null);
    }
    onDataUpdated();
    showToast(`Usuário ${deletedName} foi excluído do sistema.`);
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all') {
      if (filterRole === 'dono' || filterRole === 'gerente' || filterRole === 'atendente') {
        if (u.role !== filterRole) return false;
      } else {
        if (u.positionTitle?.toLowerCase() !== filterRole.toLowerCase()) return false;
      }
    }
    if (filterStore !== 'all') {
      const isLinkedToAll = u.hasAccessToAllStores || u.storeId === 'all' || u.role === 'dono';
      if (!isLinkedToAll && u.storeId !== filterStore) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchCpf = u.cpf?.toLowerCase().includes(q);
      const matchPos = u.positionTitle?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCpf && !matchPos) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notificationMsg}</span>
        </div>
      )}

      {/* Banner de Modo Somente Leitura para quem não tem permissão de gerenciar */}
      {isReadOnly && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex items-center gap-3 text-amber-200">
          <Eye className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block">Modo Acompanhamento (Visualização)</span>
            <span>Você tem acesso à visualização da equipe e das configurações em tempo real. Criação, edição e exclusão de acessos são privativas do perfil Dono ou usuários autorizados.</span>
          </div>
        </div>
      )}

      {/* Banner Principal com Botão de Ação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Colaboradores, Perfis & Gestão Dinâmica de Acessos</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gestão completa da equipe Crepelocks: altere vínculos de lojas, regime de ponto (cargo de confiança) e permissões de forma 100% dinâmica.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 shadow-md shadow-emerald-950/40 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Acesso / Colaborador</span>
          </button>
        )}
      </div>

      {/* Navegação Principal: Equipe Ativa vs Banco de Desligados / Demitidos */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
        <button
          onClick={() => setMainTab('ativos')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'ativos'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipe Ativa ({users.length})</span>
        </button>

        <button
          onClick={() => setMainTab('desligados')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'desligados'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
          }`}
        >
          <UserX className="w-4 h-4 text-rose-300" />
          <span>Banco de Desligados / Demitidos ({dismissedEmployees.length})</span>
        </button>
      </div>

      {/* SEÇÃO 1: ABA DE COLABORADORES ATIVOS */}
      {mainTab === 'ativos' && (
        <div className="space-y-4">
          {/* Filter toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-card/60 border-border text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Cargo:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos os Cargos</option>
              <option value="Atendente">Atendente</option>
              <option value="Gerente de Loja">Gerente de Loja</option>
              <option value="Gerente de Vendas">Gerente de Vendas</option>
              <option value="Gerente de Marketing">Gerente de Marketing</option>
              <option value="Auxiliar Administrativo">Auxiliar Administrativo</option>
              <option value="Diretor Financeiro">Diretor Financeiro</option>
              <option value="Diretor Operacional">Diretor Operacional</option>
              <option value="Diretor Executivo">Diretor Executivo</option>
              <option value="Dono (Proprietário)">Dono (Proprietário)</option>
              <option value="dono">Perfil Dono / Diretoria</option>
              <option value="gerente">Perfil Gerencial</option>
              <option value="atendente">Perfil Operacional</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Loja:</span>
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

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
          />
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
                <th className="py-3 px-3">Vínculo com Lojas</th>
                <th className="py-3 px-3">Regime de Ponto</th>
                <th className="py-3 px-3">Painéis & Acesso</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 font-sans">
                    Nenhum colaborador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isAllStores = user.hasAccessToAllStores || user.storeId === 'all' || user.role === 'dono';
                  const store = stores.find((s) => s.id === user.storeId);
                  const effectivePayrollId = user.payrollStoreId || (!isAllStores ? user.storeId : stores.find((s) => s.id === 'store-botafogo')?.id || stores[0]?.id);
                  const payrollStore = stores.find((s) => s.id === effectivePayrollId);
                  const isPasswordShown = showPasswordMap[user.id];
                  const isCurrentUser = user.id === currentUser.id;

                  // Verifica se tem permissões de modificação ou se é somente acompanhamento
                  const perms = user.permissions;
                  const hasModPerms = perms && (perms.canEditSchedules || perms.canApproveOccurrences || perms.canManageEmployees || perms.canEditStores);

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
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-normal">
                              CPF: {user.cpf || 'Não informado'}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-normal flex items-center gap-1.5 mt-0.5">
                              <span>Admissão: <strong className="text-zinc-300">{user.admissionDate || '-'}</strong></span>
                              <span>•</span>
                              {user.contractType === 'experiencia' ? (
                                <span className="text-amber-400 font-medium">
                                  Experiência ({user.probationDaysInitial || 45}d{user.probationExtended ? `+${user.probationDaysExtension || 45}d` : ''})
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-medium">Indeterminado</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-sans text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
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
                            className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
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
                            ? 'GERENTE DE LOJA'
                            : 'ATENDENTE'}
                        </span>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">
                          {user.positionTitle}
                        </p>
                      </td>

                      <td className="py-3 px-3 font-sans text-zinc-300">
                        {isAllStores ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]" title="Vinculado a todas as lojas atuais e futuras">
                              <Globe className="w-3 h-3 text-emerald-400" />
                              <span>Todas as Lojas (Rede)</span>
                            </span>
                            {payrollStore && (
                              <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>Folha: <strong className="text-zinc-200">{payrollStore.name} ({payrollStore.code})</strong></span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-300 text-[11px]">
                            <Building2 className="w-3 h-3 text-zinc-500" />
                            <span>{store?.name || 'Unidade'} ({store?.code || 'LJ'})</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-sans">
                        {user.role === 'dono' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            👑 Não Bate Ponto (Isento)
                          </span>
                        ) : user.exemptFromPunchClock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            🛡️ Confiança (Não Bate Ponto)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            ⏱️ Bate Ponto Diário
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-sans">
                        {user.role === 'dono' ? (
                          <span className="text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-400" /> Total Irrestrito
                          </span>
                        ) : user.role === 'gerente' && !hasModPerms ? (
                          <span className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <Eye className="w-3 h-3 text-emerald-400" /> Acompanhamento Geral
                          </span>
                        ) : user.role === 'gerente' ? (
                          <span className="text-[10px] font-semibold text-blue-300 flex items-center gap-1 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/20">
                            <Sliders className="w-3 h-3 text-blue-400" /> Customizado / Gestão
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">
                            Operacional (Meu Ponto)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-sans">
                        {isReadOnly ? (
                          <span className="text-[11px] text-zinc-500 italic">Visualização</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDismissalModal(user)}
                              disabled={isCurrentUser}
                              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer ${
                                isCurrentUser
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-500/40 text-amber-300 hover:text-white shadow-sm'
                              }`}
                              title={isCurrentUser ? 'Você não pode desligar a si mesmo' : 'Desligar colaborador, calcular verbas rescisórias e gerar TRCT em PDF'}
                            >
                              <UserX className="w-3.5 h-3.5 text-amber-400" />
                              <span>Desligar</span>
                            </button>

                            <button
                              onClick={() => openEditModal(user)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition-all inline-flex items-center gap-1 border border-zinc-700 cursor-pointer"
                              title="Editar este usuário"
                            >
                              <Edit2 className="w-3 h-3 text-emerald-400" />
                              <span>Editar</span>
                            </button>

                            <button
                              onClick={() => setUserToDelete(user)}
                              disabled={isCurrentUser}
                              className={`p-1.5 rounded-lg border text-[11px] font-medium transition-all inline-flex items-center justify-center cursor-pointer ${
                                isCurrentUser
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : 'bg-rose-950/30 hover:bg-rose-900/50 border-rose-500/30 text-rose-300 hover:text-white'
                              }`}
                              title={isCurrentUser ? 'Você não pode excluir sua própria conta conectada' : 'Excluir usuário'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
    </div>
  )}

      {/* SEÇÃO 2: ABA DE COLABORADORES DESLIGADOS / DEMITIDOS */}
      {mainTab === 'desligados' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Banco de Colaboradores Desligados & Rescisões Trabalhistas</h3>
                <p className="text-[11px] text-zinc-400">
                  Histórico de vínculos encerrados. Gere ou baixe novamente o Termo de Rescisão (TRCT em PDF), consulte as verbas pagas ou reative o colaborador se necessário.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
              {dismissedEmployees.length} registros no histórico
            </span>
          </div>

          <div className="p-5 rounded-2xl border bg-card/60 border-border shadow-md">
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-3">Colaborador Desligado</th>
                    <th className="py-3 px-3">Cargo & Loja de Lotação</th>
                    <th className="py-3 px-3">Período Trabalhado</th>
                    <th className="py-3 px-3">Modalidade / Enquadramento CLT</th>
                    <th className="py-3 px-3 text-right">Líquido Rescisório</th>
                    <th className="py-3 px-3 text-right">Ações & TRCT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {dismissedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-zinc-500 font-sans">
                        Nenhum colaborador desligado no momento. Quando um funcionário for demitido ou tiver o contrato encerrado, ele será arquivado aqui com o cálculo completo e PDF.
                      </td>
                    </tr>
                  ) : (
                    dismissedEmployees.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-3 font-sans">
                          <div className="font-bold text-white text-xs">{item.employeeName}</div>
                          <div className="text-[10px] text-zinc-400">CPF: {item.cpf}</div>
                        </td>

                        <td className="py-3 px-3 font-sans text-zinc-300">
                          <div className="font-medium text-white">{item.positionTitle}</div>
                          <div className="text-[10px] text-zinc-400">{item.storeName}</div>
                        </td>

                        <td className="py-3 px-3 font-sans text-zinc-300">
                          <div>
                            <span className="text-zinc-400">Admissão:</span> {item.admissionDate}
                          </div>
                          <div>
                            <span className="text-rose-400">Desligamento:</span> {item.dismissalDate}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {item.daysWorkedTotal} dias cumpridos
                          </div>
                        </td>

                        <td className="py-3 px-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-amber-300 border border-zinc-700 block truncate max-w-[260px]">
                            {item.reasonLabel}
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            {item.contractType === 'experiencia'
                              ? `Contrato de Experiência (${item.probationDaysInitial || 45}d${item.probationExtended ? ` + ${item.probationDaysExtension || 45}d` : ''})`
                              : 'Contrato Indeterminado'}
                          </span>
                          {item.artigo479IndenizacaoValor && item.artigo479IndenizacaoValor > 0 ? (
                            <span className="text-[10px] text-amber-400 font-semibold block mt-0.5">
                              ⚠️ Indenização Art. 479 CLT: R$ {item.artigo479IndenizacaoValor.toFixed(2)}
                            </span>
                          ) : null}
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          <span className="text-sm font-black text-emerald-400 block">
                            R$ {item.netSeverancePay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            Bruto: R$ {item.totalGrossSeverance.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                const storeObj = stores.find((s) => s.id === item.storeId) || stores[0];
                                SeveranceExportService.generateSeverancePdf(item, storeObj);
                                showToast(`Baixando TRCT em PDF de ${item.employeeName}...`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow cursor-pointer"
                              title="Baixar Termo de Rescisão Oficial em PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>TRCT (PDF)</span>
                            </button>

                            <button
                              onClick={() => setViewingSeverance(item)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-all inline-flex items-center gap-1 border border-zinc-700 cursor-pointer"
                              title="Ver demonstrativo detalhado das verbas rescisórias"
                            >
                              <FileText className="w-3 h-3 text-blue-400" />
                              <span>Verbas</span>
                            </button>

                            <button
                              onClick={() => handleReactivateDismissed(item)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-300 text-[11px] font-medium transition-all inline-flex items-center gap-1 border border-zinc-700 cursor-pointer"
                              title="Reativar e reintegrar este colaborador aos ativos"
                            >
                              <RotateCcw className="w-3 h-3 text-emerald-400" />
                              <span>Reativar</span>
                            </button>

                            <button
                              onClick={() => setDismissedToDelete(item)}
                              className="p-1.5 rounded-lg border bg-rose-950/30 hover:bg-rose-900/50 border-rose-500/30 text-rose-300 hover:text-white transition-all cursor-pointer"
                              title="Excluir permanentemente do histórico de demitidos"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO ACESSO / COLABORADOR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Cadastrar Novo Acesso / Colaborador Crepelocks</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Configure o perfil de acesso, vínculo de lojas e regime de ponto de forma dinâmica.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              {/* SEÇÃO 1: DADOS BÁSICOS */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  1. Dados de Identificação & Acesso
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Oliveira"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">E-mail de Login *</label>
                    <input
                      type="email"
                      required
                      placeholder="carlos@crepelocks.com.br"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Senha Inicial</label>
                    <input
                      type="text"
                      required
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={addCpf}
                      onChange={(e) => setAddCpf(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: CONTRATO DE TRABALHO, ADMISSÃO & EXPERIÊNCIA (CLT) */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Contrato de Trabalho, Admissão & Experiência (CLT)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Artigos 443 e 445 da CLT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Data de Admissão Oficial *</label>
                    <input
                      type="date"
                      required
                      value={addAdmissionDate}
                      onChange={(e) => setAddAdmissionDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Data exata de registro que constará no holerite e no contrato.
                    </span>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Tipo de Contrato</label>
                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setAddContractType('experiencia')}
                        className={`py-2 px-2 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                          addContractType === 'experiencia'
                            ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        Contrato de Experiência
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddContractType('indeterminado')}
                        className={`py-2 px-2 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                          addContractType === 'indeterminado'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        Prazo Indeterminado
                      </button>
                    </div>
                  </div>
                </div>

                {addContractType === 'experiencia' && (
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-400">
                        1º Período de Experiência (Dias Iniciais):
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[30, 45, 60].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setAddProbationDaysInitial(d)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              addProbationDaysInitial === d
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                            }`}
                          >
                            {d} dias
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={addProbationDaysInitial}
                        onChange={(e) => setAddProbationDaysInitial(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-28 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] text-zinc-400">
                        dias de experiência inicial (Término previsto: {calculateProbationDates(addAdmissionDate, addProbationDaysInitial, false, 0).p1EndStr.split('-').reverse().join('/')})
                      </span>
                    </div>

                    {/* Prorrogação */}
                    <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-zinc-200 cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={addProbationExtended}
                            onChange={(e) => setAddProbationExtended(e.target.checked)}
                            className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Prorrogar Contrato de Experiência (Permitida apenas 1 vez pela CLT)</span>
                        </label>
                        {addProbationExtended && (
                          <div className="flex items-center gap-1.5">
                            {[30, 45, 60].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setAddProbationDaysExtension(d)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                  addProbationDaysExtension === d
                                    ? 'bg-amber-500 text-black border-amber-400'
                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                                }`}
                              >
                                +{d} dias
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {addProbationExtended && (
                        <div className="flex items-center gap-2 pl-5">
                          <input
                            type="number"
                            min="1"
                            max="89"
                            value={addProbationDaysExtension}
                            onChange={(e) => setAddProbationDaysExtension(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-28 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-[11px] text-zinc-400">
                            dias na prorrogação
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Resumo Legal em Tempo Real */}
                    {(() => {
                      const info = calculateProbationDates(
                        addAdmissionDate,
                        addProbationDaysInitial,
                        addProbationExtended,
                        addProbationDaysExtension
                      );
                      return (
                        <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                          info.isOver90Days
                            ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                            : info.isExpiredAndConverted
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                            : 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
                        }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span>Duração Total da Experiência: {info.totalDays} dias</span>
                            <span>Término Final: {info.finalEndStr.split('-').reverse().join('/')}</span>
                          </div>
                          {info.isOver90Days ? (
                            <p className="text-[10px] text-rose-400">
                              ⚠️ <strong>Atenção:</strong> A soma do período inicial e prorrogação é de {info.totalDays} dias, excedendo o limite de 90 dias da CLT. Pela legislação, contratos acima de 90 dias convertem-se automaticamente em prazo indeterminado.
                            </p>
                          ) : info.isExpiredAndConverted ? (
                            <p className="text-[10px] text-emerald-400">
                              ✓ <strong>Prazo Expirado:</strong> O período de experiência já terminou. O contrato converte-se automaticamente em Contrato por Prazo Indeterminado (Artigo 451 da CLT).
                            </p>
                          ) : (
                            <p className="text-[10px] text-zinc-400">
                              ✓ Conforme CLT (máximo de 90 dias somados e 1 prorrogação). Ao término sem rescisão prévia, vira prazo indeterminado.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: TIPO DE PERFIL / CARGO */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    2. Cargo & Perfil de Acesso (Cargos da Rede Crepelocks)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">9 Funções Predefinidas</span>
                </div>

                {/* Grid de Cargos Predefinidos */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1.5 font-medium">
                    Selecione um Cargo Oficial da Rede para Pré-Configurar:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CREPELOCKS_CARGOS.map((cargo) => {
                      const isSelected = addPositionTitle.toLowerCase() === cargo.title.toLowerCase();
                      return (
                        <button
                          key={cargo.title}
                          type="button"
                          onClick={() => applyCargoPresetInAdd(cargo)}
                          className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-950/60 border-emerald-500 shadow-md text-white ring-1 ring-emerald-500'
                              : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs truncate">{cargo.title}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-zinc-400 mt-1">
                            {cargo.badge} • {cargo.schedule}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Título da Função Personalizado</label>
                  <input
                    type="text"
                    value={addPositionTitle}
                    onChange={(e) => setAddPositionTitle(e.target.value)}
                    placeholder="Ex: Gerente Geral de Operações"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-900">
                  <label className="block text-[11px] text-zinc-400 mb-1.5 font-medium">Nível de Permissão do Sistema:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div
                      onClick={() => handleRoleChangeInAdd('gerente')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        addRole === 'gerente'
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/30'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-emerald-400 text-xs">Gerencial</span>
                          <input
                            type="radio"
                            name="addRoleRadio"
                            checked={addRole === 'gerente'}
                            onChange={() => handleRoleChangeInAdd('gerente')}
                            className="text-emerald-500"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Acesso aos painéis operacionais. Permissões e regime de ponto configuráveis.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleRoleChangeInAdd('dono')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        addRole === 'dono'
                          ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/30'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-400 text-xs">👑 Dono / Diretoria</span>
                          <input
                            type="radio"
                            name="addRoleRadio"
                            checked={addRole === 'dono'}
                            onChange={() => handleRoleChangeInAdd('dono')}
                            className="text-amber-500"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Não bate ponto por lei. Controle irrestrito e automático sobre todas as lojas.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleRoleChangeInAdd('atendente')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        addRole === 'atendente'
                          ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/30'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-blue-400 text-xs">Operacional</span>
                          <input
                            type="radio"
                            name="addRoleRadio"
                            checked={addRole === 'atendente'}
                            onChange={() => handleRoleChangeInAdd('atendente')}
                            className="text-blue-500"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Colaborador operacional ou administrativo com ponto diário por escala.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: VÍNCULO COM LOJAS (REDE COMPLETA + FUTURAS vs LOJA ESPECÍFICA) */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    3. Vínculo com as Lojas da Rede
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Configuração Dinâmica</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Escolha se este perfil terá acesso a todas as lojas da rede (incluindo as que você cadastrar no futuro) ou apenas a uma loja específica:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setAddStoreLinkType('all')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      addStoreLinkType === 'all'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="addStoreLinkRadio"
                      checked={addStoreLinkType === 'all'}
                      onChange={() => setAddStoreLinkType('all')}
                      className="mt-0.5 text-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                        <Globe className="w-3.5 h-3.5" />
                        Todas as Lojas (Cadastradas + Futuras)
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                        ⭐ Vinculado a todas as unidades atuais e <strong>automaticamente a qualquer nova loja</strong> que você cadastrar depois.
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setAddStoreLinkType('single')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      addStoreLinkType === 'single'
                        ? 'bg-blue-950/40 border-blue-500 text-white shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="addStoreLinkRadio"
                      checked={addStoreLinkType === 'single'}
                      onChange={() => setAddStoreLinkType('single')}
                      className="mt-0.5 text-blue-500 cursor-pointer"
                    />
                    <div className="w-full">
                      <span className="font-bold text-blue-400 flex items-center gap-1.5 text-xs">
                        <Building2 className="w-3.5 h-3.5" />
                        Loja Específica
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                        Acesso e atuação restritos a uma única unidade operacional.
                      </span>
                      {addStoreLinkType === 'single' && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={addSelectedStoreId}
                            onChange={(e) => setAddSelectedStoreId(e.target.value)}
                            className="w-full px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                          >
                            {stores.map((s) => (
                              <option key={s.id} value={s.id}>
                                🏬 {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Loja de Pagamento do Contracheque (mesmo para quem atua em toda a rede) */}
                <div className="mt-3 pt-3 border-t border-zinc-900">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      Loja de Lotação para Folha de Pagamento & Contracheque:
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Contracheque</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mb-2">
                    Mesmo que os gerentes, diretores ou o dono sejam vinculados a todas as lojas, selecione a loja específica pela qual receberá o salário e constará no holerite (Ex: <em>trabalha pra toda rede mas recebe por Botafogo</em>).
                  </p>
                  <select
                    value={addPayrollStoreId}
                    onChange={(e) => setAddPayrollStoreId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        🏬 {s.name} ({s.code}) {s.cnpj ? `• CNPJ: ${s.cnpj}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SEÇÃO 4: REGIME DE PONTO (DECISÃO DO DONO) */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    4. Regime de Ponto (Decisão do Dono)
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Art. 62, II da CLT</span>
                </div>

                {addRole === 'dono' ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Perfil Dono:</strong> Isento de registro de ponto (não bate ponto). Horário livre de gestão executiva.</span>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-zinc-400">
                      Como Dono, decida dinamicamente se este colaborador bate ponto ou não:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setAddExemptFromPunch(true)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          addExemptFromPunch
                            ? 'bg-emerald-950/40 border-emerald-500 text-white'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addExemptRadio"
                          checked={addExemptFromPunch}
                          onChange={() => setAddExemptFromPunch(true)}
                          className="mt-0.5 text-emerald-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-emerald-400 text-xs block">
                            🛡️ Cargo de Confiança (NÃO Bate Ponto)
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                            Isento de registro de jornada diária. Não gera alertas de atraso, faltas ou horas extras.
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => setAddExemptFromPunch(false)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          !addExemptFromPunch
                            ? 'bg-amber-950/40 border-amber-500 text-white'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addExemptRadio"
                          checked={!addExemptFromPunch}
                          onChange={() => setAddExemptFromPunch(false)}
                          className="mt-0.5 text-amber-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-amber-400 text-xs block">
                            ⏱️ Bate Ponto Diário (Obrigatório)
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                            O usuário terá a aba "Bater Ponto" para registrar entrada, almoço e saída na jornada.
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* SEÇÃO 5: ACESSO AOS PAINÉIS & PERMISSÕES (NADA FIXO, TUDO DINÂMICO!) */}
              {addRole !== 'dono' && (
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      5. Acesso aos Painéis & Permissões
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">100% Customizável</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div
                      onClick={() => setAddAccompanimentMode(true)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        addAccompanimentMode
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addAccompanimentRadio"
                        checked={addAccompanimentMode}
                        onChange={() => setAddAccompanimentMode(true)}
                        className="mt-0.5 text-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-emerald-400 text-xs block">
                          👁️ Modo Acompanhamento (Igual ao Dono, Sem Modificar)
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                          Acesso completo para visualizar todos os painéis, métricas e relatórios em tempo real, <strong>sem poder alterar nenhum dado</strong>.
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => setAddAccompanimentMode(false)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        !addAccompanimentMode
                          ? 'bg-blue-950/40 border-blue-500 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addAccompanimentRadio"
                        checked={!addAccompanimentMode}
                        onChange={() => setAddAccompanimentMode(false)}
                        className="mt-0.5 text-blue-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-blue-400 text-xs block">
                          ⚙️ Permissões Personalizadas de Gestão
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                          Permite habilitar permissões específicas de criação e edição conforme as caixas abaixo.
                        </span>
                      </div>
                    </div>
                  </div>

                  {!addAccompanimentMode && (
                    <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addPermissions.canEditSchedules}
                          onChange={(e) =>
                            setAddPermissions({ ...addPermissions, canEditSchedules: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Criar e Alterar Escalas</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addPermissions.canApproveOccurrences}
                          onChange={(e) =>
                            setAddPermissions({ ...addPermissions, canApproveOccurrences: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Aprovar Ocorrências & Abonos</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addPermissions.canUploadCertificates}
                          onChange={(e) =>
                            setAddPermissions({ ...addPermissions, canUploadCertificates: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Subir e Gerenciar Atestados</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addPermissions.canExportPayroll}
                          onChange={(e) =>
                            setAddPermissions({ ...addPermissions, canExportPayroll: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Exportar Folha (PDF/CSV)</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addPermissions.canManageEmployees}
                          onChange={(e) =>
                            setAddPermissions({ ...addPermissions, canManageEmployees: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Criar / Gerenciar Usuários</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addPermissions.canEditStores}
                          onChange={(e) =>
                            setAddPermissions({ ...addPermissions, canEditStores: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Gerenciar Lojas da Rede</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* SEÇÃO 6: ESCALA E HORÁRIOS */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  6. Escala & Horário Padrão
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Tipo de Escala</label>
                    <select
                      value={addScheduleType}
                      onChange={(e) => setAddScheduleType(e.target.value as ScheduleType)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    >
                      <option value="6x1">Escala 6x1 (Padrão Crepelocks)</option>
                      <option value="12x36">Escala 12x36</option>
                      <option value="5x2">Escala 5x2 (Administrativo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Horário de Entrada</label>
                    <input
                      type="time"
                      value={addDefaultShiftStart}
                      onChange={(e) => setAddDefaultShiftStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Horário de Saída</label>
                    <input
                      type="time"
                      value={addDefaultShiftEnd}
                      onChange={(e) => setAddDefaultShiftEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 7: SEGURANÇA MFA */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white block">Autenticação em 2 Etapas (MFA)</span>
                    <span className="text-[10px] text-zinc-500">
                      Exigir código OTP no login para segurança extra
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={addMfaEnabled}
                  onChange={(e) => setAddMfaEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  Criar Colaborador & Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR ACESSO EXISTENTE (100% DINÂMICO E COM BOTÃO DE EXCLUIR) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  <span>Editar Acesso: {editingUser.name}</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Atualize qualquer configuração deste colaborador de forma totalmente dinâmica.
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              {/* SEÇÃO 1: DADOS BÁSICOS */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  1. Identificação & Credenciais
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">E-mail de Login *</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Alterar Senha</label>
                    <input
                      type="text"
                      required
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">CPF</label>
                    <input
                      type="text"
                      value={editCpf}
                      onChange={(e) => setEditCpf(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: CONTRATO DE TRABALHO, ADMISSÃO & EXPERIÊNCIA (CLT) */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Contrato de Trabalho, Admissão & Experiência (CLT)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Artigos 443 e 445 da CLT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Data de Admissão Oficial *</label>
                    <input
                      type="date"
                      required
                      value={editAdmissionDate}
                      onChange={(e) => setEditAdmissionDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Data do vínculo empregatício exibida no holerite e relatórios.
                    </span>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Tipo de Contrato</label>
                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setEditContractType('experiencia')}
                        className={`py-2 px-2 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                          editContractType === 'experiencia'
                            ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        Contrato de Experiência
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditContractType('indeterminado')}
                        className={`py-2 px-2 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                          editContractType === 'indeterminado'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        Prazo Indeterminado
                      </button>
                    </div>
                  </div>
                </div>

                {editContractType === 'experiencia' && (
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-400">
                        1º Período de Experiência (Dias Iniciais):
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[30, 45, 60].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setEditProbationDaysInitial(d)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              editProbationDaysInitial === d
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                            }`}
                          >
                            {d} dias
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={editProbationDaysInitial}
                        onChange={(e) => setEditProbationDaysInitial(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-28 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] text-zinc-400">
                        dias de experiência inicial (Término previsto: {calculateProbationDates(editAdmissionDate, editProbationDaysInitial, false, 0).p1EndStr.split('-').reverse().join('/')})
                      </span>
                    </div>

                    {/* Prorrogação */}
                    <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-zinc-200 cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={editProbationExtended}
                            onChange={(e) => setEditProbationExtended(e.target.checked)}
                            className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Prorrogar Contrato de Experiência (Permitida apenas 1 vez pela CLT)</span>
                        </label>
                        {editProbationExtended && (
                          <div className="flex items-center gap-1.5">
                            {[30, 45, 60].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setEditProbationDaysExtension(d)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                  editProbationDaysExtension === d
                                    ? 'bg-amber-500 text-black border-amber-400'
                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                                }`}
                              >
                                +{d} dias
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {editProbationExtended && (
                        <div className="flex items-center gap-2 pl-5">
                          <input
                            type="number"
                            min="1"
                            max="89"
                            value={editProbationDaysExtension}
                            onChange={(e) => setEditProbationDaysExtension(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-28 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-[11px] text-zinc-400">
                            dias na prorrogação
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Resumo Legal em Tempo Real */}
                    {(() => {
                      const info = calculateProbationDates(
                        editAdmissionDate,
                        editProbationDaysInitial,
                        editProbationExtended,
                        editProbationDaysExtension
                      );
                      return (
                        <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                          info.isOver90Days
                            ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                            : info.isExpiredAndConverted
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                            : 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
                        }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span>Duração Total da Experiência: {info.totalDays} dias</span>
                            <span>Término Final: {info.finalEndStr.split('-').reverse().join('/')}</span>
                          </div>
                          {info.isOver90Days ? (
                            <p className="text-[10px] text-rose-400">
                              ⚠️ <strong>Atenção:</strong> A soma do período inicial e prorrogação é de {info.totalDays} dias, excedendo o limite de 90 dias da CLT. Pela legislação, contratos acima de 90 dias convertem-se automaticamente em prazo indeterminado.
                            </p>
                          ) : info.isExpiredAndConverted ? (
                            <p className="text-[10px] text-emerald-400">
                              ✓ <strong>Prazo Expirado:</strong> O período de experiência já terminou. O contrato converte-se automaticamente em Contrato por Prazo Indeterminado (Artigo 451 da CLT).
                            </p>
                          ) : (
                            <p className="text-[10px] text-zinc-400">
                              ✓ Conforme CLT (máximo de 90 dias somados e 1 prorrogação). Ao término sem rescisão prévia, vira prazo indeterminado.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: CARGO / NÍVEL */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    2. Cargo & Perfil de Acesso (Cargos da Rede Crepelocks)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">9 Funções Predefinidas</span>
                </div>

                {/* Grid de Cargos Predefinidos */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1.5 font-medium">
                    Alterar para um Cargo Oficial da Rede:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CREPELOCKS_CARGOS.map((cargo) => {
                      const isSelected = editPositionTitle.toLowerCase() === cargo.title.toLowerCase();
                      return (
                        <button
                          key={cargo.title}
                          type="button"
                          onClick={() => applyCargoPresetInEdit(cargo)}
                          className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-950/60 border-emerald-500 shadow-md text-white ring-1 ring-emerald-500'
                              : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs truncate">{cargo.title}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-zinc-400 mt-1">
                            {cargo.badge} • {cargo.schedule}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Título da Função</label>
                  <input
                    type="text"
                    value={editPositionTitle}
                    onChange={(e) => setEditPositionTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-900">
                  <label className="block text-[11px] text-zinc-400 mb-1.5 font-medium">Nível de Permissão do Sistema:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div
                      onClick={() => setEditRole('gerente')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        editRole === 'gerente'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-emerald-400 text-xs">Gerencial</span>
                        <input
                          type="radio"
                          name="editRoleRadio"
                          checked={editRole === 'gerente'}
                          onChange={() => setEditRole('gerente')}
                          className="text-emerald-500"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 block">Acesso aos painéis</span>
                    </div>

                    <div
                      onClick={() => setEditRole('dono')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        editRole === 'dono'
                          ? 'bg-amber-950/40 border-amber-500 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-amber-400 text-xs">👑 Dono / Diretoria</span>
                        <input
                          type="radio"
                          name="editRoleRadio"
                          checked={editRole === 'dono'}
                          onChange={() => setEditRole('dono')}
                          className="text-amber-500"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 block">Não bate ponto</span>
                    </div>

                    <div
                      onClick={() => setEditRole('atendente')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        editRole === 'atendente'
                          ? 'bg-blue-950/40 border-blue-500 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-blue-400 text-xs">Operacional</span>
                        <input
                          type="radio"
                          name="editRoleRadio"
                          checked={editRole === 'atendente'}
                          onChange={() => setEditRole('atendente')}
                          className="text-blue-500"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 block">Ponto diário</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: VÍNCULO COM LOJAS (TODAS AS LOJAS vs ESPECÍFICA) */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  3. Vínculo com as Lojas da Rede (Atuais & Futuras)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setEditStoreLinkType('all')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      editStoreLinkType === 'all'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editStoreLinkRadio"
                      checked={editStoreLinkType === 'all'}
                      onChange={() => setEditStoreLinkType('all')}
                      className="mt-0.5 text-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-emerald-400 flex items-center gap-1 text-xs">
                        <Globe className="w-3.5 h-3.5" />
                        Todas as Lojas (Cadastradas + Futuras)
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                        ⭐ Acesso automático à rede completa e a qualquer nova loja cadastrada depois.
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setEditStoreLinkType('single')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      editStoreLinkType === 'single'
                        ? 'bg-blue-950/40 border-blue-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editStoreLinkRadio"
                      checked={editStoreLinkType === 'single'}
                      onChange={() => setEditStoreLinkType('single')}
                      className="mt-0.5 text-blue-500 cursor-pointer"
                    />
                    <div className="w-full">
                      <span className="font-bold text-blue-400 flex items-center gap-1 text-xs">
                        <Building2 className="w-3.5 h-3.5" />
                        Loja Específica
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                        Acesso exclusivo à unidade selecionada.
                      </span>
                      {editStoreLinkType === 'single' && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={editSelectedStoreId}
                            onChange={(e) => setEditSelectedStoreId(e.target.value)}
                            className="w-full px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                          >
                            {stores.map((s) => (
                              <option key={s.id} value={s.id}>
                                🏬 {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Loja de Pagamento do Contracheque no Edit Modal */}
                <div className="mt-3 pt-3 border-t border-zinc-900">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      Loja de Lotação para Folha de Pagamento & Contracheque:
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Contracheque</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mb-2">
                    Defina por qual loja o colaborador receberá na folha de pagamento e terá o holerite emitido (Ex: <em>vinculado a toda a rede, mas recebe por Botafogo</em>).
                  </p>
                  <select
                    value={editPayrollStoreId}
                    onChange={(e) => setEditPayrollStoreId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        🏬 {s.name} ({s.code}) {s.cnpj ? `• CNPJ: ${s.cnpj}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SEÇÃO 4: REGIME DE PONTO (DINÂMICO) */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  4. Regime de Ponto (Decisão do Dono)
                </span>

                {editRole === 'dono' ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Perfil Dono:</strong> Isento de registro de ponto (não bate ponto).</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div
                      onClick={() => setEditExemptFromPunch(true)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        editExemptFromPunch
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="editExemptRadio"
                        checked={editExemptFromPunch}
                        onChange={() => setEditExemptFromPunch(true)}
                        className="mt-0.5 text-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-emerald-400 text-xs block">
                          🛡️ Cargo de Confiança (NÃO Bate Ponto)
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                          Isento de bater ponto. Horário livre de gestão (Art. 62 da CLT).
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => setEditExemptFromPunch(false)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        !editExemptFromPunch
                          ? 'bg-amber-950/40 border-amber-500 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="editExemptRadio"
                        checked={!editExemptFromPunch}
                        onChange={() => setEditExemptFromPunch(false)}
                        className="mt-0.5 text-amber-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-amber-400 text-xs block">
                          ⏱️ Bate Ponto Diário (Obrigatório)
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                          O colaborador registrará entrada, almoço e saída na aba de ponto.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO 5: PAINÉIS & PERMISSÕES (DINÂMICO) */}
              {editRole !== 'dono' && (
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    5. Acesso aos Painéis & Permissões
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div
                      onClick={() => setEditAccompanimentMode(true)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        editAccompanimentMode
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="editAccompanimentRadio"
                        checked={editAccompanimentMode}
                        onChange={() => setEditAccompanimentMode(true)}
                        className="mt-0.5 text-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-emerald-400 text-xs block">
                          👁️ Modo Acompanhamento (Visualizar Sem Modificar)
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                          Acompanhamento de todos os painéis em tempo real igual ao Dono, sem permissão para editar dados.
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => setEditAccompanimentMode(false)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        !editAccompanimentMode
                          ? 'bg-blue-950/40 border-blue-500 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="editAccompanimentRadio"
                        checked={!editAccompanimentMode}
                        onChange={() => setEditAccompanimentMode(false)}
                        className="mt-0.5 text-blue-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-blue-400 text-xs block">
                          ⚙️ Permissões Personalizadas
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">
                          Habilita ações específicas de modificação.
                        </span>
                      </div>
                    </div>
                  </div>

                  {!editAccompanimentMode && (
                    <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.canEditSchedules}
                          onChange={(e) =>
                            setEditPermissions({ ...editPermissions, canEditSchedules: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Criar e Alterar Escalas</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.canApproveOccurrences}
                          onChange={(e) =>
                            setEditPermissions({ ...editPermissions, canApproveOccurrences: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Aprovar Ocorrências & Abonos</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.canUploadCertificates}
                          onChange={(e) =>
                            setEditPermissions({ ...editPermissions, canUploadCertificates: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Subir e Gerenciar Atestados</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.canExportPayroll}
                          onChange={(e) =>
                            setEditPermissions({ ...editPermissions, canExportPayroll: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Exportar Folha (PDF/CSV)</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.canManageEmployees}
                          onChange={(e) =>
                            setEditPermissions({ ...editPermissions, canManageEmployees: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Criar / Gerenciar Usuários</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.canEditStores}
                          onChange={(e) =>
                            setEditPermissions({ ...editPermissions, canEditStores: e.target.checked })
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Gerenciar Lojas da Rede</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* SEÇÃO 6: ESCALA E HORÁRIOS */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  6. Escala & Horário de Trabalho
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Escala</label>
                    <select
                      value={editScheduleType}
                      onChange={(e) => setEditScheduleType(e.target.value as ScheduleType)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
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
                      value={editDefaultShiftStart}
                      onChange={(e) => setEditDefaultShiftStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Saída</label>
                    <input
                      type="time"
                      value={editDefaultShiftEnd}
                      onChange={(e) => setEditDefaultShiftEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé com Botão de Excluir */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setUserToDelete(editingUser);
                  }}
                  disabled={editingUser.id === currentUser.id}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    editingUser.id === currentUser.id
                      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30'
                  }`}
                  title={editingUser.id === currentUser.id ? 'Você não pode excluir sua própria conta conectada' : 'Excluir usuário'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Usuário</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE USUÁRIO */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-rose-500/40 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Usuário / Acesso</h3>
                <span className="text-[11px] text-zinc-400">Esta ação é irreversível</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Nome:</span>
                <span className="font-bold text-white">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">E-mail:</span>
                <span className="font-mono text-zinc-300">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Perfil:</span>
                <span className="font-semibold text-emerald-400 uppercase">{userToDelete.role}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Tem certeza que deseja excluir o acesso de <strong>{userToDelete.name}</strong>?
              O colaborador será removido permanentemente da lista de usuários e do banco de dados na nuvem Firestore.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DESLIGAMENTO DE COLABORADOR / RESCISÃO CONTRATUAL & TRCT EM PDF */}
      {dismissingEmployee && (() => {
        const baseSalary = StorageService.getPayrollConfigs().find((c) => c.employeeId === dismissingEmployee.id)?.baseSalary || 2000;
        const storeObj = stores.find((s) => s.id === (dismissingEmployee.payrollStoreId || dismissingEmployee.storeId)) || stores[0];

        const calculation = PayrollCalculatorService.calculateSeverance({
          employee: dismissingEmployee,
          baseSalary,
          admissionDate: dismissingEmployee.admissionDate || '2026-08-01',
          dismissalDate,
          reason: dismissalReason,
          contractType: dismissingEmployee.contractType || 'experiencia',
          probationDaysInitial: dismissingEmployee.probationDaysInitial || 45,
          probationExtended: dismissingEmployee.probationExtended,
          probationDaysExtension: dismissingEmployee.probationDaysExtension || 45,
          otherDiscounts: parseFloat(dismissalOtherDiscounts.replace(',', '.')) || 0,
          storeName: storeObj.name,
          payrollStoreId: storeObj.id
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
            <div className="w-full max-w-2xl p-6 rounded-2xl bg-zinc-900 border border-amber-500/40 text-zinc-100 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/30 shrink-0 text-amber-400">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Rescisão Contratual & Desligamento CLT</span>
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                      {dismissingEmployee.name} • {dismissingEmployee.positionTitle}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDismissingEmployee(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                <p>
                  Ao confirmar, o colaborador será movido para o <strong>Banco de Desligados / Demitidos</strong>, saindo das escalas e folhas ativas, e o <strong>Termo de Rescisão Oficial (TRCT em PDF)</strong> será gerado e baixado imediatamente com todas as verbas e termos legais.
                </p>
              </div>

              {/* Dados Contratuais */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Data de Admissão:</span>
                  <strong className="text-white font-mono">{dismissingEmployee.admissionDate || '2026-08-01'}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Salário Base:</span>
                  <strong className="text-emerald-400 font-mono">R$ {baseSalary.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Tipo de Vínculo:</span>
                  <strong className="text-amber-400">
                    {dismissingEmployee.contractType === 'experiencia'
                      ? `Experiência (${dismissingEmployee.probationDaysInitial || 45}d${dismissingEmployee.probationExtended ? ` + ${dismissingEmployee.probationDaysExtension || 45}d` : ''})`
                      : 'Prazo Indeterminado'}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Loja de Pagamento:</span>
                  <strong className="text-zinc-200 truncate block">{storeObj.name}</strong>
                </div>
              </div>

              {/* Form Rescisão */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Data de Desligamento / Encerramento *</label>
                    <input
                      type="date"
                      value={dismissalDate}
                      onChange={(e) => setDismissalDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Motivo do Desligamento (Modalidade CLT) *</label>
                    <select
                      value={dismissalReason}
                      onChange={(e) => setDismissalReason(e.target.value as SeveranceReason)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                    >
                      <option value="termino_experiencia">
                        Término no Prazo da Experiência (Sem aviso prévio, sem multa 40% FGTS)
                      </option>
                      <option value="rescisao_antecipada_empregador">
                        Rescisão Antecipada pelo Empregador na Experiência (Art. 479 CLT - 50% dos dias restantes)
                      </option>
                      <option value="rescisao_antecipada_empregado">
                        Rescisão Antecipada pelo Empregado na Experiência (Pedido de saída)
                      </option>
                      <option value="sem_justa_causa">
                        Demissão Sem Justa Causa (Prazo Indeterminado - aviso prévio + multa 40% FGTS)
                      </option>
                      <option value="com_justa_causa">
                        Demissão Com Justa Causa (Art. 482 CLT - falta grave)
                      </option>
                      <option value="pedido_demissao">
                        Pedido de Demissão pelo Colaborador
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Outros Descontos Rescisórios (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={dismissalOtherDiscounts}
                      onChange={(e) => setDismissalOtherDiscounts(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Observações da Rescisão</label>
                    <input
                      type="text"
                      value={dismissalNotes}
                      onChange={(e) => setDismissalNotes(e.target.value)}
                      placeholder="Ex: Entregou uniforme e crachá sem pendências"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Demonstrativo das Verbas Rescisórias em Tempo Real */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                    Demonstrativo de Verbas Rescisórias (Cálculo Oficial CLT)
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {calculation.daysWorkedTotal} dias trabalhados
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Saldo de Salário ({calculation.saldoSalarioDias} dias):</span>
                    <span className="font-semibold text-white">R$ {calculation.saldoSalarioValor.toFixed(2)}</span>
                  </div>

                  {calculation.decimoTerceiroValor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">13º Salário Proporcional ({calculation.decimoTerceiroProporcionalMeses}/12 avos):</span>
                      <span className="font-semibold text-emerald-400">+ R$ {calculation.decimoTerceiroValor.toFixed(2)}</span>
                    </div>
                  )}

                  {calculation.feriasProporcionaisValor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Férias Proporcionais ({calculation.feriasProporcionaisMeses}/12 avos) + 1/3:</span>
                      <span className="font-semibold text-emerald-400">+ R$ {(calculation.feriasProporcionaisValor + calculation.tercoConstitucionalFerias).toFixed(2)}</span>
                    </div>
                  )}

                  {calculation.artigo479IndenizacaoValor && calculation.artigo479IndenizacaoValor > 0 ? (
                    <div className="flex justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      <span>⚠️ Indenização Art. 479 CLT (50% de {calculation.artigo479IndenizacaoDias} dias restantes):</span>
                      <span className="font-bold">+ R$ {calculation.artigo479IndenizacaoValor.toFixed(2)}</span>
                    </div>
                  ) : null}

                  {calculation.avisoPrevioIndenizadoValor && calculation.avisoPrevioIndenizadoValor > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Aviso Prévio Indenizado:</span>
                      <span className="font-semibold text-emerald-400">+ R$ {calculation.avisoPrevioIndenizadoValor.toFixed(2)}</span>
                    </div>
                  ) : null}

                  {calculation.multaFgts40PctValor && calculation.multaFgts40PctValor > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Multa Rescisória de 40% s/ FGTS:</span>
                      <span className="font-semibold text-emerald-400">+ R$ {calculation.multaFgts40PctValor.toFixed(2)}</span>
                    </div>
                  ) : null}

                  <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-white">
                    <span>Total Bruto da Rescisão:</span>
                    <span>R$ {calculation.totalGrossSeverance.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-rose-400">
                    <span>Total de Descontos (INSS + IRPF [isento até R$5.000] + Outros):</span>
                    <span>- R$ {calculation.totalDeductionsSeverance.toFixed(2)}</span>
                  </div>
                </div>

                {/* Salário Líquido Rescisório Destacado */}
                <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between shadow-inner">
                  <div>
                    <span className="font-bold text-emerald-300 text-xs block">VALOR LÍQUIDO A PAGAR AO COLABORADOR:</span>
                    <span className="text-[10px] text-zinc-400">Depositado em conta ou pago na homologação com recibo</span>
                  </div>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    R$ {calculation.netSeverancePay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDismissingEmployee(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDismissal}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Confirmar Desligamento & Baixar TRCT (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: VISUALIZAÇÃO DETALHADA DE VERBAS RESCISÓRIAS */}
      {viewingSeverance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Demonstrativo Rescisório: {viewingSeverance.employeeName}</span>
                </h3>
                <span className="text-[11px] text-zinc-400">
                  {viewingSeverance.positionTitle} • {viewingSeverance.storeName}
                </span>
              </div>
              <button
                onClick={() => setViewingSeverance(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resumo Contratual */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px]">Data de Admissão:</span>
                <strong className="text-white">{viewingSeverance.admissionDate}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Data de Rescisão:</span>
                <strong className="text-rose-400">{viewingSeverance.dismissalDate}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Dias Trabalhados:</span>
                <strong className="text-white">{viewingSeverance.daysWorkedTotal} dias</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Modalidade:</span>
                <strong className="text-amber-300">{viewingSeverance.reasonLabel}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Tipo de Contrato:</span>
                <strong className="text-zinc-300">
                  {viewingSeverance.contractType === 'experiencia'
                    ? `Experiência (${viewingSeverance.probationDaysInitial || 45}d${viewingSeverance.probationExtended ? ` + ${viewingSeverance.probationDaysExtension || 45}d` : ''})`
                    : 'Indeterminado'}
                </strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Enquadramento Legal:</span>
                <strong className="text-zinc-300">{viewingSeverance.cltArticle || 'CLT'}</strong>
              </div>
            </div>

            {/* Rubricas */}
            <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400">Saldo de Salário ({viewingSeverance.saldoSalarioDias} dias):</span>
                <span className="text-white">R$ {viewingSeverance.saldoSalarioValor.toFixed(2)}</span>
              </div>
              {viewingSeverance.decimoTerceiroValor > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">13º Salário Proporcional ({viewingSeverance.decimoTerceiroProporcionalMeses}/12 avos):</span>
                  <span className="text-emerald-400">+ R$ {viewingSeverance.decimoTerceiroValor.toFixed(2)}</span>
                </div>
              )}
              {viewingSeverance.feriasProporcionaisValor > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Férias Proporcionais ({viewingSeverance.feriasProporcionaisMeses}/12 avos):</span>
                  <span className="text-emerald-400">+ R$ {viewingSeverance.feriasProporcionaisValor.toFixed(2)}</span>
                </div>
              )}
              {viewingSeverance.tercoConstitucionalFerias > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">1/3 Constitucional de Férias:</span>
                  <span className="text-emerald-400">+ R$ {viewingSeverance.tercoConstitucionalFerias.toFixed(2)}</span>
                </div>
              )}
              {viewingSeverance.artigo479IndenizacaoValor && viewingSeverance.artigo479IndenizacaoValor > 0 ? (
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Indenização Art. 479 CLT ({viewingSeverance.artigo479IndenizacaoDias} dias restantes):</span>
                  <span>+ R$ {viewingSeverance.artigo479IndenizacaoValor.toFixed(2)}</span>
                </div>
              ) : null}
              {viewingSeverance.avisoPrevioIndenizadoValor && viewingSeverance.avisoPrevioIndenizadoValor > 0 ? (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Aviso Prévio Indenizado:</span>
                  <span className="text-emerald-400">+ R$ {viewingSeverance.avisoPrevioIndenizadoValor.toFixed(2)}</span>
                </div>
              ) : null}
              {viewingSeverance.multaFgts40PctValor && viewingSeverance.multaFgts40PctValor > 0 ? (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Multa Rescisória de 40% s/ FGTS:</span>
                  <span className="text-emerald-400">+ R$ {viewingSeverance.multaFgts40PctValor.toFixed(2)}</span>
                </div>
              ) : null}

              <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-white">
                <span>Total Bruto:</span>
                <span>R$ {viewingSeverance.totalGrossSeverance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Descontos (INSS + IRPF [isento até R$5.000]):</span>
                <span>- R$ {viewingSeverance.totalDeductionsSeverance.toFixed(2)}</span>
              </div>
            </div>

            {/* Total Líquido */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <span className="font-bold text-emerald-300 text-xs">VALOR LÍQUIDO RESCISÓRIO QUITADO:</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                R$ {viewingSeverance.netSeverancePay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {viewingSeverance.notes && (
              <p className="text-[11px] text-zinc-400 italic">
                Observações: {viewingSeverance.notes}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setViewingSeverance(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const storeObj = stores.find((s) => s.id === viewingSeverance.storeId) || stores[0];
                  SeveranceExportService.generateSeverancePdf(viewingSeverance, storeObj);
                  showToast(`Baixando TRCT em PDF de ${viewingSeverance.employeeName}...`);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Download className="w-4 h-4" />
                <span>Baixar TRCT (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCLUSÃO DEFINITIVA DO HISTÓRICO DE DESLIGADOS */}
      {dismissedToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-rose-500/40 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Registro de Rescisão</h3>
                <span className="text-[11px] text-zinc-400">Esta ação é irreversível</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Deseja realmente remover o histórico de rescisão de <strong>{dismissedToDelete.employeeName}</strong>?
              O registro das verbas calculadas e termo de rescisão não estará mais visível na listagem.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDismissedToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDismissed(dismissedToDelete.id)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
