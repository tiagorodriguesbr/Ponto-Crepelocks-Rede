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
  ArrowUpDown
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
import { PayrollCalculatorService } from '../services/payrollCalculator';
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
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
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

  // Form state for modal editor
  const [formBaseSalary, setFormBaseSalary] = useState<string>('0');
  const [formBonusGratification, setFormBonusGratification] = useState<string>('0');
  const [formInsalubridadePct, setFormInsalubridadePct] = useState<string>('0');
  const [formDependents, setFormDependents] = useState<string>('0');
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
  const [formNotes, setFormNotes] = useState<string>('');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedStore !== 'all' && u.storeId !== selectedStore && u.storeId !== 'all') return false;
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
  }, [users, selectedStore, roleFilter, searchTerm]);

  // Compute payroll result for each filtered employee
  const payrollResults = useMemo<PayrollCalculationResult[]>(() => {
    return filteredUsers.map((user) => {
      const config = configs[user.id];
      const store = stores.find((s) => s.id === user.storeId);
      return PayrollCalculatorService.calculatePayroll(user, config, store, punches, selectedMonth);
    });
  }, [filteredUsers, configs, stores, punches, selectedMonth]);

  // Grand totals of the filtered payroll
  const grandTotals = useMemo(() => {
    return payrollResults.reduce(
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
  }, [payrollResults]);

  // Open modal editor for employee
  const handleOpenEdit = (user: UserAccount) => {
    const cfg = configs[user.id];
    setEditingEmployee(user);

    setFormBaseSalary(cfg?.baseSalary !== undefined ? String(cfg.baseSalary) : (user.role === 'dono' ? '10000' : '2000'));
    setFormBonusGratification(cfg?.bonusGratification !== undefined ? String(cfg.bonusGratification) : '0');
    setFormInsalubridadePct(cfg?.insalubridadePct !== undefined ? String(cfg.insalubridadePct) : '0');
    setFormDependents(cfg?.familyAllowanceDependents !== undefined ? String(cfg.familyAllowanceDependents) : '0');
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
    setFormIncludeDelays(cfg?.includeDelaysDiscount === true);
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

    const updatedConfig: PayrollEmployeeConfig = {
      employeeId: editingEmployee.id,
      monthYear: selectedMonth,
      baseSalary: parseNum(formBaseSalary),
      bonusGratification: parseNum(formBonusGratification),
      insalubridadePct: parseNum(formInsalubridadePct),
      familyAllowanceDependents: Math.round(parseNum(formDependents)),
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
      notes: formNotes.trim(),
      updatedAt: new Date().toISOString()
    };

    setConfigs((prev) => ({ ...prev, [editingEmployee.id]: updatedConfig }));
    StorageService.updatePayrollConfig(updatedConfig);
    onDataUpdated();
    setEditingEmployee(null);
    showToast(`Configuração de folha de ${editingEmployee.name} salva com sucesso!`);
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

    payrollResults.forEach((r) => {
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
    link.setAttribute('download', `folha_pagamento_crepelocks_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);

    showToast(`Planilha CSV da folha gerada com ${payrollResults.length} registros!`);
  };

  // Generate Official Holerite / Contracheque PDF
  const handleGenerateHoleritePdf = (res: PayrollCalculationResult) => {
    const emp = users.find((u) => u.id === res.employeeId);
    const store = stores.find((s) => s.id === emp?.storeId);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header Card
    doc.setFillColor(6, 78, 59); // Emerald-900
    doc.rect(14, 12, 182, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CREPELOCKS BRASIL - RECIBO DE PAGAMENTO DE SALÁRIO', 20, 21);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(`DEMONSTRATIVO DE HOLERITE / PRÓ-LABORE • COMPETÊNCIA: ${res.monthYear}`, 20, 29);

    // Employee & Company info box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 38, 182, 28, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 38, 182, 28, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Empresa: CREPELOCKS ALIMENTAÇÃO LTDA`, 18, 44);
    doc.text(`CNPJ: 45.981.234/0001-89`, 120, 44);

    doc.text(`Colaborador(a): ${res.employeeName.toUpperCase()}`, 18, 51);
    doc.text(`CPF: ${emp?.cpf || '000.000.000-00'}`, 120, 51);

    doc.setFont('helvetica', 'normal');
    doc.text(`Cargo / Função: ${res.positionTitle} (${res.role === 'dono' ? 'Pró-Labore Dono' : 'CLT'})`, 18, 58);
    doc.text(`Lotação: ${store?.name || 'Sede Administrativa'}`, 120, 58);

    doc.text(`Admissão: ${emp?.admissionDate || '2023-01-01'}`, 18, 64);
    doc.text(`Banco: Itaú Unibanco (0341) | Conta Corrente Salário`, 120, 64);

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(14, 70, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CÓD', 18, 75.5);
    doc.text('DESCRIÇÃO DA VERBA / RUBRICA', 32, 75.5);
    doc.text('REF / %', 105, 75.5);
    doc.text('PROVENTOS (R$)', 130, 75.5);
    doc.text('DESCONTOS (R$)', 165, 75.5);

    // Table Rows
    let y = 84;
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
        desc: 'SALÁRIO FAMÍLIA (DEPENDENTES)',
        ref: 'Legal',
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
        doc.rect(14, y - 4, 182, 6.5, 'F');
      }
      doc.text(item.cod, 18, y);
      doc.text(item.desc, 32, y);
      doc.text(item.ref, 107, y);
      doc.text(item.prov > 0 ? item.prov.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-', 140, y, { align: 'right' });
      doc.text(item.descVal > 0 ? item.descVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-', 185, y, { align: 'right' });
      y += 6.5;
    });

    // Box Totals
    const boxY = Math.max(y + 6, 175);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, boxY, 182, 28, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, boxY, 182, 28, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TOTAL DE VENCIMENTOS (BRUTO)', 20, boxY + 7);
    doc.text(`R$ ${res.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 75, boxY + 7);

    doc.text('TOTAL DE DESCONTOS', 110, boxY + 7);
    doc.text(`R$ ${res.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 160, boxY + 7);

    // Salário Líquido Destacado
    doc.setFillColor(6, 78, 59);
    doc.roundedRect(18, boxY + 12, 174, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('VALOR LÍQUIDO A RECEBER:', 25, boxY + 19.5);
    doc.setFontSize(12);
    doc.text(`R$ ${res.netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 140, boxY + 20);

    // Base de Cálculo & FGTS
    const baseCalcY = boxY + 34;
    doc.setFillColor(255, 255, 255);
    doc.rect(14, baseCalcY, 182, 12, 'D');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Salário Base: R$ ${res.baseSalary.toFixed(2)}`, 18, baseCalcY + 5);
    doc.text(`Base Cálc. INSS: R$ ${res.totalGross.toFixed(2)}`, 60, baseCalcY + 5);
    doc.text(`Base Cálc. FGTS: R$ ${res.totalGross.toFixed(2)}`, 110, baseCalcY + 5);
    doc.text(`FGTS do Mês (8%): R$ ${res.fgtsEmployer.toFixed(2)}`, 150, baseCalcY + 5);

    doc.text(`Base Cálc. IRRF: R$ ${Math.max(0, res.totalGross - res.inssDiscount).toFixed(2)}`, 18, baseCalcY + 10);
    doc.text(`Faixa IRRF: ${res.irpfEffectivePct}%`, 60, baseCalcY + 10);
    doc.text(`Autenticação Bancária: ${res.employeeId.slice(0, 8).toUpperCase()}-${Date.now().toString(16).toUpperCase()}`, 110, baseCalcY + 10);

    // Signatures
    const sigY = baseCalcY + 24;
    doc.setDrawColor(148, 163, 184);
    doc.line(20, sigY, 90, sigY);
    doc.line(115, sigY, 185, sigY);

    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Assinatura do Empregador / Crepelocks', 26, sigY + 4);
    doc.text('Assinatura do Colaborador / Recibo', 124, sigY + 4);

    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('DECLARO TER RECEBIDO A IMPORTÂNCIA LÍQUIDA ACIMA DISCRIMINADA DISPOSTA EM CONTA BANCÁRIA.', 30, sigY + 11);

    doc.save(`holerite_${res.employeeName.toLowerCase().replace(/\s+/g, '_')}_${res.monthYear}.pdf`);
    showToast(`Holerite de ${res.employeeName} gerado com sucesso!`);
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
          <span className="text-[10px] text-zinc-400">Crepelocks Folha</span>
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
          {canDownload ? (
            <button
              onClick={handleExportPayrollCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-all flex items-center gap-1.5 shadow hover:scale-[1.02]"
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card/40 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Bruto da Folha</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-black text-foreground">
            R$ {grandTotals.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Base R$ {grandTotals.totalBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + R$ {grandTotals.totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} grat.
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/40 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total de Descontos</span>
            <Percent className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-xl font-black text-rose-400">
            R$ {grandTotals.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            INSS R$ {grandTotals.totalInss.toFixed(2)} • IRPF R$ {grandTotals.totalIrpf.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-medium">
            <span>Líquido a Pagar</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-400">
            R$ {grandTotals.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-emerald-300/70">
            {payrollResults.length} colaboradores na folha
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/40 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>FGTS Patronal (8%)</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl font-black text-blue-400">
            R$ {grandTotals.totalFgts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Custo patronal informativo
          </div>
        </div>
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
              <option value="2026-10">Outubro / 2026</option>
              <option value="2026-09">Setembro / 2026</option>
              <option value="2026-08">Agosto / 2026</option>
              <option value="2026-11">Novembro / 2026</option>
              <option value="2026-12">Dezembro / 2026</option>
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
              <option value="all">Todas as Lojas & Sede</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
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
              {payrollResults.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-muted-foreground text-xs">
                    Nenhum colaborador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                payrollResults.map((res) => {
                  const emp = users.find((u) => u.id === res.employeeId);
                  const cfg = configs[res.employeeId];
                  const isOwner = res.role === 'dono';

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
                        <span className="font-medium text-foreground block truncate max-w-[140px]" title={res.positionTitle}>
                          {res.positionTitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[140px]">
                          {isOwner ? '👑 Diretor / Sócio' : res.storeName}
                        </span>
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
            {payrollResults.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60 font-bold text-foreground">
                  <td colSpan={2} className="py-3.5 px-3.5 text-xs">
                    TOTAL GERAL CONSOLIDADO ({payrollResults.length} Registros)
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs">
                    R$ {grandTotals.totalBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-emerald-400">
                    R$ {grandTotals.totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {grandTotals.totalVt.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {grandTotals.totalVrVa.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {grandTotals.totalInss.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {grandTotals.totalIrpf.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-rose-400">
                    R$ {grandTotals.totalOther.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-sm font-black text-emerald-400">
                    R$ {grandTotals.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

                  <div>
                    <label className="block text-muted-foreground mb-1 font-semibold">
                      Dependentes (Salário Família / IRPF):
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="10"
                      value={formDependents}
                      onChange={(e) => setFormDependents(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeExtrasCheck"
                    checked={formIncludeExtras}
                    onChange={(e) => setFormIncludeExtras(e.target.checked)}
                    className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="includeExtrasCheck" className="text-muted-foreground">
                    Calcular horas extras automaticamente com base nas marcações de ponto do mês (50% CLT)
                  </label>
                </div>
              </div>

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
                      Conforme política interna Crepelocks
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

      {/* MODAL: Visualização Rápida de Holerite */}
      {viewingHolerite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Demonstrativo de Holerite ({viewingHolerite.monthYear})</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  {viewingHolerite.employeeName} • {viewingHolerite.positionTitle}
                </span>
              </div>
              <button
                onClick={() => setViewingHolerite(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Proventos */}
              <div className="border border-border rounded-xl p-3 bg-muted/20">
                <span className="font-bold text-emerald-400 text-xs block mb-2">Proventos (+)</span>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salário Base / Pró-Labore:</span>
                    <span className="font-semibold text-foreground">R$ {viewingHolerite.baseSalary.toFixed(2)}</span>
                  </div>
                  {viewingHolerite.bonusGratification > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gratificação de Salário:</span>
                      <span className="font-semibold text-emerald-400">+ R$ {viewingHolerite.bonusGratification.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingHolerite.extraHoursPay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horas Extras ({viewingHolerite.extraHoursCount}h):</span>
                      <span className="font-semibold text-emerald-400">+ R$ {viewingHolerite.extraHoursPay.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingHolerite.insalubridadePay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Insalubridade:</span>
                      <span className="font-semibold text-emerald-400">+ R$ {viewingHolerite.insalubridadePay.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border flex justify-between font-bold text-foreground">
                    <span>Total Bruto:</span>
                    <span>R$ {viewingHolerite.totalGross.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Descontos */}
              <div className="border border-border rounded-xl p-3 bg-muted/20">
                <span className="font-bold text-rose-400 text-xs block mb-2">Descontos (-)</span>
                <div className="space-y-1.5 font-mono">
                  {viewingHolerite.inssDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">INSS ({viewingHolerite.inssEffectivePct}%):</span>
                      <span className="font-semibold text-rose-400">- R$ {viewingHolerite.inssDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingHolerite.irpfDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IRPF ({viewingHolerite.irpfEffectivePct}%):</span>
                      <span className="font-semibold text-rose-400">- R$ {viewingHolerite.irpfDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingHolerite.vtDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vale Transporte ({viewingHolerite.vtEffectivePct}%):</span>
                      <span className="font-semibold text-rose-400">- R$ {viewingHolerite.vtDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingHolerite.vrVaDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vale Refeição/PAT ({viewingHolerite.vrVaEffectivePct}%):</span>
                      <span className="font-semibold text-rose-400">- R$ {viewingHolerite.vrVaDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingHolerite.otherDiscounts > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outros Descontos:</span>
                      <span className="font-semibold text-rose-400">- R$ {viewingHolerite.otherDiscounts.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border flex justify-between font-bold text-rose-400">
                    <span>Total de Descontos:</span>
                    <span>- R$ {viewingHolerite.totalDiscounts.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Salário Líquido */}
              <div className="p-3.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-between">
                <span className="font-bold text-emerald-300 text-xs">VALOR LÍQUIDO A RECEBER:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  R$ {viewingHolerite.netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-border">
              <button
                onClick={() => setViewingHolerite(null)}
                className="px-4 py-1.5 rounded-xl border border-border text-xs text-foreground hover:bg-muted font-semibold"
              >
                Fechar
              </button>
              <button
                onClick={() => handleGenerateHoleritePdf(viewingHolerite)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
