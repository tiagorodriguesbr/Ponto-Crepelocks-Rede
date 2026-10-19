import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Calculator,
  Save,
  RotateCcw,
  Download,
  FileSpreadsheet,
  Building2,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  HelpCircle,
  Eye,
  Edit3,
  Percent,
  PlusCircle,
  TrendingUp,
  FileText,
  Printer,
  Shield,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Globe,
  Calendar,
  Clock,
  Umbrella,
  Coins,
  Briefcase,
  Settings,
  Check,
  X
} from 'lucide-react';
import {
  UserAccount,
  Store,
  PunchRecord,
  PayrollEmployeeConfig,
  PayrollCalculationResult,
  Role
} from '../types';
import { StorageService } from '../services/storage';
import {
  PayrollCalculatorService,
  INSS_BRACKETS_2026,
  INSS_TETO_SALARIO,
  INSS_TETO_CONTRIBUICAO
} from '../services/payrollCalculator';
import { canDownloadDocuments } from '../services/rolePermissions';
import { jsPDF } from 'jspdf';

interface PayrollManagerProps {
  users: UserAccount[];
  stores: Store[];
  punches: PunchRecord[];
  currentUser: UserAccount;
  onDataUpdated: () => void;
}

export const PayrollManager: React.FC<PayrollManagerProps> = ({
  users,
  stores,
  punches,
  currentUser,
  onDataUpdated
}) => {
  const canDownload = canDownloadDocuments(currentUser);

  // State
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const availableMonths = useMemo(() => {
    const list: Array<{ val: string; label: string }> = [];
    const base = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
      list.push({ val, label: name.charAt(0).toUpperCase() + name.slice(1) });
    }
    return list;
  }, []);
  
  // Payroll configurations map
  const [configs, setConfigs] = useState<Record<string, PayrollEmployeeConfig>>(() => {
    const list = StorageService.getPayrollConfigs();
    const map: Record<string, PayrollEmployeeConfig> = {};
    list.forEach((c) => {
      map[c.employeeId] = c;
    });
    return map;
  });

  // Selected employee for detailed modal editor & holerite preview
  const [editingEmployee, setEditingEmployee] = useState<UserAccount | null>(null);
  const [viewingHolerite, setViewingHolerite] = useState<PayrollCalculationResult | null>(null);

  // Active sub-tab: Folha Mensal or Férias & 13º
  const [activeSubTab, setActiveSubTab] = useState<'folha' | 'ferias_13'>('folha');

  // Store Header Configuration Modal
  const [showStoreHeaderModal, setShowStoreHeaderModal] = useState<boolean>(false);
  const [selectedHeaderStoreId, setSelectedHeaderStoreId] = useState<string>(stores[0]?.id || '');
  const [headerRazaoSocial, setHeaderRazaoSocial] = useState<string>('');
  const [headerName, setHeaderName] = useState<string>('');
  const [headerCnpj, setHeaderCnpj] = useState<string>('');
  const [headerStateRegistration, setHeaderStateRegistration] = useState<string>('');
  const [headerAddress, setHeaderAddress] = useState<string>('');
  const [headerNeighborhood, setHeaderNeighborhood] = useState<string>('');
  const [headerCep, setHeaderCep] = useState<string>('');
  const [headerCity, setHeaderCity] = useState<string>('');
  const [headerPhone, setHeaderPhone] = useState<string>('');
  const [headerEmail, setHeaderEmail] = useState<string>('');
  const [headerTitle, setHeaderTitle] = useState<string>('RECIBO DE PAGAMENTO DE SALÁRIO');
  const [headerSubtitle, setHeaderSubtitle] = useState<string>('Demonstrativo Mensal de Pagamento de Salário - CLT');
  const [headerFooterMessage, setHeaderFooterMessage] = useState<string>('Crédito realizado em conta bancária/PIX.');

  // Form state for modal editor
  const [formPayrollStoreId, setFormPayrollStoreId] = useState<string>('');
  const [formBaseSalary, setFormBaseSalary] = useState<string>('0');
  const [formBonusGratification, setFormBonusGratification] = useState<string>('0');
  const [formInsalubridadePct, setFormInsalubridadePct] = useState<string>('0');
  const [formReceiveSalarioFamilia, setFormReceiveSalarioFamilia] = useState<boolean>(false);
  const [formDependents, setFormDependents] = useState<string>('0');
  const [formIrpfDependents, setFormIrpfDependents] = useState<string>('0');
  const [formVtDiscountPct, setFormVtDiscountPct] = useState<string>('6');
  const [formVrVaDiscountPct, setFormVrVaDiscountPct] = useState<string>('5');
  const [formInssManualPct, setFormInssManualPct] = useState<string>(''); // Vazio = cálculo automático CLT
  const [formIrpfManualPct, setFormIrpfManualPct] = useState<string>(''); // Vazio = cálculo automático IRPF
  const [formManualInssR$, setFormManualInssR$] = useState<string>('');
  const [formManualIrpfR$, setFormManualIrpfR$] = useState<string>('');
  const [formManualVtR$, setFormManualVtR$] = useState<string>('');
  const [formManualVrVaR$, setFormManualVrVaR$] = useState<string>('');
  const [formOtherDiscountsAmount, setFormOtherDiscountsAmount] = useState<string>('0');
  const [formOtherDiscountsDescription, setFormOtherDiscountsDescription] = useState<string>('');
  const [formIncludeExtras, setFormIncludeExtras] = useState<boolean>(true);
  const [formIncludeDelays, setFormIncludeDelays] = useState<boolean>(true);
  const [formDelaysPolicy, setFormDelaysPolicy] = useState<'proporcional' | 'com_dsr' | 'isento'>('proporcional');
  const [formManualDelaysMin, setFormManualDelaysMin] = useState<string>('');
  const [formManualDelaysR$, setFormManualDelaysR$] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Férias & 13º Salário Simulator state
  const [feriasEmployeeId, setFeriasEmployeeId] = useState<string>(users[0]?.id || '');
  const [feriasDays, setFeriasDays] = useState<number>(30);
  const [feriasSellDays, setFeriasSellDays] = useState<number>(0);
  const [feriasAdvance13th, setFeriasAdvance13th] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showInssTable, setShowInssTable] = useState<boolean>(true);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to determine the effective payroll store for an employee
  const getEffectivePayrollStoreId = (user: UserAccount, cfg?: PayrollEmployeeConfig): string => {
    return cfg?.payrollStoreId || user.payrollStoreId || (user.storeId !== 'all' ? user.storeId : stores.find((s) => s.id === 'store-botafogo')?.id || stores[0]?.id || 'store-1');
  };

  // Compute payroll result for ALL employees across the entire company
  const allPayrollResults = useMemo<PayrollCalculationResult[]>(() => {
    return users.map((user) => {
      const config = configs[user.id];
      const effectiveStoreId = getEffectivePayrollStoreId(user, config);
      const store = stores.find((s) => s.id === effectiveStoreId) || stores[0];
      return PayrollCalculatorService.calculatePayroll(user, config, store, punches, selectedMonth);
    });
  }, [users, configs, stores, punches, selectedMonth]);

  // Grand totals of the whole company (Consolidado Rede)
  const networkTotals = useMemo(() => {
    return allPayrollResults.reduce(
      (acc, r) => {
        acc.totalBase += r.baseSalary;
        acc.totalBonus += r.bonusGratification;
        acc.totalExtras += r.extraHoursPay;
        acc.totalGross += r.totalGross;
        acc.totalInss += r.inssDiscount;
        acc.totalIrpf += r.irpfDiscount;
        acc.totalVt += r.vtDiscount;
        acc.totalVrVa += r.vrVaDiscount;
        acc.totalOther += r.otherDiscounts;
        acc.totalDiscounts += r.totalDiscounts;
        acc.totalNet += r.netSalary;
        acc.totalFgts += r.fgtsEmployer;
        return acc;
      },
      {
        totalBase: 0,
        totalBonus: 0,
        totalExtras: 0,
        totalGross: 0,
        totalInss: 0,
        totalIrpf: 0,
        totalVt: 0,
        totalVrVa: 0,
        totalOther: 0,
        totalDiscounts: 0,
        totalNet: 0,
        totalFgts: 0
      }
    );
  }, [allPayrollResults]);

  // Totais separados por loja (Breakdown individual por loja)
  const storePayrollSummaries = useMemo(() => {
    return stores.map((store) => {
      const storeResults = allPayrollResults.filter((r) => r.payrollStoreId === store.id);
      const totals = storeResults.reduce(
        (acc, r) => {
          acc.totalBase += r.baseSalary;
          acc.totalBonus += r.bonusGratification;
          acc.totalExtras += r.extraHoursPay;
          acc.totalGross += r.totalGross;
          acc.totalInss += r.inssDiscount;
          acc.totalIrpf += r.irpfDiscount;
          acc.totalVt += r.vtDiscount;
          acc.totalVrVa += r.vrVaDiscount;
          acc.totalOther += r.otherDiscounts;
          acc.totalDiscounts += r.totalDiscounts;
          acc.totalNet += r.netSalary;
          acc.totalFgts += r.fgtsEmployer;
          return acc;
        },
        {
          totalBase: 0,
          totalBonus: 0,
          totalExtras: 0,
          totalGross: 0,
          totalInss: 0,
          totalIrpf: 0,
          totalVt: 0,
          totalVrVa: 0,
          totalOther: 0,
          totalDiscounts: 0,
          totalNet: 0,
          totalFgts: 0
        }
      );
      return {
        store,
        count: storeResults.length,
        results: storeResults,
        ...totals
      };
    });
  }, [stores, allPayrollResults]);

  // Filtered payroll results for display in table based on selectedStore, role, search
  const filteredPayrollResults = useMemo(() => {
    return allPayrollResults.filter((r) => {
      const u = users.find((user) => user.id === r.employeeId);
      if (!u) return false;

      // Filter by store: match strictly the employee's payrollStoreId
      if (selectedStore !== 'all' && r.payrollStoreId !== selectedStore) {
        return false;
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(term);
        const matchesEmail = u.email.toLowerCase().includes(term);
        const matchesCargo = u.positionTitle?.toLowerCase().includes(term);
        const matchesCpf = u.cpf?.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesCargo && !matchesCpf) return false;
      }
      return true;
    });
  }, [allPayrollResults, users, selectedStore, roleFilter, searchTerm]);

  // Current active totals to display on the 4 primary KPI cards
  const activeTotals = useMemo(() => {
    if (selectedStore === 'all') {
      return {
        ...networkTotals,
        employeeCount: allPayrollResults.length,
        title: 'Toda a Rede (Consolidado)',
        subtitle: 'Soma de todas as lojas e colaboradores cadastrados na rede'
      };
    }
    const currentStoreSummary = storePayrollSummaries.find((s) => s.store.id === selectedStore);
    if (currentStoreSummary) {
      return {
        ...currentStoreSummary,
        employeeCount: currentStoreSummary.count,
        title: `${currentStoreSummary.store.name} (${currentStoreSummary.store.code})`,
        subtitle: `CNPJ: ${currentStoreSummary.store.cnpj || 'Não cadastrado'} • Folha exclusiva desta unidade`
      };
    }
    return {
      ...networkTotals,
      employeeCount: allPayrollResults.length,
      title: 'Toda a Rede',
      subtitle: ''
    };
  }, [selectedStore, networkTotals, allPayrollResults.length, storePayrollSummaries]);

  // Store Header Configuration Helpers
  const handleOpenStoreHeaderModal = (storeId?: string) => {
    const targetId = storeId || (selectedStore !== 'all' ? selectedStore : stores[0]?.id) || stores[0]?.id;
    const st = stores.find((s) => s.id === targetId) || stores[0];
    if (!st) return;

    setSelectedHeaderStoreId(st.id);
    setHeaderName(st.name || '');
    setHeaderRazaoSocial(st.razaoSocial || st.name || '');
    setHeaderCnpj(st.cnpj || '');
    setHeaderStateRegistration(st.stateRegistration || '');
    setHeaderAddress(st.address || '');
    setHeaderNeighborhood(st.neighborhood || '');
    setHeaderCep(st.cep || '');
    setHeaderCity(st.city || '');
    setHeaderPhone(st.phone || '');
    setHeaderEmail(st.email || '');
    setHeaderTitle(st.holeriteHeaderTitle || 'RECIBO DE PAGAMENTO DE SALÁRIO');
    setHeaderSubtitle(st.holeriteSubtitle || 'Demonstrativo Mensal de Pagamento de Salário - CLT');
    setHeaderFooterMessage(st.holeriteFooterMessage || 'Crédito realizado em conta bancária/PIX.');
    setShowStoreHeaderModal(true);
  };

  const handleSelectHeaderStore = (storeId: string) => {
    const st = stores.find((s) => s.id === storeId);
    if (!st) return;
    setSelectedHeaderStoreId(st.id);
    setHeaderName(st.name || '');
    setHeaderRazaoSocial(st.razaoSocial || st.name || '');
    setHeaderCnpj(st.cnpj || '');
    setHeaderStateRegistration(st.stateRegistration || '');
    setHeaderAddress(st.address || '');
    setHeaderNeighborhood(st.neighborhood || '');
    setHeaderCep(st.cep || '');
    setHeaderCity(st.city || '');
    setHeaderPhone(st.phone || '');
    setHeaderEmail(st.email || '');
    setHeaderTitle(st.holeriteHeaderTitle || 'RECIBO DE PAGAMENTO DE SALÁRIO');
    setHeaderSubtitle(st.holeriteSubtitle || 'Demonstrativo Mensal de Pagamento de Salário - CLT');
    setHeaderFooterMessage(st.holeriteFooterMessage || 'Crédito realizado em conta bancária/PIX.');
  };

  const handleSaveStoreHeader = (e: React.FormEvent) => {
    e.preventDefault();
    const st = stores.find((s) => s.id === selectedHeaderStoreId);
    if (!st) return;

    const updated: Store = {
      ...st,
      name: headerName.trim() || st.name,
      razaoSocial: headerRazaoSocial.trim() || headerName.trim(),
      cnpj: headerCnpj.trim() || undefined,
      stateRegistration: headerStateRegistration.trim() || undefined,
      address: headerAddress.trim() || st.address,
      neighborhood: headerNeighborhood.trim() || undefined,
      cep: headerCep.trim() || undefined,
      city: headerCity.trim() || st.city,
      phone: headerPhone.trim() || undefined,
      email: headerEmail.trim() || undefined,
      holeriteHeaderTitle: headerTitle.trim() || 'RECIBO DE PAGAMENTO DE SALÁRIO',
      holeriteSubtitle: headerSubtitle.trim() || 'Demonstrativo Mensal de Pagamento de Salário - CLT',
      holeriteFooterMessage: headerFooterMessage.trim() || 'Crédito em conta bancária/PIX.'
    };

    StorageService.updateStore(updated);
    setShowStoreHeaderModal(false);
    onDataUpdated();
    showToast(`Cabeçalho e dados cadastrais da loja "${updated.name}" atualizados com sucesso!`);
  };

  // Open modal editor for employee
  const handleOpenEdit = (user: UserAccount) => {
    const cfg = configs[user.id];
    setEditingEmployee(user);

    const effectiveStoreId = getEffectivePayrollStoreId(user, cfg);
    setFormPayrollStoreId(effectiveStoreId);
    setFormBaseSalary(cfg?.baseSalary !== undefined ? String(cfg.baseSalary) : (user.role === 'dono' ? '10000' : '2000'));
    setFormBonusGratification(cfg?.bonusGratification !== undefined ? String(cfg.bonusGratification) : '0');
    setFormInsalubridadePct(cfg?.insalubridadePct !== undefined ? String(cfg.insalubridadePct) : '0');
    setFormReceiveSalarioFamilia(user.role !== 'dono' && Boolean(cfg?.receiveSalarioFamilia ?? user.receiveSalarioFamilia ?? false));
    setFormDependents(cfg?.familyAllowanceDependents !== undefined ? String(cfg.familyAllowanceDependents) : (user.dependentsList?.filter(d => d.eligibleFamilyAllowance).length ? String(user.dependentsList.filter(d => d.eligibleFamilyAllowance).length) : '0'));
    setFormIrpfDependents(cfg?.irpfDependentsCount !== undefined ? String(cfg.irpfDependentsCount) : (user.dependentsList?.filter(d => d.eligibleIrpfDeduction).length ? String(user.dependentsList.filter(d => d.eligibleIrpfDeduction).length) : '0'));
    setFormVtDiscountPct(cfg?.vtDiscountPct !== undefined ? String(cfg.vtDiscountPct) : (user.role === 'dono' ? '0' : '6'));
    setFormVrVaDiscountPct(cfg?.vrVaDiscountPct !== undefined ? String(cfg.vrVaDiscountPct) : (user.role === 'dono' ? '0' : '5'));
    setFormInssManualPct(cfg?.inssDiscountPct !== null && cfg?.inssDiscountPct !== undefined ? String(cfg.inssDiscountPct) : '');
    setFormIrpfManualPct(cfg?.irpfDiscountPct !== null && cfg?.irpfDiscountPct !== undefined ? String(cfg.irpfDiscountPct) : '');
    setFormManualInssR$(cfg?.manualInssOverride !== null && cfg?.manualInssOverride !== undefined ? String(cfg.manualInssOverride) : '');
    setFormManualIrpfR$(cfg?.manualIrpfOverride !== null && cfg?.manualIrpfOverride !== undefined ? String(cfg.manualIrpfOverride) : '');
    setFormManualVtR$(cfg?.manualVtOverride !== null && cfg?.manualVtOverride !== undefined ? String(cfg.manualVtOverride) : '');
    setFormManualVrVaR$(cfg?.manualVrVaOverride !== null && cfg?.manualVrVaOverride !== undefined ? String(cfg.manualVrVaOverride) : '');
    setFormOtherDiscountsAmount(cfg?.otherDiscountsAmount !== undefined ? String(cfg.otherDiscountsAmount) : '0');
    setFormOtherDiscountsDescription(cfg?.otherDiscountsDescription || '');
    setFormIncludeExtras(cfg?.includePunchesExtras !== false);
    setFormIncludeDelays(cfg?.includeDelaysDiscount !== false);
    setFormDelaysPolicy(cfg?.delaysDeductionPolicy || 'proporcional');
    setFormManualDelaysMin(cfg?.manualDelaysMinutesOverride != null ? String(cfg.manualDelaysMinutesOverride) : '');
    setFormManualDelaysR$(cfg?.manualDelaysDiscountOverride != null ? String(cfg.manualDelaysDiscountOverride) : '');
    setFormNotes(cfg?.notes || '');
  };

  // Quick inline update for gross salary or bonus directly from table
  const handleInlineChange = (
    employeeId: string,
    field: keyof PayrollEmployeeConfig,
    val: number | string | boolean
  ) => {
    const existing = configs[employeeId] || {
      employeeId,
      baseSalary: 0,
      bonusGratification: 0,
      vtDiscountPct: 6,
      vrVaDiscountPct: 5,
      otherDiscountsAmount: 0,
      updatedAt: new Date().toISOString()
    };

    const updated: PayrollEmployeeConfig = {
      ...existing,
      [field]: val,
      updatedAt: new Date().toISOString()
    };

    setConfigs((prev) => ({ ...prev, [employeeId]: updated }));
    StorageService.updatePayrollConfig(updated);
    onDataUpdated();
  };

  // Save full modal editor
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const parseNum = (v: string): number => {
      const clean = v.replace(',', '.').trim();
      const n = parseFloat(clean);
      return isNaN(n) ? 0 : n;
    };

    const parseNullableNum = (v: string): number | null => {
      const clean = v.replace(',', '.').trim();
      if (clean === '') return null;
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    };

    const isNonOwner = editingEmployee.role !== 'dono';
    const isFamAllowanceEnabled = isNonOwner && formReceiveSalarioFamilia;

    const updatedConfig: PayrollEmployeeConfig = {
      employeeId: editingEmployee.id,
      payrollStoreId: formPayrollStoreId,
      monthYear: selectedMonth,
      baseSalary: parseNum(formBaseSalary),
      bonusGratification: parseNum(formBonusGratification),
      insalubridadePct: parseNum(formInsalubridadePct),
      receiveSalarioFamilia: isFamAllowanceEnabled,
      familyAllowanceDependents: isFamAllowanceEnabled ? Math.max(0, Math.round(parseNum(formDependents))) : 0,
      irpfDependentsCount: Math.max(0, Math.round(parseNum(formIrpfDependents))),
      vtDiscountPct: parseNum(formVtDiscountPct),
      vrVaDiscountPct: parseNum(formVrVaDiscountPct),
      inssDiscountPct: parseNullableNum(formInssManualPct),
      irpfDiscountPct: parseNullableNum(formIrpfManualPct),
      manualInssOverride: parseNullableNum(formManualInssR$),
      manualIrpfOverride: parseNullableNum(formManualIrpfR$),
      manualVtOverride: parseNullableNum(formManualVtR$),
      manualVrVaOverride: parseNullableNum(formManualVrVaR$),
      otherDiscountsAmount: parseNum(formOtherDiscountsAmount),
      otherDiscountsDescription: formOtherDiscountsDescription.trim(),
      includePunchesExtras: formIncludeExtras,
      includeDelaysDiscount: formIncludeDelays,
      delaysDeductionPolicy: formDelaysPolicy,
      manualDelaysMinutesOverride: parseNullableNum(formManualDelaysMin),
      manualDelaysDiscountOverride: parseNullableNum(formManualDelaysR$),
      notes: formNotes.trim(),
      updatedAt: new Date().toISOString()
    };

    setConfigs((prev) => ({ ...prev, [editingEmployee.id]: updatedConfig }));
    StorageService.updatePayrollConfig(updatedConfig);

    // Sync payrollStoreId and receiveSalarioFamilia on user account as well
    const updatedUser: UserAccount = {
      ...editingEmployee,
      payrollStoreId: formPayrollStoreId,
      receiveSalarioFamilia: isFamAllowanceEnabled
    };
    StorageService.updateUser(updatedUser);

    onDataUpdated();
    setEditingEmployee(null);
    showToast(`Configuração de folha de ${editingEmployee.name} salva com sucesso!`);
  };

  const openHeaderModalForStore = (storeId: string) => {
    handleSelectHeaderStore(storeId);
    setShowStoreHeaderModal(true);
  };

  // Export full payroll report to CSV
  const handleExportPayrollCsv = () => {
    const headers = [
      'ID_COLABORADOR',
      'NOME',
      'CARGO',
      'PERFIL',
      'LOJA',
      'COMPETENCIA',
      'SALARIO_BRUTO_BASE_RS',
      'GRATIFICACAO_RS',
      'HORAS_EXTRAS_RS',
      'TOTAL_BRUTO_RS',
      'INSS_RS',
      'INSS_ALIQUOTA_EFETIVA_%',
      'IRPF_RS',
      'IRPF_ALIQUOTA_EFETIVA_%',
      'VALE_TRANSPORTE_RS',
      'VALE_REFEICAO_RS',
      'OUTROS_DESCONTOS_RS',
      'TOTAL_DESCONTOS_RS',
      'SALARIO_LIQUIDO_RS',
      'FGTS_INFORMATIVO_RS'
    ];

    const rows: string[] = [headers.join(';')];

    const targetList = filteredPayrollResults.length > 0 ? filteredPayrollResults : allPayrollResults;

    targetList.forEach((r) => {
      const row = [
        r.employeeId,
        `"${r.employeeName}"`,
        `"${r.positionTitle}"`,
        r.role.toUpperCase(),
        `"${r.storeName}"`,
        r.monthYear,
        r.baseSalary.toFixed(2),
        r.bonusGratification.toFixed(2),
        r.extraHoursPay.toFixed(2),
        r.totalGross.toFixed(2),
        r.inssDiscount.toFixed(2),
        `${r.inssEffectivePct}%`,
        r.irpfDiscount.toFixed(2),
        `${r.irpfEffectivePct}%`,
        r.vtDiscount.toFixed(2),
        r.vrVaDiscount.toFixed(2),
        r.otherDiscounts.toFixed(2),
        r.totalDiscounts.toFixed(2),
        r.netSalary.toFixed(2),
        r.fgtsEmployer.toFixed(2)
      ];
      rows.push(row.join(';'));
    });

    const bom = '\uFEFF';
    const csvContent = bom + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `folha_pagamento_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);

    showToast(`Planilha CSV da folha gerada com ${targetList.length} registros!`);
  };

  // Generate Official Holerite / Contracheque PDF
  const handleGenerateHoleritePdf = (res: PayrollCalculationResult) => {
    const emp = users.find((u) => u.id === res.employeeId);
    const store = stores.find((s) => s.id === res.payrollStoreId) || stores.find((s) => s.id === emp?.storeId) || stores[0];

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const headerTitle = res.holeriteHeaderTitle || store?.holeriteHeaderTitle || (res.role === 'dono' ? 'DEMONSTRATIVO DE PRÓ-LABORE' : 'RECIBO DE PAGAMENTO DE SALÁRIO');
    const headerSubtitle = res.holeriteSubtitle || store?.holeriteSubtitle || 'Demonstrativo Mensal de Pagamento de Salário - CLT';
    const storeRazaoSocial = res.storeRazaoSocial || store?.razaoSocial || store?.name || 'Unidade Operacional';
    const storeCnpj = res.storeCnpj || store?.cnpj || 'Não informado';
    const storeIE = res.storeStateRegistration || store?.stateRegistration || 'Isento';
    const storeAddress = res.storeAddress || store?.address || 'Endereço da Unidade';
    const storeNeighborhood = res.storeNeighborhood || store?.neighborhood || '';
    const storeCity = res.storeCity || store?.city || '';
    const storeCep = res.storeCep || store?.cep || '';
    const storePhone = res.storePhone || store?.phone || '';

    // Header Card
    doc.setFillColor(15, 23, 42); // Slate-900 elegante
    doc.rect(14, 12, 182, 23, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(headerTitle.toUpperCase(), 18, 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(`${headerSubtitle} • COMPETÊNCIA: ${res.monthYear} • CÓDIGO DA UNIDADE: ${res.storeCode || store?.code || 'LJ'}`, 18, 26);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`EMPREGADOR: ${storeRazaoSocial.toUpperCase()}`, 18, 31.5);

    // Employee & Company info box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 37, 182, 30, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 37, 182, 30, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Razão Social: ${storeRazaoSocial}`, 18, 43);
    doc.text(`CNPJ: ${storeCnpj} • I.E.: ${storeIE}`, 115, 43);

    doc.setFont('helvetica', 'normal');
    doc.text(`Endereço: ${storeAddress}${storeNeighborhood ? ` - ${storeNeighborhood}` : ''}, ${storeCity}${storeCep ? ` • CEP: ${storeCep}` : ''}`, 18, 49);
    doc.text(`Contato: ${storePhone || 'DP da Unidade'}`, 115, 49);

    doc.setFont('helvetica', 'bold');
    doc.text(`Colaborador(a): ${res.employeeName.toUpperCase()}`, 18, 56);
    doc.text(`CPF: ${emp?.cpf || '000.000.000-00'}`, 115, 56);

    doc.setFont('helvetica', 'normal');
    doc.text(`Cargo / Função: ${res.positionTitle} (${res.role === 'dono' ? 'Diretoria / Pró-Labore' : 'CLT'})`, 18, 62);
    doc.text(`Lotação / Pagamento: ${res.storeName} (${res.storeCode || store?.code || 'LJ'})`, 115, 62);

    const contractDesc = emp?.contractType === 'experiencia'
      ? `Contrato de Experiência (${emp.probationDaysInitial || 45}d${emp.probationExtended ? ` + ${emp.probationDaysExtension || 45}d` : ''})`
      : res.role === 'dono' ? 'Contrato Social / Diretoria' : 'Contrato por Prazo Indeterminado';
    doc.text(`Admissão: ${emp?.admissionDate || 'Não informada'}`, 18, 65.5);
    doc.text(`Vínculo: ${contractDesc}`, 115, 65.5);

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(14, 69, 182, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CÓD', 18, 74);
    doc.text('DESCRIÇÃO DA VERBA / RUBRICA', 32, 74);
    doc.text('REF / %', 105, 74);
    doc.text('PROVENTOS (R$)', 130, 74);
    doc.text('DESCONTOS (R$)', 165, 74);

    // Table Rows
    let y = 82;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const items: Array<{ cod: string; desc: string; ref: string; prov: number; descVal: number }> = [
      {
        cod: '001',
        desc: res.role === 'dono' ? 'PRÓ-LABORE MENSAL' : 'SALÁRIO BASE MENSAL',
        ref: '30 Dias',
        prov: res.baseSalary,
        descVal: 0
      }
    ];

    if (res.bonusGratification > 0) {
      items.push({
        cod: '015',
        desc: 'GRATIFICAÇÃO DE FUNÇÃO / PRÊMIO',
        ref: '100%',
        prov: res.bonusGratification,
        descVal: 0
      });
    }

    if (res.extraHoursPay > 0) {
      items.push({
        cod: '050',
        desc: `HORAS EXTRAS 50% (${res.extraHoursCount}h apuradas)`,
        ref: '50%',
        prov: res.extraHoursPay,
        descVal: 0
      });
    }

    if (res.dsrExtraHoursPay > 0) {
      items.push({
        cod: '055',
        desc: 'DSR SOBRE HORAS EXTRAS (SÚMULA 172 TST)',
        ref: '1/6',
        prov: res.dsrExtraHoursPay,
        descVal: 0
      });
    }

    if (res.insalubridadePay > 0) {
      items.push({
        cod: '032',
        desc: 'ADICIONAL DE INSALUBRIDADE',
        ref: '20%',
        prov: res.insalubridadePay,
        descVal: 0
      });
    }

    if (res.familyAllowancePay > 0) {
      items.push({
        cod: '045',
        desc: `SALÁRIO FAMÍLIA PREVIDÊNCIA SOCIAL (${res.familyAllowanceCount} cota${res.familyAllowanceCount > 1 ? 's' : ''})`,
        ref: `${res.familyAllowanceCount} Cotas`,
        prov: res.familyAllowancePay,
        descVal: 0
      });
    }

    if (res.inssDiscount > 0) {
      items.push({
        cod: '101',
        desc: 'CONTRIBUIÇÃO PREVIDENCIÁRIA INSS',
        ref: `${res.inssEffectivePct}%`,
        prov: 0,
        descVal: res.inssDiscount
      });
    }

    if (res.irpfDiscount > 0) {
      items.push({
        cod: '102',
        desc: 'IMPOSTO DE RENDA RETIDO NA FONTE (IRRF)',
        ref: `${res.irpfEffectivePct}%`,
        prov: 0,
        descVal: res.irpfDiscount
      });
    }

    if (res.vtDiscount > 0) {
      items.push({
        cod: '201',
        desc: 'DESCONTO VALE TRANSPORTE (LEI 7.418/85)',
        ref: `${res.vtEffectivePct}%`,
        prov: 0,
        descVal: res.vtDiscount
      });
    }

    if (res.vrVaDiscount > 0) {
      items.push({
        cod: '202',
        desc: 'DESCONTO VALE REFEIÇÃO / PAT',
        ref: `${res.vrVaEffectivePct}%`,
        prov: 0,
        descVal: res.vrVaDiscount
      });
    }

    if (res.delaysDiscount > 0) {
      const delayHrs = Math.floor(res.delaysMinutesCount / 60);
      const delayMins = res.delaysMinutesCount % 60;
      const refStr = delayHrs > 0 ? `${delayHrs}h ${delayMins}m` : `${res.delaysMinutesCount} min`;
      items.push({
        cod: '301',
        desc: `DESCONTO DE ATRASOS / SAÍDAS ANTECIPADAS (${refStr})`,
        ref: refStr,
        prov: 0,
        descVal: res.delaysDiscount
      });
    }

    if (res.dsrLossDiscount > 0) {
      items.push({
        cod: '305',
        desc: 'DESCONTO REPOUSO SEMANAL REMUNERADO (LEI 605/49)',
        ref: '1 Dia',
        prov: 0,
        descVal: res.dsrLossDiscount
      });
    }

    if (res.otherDiscounts > 0) {
      items.push({
        cod: '990',
        desc: 'OUTROS DESCONTOS CONVÊNIO / ADIANTAMENTO',
        ref: 'Fixo',
        prov: 0,
        descVal: res.otherDiscounts
      });
    }

    items.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 4, 182, 6, 'F');
      }
      doc.text(item.cod, 18, y);
      doc.text(item.desc, 32, y);
      doc.text(item.ref, 107, y);
      doc.text(item.prov > 0 ? item.prov.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-', 140, y, { align: 'right' });
      doc.text(item.descVal > 0 ? item.descVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-', 185, y, { align: 'right' });
      y += 6;
    });

    // Box Totals
    const boxY = Math.max(y + 4, 168);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, boxY, 182, 26, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, boxY, 182, 26, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TOTAL DE VENCIMENTOS (BRUTO)', 20, boxY + 6.5);
    doc.text(`R$ ${res.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 75, boxY + 6.5);

    doc.text('TOTAL DE DESCONTOS', 110, boxY + 6.5);
    doc.text(`R$ ${res.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 160, boxY + 6.5);

    // Salário Líquido Destacado
    doc.setFillColor(6, 78, 59); // Emerald-900
    doc.roundedRect(18, boxY + 11, 174, 11, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9.5);
    doc.text('VALOR LÍQUIDO A RECEBER:', 25, boxY + 18);
    doc.setFontSize(11.5);
    doc.text(`R$ ${res.netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 140, boxY + 18.5);

    // Base de Cálculo & FGTS
    const baseCalcY = boxY + 29;
    doc.setFillColor(255, 255, 255);
    doc.rect(14, baseCalcY, 182, 11, 'D');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Salário Base: R$ ${res.baseSalary.toFixed(2)}`, 18, baseCalcY + 4.5);
    doc.text(`Base Cálc. INSS: R$ ${res.inssBase.toFixed(2)}`, 60, baseCalcY + 4.5);
    doc.text(`Base Cálc. FGTS: R$ ${res.fgtsBase.toFixed(2)}`, 110, baseCalcY + 4.5);
    doc.text(`FGTS do Mês (8%): R$ ${res.fgtsEmployer.toFixed(2)}`, 150, baseCalcY + 4.5);

    doc.text(`Base Cálc. IRRF: R$ ${res.irpfBase.toFixed(2)}`, 18, baseCalcY + 9);
    doc.text(`Faixa IRRF: ${res.irpfEffectivePct}%`, 60, baseCalcY + 9);
    doc.text(`Código de Autenticação: ${res.employeeId.slice(0, 8).toUpperCase()}-${Date.now().toString(16).toUpperCase()}`, 110, baseCalcY + 9);

    // Mensagem da Loja
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Observações: ${res.holeriteFooterMessage || store?.holeriteFooterMessage || 'Crédito realizado em conta bancária/PIX. Dúvidas com o RH/DP.'}`, 18, baseCalcY + 15);

    // Canhoto destacável de quitação salarial
    const cutY = baseCalcY + 21;
    doc.setLineDashPattern([2, 1], 0);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, cutY, 196, cutY);
    doc.setLineDashPattern([], 0);

    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`RECIBO DE QUITAÇÃO DE PAGAMENTO SALARIAL • COMPETÊNCIA: ${res.monthYear}`, 18, cutY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Recebi de ${storeRazaoSocial.toUpperCase()} (CNPJ: ${storeCnpj}) a quantia líquida de R$ ${res.netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, correspondente à remuneração discriminada neste comprovante.`, 18, cutY + 11);

    const sigY = cutY + 22;
    doc.setDrawColor(148, 163, 184);
    doc.line(18, sigY, 70, sigY);
    doc.line(90, sigY, 185, sigY);

    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('Data: _____ / _____ / _________', 22, sigY + 4);
    doc.text(`Assinatura: ${res.employeeName.toUpperCase()} (CPF: ${emp?.cpf || '000.000.000-00'})`, 95, sigY + 4);

    doc.save(`holerite_${res.employeeName.toLowerCase().replace(/\s+/g, '_')}_${res.monthYear}.pdf`);
    showToast(`Holerite oficial de ${res.employeeName} gerado com sucesso!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{notification.message}</span>
          </div>
          <span className="text-[10px] text-zinc-400">Notificação DP</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Cálculo & Gestão de Folha de Pagamento
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Salário bruto, gratificações, percentuais de VT, VR/VA, INSS, IRPF, holerite oficial e cálculo dinâmico ajustável (inclusive Dono/Pró-Labore).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const currentStoreId = selectedStore !== 'all' ? selectedStore : (stores[0]?.id || 'store-1');
              openHeaderModalForStore(currentStoreId);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-all flex items-center gap-1.5 shadow hover:scale-[1.02] cursor-pointer"
            title="Personalize as informações oficiais exibidas no cabeçalho do contracheque desta unidade"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Configurar Cabeçalho do Contracheque</span>
          </button>

          {canDownload ? (
            <button
              onClick={handleExportPayrollCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-all flex items-center gap-1.5 shadow hover:scale-[1.02] cursor-pointer"
              title="Download da folha consolidada em arquivo CSV compatível com softwares contábeis"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar Folha (CSV)</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Download restrito à Diretoria</span>
            </div>
          )}
        </div>
      </div>

      {/* SELETOR RÁPIDO DE LOJAS PARA A FOLHA */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Visualizar Folha por Loja ou Toda a Rede:</span>
          </span>
          <span className="text-[11px] text-zinc-400">
            {selectedStore === 'all' ? 'Exibindo Consolidado da Rede' : `Filtrando por ${activeTotals.title}`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedStore('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
              selectedStore === 'all'
                ? 'bg-emerald-600 text-white shadow-emerald-950/40 ring-2 ring-emerald-400'
                : 'bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Toda a Rede (Consolidado)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-mono text-emerald-200">
              {allPayrollResults.length} colab.
            </span>
          </button>

          {stores.map((st) => {
            const count = allPayrollResults.filter((r) => r.payrollStoreId === st.id).length;
            const isSelected = selectedStore === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStore(st.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-emerald-950/40 ring-2 ring-emerald-400'
                    : 'bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                <span>{st.name} ({st.code})</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isSelected ? 'bg-black/30 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-foreground">
            Folha de Pagamento Ativa: <strong className="text-emerald-400">{activeTotals.title}</strong>
          </span>
          <span className="text-muted-foreground hidden sm:inline">|</span>
          <span className="text-muted-foreground">{activeTotals.subtitle}</span>
        </div>
        {selectedStore !== 'all' && (
          <button
            onClick={() => setSelectedStore('all')}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1 self-start sm:self-auto"
          >
            ← Voltar para Toda a Rede
          </button>
        )}
      </div>

      {/* KPI Cards (Atualizados dinamicamente pela loja selecionada) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Bruto da Folha</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-black text-foreground">
            R$ {activeTotals.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Base R$ {activeTotals.totalBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + R$ {activeTotals.totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} grat.
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total de Descontos</span>
            <Percent className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-xl font-black text-rose-400">
            R$ {activeTotals.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            INSS R$ {activeTotals.totalInss.toFixed(2)} • IRPF R$ {activeTotals.totalIrpf.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-medium">
            <span>Líquido a Pagar</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-400">
            R$ {activeTotals.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-emerald-300/70">
            {activeTotals.employeeCount} colaboradores na folha
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>FGTS Patronal (8%)</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl font-black text-blue-400">
            R$ {activeTotals.totalFgts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Custo patronal informativo
          </div>
        </div>
      </div>

      {/* SEÇÃO SOLICITADA: TOTAIS E INFORMAÇÕES DA FOLHA SEPARADAS POR LOJA */}
      <div className="p-5 rounded-2xl border border-border bg-card/40 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Totais da Folha Separados por Loja (Comparativo da Rede)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Valores individualizados por loja para conferência contábil, holerites e centros de custos.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {stores.length} Lojas Operacionais Cadastradas
          </div>
        </div>

        {/* Grid de Cards com as informações separadas por cada loja */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {storePayrollSummaries.map((summary) => {
            const isStoreActive = selectedStore === summary.store.id;
            return (
              <div
                key={summary.store.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 shadow-sm ${
                  isStoreActive
                    ? 'border-emerald-500 bg-emerald-950/25 ring-2 ring-emerald-500/30'
                    : 'border-border bg-card/60 hover:border-zinc-600'
                }`}
              >
                {/* Store Header */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-border/60">
                  <div>
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[170px]" title={summary.store.name}>
                        {summary.store.name}
                      </span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 font-mono">
                      Código: {summary.store.code} {summary.store.cnpj ? `• CNPJ: ${summary.store.cnpj}` : ''}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 shrink-0 border border-emerald-500/20">
                    {summary.count} {summary.count === 1 ? 'colab.' : 'colabs.'}
                  </span>
                </div>

                {/* As 4 informações exatamente como solicitadas, separadas por loja */}
                <div className="space-y-2 text-xs">
                  {/* Total Bruto */}
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-[10px] text-muted-foreground block font-medium">Total Bruto da Folha</span>
                    <span className="font-black text-sm text-foreground block font-mono">
                      R$ {summary.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      Base R$ {summary.totalBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + R$ {summary.totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} grat.
                    </span>
                  </div>

                  {/* Total de Descontos */}
                  <div className="p-2 rounded-lg bg-rose-950/15 border border-rose-500/20">
                    <span className="text-[10px] text-rose-300 block font-medium">Total de Descontos</span>
                    <span className="font-black text-sm text-rose-400 block font-mono">
                      R$ {summary.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-rose-300/80 block">
                      INSS R$ {summary.totalInss.toFixed(2)} • IRPF R$ {summary.totalIrpf.toFixed(2)}
                    </span>
                  </div>

                  {/* Líquido a Pagar */}
                  <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-300 block font-medium">Líquido a Pagar</span>
                    <span className="font-black text-base text-emerald-400 block font-mono">
                      R$ {summary.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-300/70 block">
                      {summary.count} colaboradores na folha
                    </span>
                  </div>

                  {/* FGTS Patronal */}
                  <div className="p-2 rounded-lg bg-blue-950/15 border border-blue-500/20">
                    <span className="text-[10px] text-blue-300 block font-medium">FGTS Patronal (8%)</span>
                    <span className="font-black text-sm text-blue-400 block font-mono">
                      R$ {summary.totalFgts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Custo patronal informativo
                    </span>
                  </div>
                </div>

                {/* Ação rápida para filtrar */}
                <button
                  type="button"
                  onClick={() => setSelectedStore(summary.store.id)}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    isStoreActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  <Building2 className="w-3 h-3 text-emerald-400" />
                  <span>{isStoreActive ? '✓ Visualizando esta Loja' : 'Filtrar Folha Desta Loja'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABELA PROGRESSIVA OFICIAL DO INSS (INFORMATIVO & FAIXAS) */}
      <div className="border border-border rounded-xl bg-card/50 overflow-hidden shadow-sm">
        <div
          className="p-3.5 bg-muted/40 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors"
          onClick={() => setShowInssTable(!showInssTable)}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-foreground">
              Tabela Progressiva Oficial de Contribuição do INSS (Faixas & Parcelas a Deduzir)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
              Vigente
            </span>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 font-semibold"
          >
            <span>{showInssTable ? 'Recolher' : 'Exibir Tabela'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showInssTable ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showInssTable && (
          <div className="p-4 border-t border-border space-y-3 text-xs">
            <p className="text-[11px] text-muted-foreground">
              O sistema calcula o INSS automaticamente conforme a legislação oficial, aplicando alíquotas progressivas e deduzindo as parcelas correspondentes:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted/70 text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2 px-3 border-b border-border">Salário de Contribuição</th>
                    <th className="py-2 px-3 text-center border-b border-border">Alíquota (%)</th>
                    <th className="py-2 px-3 text-right border-b border-border">Parcela a Deduzir</th>
                    <th className="py-2 px-3 text-right border-b border-border">Contribuição Máxima na Faixa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[11px]">
                  {INSS_BRACKETS_2026.map((bracket, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="py-2 px-3 font-sans font-semibold text-foreground">{bracket.rangeLabel}</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-400">{bracket.aliquotaPct.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right text-rose-400 font-semibold">
                        {bracket.deducao > 0 ? `R$ ${bracket.deducao.toFixed(2)}` : 'R$ 0,00'}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        R$ {((bracket.max * (bracket.aliquotaPct / 100)) - bracket.deducao).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-bold">
                    <td className="py-2 px-3 font-sans text-amber-300">Acima de R$ 8.475,55 (Teto Previdenciário)</td>
                    <td className="py-2 px-3 text-center text-amber-300">Teto Máximo (14%)</td>
                    <td className="py-2 px-3 text-right text-amber-300">R$ 198,49</td>
                    <td className="py-2 px-3 text-right text-amber-300 font-mono">
                      R$ {INSS_TETO_CONTRIBUICAO.toFixed(2)} (Teto)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Cálculo Automático Ativo:</strong> Fórmula aplicada: <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-emerald-200">INSS = (Base × Alíquota) − Parcela a Deduzir</code> com limitação no teto máximo de R$ 988,09 para salários acima de R$ 8.475,55.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-border bg-card/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Competência / Mês */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-semibold">Mês / Competência:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {availableMonths.map((m) => (
                <option key={m.val} value={m.val}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Loja */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Todas as Lojas & Sede (Consolidado)</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) {s.cnpj ? `• CNPJ: ${s.cnpj}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Perfil */}
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Todos os Cargos & Perfis</option>
              <option value="dono">Dono / Sócios (Pró-Labore)</option>
              <option value="gerente">Gerentes de Loja / Vendas / Marketing</option>
              <option value="atendente">Atendentes & Auxiliares</option>
            </select>
          </div>
        </div>

        {/* Busca por nome */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por colaborador ou cargo..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-3.5">Colaborador / Perfil</th>
                <th className="py-3 px-3">Cargo / Loja</th>
                <th className="py-3 px-3 text-right">Salário Bruto</th>
                <th className="py-3 px-3 text-right">Gratificação</th>
                <th className="py-3 px-3 text-right">VT (%)</th>
                <th className="py-3 px-3 text-right">VR/VA (%)</th>
                <th className="py-3 px-3 text-right">INSS (R$ / %)</th>
                <th className="py-3 px-3 text-right">IRPF (R$ / %)</th>
                <th className="py-3 px-3 text-right">Outros Desc.</th>
                <th className="py-3 px-3 text-right font-bold text-foreground">Salário Líquido</th>
                <th className="py-3 px-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayrollResults.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-muted-foreground text-xs">
                    Nenhum colaborador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPayrollResults.map((res) => {
                  const emp = users.find((u) => u.id === res.employeeId);
                  const cfg = configs[res.employeeId];
                  const isOwner = res.role === 'dono';
                  const isAllStores = emp?.hasAccessToAllStores || emp?.storeId === 'all' || isOwner;

                  return (
                    <tr
                      key={res.employeeId}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
                              emp?.avatarColor || 'from-emerald-500 to-teal-700'
                            } flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm`}
                          >
                            {res.employeeName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">
                              {res.employeeName}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {emp?.cpf || 'CPF não informado'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cargo / Loja */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-foreground block truncate max-w-[150px]" title={res.positionTitle}>
                          {res.positionTitle}
                        </span>
                        <div className="text-[10px] mt-0.5 space-y-0.5">
                          {isAllStores ? (
                            <span className="text-emerald-400 font-semibold block truncate max-w-[150px]">
                              🌐 Rede • 💰 Folha: {res.storeName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground block truncate max-w-[150px]">
                              {res.storeName} ({res.storeCode})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Salário Bruto (com input rápido direto) */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="inline-flex items-center justify-end gap-1">
                          <span className="text-muted-foreground text-[10px]">R$</span>
                          <input
                            type="number"
                            step="50"
                            min="0"
                            value={cfg?.baseSalary !== undefined ? cfg.baseSalary : res.baseSalary}
                            onChange={(e) =>
                              handleInlineChange(res.employeeId, 'baseSalary', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-1.5 py-0.5 rounded border border-border bg-background text-foreground text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            title="Editar salário base diretamente"
                          />
                        </div>
                      </td>

                      {/* Gratificação */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="inline-flex items-center justify-end gap-1">
                          <span className="text-muted-foreground text-[10px]">R$</span>
                          <input
                            type="number"
                            step="50"
                            min="0"
                            value={cfg?.bonusGratification !== undefined ? cfg.bonusGratification : res.bonusGratification}
                            onChange={(e) =>
                              handleInlineChange(res.employeeId, 'bonusGratification', parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-1.5 py-0.5 rounded border border-border bg-background text-foreground text-right text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            title="Editar gratificação de função / bonificação"
                          />
                        </div>
                      </td>

                      {/* VT % */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="inline-flex items-center justify-end gap-0.5">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="20"
                            value={cfg?.vtDiscountPct !== undefined ? cfg.vtDiscountPct : res.vtEffectivePct}
                            onChange={(e) =>
                              handleInlineChange(res.employeeId, 'vtDiscountPct', parseFloat(e.target.value) || 0)
                            }
                            className="w-11 px-1 py-0.5 rounded border border-border bg-background text-foreground text-right text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            title="Desconto de VT em % (0 para donos ou dispensados)"
                          />
                          <span className="text-muted-foreground text-[10px]">%</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          R$ {res.vtDiscount.toFixed(2)}
                        </div>
                      </td>

                      {/* VR/VA % */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="inline-flex items-center justify-end gap-0.5">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="25"
                            value={cfg?.vrVaDiscountPct !== undefined ? cfg.vrVaDiscountPct : res.vrVaEffectivePct}
                            onChange={(e) =>
                              handleInlineChange(res.employeeId, 'vrVaDiscountPct', parseFloat(e.target.value) || 0)
                            }
                            className="w-11 px-1 py-0.5 rounded border border-border bg-background text-foreground text-right text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            title="Desconto de VR/VA em % (PAT)"
                          />
                          <span className="text-muted-foreground text-[10px]">%</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          R$ {res.vrVaDiscount.toFixed(2)}
                        </div>
                      </td>

                      {/* INSS */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-semibold text-rose-400">
                          - R$ {res.inssDiscount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {res.inssEffectivePct}% {cfg?.inssDiscountPct != null ? '(Manual)' : '(CLT)'}
                        </div>
                      </td>

                      {/* IRPF */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-semibold text-rose-400">
                          {res.irpfDiscount > 0 ? `- R$ ${res.irpfDiscount.toFixed(2)}` : 'Isento'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {res.irpfEffectivePct > 0 ? `${res.irpfEffectivePct}%` : '0%'}
                        </div>
                      </td>

                      {/* Outros Descontos */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="inline-flex items-center justify-end gap-1">
                          <span className="text-muted-foreground text-[10px]">R$</span>
                          <input
                            type="number"
                            step="10"
                            min="0"
                            value={cfg?.otherDiscountsAmount !== undefined ? cfg.otherDiscountsAmount : res.otherDiscounts}
                            onChange={(e) =>
                              handleInlineChange(res.employeeId, 'otherDiscountsAmount', parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-1.5 py-0.5 rounded border border-border bg-background text-foreground text-right text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            title="Outros descontos (adiantamentos, convênios)"
                          />
                        </div>
                      </td>

                      {/* Salário Líquido Destacado */}
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-sm">
                        R$ {res.netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => emp && handleOpenEdit(emp)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
                            title="Ajuste detalhado e manual de todos os parâmetros"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                          </button>

                          <button
                            onClick={() => setViewingHolerite(res)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
                            title="Visualizar holerite em tela"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          {canDownload ? (
                            <button
                              onClick={() => handleGenerateHoleritePdf(res)}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
                              title="Baixar holerite oficial em PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 rounded-lg text-zinc-600 cursor-not-allowed inline-flex items-center"
                              title="Download de holerite restrito a cargos corporativos/Diretoria"
                            >
                              <Lock className="w-3 h-3 text-zinc-600" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Total Row */}
            {filteredPayrollResults.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60 font-bold text-foreground">
                  <td colSpan={2} className="py-3.5 px-3.5 text-xs">
                    TOTAL DA FOLHA: {activeTotals.title.toUpperCase()} ({filteredPayrollResults.length} Registros)
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs">
                    R$ {activeTotals.totalBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-emerald-400">
                    R$ {activeTotals.totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {activeTotals.totalVt.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {activeTotals.totalVrVa.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {activeTotals.totalInss.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {activeTotals.totalIrpf.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {activeTotals.totalOther.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-sm font-black text-emerald-400">
                    R$ {activeTotals.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL: Ajuste Manual Completo por Colaborador */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  <span>Configurar Folha: {editingEmployee.name}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingEmployee.positionTitle} • {editingEmployee.role === 'dono' ? 'Diretor / Sócio (Pró-Labore)' : 'CLT'} • Loja: {stores.find((s) => s.id === editingEmployee.storeId)?.name || 'Sede'}
                </p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-5 space-y-5 text-xs">
              {/* Lotação da Folha / Loja de Pagamento */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/15 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>Loja de Pagamento do Contracheque / Lotação da Folha</span>
                  </h4>
                  <span className="text-[10px] text-blue-300 font-mono">Contracheque</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Mesmo que os gerentes, diretores ou o dono sejam vinculados a todas as lojas, selecione a loja específica pela qual receberá o salário e constará no holerite (Ex: <em>trabalha pra toda rede mas recebe por Botafogo</em>).
                </p>
                <select
                  value={formPayrollStoreId}
                  onChange={(e) => setFormPayrollStoreId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      🏬 {s.name} ({s.code}) {s.cnpj ? `• CNPJ: ${s.cnpj}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Proventos / Salário & Gratificação */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 space-y-3">
                <h4 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>Proventos e Vencimentos (R$)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      Salário Bruto / Pró-Labore (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formBaseSalary}
                      onChange={(e) => setFormBaseSalary(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-semibold focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      Gratificação de Salário / Bonificação (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formBonusGratification}
                      onChange={(e) => setFormBonusGratification(e.target.value)}
                      placeholder="0.00 (pode deixar em branco)"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-semibold focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      Adicional de Insalubridade (% opcional):
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="40"
                      value={formInsalubridadePct}
                      onChange={(e) => setFormInsalubridadePct(e.target.value)}
                      placeholder="Ex: 20 (cozinha/chapa) ou 0"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  </div>
                </div>

                {/* SEÇÃO SALÁRIO FAMÍLIA & DEPENDENTES */}
                <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Salário-Família & Deduções de Dependentes</span>
                    </span>
                    <span className="text-[10px] text-zinc-400">Previdência Social CLT</span>
                  </div>

                  {/* Toggle Habilitar Salário Família */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <input
                      type="checkbox"
                      id="receiveFamAllowanceCheck"
                      disabled={editingEmployee.role === 'dono'}
                      checked={formReceiveSalarioFamilia}
                      onChange={(e) => setFormReceiveSalarioFamilia(e.target.checked)}
                      className="mt-0.5 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                    />
                    <div>
                      <label htmlFor="receiveFamAllowanceCheck" className="text-xs font-bold text-foreground cursor-pointer block">
                        Habilitar Salário-Família (Previdência Social / Lei 8.213/91)
                      </label>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {editingEmployee.role === 'dono'
                          ? 'Não aplicável para perfil de Dono/Pró-Labore.'
                          : 'Apenas devido mediante entrega de certidão de nascimento, caderneta de vacinação e comprovante escolar para dependentes até 14 anos (ou inválido).'}
                      </span>
                    </div>
                  </div>

                  {/* Aviso de Teto Salarial Legal CLT */}
                  {(() => {
                    const currentGross = (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0);
                    const isAboveCeiling = currentGross > 1819.26;
                    if (formReceiveSalarioFamilia && isAboveCeiling && editingEmployee.role !== 'dono') {
                      return (
                        <div className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-[11px] flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>Atenção ao Limite Legal:</strong> A remuneração deste colaborador (R$ {currentGross.toFixed(2)}) ultrapassa o teto legal da Previdência Social de <strong>R$ 1.819,26</strong>. Conforme o Art. 65 da Lei 8.213/91, o benefício de Salário Família <strong>não será pago</strong> (R$ 0,00).
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted-foreground mb-1 font-semibold text-[11px]">
                        Cotas Salário-Família (Filhos até 14 anos):
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="10"
                        disabled={!formReceiveSalarioFamilia || editingEmployee.role === 'dono'}
                        value={formDependents}
                        onChange={(e) => setFormDependents(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-50 text-xs focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Valor legal: R$ 62,04 por cota
                      </span>
                    </div>

                    <div>
                      <label className="block text-muted-foreground mb-1 font-semibold text-[11px]">
                        Dependentes para Dedução IRPF:
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="10"
                        value={formIrpfDependents}
                        onChange={(e) => setFormIrpfDependents(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Dedução de R$ 189,59/mês por dependente no IRRF
                      </span>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO DESCONTO DE ATRASOS DO PONTO */}
                {editingEmployee.role !== 'dono' && (
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Desconto Automático de Atrasos & Saídas Antecipadas (CLT Art. 58)</span>
                      </span>
                      <span className="text-[10px] text-amber-300 font-semibold">Integrado ao Ponto</span>
                    </div>

                    {/* Indicador de atrasos no mês */}
                    {(() => {
                      const userMonthPunches = punches.filter(
                        (p) => p.employeeId === editingEmployee.id && p.date.startsWith(selectedMonth)
                      );
                      const totalLoggedDelayMin = userMonthPunches.reduce((acc, p) => acc + (p.delayMinutes || 0), 0);
                      const delayHrs = Math.floor(totalLoggedDelayMin / 60);
                      const delayRemMins = totalLoggedDelayMin % 60;
                      const hourly = (parseFloat(formBaseSalary.replace(',', '.')) || 0) / 220;
                      const calculatedDiscount = Math.round((totalLoggedDelayMin / 60) * hourly * 100) / 100;

                      return (
                        <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Total de Atrasos no Mês ({selectedMonth}):</span>
                            <span className="font-bold font-mono text-amber-300">
                              {totalLoggedDelayMin} minutos ({delayHrs}h {delayRemMins}m)
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Desconto Proporcional Apurado:</span>
                            <span className="font-bold font-mono text-rose-400">
                              - R$ {calculatedDiscount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeDelaysCheck"
                          checked={formIncludeDelays}
                          onChange={(e) => setFormIncludeDelays(e.target.checked)}
                          className="rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="includeDelaysCheck" className="text-xs font-semibold text-foreground cursor-pointer">
                          Descontar atrasos e saídas antecipadas automaticamente na folha deste mês
                        </label>
                      </div>

                      <div>
                        <label className="block text-muted-foreground mb-1 font-semibold text-[11px]">
                          Regra de Aplicação do Desconto:
                        </label>
                        <select
                          value={formDelaysPolicy}
                          onChange={(e) => setFormDelaysPolicy(e.target.value as any)}
                          disabled={!formIncludeDelays}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                        >
                          <option value="proporcional">Proporcional aos minutos exatos (Valor hora / 60)</option>
                          <option value="com_dsr">Proporcional + Perda de 1 DSR semanal (Lei 605/49 Art. 6º)</option>
                          <option value="isento">Isentar atrasos este mês (Abonar/Sem desconto)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-muted-foreground mb-1 text-[10px]">
                            Ajustar Minutos Manualmente (Opcional):
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={formManualDelaysMin}
                            onChange={(e) => setFormManualDelaysMin(e.target.value)}
                            placeholder="Padrão do ponto"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-muted-foreground mb-1 text-[10px]">
                            Fixar Desconto em R$ (Opcional):
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formManualDelaysR$}
                            onChange={(e) => setFormManualDelaysR$(e.target.value)}
                            placeholder="Padrão calculado"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Percentuais de Desconto (VT, VR/VA, INSS, IRPF) */}
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-3">
                <h4 className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                  <Percent className="w-4 h-4" />
                  <span>Percentuais e Ajustes de Descontos Legais</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      Vale Transporte (%):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={formVtDiscountPct}
                      onChange={(e) => setFormVtDiscountPct(e.target.value)}
                      placeholder="6 (ou 0 se dispensou / dono)"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Legal CLT: até 6% sobre o salário base
                    </span>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      Vale Refeição / Alimentação (% PAT):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="25"
                      value={formVrVaDiscountPct}
                      onChange={(e) => setFormVrVaDiscountPct(e.target.value)}
                      placeholder="5 (ou 0)"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Conforme política interna de benefícios da empresa
                    </span>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      INSS % Manual (Vazio = Cálculo Oficial CLT):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={formInssManualPct}
                      onChange={(e) => setFormInssManualPct(e.target.value)}
                      placeholder="Deixe em branco para usar tabela progressiva"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      IRPF % Manual (Vazio = Cálculo Oficial IRPF):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="35"
                      value={formIrpfManualPct}
                      onChange={(e) => setFormIrpfManualPct(e.target.value)}
                      placeholder="Deixe em branco para tabela oficial"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Demonstração em Tempo Real da Faixa de INSS */}
                <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-950/20 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between font-bold text-rose-300">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      Cálculo Oficial INSS (Progressivo 2026):
                    </span>
                    <span className="font-mono text-rose-400">
                      {PayrollCalculatorService.getInssDetail(
                        (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)
                      ).rangeLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-muted-foreground pt-1">
                    <div>
                      Base de Cálculo: <strong className="text-foreground">
                        R$ {((parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      Alíquota Faixa: <strong className="text-foreground">
                        {PayrollCalculatorService.getInssDetail(
                          (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)
                        ).aliquotaPct}%
                      </strong>
                    </div>
                    <div>
                      Parcela a Deduzir: <strong className="text-foreground">
                        R$ {PayrollCalculatorService.getInssDetail(
                          (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)
                        ).deducao.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      INSS Previsto: <strong className="text-rose-400 font-bold">
                        R$ {PayrollCalculatorService.getInssDetail(
                          (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)
                        ).amount.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Demonstração em Tempo Real da Faixa de IRPF (Isenção Vigente até R$ 5.000,00) */}
                <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-950/20 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between font-bold text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      Cálculo Oficial IRPF (Isenção até R$ 5.000,00):
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {PayrollCalculatorService.getIrpfDetail(
                        (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0),
                        PayrollCalculatorService.calculateCltInss((parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)).amount,
                        Math.round(parseFloat(formDependents) || 0)
                      ).rangeLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-muted-foreground pt-1">
                    <div>
                      Base Tributável: <strong className="text-foreground">
                        R$ {PayrollCalculatorService.getIrpfDetail(
                          (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0),
                          PayrollCalculatorService.calculateCltInss((parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)).amount,
                          Math.round(parseFloat(formDependents) || 0)
                        ).baseCalculo.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      Alíquota Efetiva: <strong className="text-foreground">
                        {PayrollCalculatorService.getIrpfDetail(
                          (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0),
                          PayrollCalculatorService.calculateCltInss((parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)).amount,
                          Math.round(parseFloat(formDependents) || 0)
                        ).effectivePct}%
                      </strong>
                    </div>
                    <div>
                      Condição Legal: <strong className="text-emerald-400 font-bold">
                        {PayrollCalculatorService.getIrpfDetail(
                          (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0),
                          PayrollCalculatorService.calculateCltInss((parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)).amount,
                          Math.round(parseFloat(formDependents) || 0)
                        ).isExempt ? '✓ ISENTO DE IRPF' : 'TRIBUTÁVEL'}
                      </strong>
                    </div>
                    <div>
                      IRPF Previsto: <strong className="text-emerald-400 font-bold">
                        R$ {PayrollCalculatorService.getIrpfDetail(
                          (parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0),
                          PayrollCalculatorService.calculateCltInss((parseFloat(formBaseSalary.replace(',', '.')) || 0) + (parseFloat(formBonusGratification.replace(',', '.')) || 0)).amount,
                          Math.round(parseFloat(formDependents) || 0)
                        ).amount.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Overrides Manuais em R$ fixo */}
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[11px] font-bold text-foreground block mb-2">
                    Ajustes Manuais Fixos em R$ (Sobrescrevem cálculos percentuais se preenchidos):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block">Fixar INSS (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formManualInssR$}
                        onChange={(e) => setFormManualInssR$(e.target.value)}
                        placeholder="Automático"
                        className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block">Fixar IRPF (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formManualIrpfR$}
                        onChange={(e) => setFormManualIrpfR$(e.target.value)}
                        placeholder="Automático"
                        className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block">Fixar VT (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formManualVtR$}
                        onChange={(e) => setFormManualVtR$(e.target.value)}
                        placeholder="Automático"
                        className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block">Fixar VR/VA (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formManualVrVaR$}
                        onChange={(e) => setFormManualVrVaR$(e.target.value)}
                        placeholder="Automático"
                        className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Outros Descontos & Observações */}
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                <h4 className="font-bold text-foreground text-xs">Outros Descontos & Adiantamentos</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      Valor de Outros Descontos (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formOtherDiscountsAmount}
                      onChange={(e) => setFormOtherDiscountsAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      Descrição do Desconto:
                    </label>
                    <input
                      type="text"
                      value={formOtherDiscountsDescription}
                      onChange={(e) => setFormOtherDiscountsDescription(e.target.value)}
                      placeholder="Ex: Vale Farmácia, Adiantamento, Seguro"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 font-semibold">
                    Observações Internas da Folha:
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Anotações para contabilidade ou histórico..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visualização Rápida de Holerite (Contracheque Oficial CLT) */}
      {viewingHolerite && (() => {
        const emp = users.find((u) => u.id === viewingHolerite.employeeId);
        const store = stores.find((s) => s.id === viewingHolerite.payrollStoreId) || stores.find((s) => s.id === emp?.storeId) || stores[0];

        const headerTitle = viewingHolerite.holeriteHeaderTitle || store?.holeriteHeaderTitle || (viewingHolerite.role === 'dono' ? 'DEMONSTRATIVO DE PRÓ-LABORE' : 'RECIBO DE PAGAMENTO DE SALÁRIO');
        const headerSubtitle = viewingHolerite.holeriteSubtitle || store?.holeriteSubtitle || 'Demonstrativo Mensal de Pagamento de Salário - CLT';
        const storeRazaoSocial = viewingHolerite.storeRazaoSocial || store?.razaoSocial || store?.name || 'Unidade Operacional';
        const storeCnpj = viewingHolerite.storeCnpj || store?.cnpj || 'Não informado';
        const storeIE = viewingHolerite.storeStateRegistration || store?.stateRegistration || 'Isento';
        const storeAddress = viewingHolerite.storeAddress || store?.address || 'Endereço da Unidade';
        const storeNeighborhood = viewingHolerite.storeNeighborhood || store?.neighborhood || '';
        const storeCity = viewingHolerite.storeCity || store?.city || '';
        const storeCep = viewingHolerite.storeCep || store?.cep || '';
        const storePhone = viewingHolerite.storePhone || store?.phone || '';
        const storeEmail = viewingHolerite.storeEmail || store?.email || '';

        // Rubricas dinâmicas do holerite
        const rubrics: Array<{ cod: string; desc: string; ref: string; prov: number; descVal: number }> = [
          {
            cod: '001',
            desc: viewingHolerite.role === 'dono' ? 'PRÓ-LABORE MENSAL' : 'SALÁRIO BASE MENSAL',
            ref: '30 Dias',
            prov: viewingHolerite.baseSalary,
            descVal: 0
          }
        ];

        if (viewingHolerite.bonusGratification > 0) {
          rubrics.push({
            cod: '015',
            desc: 'GRATIFICAÇÃO DE FUNÇÃO / PRÊMIO',
            ref: '100%',
            prov: viewingHolerite.bonusGratification,
            descVal: 0
          });
        }

        if (viewingHolerite.extraHoursPay > 0) {
          rubrics.push({
            cod: '050',
            desc: `HORAS EXTRAS 50% (${viewingHolerite.extraHoursCount}h apuradas)`,
            ref: '50%',
            prov: viewingHolerite.extraHoursPay,
            descVal: 0
          });
        }

        if (viewingHolerite.dsrExtraHoursPay > 0) {
          rubrics.push({
            cod: '055',
            desc: 'DSR SOBRE HORAS EXTRAS (SÚMULA 172 TST)',
            ref: '1/6',
            prov: viewingHolerite.dsrExtraHoursPay,
            descVal: 0
          });
        }

        if (viewingHolerite.insalubridadePay > 0) {
          rubrics.push({
            cod: '032',
            desc: 'ADICIONAL DE INSALUBRIDADE',
            ref: '20%',
            prov: viewingHolerite.insalubridadePay,
            descVal: 0
          });
        }

        if (viewingHolerite.familyAllowancePay > 0) {
          rubrics.push({
            cod: '045',
            desc: `SALÁRIO FAMÍLIA PREVIDÊNCIA (${viewingHolerite.familyAllowanceCount} cota${viewingHolerite.familyAllowanceCount > 1 ? 's' : ''})`,
            ref: `${viewingHolerite.familyAllowanceCount} Cotas`,
            prov: viewingHolerite.familyAllowancePay,
            descVal: 0
          });
        }

        if (viewingHolerite.inssDiscount > 0) {
          rubrics.push({
            cod: '101',
            desc: 'CONTRIBUIÇÃO PREVIDENCIÁRIA INSS',
            ref: `${viewingHolerite.inssEffectivePct}%`,
            prov: 0,
            descVal: viewingHolerite.inssDiscount
          });
        }

        if (viewingHolerite.irpfDiscount > 0) {
          rubrics.push({
            cod: '102',
            desc: 'IMPOSTO DE RENDA RETIDO NA FONTE (IRRF)',
            ref: `${viewingHolerite.irpfEffectivePct}%`,
            prov: 0,
            descVal: viewingHolerite.irpfDiscount
          });
        }

        if (viewingHolerite.vtDiscount > 0) {
          rubrics.push({
            cod: '201',
            desc: 'DESCONTO VALE TRANSPORTE (LEI 7.418/85)',
            ref: `${viewingHolerite.vtEffectivePct}%`,
            prov: 0,
            descVal: viewingHolerite.vtDiscount
          });
        }

        if (viewingHolerite.vrVaDiscount > 0) {
          rubrics.push({
            cod: '202',
            desc: 'DESCONTO VALE REFEIÇÃO / PAT',
            ref: `${viewingHolerite.vrVaEffectivePct}%`,
            prov: 0,
            descVal: viewingHolerite.vrVaDiscount
          });
        }

        if (viewingHolerite.delaysDiscount > 0) {
          const delayHrs = Math.floor(viewingHolerite.delaysMinutesCount / 60);
          const delayMins = viewingHolerite.delaysMinutesCount % 60;
          const refStr = delayHrs > 0 ? `${delayHrs}h ${delayMins}m` : `${viewingHolerite.delaysMinutesCount} min`;
          rubrics.push({
            cod: '301',
            desc: `DESCONTO DE ATRASOS / SAÍDAS ANTECIPADAS (${refStr})`,
            ref: refStr,
            prov: 0,
            descVal: viewingHolerite.delaysDiscount
          });
        }

        if (viewingHolerite.dsrLossDiscount > 0) {
          rubrics.push({
            cod: '305',
            desc: 'DESCONTO PERDA DE DSR (FALTA / ATRASO SEMANAL)',
            ref: '1 DSR',
            prov: 0,
            descVal: viewingHolerite.dsrLossDiscount
          });
        }

        if (viewingHolerite.otherDiscounts > 0) {
          rubrics.push({
            cod: '401',
            desc: viewingHolerite.otherDiscountsDescription || 'OUTROS DESCONTOS EM FOLHA',
            ref: 'Valor Fixo',
            prov: 0,
            descVal: viewingHolerite.otherDiscounts
          });
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[94vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4 my-auto">
              {/* Modal Top Actions */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Contracheque Oficial • Competência {viewingHolerite.monthYear}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Unidade de Lotação: <strong className="text-foreground">{viewingHolerite.storeName} ({viewingHolerite.storeCode || store?.code || 'LJ'})</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (store) openHeaderModalForStore(store.id);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
                    title="Editar informações do cabeçalho da loja deste colaborador"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Configurar Cabeçalho da Loja</span>
                  </button>
                  <button
                    onClick={() => setViewingHolerite(null)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* CONTRATO DE TRABALHO & CABEÇALHO DO HOLERITE (Layout Fiel ao Documento Físico) */}
              <div className="border border-border rounded-xl bg-card text-foreground overflow-hidden shadow-sm">
                {/* 1. Faixa Superior do Empregador */}
                <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm tracking-wide text-emerald-400 uppercase">
                        {headerTitle}
                      </h4>
                      <p className="text-[10px] text-emerald-200/80">
                        {headerSubtitle} • COMPETÊNCIA: <strong className="text-white">{viewingHolerite.monthYear}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const s = stores.find((st) => st.id === viewingHolerite.payrollStoreId) || stores.find((st) => st.id === emp?.storeId) || stores[0];
                          if (s) openHeaderModalForStore(s);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-[10px] font-bold border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Personalizar Razão Social, CNPJ, Título e Endereço que saem no cabeçalho desta unidade"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Configurar Cabeçalho desta Loja</span>
                      </button>
                      <div className="text-left sm:text-right text-[10px] text-zinc-400 font-mono">
                        <span>CÓD. UNIDADE: <strong className="text-white">{viewingHolerite.storeCode || store?.code || 'LJ-01'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Box de Dados da Empresa e do Colaborador */}
                <div className="p-3.5 bg-muted/20 border-b border-border space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-bold uppercase">Razão Social / Empregador</span>
                      <strong className="text-xs text-foreground block font-sans">{storeRazaoSocial}</strong>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {storeAddress}{storeNeighborhood ? ` - ${storeNeighborhood}` : ''}, {storeCity}{storeCep ? ` • CEP: ${storeCep}` : ''}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] text-muted-foreground block font-bold uppercase">CNPJ & Inscrição Estadual</span>
                      <strong className="text-xs font-mono text-foreground block">{storeCnpj} • I.E.: {storeIE}</strong>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Contato DP: {storePhone || storeEmail || 'dp@empresa.com.br'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Colaborador(a):</span>
                      <strong className="text-foreground block">{viewingHolerite.employeeName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">CPF:</span>
                      <strong className="text-foreground font-mono block">{emp?.cpf || '000.000.000-00'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Cargo / Função:</span>
                      <strong className="text-foreground block">{viewingHolerite.positionTitle}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Lotação / Pagamento:</span>
                      <strong className="text-emerald-400 block">{viewingHolerite.storeName}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Tabela de Rubricas / Verbas */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border font-bold">
                      <tr>
                        <th className="px-3 py-2">Cód</th>
                        <th className="px-3 py-2">Descrição da Rubrica</th>
                        <th className="px-3 py-2 text-center">Ref / %</th>
                        <th className="px-3 py-2 text-right">Proventos (R$)</th>
                        <th className="px-3 py-2 text-right">Descontos (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                      {rubrics.map((r) => (
                        <tr key={r.cod} className="hover:bg-muted/30">
                          <td className="px-3 py-1.5 text-muted-foreground font-semibold">{r.cod}</td>
                          <td className="px-3 py-1.5 font-sans text-foreground font-medium">{r.desc}</td>
                          <td className="px-3 py-1.5 text-center text-muted-foreground">{r.ref}</td>
                          <td className="px-3 py-1.5 text-right font-bold text-emerald-400">
                            {r.prov > 0 ? r.prov.toFixed(2) : '-'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-bold text-rose-400">
                            {r.descVal > 0 ? r.descVal.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Faixa de Totais e Salário Líquido */}
                <div className="p-3 bg-muted/30 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <div className="p-2.5 rounded-lg bg-card border border-border text-center sm:text-left">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Total de Proventos</span>
                    <strong className="text-sm font-mono text-emerald-400">
                      R$ {viewingHolerite.totalGross.toFixed(2)}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-card border border-border text-center sm:text-left">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Total de Descontos</span>
                    <strong className="text-sm font-mono text-rose-400">
                      - R$ {viewingHolerite.totalDiscounts.toFixed(2)}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-center sm:text-left">
                    <span className="text-[10px] text-emerald-300 block font-bold uppercase">Valor Líquido a Receber</span>
                    <strong className="text-base font-mono font-black text-emerald-400">
                      R$ {viewingHolerite.netSalary.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* 5. Bases Legais de Cálculo (CLT e Previdenciárias) */}
                <div className="p-3 bg-card border-t border-border text-[10px] text-muted-foreground font-mono grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div>
                    <span className="block font-sans text-zinc-400">Salário Base:</span>
                    <strong className="text-foreground">R$ {viewingHolerite.baseSalary.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="block font-sans text-zinc-400">Base INSS:</span>
                    <strong className="text-foreground">R$ {viewingHolerite.inssBase.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="block font-sans text-zinc-400">Base FGTS:</span>
                    <strong className="text-foreground">R$ {viewingHolerite.fgtsBase.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="block font-sans text-zinc-400">FGTS do Mês (8%):</span>
                    <strong className="text-foreground font-bold">R$ {viewingHolerite.fgtsEmployer.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="block font-sans text-zinc-400">Base IRRF:</span>
                    <strong className="text-foreground">R$ {viewingHolerite.irpfBase.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="block font-sans text-zinc-400">Faixa Efetiva IRRF:</span>
                    <strong className="text-foreground font-bold">{viewingHolerite.irpfEffectivePct}%</strong>
                  </div>
                </div>

                {/* 6. Mensagem de Rodapé da Loja */}
                <div className="px-4 py-2 bg-muted/20 border-t border-border text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>
                    Mensagem: <strong className="text-foreground">{viewingHolerite.holeriteFooterMessage || store?.holeriteFooterMessage || 'Crédito realizado em conta bancária/PIX.'}</strong>
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    Autenticação: SHA256-{viewingHolerite.employeeId.slice(0, 6).toUpperCase()}
                  </span>
                </div>

                {/* 7. Canhoto de Quitação */}
                <div className="p-3 bg-muted/10 border-t border-dashed border-border/80 text-[10px] text-muted-foreground space-y-2">
                  <p className="italic">
                    "Declaro ter recebido da empresa empregadora identificada acima a importância líquida descrita neste recibo, correspondente à quitação integral da folha de pagamento da competência indicada."
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-center sm:text-left">
                      <div className="w-48 border-b border-border mb-1" />
                      <span>Data: ____/____/________</span>
                    </div>
                    <div className="text-center sm:text-right">
                      <div className="w-56 border-b border-border mb-1" />
                      <span className="font-bold text-foreground">{viewingHolerite.employeeName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    if (store) openHeaderModalForStore(store.id);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs text-foreground hover:bg-muted font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Configurar Cabeçalho Desta Loja</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingHolerite(null)}
                    className="px-4 py-1.5 rounded-xl border border-border text-xs text-foreground hover:bg-muted font-semibold cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => handleGenerateHoleritePdf(viewingHolerite)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar PDF Oficial</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURAR CABEÇALHO DO CONTRACHEQUE POR UNIDADE */}
      {/* ========================================================================= */}
      {showStoreHeaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Personalizar Cabeçalho do Contracheque
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Defina a Razão Social, CNPJ, Título e Rodapé que aparecem no holerite dos colaboradores desta loja.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStoreHeaderModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStoreHeader} className="space-y-4 text-xs">
              {/* Seletor de Loja */}
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Selecione a Loja a Configurar:</label>
                <select
                  value={selectedHeaderStoreId}
                  onChange={(e) => openHeaderModalForStore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-semibold"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.razaoSocial || s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Títulos do Documento */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block">
                  1. Título & Subtítulo do Holerite
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Título Principal *</label>
                    <input
                      type="text"
                      required
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      placeholder="Ex: RECIBO DE PAGAMENTO DE SALÁRIO"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Subtítulo</label>
                    <input
                      type="text"
                      value={headerSubtitle}
                      onChange={(e) => setHeaderSubtitle(e.target.value)}
                      placeholder="Ex: Demonstrativo Mensal de Pagamento de Salário - CLT"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Fiscais da Empresa */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <span className="font-bold text-zinc-300 uppercase text-[10px] tracking-wider block">
                  2. Dados do Empregador (Razão Social & CNPJ)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Razão Social Oficial *</label>
                    <input
                      type="text"
                      required
                      value={headerRazaoSocial}
                      onChange={(e) => setHeaderRazaoSocial(e.target.value)}
                      placeholder="Ex: MINHA EMPRESA ALIMENTAÇÃO LTDA"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Nome Fantasia da Loja</label>
                    <input
                      type="text"
                      value={headerName}
                      onChange={(e) => setHeaderName(e.target.value)}
                      placeholder="Ex: Unidade Centro"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">CNPJ *</label>
                    <input
                      type="text"
                      value={headerCnpj}
                      onChange={(e) => setHeaderCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Inscrição Estadual</label>
                    <input
                      type="text"
                      value={headerStateRegistration}
                      onChange={(e) => setHeaderStateRegistration(e.target.value)}
                      placeholder="Isento ou número da IE"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço & Contato */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <span className="font-bold text-zinc-300 uppercase text-[10px] tracking-wider block">
                  3. Endereço & Contato da Unidade
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1 font-medium">Endereço Completo</label>
                    <input
                      type="text"
                      value={headerAddress}
                      onChange={(e) => setHeaderAddress(e.target.value)}
                      placeholder="Av. Principal, 100"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Bairro</label>
                    <input
                      type="text"
                      value={headerNeighborhood}
                      onChange={(e) => setHeaderNeighborhood(e.target.value)}
                      placeholder="Centro"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Cidade / UF</label>
                    <input
                      type="text"
                      value={headerCity}
                      onChange={(e) => setHeaderCity(e.target.value)}
                      placeholder="Rio de Janeiro - RJ"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Telefone DP</label>
                    <input
                      type="text"
                      value={headerPhone}
                      onChange={(e) => setHeaderPhone(e.target.value)}
                      placeholder="(21) 2555-8900"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">E-mail DP</label>
                    <input
                      type="email"
                      value={headerEmail}
                      onChange={(e) => setHeaderEmail(e.target.value)}
                      placeholder="dp@empresa.com.br"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Mensagem de Rodapé */}
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Mensagem de Rodapé do Contracheque:</label>
                <input
                  type="text"
                  value={headerFooterMessage}
                  onChange={(e) => setHeaderFooterMessage(e.target.value)}
                  placeholder="Ex: Crédito realizado em conta corrente via PIX. Em caso de dúvidas, contate o DP."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-dashed border-emerald-500/40 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Pré-visualização do Cabeçalho Oficial:
                </span>
                <div className="text-white font-bold text-xs">{headerTitle.toUpperCase()}</div>
                <div className="text-[11px] text-zinc-400">{headerSubtitle}</div>
                <div className="text-[10px] text-zinc-300 font-sans mt-1">
                  <strong>{headerRazaoSocial || 'RAZÃO SOCIAL LTDA'}</strong> • CNPJ: {headerCnpj || '00.000.000/0001-00'}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowStoreHeaderModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  Salvar Configuração do Cabeçalho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
