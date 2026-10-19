import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  Plus,
  Trash2,
  HeartHandshake,
  Stethoscope,
  Scale,
  Award,
  CreditCard,
  Briefcase,
  ChevronRight,
  Sparkles,
  Info,
  Filter,
  Search,
  Check,
  X,
  FileCheck,
  Building2,
  Percent
} from 'lucide-react';
import {
  UserAccount,
  Store,
  VacationRecord,
  ThirteenthSalaryRecord,
  MedicalExamRecord,
  DisciplinaryNoticeRecord,
  EmployeeBenefitCard
} from '../types';
import { StorageService } from '../services/storage';
import { PayrollCalculatorService } from '../services/payrollCalculator';
import { jsPDF } from 'jspdf';

interface CompleteHRSuiteProps {
  users: UserAccount[];
  stores: Store[];
  currentUser: UserAccount;
  onDataUpdated: () => void;
}

export const CompleteHRSuite: React.FC<CompleteHRSuiteProps> = ({
  users,
  stores,
  currentUser,
  onDataUpdated
}) => {
  // Tabs for the complete HR Suite
  const [activeSubTab, setActiveSubTab] = useState<
    'ferias' | 'decimo' | 'beneficios' | 'medicina' | 'disciplinar' | 'ficha'
  >('ferias');

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // State for data
  const [vacations, setVacations] = useState<VacationRecord[]>(() => StorageService.getVacations());
  const [thirteenthRecords, setThirteenthRecords] = useState<ThirteenthSalaryRecord[]>(() =>
    StorageService.getThirteenthSalaries()
  );
  const [medicalExams, setMedicalExams] = useState<MedicalExamRecord[]>(() => StorageService.getMedicalExams());
  const [disciplinaryNotices, setDisciplinaryNotices] = useState<DisciplinaryNoticeRecord[]>(() =>
    StorageService.getDisciplinaryNotices()
  );
  const [benefitCards, setBenefitCards] = useState<EmployeeBenefitCard[]>(() => StorageService.getBenefitCards());

  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const filteredEmployees = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.cpf?.includes(searchTerm) ||
        u.positionTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStore = storeFilter === 'all' || u.storeId === storeFilter || u.payrollStoreId === storeFilter;
      return matchesSearch && matchesStore;
    });
  }, [users, searchTerm, storeFilter]);

  // ==========================================
  // MODAL STATES
  // ==========================================
  // Férias Modal
  const [showVacationModal, setShowVacationModal] = useState<boolean>(false);
  const [vacationEmpId, setVacationEmpId] = useState<string>('');
  const [vacationDays, setVacationDays] = useState<number>(30);
  const [vacationStartDate, setVacationStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 35); // 30+ dias de aviso prévio
    return d.toISOString().split('T')[0];
  });
  const [vacationSellAbono, setVacationSellAbono] = useState<boolean>(false);
  const [vacationAbonoDays, setVacationAbonoDays] = useState<number>(10);
  const [vacationAdvance13th, setVacationAdvance13th] = useState<boolean>(false);
  const [vacationNotes, setVacationNotes] = useState<string>('');

  // 13º Salário Simulation Year
  const [thirteenthYear, setThirteenthYear] = useState<number>(() => new Date().getFullYear());

  // Novo Exame Médico (ASO) Modal
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [examEmpId, setExamEmpId] = useState<string>('');
  const [examType, setExamType] = useState<MedicalExamRecord['examType']>('periodico');
  const [examClinic, setExamClinic] = useState<string>('Clínica MedTrabalho Rio');
  const [examDoctor, setExamDoctor] = useState<string>('Dra. Beatriz Mendes');
  const [examCrm, setExamCrm] = useState<string>('CRM-RJ 984512');
  const [examDate, setExamDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [examExpiration, setExamExpiration] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [examResult, setExamResult] = useState<MedicalExamRecord['result']>('apto');
  const [examNotes, setExamNotes] = useState<string>('');

  // Nova Medida Disciplinar Modal
  const [showDisciplinaryModal, setShowDisciplinaryModal] = useState<boolean>(false);
  const [discEmpId, setDiscEmpId] = useState<string>('');
  const [discType, setDiscType] = useState<DisciplinaryNoticeRecord['type']>('advertencia_escrita');
  const [discSuspensionDays, setDiscSuspensionDays] = useState<number>(1);
  const [discReason, setDiscReason] = useState<DisciplinaryNoticeRecord['cltReason']>('atrasos_reiterados');
  const [discDetails, setDiscDetails] = useState<string>('');
  const [discWitness1, setDiscWitness1] = useState<string>('');
  const [discWitness2, setDiscWitness2] = useState<string>('');

  // Visualização de Ficha de Registro
  const [viewingFichaEmp, setViewingFichaEmp] = useState<UserAccount | null>(null);

  // Helper to get base salary of an employee
  const getEmployeeSalary = (empId: string): number => {
    const cfg = StorageService.getPayrollConfigs().find((c) => c.employeeId === empId);
    if (cfg && cfg.baseSalary > 0) return cfg.baseSalary;
    const emp = users.find((u) => u.id === empId);
    return emp?.role === 'dono' ? 12500 : 1600;
  };

  // Helper to format currency
  const fmtMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ==========================================
  // HANDLERS: FÉRIAS
  // ==========================================
  const handleSaveVacation = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = users.find((u) => u.id === vacationEmpId);
    if (!emp) {
      showToast('Selecione um colaborador válido.');
      return;
    }

    const salary = getEmployeeSalary(emp.id);
    const dailyRate = salary / 30;

    const actualDays = vacationSellAbono ? vacationDays - vacationAbonoDays : vacationDays;
    const vacationPay = dailyRate * actualDays;
    const oneThird = vacationPay / 3;

    const abonoPay = vacationSellAbono ? dailyRate * vacationAbonoDays : 0;
    const abonoOneThird = abonoPay / 3;

    const advance13th = vacationAdvance13th ? salary * 0.5 : 0;

    // INSS & IRRF sobre as férias
    const inss = PayrollCalculatorService.calculateCltInss(vacationPay + oneThird).amount;
    const irrf = PayrollCalculatorService.calculateCltIrpf(
      vacationPay + oneThird,
      inss,
      emp.dependentsList?.filter((d) => d.eligibleIrpfDeduction).length || 0
    ).amount;

    const netPay = vacationPay + oneThird + abonoPay + abonoOneThird + advance13th - (inss + irrf);

    const start = new Date(vacationStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + actualDays - 1);

    // Período concessivo é 1 ano após o aquisitivo
    const adm = new Date(emp.admissionDate || '2025-01-01');
    const aqEnd = new Date(adm);
    aqEnd.setFullYear(aqEnd.getFullYear() + 1);
    const concEnd = new Date(aqEnd);
    concEnd.setFullYear(concEnd.getFullYear() + 1);

    const newVac: VacationRecord = {
      id: `vac-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      storeId: emp.storeId,
      aquisitiveStart: adm.toISOString().split('T')[0],
      aquisitiveEnd: aqEnd.toISOString().split('T')[0],
      concessiveEnd: concEnd.toISOString().split('T')[0],
      daysEntitled: 30,
      daysTaken: actualDays,
      startDate: vacationStartDate,
      endDate: end.toISOString().split('T')[0],
      sellAbonoPecuniario: vacationSellAbono,
      abonoDays: vacationSellAbono ? vacationAbonoDays : 0,
      advanceFirstThirteenth: vacationAdvance13th,
      baseSalary: salary,
      vacationPay,
      oneThirdBonus: oneThird,
      abonoPay,
      abonoOneThirdPay: abonoOneThird,
      advanceThirteenthAmount: advance13th,
      inssDiscount: inss,
      irpfDiscount: irrf,
      netVacationPay: netPay,
      status: 'aprovada',
      noticeDate: new Date().toISOString().split('T')[0],
      notes: vacationNotes.trim(),
      createdAt: new Date().toISOString()
    };

    StorageService.addVacation(newVac);
    setVacations(StorageService.getVacations());
    setShowVacationModal(false);
    onDataUpdated();
    showToast(`Férias de ${emp.name} programadas com sucesso!`);
  };

  // Generate Official Recibo de Férias PDF
  const handleGenerateVacationPdf = (vac: VacationRecord) => {
    const emp = users.find((u) => u.id === vac.employeeId);
    const store = stores.find((s) => s.id === vac.storeId) || stores[0];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header institucional
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, 182, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RECIBO DE PAGAMENTO DE FÉRIAS - CLT', 18, 21);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(`Art. 129 a 153 da CLT • Constituição Federal Art. 7º, XVII • Empregador: ${(store.razaoSocial || store.name).toUpperCase()}`, 18, 28);

    // Box Empresa e Colaborador
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 38, 182, 34, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 38, 182, 34, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Razão Social: ${store.razaoSocial || store.name}`, 18, 44);
    doc.text(`CNPJ: ${store.cnpj || 'Não informado'}`, 120, 44);

    doc.setFont('helvetica', 'normal');
    doc.text(`Colaborador(a): ${vac.employeeName.toUpperCase()}`, 18, 51);
    doc.text(`CPF: ${emp?.cpf || '000.000.000-00'}`, 120, 51);
    doc.text(`Cargo: ${emp?.positionTitle || 'Atendente'}`, 18, 57);
    doc.text(`Data de Admissão: ${emp?.admissionDate || 'Não informada'}`, 120, 57);
    doc.text(`Período Aquisitivo: ${vac.aquisitiveStart} até ${vac.aquisitiveEnd}`, 18, 64);
    doc.text(`Período de Gozo: ${vac.startDate} até ${vac.endDate} (${vac.daysTaken} dias)`, 120, 64);

    // Tabela de Verbas
    doc.setFillColor(30, 41, 59);
    doc.rect(14, 76, 182, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CÓD', 18, 81);
    doc.text('DESCRIÇÃO DA VERBA DE FÉRIAS', 32, 81);
    doc.text('REF', 105, 81);
    doc.text('PROVENTOS (R$)', 130, 81);
    doc.text('DESCONTOS (R$)', 165, 81);

    let y = 89;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');

    const lines = [
      { cod: '101', desc: `REMUNERAÇÃO DOS DIAS DE FÉRIAS (${vac.daysTaken} DIAS)`, ref: `${vac.daysTaken}d`, prov: vac.vacationPay, desc: 0 },
      { cod: '102', desc: '1/3 CONSTITUCIONAL DE FÉRIAS (ART. 7º, XVII CF)', ref: '33.33%', prov: vac.oneThirdBonus, desc: 0 }
    ];

    if (vac.sellAbonoPecuniario && vac.abonoPay > 0) {
      lines.push({ cod: '105', desc: `ABONO PECUNIÁRIO (VENDA DE ${vac.abonoDays} DIAS - ART. 143 CLT)`, ref: `${vac.abonoDays}d`, prov: vac.abonoPay, desc: 0 });
      lines.push({ cod: '106', desc: '1/3 CONSTITUCIONAL SOBRE O ABONO PECUNIÁRIO', ref: '33.33%', prov: vac.abonoOneThirdPay, desc: 0 });
    }

    if (vac.advanceFirstThirteenth && vac.advanceThirteenthAmount > 0) {
      lines.push({ cod: '120', desc: 'ADIANTAMENTO DA 1ª PARCELA DO 13º SALÁRIO', ref: '50%', prov: vac.advanceThirteenthAmount, desc: 0 });
    }

    if (vac.inssDiscount > 0) {
      lines.push({ cod: '501', desc: 'CONTRIBUIÇÃO PREVIDENCIÁRIA INSS S/ FÉRIAS', ref: 'Tabela', prov: 0, desc: vac.inssDiscount });
    }

    if (vac.irpfDiscount > 0) {
      lines.push({ cod: '502', desc: 'IMPOSTO DE RENDA RETIDO NA FONTE (IRRF) S/ FÉRIAS', ref: 'Tabela', prov: 0, desc: vac.irpfDiscount });
    }

    lines.forEach((l) => {
      doc.text(l.cod, 18, y);
      doc.text(l.desc, 32, y);
      doc.text(l.ref, 105, y);
      doc.text(l.prov > 0 ? l.prov.toFixed(2) : '-', 135, y);
      doc.text(l.desc > 0 ? l.desc.toFixed(2) : '-', 170, y);
      y += 6;
    });

    // Box Totais
    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 16, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, 16, 'D');

    const totalProv = vac.vacationPay + vac.oneThirdBonus + vac.abonoPay + vac.abonoOneThirdPay + vac.advanceThirteenthAmount;
    const totalDesc = vac.inssDiscount + vac.irpfDiscount;

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Bruto: R$ ${totalProv.toFixed(2)}`, 18, y + 6);
    doc.text(`Total Descontos: R$ ${totalDesc.toFixed(2)}`, 85, y + 6);
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(10);
    doc.text(`VALOR LÍQUIDO A RECEBER: R$ ${vac.netVacationPay.toFixed(2)}`, 18, y + 12);

    // Canhoto de quitação
    y += 24;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Declaro ter recebido adiantadamente da empresa a importância líquida supra descrita, referente ao pagamento das minhas férias relativas ao período aquisitivo citado, dando plena, rasa e irrevogável quitação.',
      18,
      y,
      { maxWidth: 174 }
    );

    y += 18;
    doc.line(18, y, 100, y);
    doc.line(115, y, 180, y);
    doc.setFontSize(7.5);
    doc.text('Assinatura do Colaborador', 35, y + 4);
    doc.text('Data e Quitação da Empresa', 130, y + 4);

    doc.save(`recibo_ferias_${vac.employeeName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    showToast(`PDF do recibo de férias de ${vac.employeeName} gerado com sucesso!`);
  };

  // ==========================================
  // HANDLERS: 13º SALÁRIO
  // ==========================================
  // Calculate 13th preview for all employees
  const thirteenthList = useMemo(() => {
    return filteredEmployees.map((emp) => {
      const salary = getEmployeeSalary(emp.id);
      const adm = new Date(emp.admissionDate || `${thirteenthYear}-01-01`);
      
      // Calculate months worked in current year
      let monthsWorked = 12;
      if (adm.getFullYear() === thirteenthYear) {
        const admMonth = adm.getMonth(); // 0-indexed
        const admDay = adm.getDate();
        // Art. 1º § 2º Lei 4.090/62: fração igual ou superior a 15 dias trabalhados confere 1 avo
        monthsWorked = admDay <= 15 ? 12 - admMonth : 12 - admMonth - 1;
        monthsWorked = Math.max(1, Math.min(12, monthsWorked));
      } else if (adm.getFullYear() > thirteenthYear) {
        monthsWorked = 0;
      }

      const totalDueYear = (salary / 12) * monthsWorked;
      const firstInstallmentGross = totalDueYear * 0.5; // 50% sem descontos

      const inss = PayrollCalculatorService.calculateCltInss(totalDueYear).amount;
      const irrf = PayrollCalculatorService.calculateCltIrpf(
        totalDueYear,
        inss,
        emp.dependentsList?.filter((d) => d.eligibleIrpfDeduction).length || 0
      ).amount;

      const secondInstallmentGross = totalDueYear - firstInstallmentGross;
      const secondInstallmentNet = Math.max(0, totalDueYear - firstInstallmentGross - (inss + irrf));

      const existingRecord = thirteenthRecords.find((r) => r.employeeId === emp.id && r.year === thirteenthYear);

      return {
        emp,
        salary,
        monthsWorked,
        totalDueYear,
        firstInstallmentGross,
        secondInstallmentGross,
        inssSecondInstallment: inss,
        irpfSecondInstallment: irrf,
        secondInstallmentNet,
        paidFirst: existingRecord?.paidFirstInstallment || false,
        paidSecond: existingRecord?.paidSecondInstallment || false
      };
    });
  }, [filteredEmployees, thirteenthYear, thirteenthRecords]);

  const handleToggle13thPayment = (empId: string, installment: 'first' | 'second') => {
    const target = thirteenthList.find((t) => t.emp.id === empId);
    if (!target) return;

    const existing = thirteenthRecords.find((r) => r.employeeId === empId && r.year === thirteenthYear);
    const updated: ThirteenthSalaryRecord = existing || {
      id: `13th-${empId}-${thirteenthYear}`,
      employeeId: empId,
      employeeName: target.emp.name,
      storeId: target.emp.storeId,
      year: thirteenthYear,
      monthsWorked: target.monthsWorked,
      baseSalary: target.salary,
      firstInstallmentGross: target.firstInstallmentGross,
      secondInstallmentGross: target.secondInstallmentGross,
      inssSecondInstallment: target.inssSecondInstallment,
      irpfSecondInstallment: target.irpfSecondInstallment,
      secondInstallmentNet: target.secondInstallmentNet,
      totalGrossYear: target.totalDueYear,
      totalNetYear: target.firstInstallmentGross + target.secondInstallmentNet,
      paidFirstInstallment: false,
      paidSecondInstallment: false,
      createdAt: new Date().toISOString()
    };

    if (installment === 'first') {
      updated.paidFirstInstallment = !updated.paidFirstInstallment;
      updated.firstInstallmentPaymentDate = updated.paidFirstInstallment ? new Date().toISOString().split('T')[0] : undefined;
    } else {
      updated.paidSecondInstallment = !updated.paidSecondInstallment;
      updated.secondInstallmentPaymentDate = updated.paidSecondInstallment ? new Date().toISOString().split('T')[0] : undefined;
    }

    StorageService.updateThirteenthSalary(updated);
    setThirteenthRecords(StorageService.getThirteenthSalaries());
    showToast(`Status da parcela do 13º de ${target.emp.name} atualizado!`);
  };

  // ==========================================
  // HANDLERS: ASO & MEDICINA DO TRABALHO
  // ==========================================
  const handleSaveMedicalExam = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = users.find((u) => u.id === examEmpId);
    if (!emp) {
      showToast('Selecione um colaborador.');
      return;
    }

    const newExam: MedicalExamRecord = {
      id: `exam-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      storeId: emp.storeId,
      examType,
      clinicName: examClinic.trim(),
      doctorName: examDoctor.trim(),
      doctorCrm: examCrm.trim(),
      examDate,
      expirationDate: examExpiration,
      result: examResult,
      notes: examNotes.trim(),
      createdAt: new Date().toISOString()
    };

    StorageService.addMedicalExam(newExam);
    setMedicalExams(StorageService.getMedicalExams());
    setShowExamModal(false);
    onDataUpdated();
    showToast(`Exame ASO de ${emp.name} registrado com sucesso!`);
  };

  // ==========================================
  // HANDLERS: MEDIDAS DISCIPLINARES
  // ==========================================
  const handleSaveDisciplinary = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = users.find((u) => u.id === discEmpId);
    if (!emp) {
      showToast('Selecione um colaborador.');
      return;
    }

    const reasonLabels: Record<DisciplinaryNoticeRecord['cltReason'], string> = {
      desidia: 'Desídia no Desempenho das Funções (Art. 482 "e" CLT)',
      atrasos_reiterados: 'Atrasos Reiterados e Faltas Injustificadas (Art. 482 "e" CLT)',
      indisciplina_insubordinacao: 'Indisciplina ou Insubordinação (Art. 482 "h" CLT)',
      desrespeito_chefia: 'Desrespeito à Liderança / Colegas (Art. 482 "j" CLT)',
      abandono_posto: 'Abandono Momentâneo do Posto de Atendimento',
      outros: 'Descumprimento de Normas Internas'
    };

    const newNotice: DisciplinaryNoticeRecord = {
      id: `disc-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      storeId: emp.storeId,
      type: discType,
      suspensionDays: discType === 'suspensao_disciplinar' ? discSuspensionDays : 0,
      cltReason: discReason,
      cltReasonLabel: reasonLabels[discReason],
      occurrenceDate: new Date().toISOString().split('T')[0],
      incidentDetails: discDetails.trim(),
      witness1Name: discWitness1.trim(),
      witness2Name: discWitness2.trim(),
      signedByEmployee: true,
      managerSignerName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    StorageService.addDisciplinaryNotice(newNotice);
    setDisciplinaryNotices(StorageService.getDisciplinaryNotices());
    setShowDisciplinaryModal(false);
    onDataUpdated();
    showToast(`Medida disciplinar formalizada no prontuário de ${emp.name}!`);
  };

  // Generate Disciplinary PDF Term
  const handleGenerateDisciplinaryPdf = (notice: DisciplinaryNoticeRecord) => {
    const emp = users.find((u) => u.id === notice.employeeId);
    const store = stores.find((s) => s.id === notice.storeId) || stores[0];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, 182, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const title = notice.type === 'suspensao_disciplinar' ? 'TERMO DE SUSPENSÃO DISCIPLINAR' : 'TERMO DE ADVERTÊNCIA DISCIPLINAR ESCRITA';
    doc.text(title, 18, 22);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(`Fundamentação Legal: CLT Art. 482 • Empregador: ${(store.razaoSocial || store.name).toUpperCase()}`, 18, 28);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(`A(o) Colaborador(a): ${notice.employeeName.toUpperCase()}`, 18, 45);
    doc.text(`CPF: ${emp?.cpf || '000.000.000-00'} • Cargo: ${emp?.positionTitle || 'Atendente'}`, 18, 51);
    doc.text(`Unidade: ${store.name} • Data do Fato: ${notice.occurrenceDate}`, 18, 57);

    doc.setFont('helvetica', 'bold');
    doc.text(`Motivo Legal Enquadrado: ${notice.cltReasonLabel}`, 18, 67);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const bodyText = `Vimos por meio deste notificar-lhe formalmente quanto ao descumprimento dos deveres contratuais estabelecidos pela legislação trabalhista e regimento interno. Constatou-se a seguinte ocorrência:\n\n"${notice.incidentDetails}"\n\n${
      notice.type === 'suspensao_disciplinar'
        ? `Diante da gravidade da conduta, aplicamos a penalidade de SUSPENSÃO DISCIPLINAR por ${notice.suspensionDays} dia(s), período no qual haverá perda da respectiva remuneração e do Repouso Semanal Remunerado (DSR).`
        : 'Esta advertência tem caráter corretivo e pedagógico, servindo como alerta formal para que condutas similares não tornem a se repetir, sob pena de medidas mais severas, inclusive demissão por justa causa (Art. 482 da CLT).'
    }`;

    doc.text(bodyText, 18, 76, { maxWidth: 174 });

    const y = 160;
    doc.text('Ciente do Colaborador em ____/____/________', 18, y);
    doc.line(18, y + 15, 90, y + 15);
    doc.text(notice.employeeName, 18, y + 19);

    doc.line(110, y + 15, 182, y + 15);
    doc.text(`Liderança / DP: ${notice.managerSignerName}`, 110, y + 19);

    if (notice.witness1Name) {
      doc.text('Testemunhas presenciais (em caso de recusa de assinatura):', 18, y + 32);
      doc.line(18, y + 45, 90, y + 45);
      doc.text(`1. ${notice.witness1Name}`, 18, y + 49);
      if (notice.witness2Name) {
        doc.line(110, y + 45, 182, y + 45);
        doc.text(`2. ${notice.witness2Name}`, 110, y + 49);
      }
    }

    doc.save(`medida_disciplinar_${notice.employeeName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    showToast('Termo disciplinar gerado em PDF com sucesso!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 border border-emerald-500/50 text-emerald-300 shadow-2xl text-xs font-medium animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/5 pointer-events-none rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Módulo RH & Departamento Pessoal CLT Completo</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Recursos Humanos & Departamento Pessoal CLT</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Gestão integral e em conformidade estrita com a CLT: Controle de Férias e 1/3 Constitucional, Gratificação Natalina (13º),
              Medicina Ocupacional (PCMSO/ASO), Gestão Disciplinar e Prontuários Funcionais.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">Colaboradores</span>
              <strong className="text-lg font-black text-white font-mono">{users.length}</strong>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-emerald-400 block uppercase font-bold">Férias Ativas</span>
              <strong className="text-lg font-black text-emerald-400 font-mono">{vacations.length}</strong>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-blue-400 block uppercase font-bold">Exames ASO</span>
              <strong className="text-lg font-black text-blue-400 font-mono">{medicalExams.length}</strong>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[10px] text-amber-400 block uppercase font-bold">Medidas Disc.</span>
              <strong className="text-lg font-black text-amber-400 font-mono">{disciplinaryNotices.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveSubTab('ferias')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'ferias'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>🌴 Férias & 1/3 (CLT Art. 129)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('decimo')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'decimo'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>🎁 13º Salário & Provisões</span>
        </button>

        <button
          onClick={() => setActiveSubTab('beneficios')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'beneficios'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>💳 Benefícios (VT, VR/VA, Planos)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('medicina')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'medicina'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>🩺 Saúde Ocupacional (ASO / PCMSO)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('disciplinar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'disciplinar'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>⚖️ Gestão Disciplinar (Art. 482)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ficha')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'ficha'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>📄 Ficha de Registro de Empregado</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: FÉRIAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'ferias' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Programação e Recibos de Férias CLT</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Cálculo de 30 dias (ou fracionado), 1/3 constitucional, abono pecuniário (venda de 10 dias) e dedução oficial de INSS/IRRF.
              </p>
            </div>
            <button
              onClick={() => {
                setVacationEmpId(users[0]?.id || '');
                setShowVacationModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Programar / Simular Férias</span>
            </button>
          </div>

          {/* Lista de Férias Programadas */}
          {vacations.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhuma programação de férias registrada no momento.</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Clique em "Programar / Simular Férias" para calcular o 1/3 constitucional e emitir o recibo oficial.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 font-bold">
                    <tr>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Período de Gozo</th>
                      <th className="px-4 py-3">Dias / Abono</th>
                      <th className="px-4 py-3">Remuneração Base</th>
                      <th className="px-4 py-3">1/3 Constitucional</th>
                      <th className="px-4 py-3">Líquido a Pagar</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
                    {vacations.map((vac) => (
                      <tr key={vac.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-sans font-semibold text-white">
                          {vac.employeeName}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {vac.startDate} até {vac.endDate}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {vac.daysTaken} dias {vac.sellAbonoPecuniario ? `(+ ${vac.abonoDays}d abono)` : ''}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {fmtMoney(vac.vacationPay)}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">
                          +{fmtMoney(vac.oneThirdBonus)}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400 text-xs">
                          {fmtMoney(vac.netVacationPay)}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                            {vac.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleGenerateVacationPdf(vac)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              title="Baixar Recibo Oficial de Férias PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>Recibo PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                StorageService.deleteVacation(vac.id);
                                setVacations(StorageService.getVacations());
                                showToast('Férias removidas.');
                              }}
                              className="p-1 rounded-lg hover:bg-rose-950/50 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: 13º SALÁRIO & PROVISÕES */}
      {/* ========================================================================= */}
      {activeSubTab === 'decimo' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Gestão da Gratificação Natalina (13º Salário) - Ano {thirteenthYear}</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                1ª Parcela (50% sem descontos até 30/nov) e 2ª Parcela (com dedução integral de INSS e IRRF até 20/dez).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400 font-semibold">Exercício:</label>
              <select
                value={thirteenthYear}
                onChange={(e) => setThirteenthYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-xs"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 font-bold">
                  <tr>
                    <th className="px-4 py-3">Colaborador</th>
                    <th className="px-4 py-3">Admissão</th>
                    <th className="px-4 py-3">Avos Devidos</th>
                    <th className="px-4 py-3">Salário Base</th>
                    <th className="px-4 py-3">1ª Parcela (Adiantamento)</th>
                    <th className="px-4 py-3">INSS / IRRF 2ª Parcela</th>
                    <th className="px-4 py-3">2ª Parcela (Líquido)</th>
                    <th className="px-4 py-3 text-right">Quitação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
                  {thirteenthList.map((item) => (
                    <tr key={item.emp.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-sans font-semibold text-white">
                        {item.emp.name}
                        <span className="block text-[10px] text-zinc-500 font-normal">{item.emp.positionTitle}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{item.emp.admissionDate || '-'}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">{item.monthsWorked}/12 avos</td>
                      <td className="px-4 py-3 text-zinc-300">{fmtMoney(item.salary)}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-white block">{fmtMoney(item.firstInstallmentGross)}</span>
                        <span className="text-[10px] text-zinc-500 font-sans">Sem descontos</span>
                      </td>
                      <td className="px-4 py-3 text-rose-400">
                        -{fmtMoney(item.inssSecondInstallment + item.irpfSecondInstallment)}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-400 text-xs">
                        {fmtMoney(item.secondInstallmentNet)}
                      </td>
                      <td className="px-4 py-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggle13thPayment(item.emp.id, 'first')}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                              item.paidFirst
                                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                            }`}
                          >
                            {item.paidFirst ? '✓ 1ª Parcela Paga' : 'Pagar 1ª Parc.'}
                          </button>
                          <button
                            onClick={() => handleToggle13thPayment(item.emp.id, 'second')}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                              item.paidSecond
                                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                            }`}
                          >
                            {item.paidSecond ? '✓ 2ª Parcela Paga' : 'Pagar 2ª Parc.'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: BENEFÍCIOS (VT, VR/VA, PLANOS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'beneficios' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Gestão de Benefícios & Encargos Sociais CLT</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Vale Transporte (limite legal de 6% sobre salário básico - Lei 7.418/85), Vale Refeição / Alimentação (PAT) e Planos de Saúde.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEmployees.map((emp) => {
              const salary = getEmployeeSalary(emp.id);
              const vtMaxDiscount = salary * 0.06;
              const vrEstimated = 550; // Média mensal
              const vrDiscount = vrEstimated * 0.05; // 5% política PAT

              return (
                <div key={emp.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div>
                      <h4 className="text-xs font-bold text-white">{emp.name}</h4>
                      <span className="text-[10px] text-zinc-400">{emp.positionTitle} • Salário Base: {fmtMoney(salary)}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-emerald-400">
                      CLT Ativo
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* VT */}
                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                          VT
                        </div>
                        <div>
                          <span className="font-semibold text-white block text-[11px]">Vale Transporte (Bilhete Único / Riocard)</span>
                          <span className="text-[10px] text-zinc-500">Teto Legal: 6% do salário</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-400 text-xs block">-{fmtMoney(vtMaxDiscount)}</span>
                        <span className="text-[10px] text-zinc-500">Desconto em Folha</span>
                      </div>
                    </div>

                    {/* VR / VA */}
                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          VR
                        </div>
                        <div>
                          <span className="font-semibold text-white block text-[11px]">Vale Refeição / Alimentação (PAT)</span>
                          <span className="text-[10px] text-zinc-500">Carga Mensal estimada: R$ 550,00</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-400 text-xs block">-{fmtMoney(vrDiscount)}</span>
                        <span className="text-[10px] text-zinc-500">5% Coparticipação</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MEDICINA OCUPACIONAL & ASO */}
      {/* ========================================================================= */}
      {activeSubTab === 'medicina' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                <span>Programa de Controle Médico de Saúde Ocupacional (PCMSO / NR-7)</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Controle rigoroso de ASO (Admissional, Periódico anual, Retorno ao Trabalho e Demissional).
              </p>
            </div>
            <button
              onClick={() => {
                setExamEmpId(users[0]?.id || '');
                setShowExamModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Novo ASO</span>
            </button>
          </div>

          {medicalExams.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400">
              <Stethoscope className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhum exame médico ASO registrado ainda.</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Cadastre os exames admissionais e periódicos para manter a empresa em conformidade com o eSocial e a NR-7.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 font-bold">
                    <tr>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Tipo de Exame</th>
                      <th className="px-4 py-3">Clínica & Médico</th>
                      <th className="px-4 py-3">Data do Exame</th>
                      <th className="px-4 py-3">Validade ASO</th>
                      <th className="px-4 py-3">Resultado</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
                    {medicalExams.map((exam) => {
                      const isExpired = new Date(exam.expirationDate) < new Date();
                      return (
                        <tr key={exam.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 font-sans font-semibold text-white">
                            {exam.employeeName}
                          </td>
                          <td className="px-4 py-3 font-sans">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/60 border border-blue-500/40 text-blue-400 uppercase">
                              {exam.examType.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 font-sans">
                            {exam.clinicName}
                            <span className="block text-[10px] text-zinc-500">{exam.doctorName} ({exam.doctorCrm})</span>
                          </td>
                          <td className="px-4 py-3 text-zinc-300">{exam.examDate}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {exam.expirationDate}
                            </span>
                            {isExpired && <span className="block text-[9px] text-rose-500 font-sans">VENCIDO</span>}
                          </td>
                          <td className="px-4 py-3 font-sans">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-500 text-emerald-400">
                              ✓ APTO
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-sans">
                            <button
                              onClick={() => {
                                StorageService.deleteMedicalExam(exam.id);
                                setMedicalExams(StorageService.getMedicalExams());
                                showToast('Registro médico removido.');
                              }}
                              className="p-1 rounded-lg hover:bg-rose-950/50 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: GESTÃO DISCIPLINAR (CLT ART. 482) */}
      {/* ========================================================================= */}
      {activeSubTab === 'disciplinar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>Gestão Disciplinar & Prontuário Funcional (CLT Art. 482)</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Aplicação pedagógica de medidas disciplinares (Orientação verbal, advertência escrita formal e suspensão disciplinar com perda de salário e DSR).
              </p>
            </div>
            <button
              onClick={() => {
                setDiscEmpId(users[0]?.id || '');
                setShowDisciplinaryModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Formalizar Notificação Disciplinar</span>
            </button>
          </div>

          {disciplinaryNotices.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400">
              <Scale className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhuma ocorrência disciplinar formalizada até o momento.</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Todas as advertências ou suspensões registradas aqui geram documentação jurídica pronta para impressão com assinatura de testemunhas.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 font-bold">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Tipo de Medida</th>
                      <th className="px-4 py-3">Enquadramento Legal CLT</th>
                      <th className="px-4 py-3">Detalhes do Ocorrido</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-[11px]">
                    {disciplinaryNotices.map((n) => (
                      <tr key={n.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-zinc-400">{n.occurrenceDate}</td>
                        <td className="px-4 py-3 font-semibold text-white">{n.employeeName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              n.type === 'suspensao_disciplinar'
                                ? 'bg-rose-950/80 border border-rose-500 text-rose-300'
                                : 'bg-amber-950/80 border border-amber-500 text-amber-300'
                            }`}
                          >
                            {n.type === 'suspensao_disciplinar'
                              ? `SUSPENSÃO (${n.suspensionDays}d)`
                              : 'ADVERTÊNCIA ESCRITA'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{n.cltReasonLabel}</td>
                        <td className="px-4 py-3 text-zinc-400 max-w-xs truncate" title={n.incidentDetails}>
                          {n.incidentDetails}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleGenerateDisciplinaryPdf(n)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              title="Baixar Termo em PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>Termo PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                StorageService.deleteDisciplinaryNotice(n.id);
                                setDisciplinaryNotices(StorageService.getDisciplinaryNotices());
                                showToast('Notificação excluída.');
                              }}
                              className="p-1 rounded-lg hover:bg-rose-950/50 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: FICHA DE REGISTRO DE EMPREGADO (CLT ART. 41) */}
      {/* ========================================================================= */}
      {activeSubTab === 'ficha' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Livro Digital de Registro de Empregados (CLT Art. 41)</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Consulte e imprima a ficha funcional completa de qualquer colaborador, com dados civis, histórico salarial, dependentes e comprovantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => {
              const salary = getEmployeeSalary(emp.id);
              const store = stores.find((s) => s.id === emp.storeId) || stores[0];

              return (
                <div key={emp.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{emp.name}</h4>
                      <span className="text-[10px] text-zinc-400 block">{emp.positionTitle}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">CPF:</span>
                      <span className="text-zinc-200">{emp.cpf || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Admissão:</span>
                      <span className="text-zinc-200">{emp.admissionDate || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Unidade:</span>
                      <span className="text-emerald-400">{store?.name || 'Geral'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Remuneração:</span>
                      <span className="font-bold text-white">{fmtMoney(salary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Dependentes:</span>
                      <span className="text-zinc-300 font-sans">
                        {emp.dependentsList?.length || 0} cadastrado(s)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingFichaEmp(emp)}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Visualizar Ficha Funcional Completa</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROGRAMAR FÉRIAS */}
      {/* ========================================================================= */}
      {showVacationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Programar / Simular Férias CLT</span>
              </h3>
              <button
                onClick={() => setShowVacationModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVacation} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Colaborador *</label>
                <select
                  value={vacationEmpId}
                  onChange={(e) => setVacationEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  required
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.positionTitle} - {fmtMoney(getEmployeeSalary(u.id))})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Data de Início do Gozo *</label>
                  <input
                    type="date"
                    required
                    value={vacationStartDate}
                    onChange={(e) => setVacationStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    CLT Art. 134 § 3º: Vedado início nos 2 dias antes de folga ou feriado.
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Dias de Gozo *</label>
                  <select
                    value={vacationDays}
                    onChange={(e) => setVacationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  >
                    <option value={30}>30 Dias (Período Integral)</option>
                    <option value={20}>20 Dias (Comum com Abono de 10 dias)</option>
                    <option value={15}>15 Dias (1º Período Fracionado)</option>
                    <option value={14}>14 Dias (Mínimo legal para 1 período fracionado)</option>
                    <option value={10}>10 Dias</option>
                  </select>
                </div>
              </div>

              {/* Opção de Abono Pecuniário */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vacationSellAbono}
                    onChange={(e) => setVacationSellAbono(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-white">
                    Venda de Férias (Abono Pecuniário - Art. 143 da CLT)
                  </span>
                </label>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Permite a conversão de 1/3 do período de férias a que tiver direito em abono pecuniário (máximo de 10 dias).
                </p>
                {vacationSellAbono && (
                  <div className="pt-2 border-t border-zinc-800">
                    <label className="block text-zinc-400 mb-1">Dias de Abono:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={vacationAbonoDays}
                      onChange={(e) => setVacationAbonoDays(Number(e.target.value))}
                      className="w-32 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Adiantamento do 13º */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vacationAdvance13th}
                    onChange={(e) => setVacationAdvance13th(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-white">
                    Adiantar 1ª Parcela do 13º Salário (50%) junto com as férias
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Observações do DP:</label>
                <textarea
                  rows={2}
                  value={vacationNotes}
                  onChange={(e) => setVacationNotes(e.target.value)}
                  placeholder="Anotações para contabilidade ou histórico..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowVacationModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Salvar e Programar Férias
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR EXAME ASO */}
      {/* ========================================================================= */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                <span>Registrar Exame Médico Ocupacional (ASO)</span>
              </h3>
              <button
                onClick={() => setShowExamModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMedicalExam} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador *</label>
                <select
                  value={examEmpId}
                  onChange={(e) => setExamEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  required
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
                  <label className="block text-zinc-400 mb-1">Tipo de ASO *</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as MedicalExamRecord['examType'])}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="admissional">Admissional</option>
                    <option value="periodico">Periódico (Anual)</option>
                    <option value="retorno_trabalho">Retorno ao Trabalho</option>
                    <option value="mudanca_risco">Mudança de Risco</option>
                    <option value="demissional">Demissional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Resultado *</label>
                  <select
                    value={examResult}
                    onChange={(e) => setExamResult(e.target.value as MedicalExamRecord['result'])}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="apto">✓ APTO</option>
                    <option value="apto_com_restricao">Apto com Restrição</option>
                    <option value="inapto">Inapto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Data do Exame *</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Validade do ASO *</label>
                  <input
                    type="date"
                    required
                    value={examExpiration}
                    onChange={(e) => setExamExpiration(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Clínica de Saúde</label>
                  <input
                    type="text"
                    value={examClinic}
                    onChange={(e) => setExamClinic(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Médico & CRM</label>
                  <input
                    type="text"
                    value={examDoctor}
                    onChange={(e) => setExamDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Registrar ASO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORMALIZAR MEDIDA DISCIPLINAR */}
      {/* ========================================================================= */}
      {showDisciplinaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-rose-400" />
                <span>Formalizar Medida Disciplinar (CLT Art. 482)</span>
              </h3>
              <button
                onClick={() => setShowDisciplinaryModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDisciplinary} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador Notificado *</label>
                <select
                  value={discEmpId}
                  onChange={(e) => setDiscEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  required
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
                  <label className="block text-zinc-400 mb-1">Tipo de Medida *</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value as DisciplinaryNoticeRecord['type'])}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="advertencia_escrita">Advertência Escrita Formal</option>
                    <option value="suspensao_disciplinar">Suspensão Disciplinar</option>
                    <option value="orientacao_verbal">Orientação Verbal (Registro Interno)</option>
                  </select>
                </div>

                {discType === 'suspensao_disciplinar' && (
                  <div>
                    <label className="block text-zinc-400 mb-1">Dias de Suspensão (1 a 3):</label>
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={discSuspensionDays}
                      onChange={(e) => setDiscSuspensionDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Enquadramento Legal CLT *</label>
                <select
                  value={discReason}
                  onChange={(e) => setDiscReason(e.target.value as DisciplinaryNoticeRecord['cltReason'])}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value="atrasos_reiterados">Atrasos Reiterados e Faltas Injustificadas (Art. 482 "e" CLT)</option>
                  <option value="desidia">Desídia no Desempenho das Funções (Art. 482 "e" CLT)</option>
                  <option value="indisciplina_insubordinacao">Indisciplina ou Insubordinação (Art. 482 "h" CLT)</option>
                  <option value="desrespeito_chefia">Desrespeito à Liderança / Ofensas (Art. 482 "j" CLT)</option>
                  <option value="abandono_posto">Abandono Momentâneo do Posto de Atendimento</option>
                  <option value="outros">Descumprimento de Normas Internas da Empresa</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Descrição Circunstanciada do Fato *</label>
                <textarea
                  rows={3}
                  required
                  value={discDetails}
                  onChange={(e) => setDiscDetails(e.target.value)}
                  placeholder="Descreva exatamente a data, horário e conduta que ensejou a aplicação da medida disciplinar..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Testemunha 1 (Opcional):</label>
                  <input
                    type="text"
                    value={discWitness1}
                    onChange={(e) => setDiscWitness1(e.target.value)}
                    placeholder="Nome da testemunha..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Testemunha 2 (Opcional):</label>
                  <input
                    type="text"
                    value={discWitness2}
                    onChange={(e) => setDiscWitness2(e.target.value)}
                    placeholder="Nome da testemunha..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowDisciplinaryModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Formalizar Notificação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR FICHA DE REGISTRO COMPLETA (CLT ART. 41) */}
      {/* ========================================================================= */}
      {viewingFichaEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Ficha de Registro de Empregado - {viewingFichaEmp.name}</span>
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Prontuário Individual Digital em conformidade com o Artigo 41 da CLT
                </span>
              </div>
              <button
                onClick={() => setViewingFichaEmp(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Identificação */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider block">
                  1. Dados Civis & Identificação
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-zinc-300">
                  <div>Nome: <strong className="text-white block">{viewingFichaEmp.name}</strong></div>
                  <div>CPF: <strong className="text-white block font-mono">{viewingFichaEmp.cpf || '-'}</strong></div>
                  <div>E-mail: <strong className="text-white block">{viewingFichaEmp.email}</strong></div>
                  <div>Telefone: <strong className="text-white block font-mono">{viewingFichaEmp.phone || '-'}</strong></div>
                  <div>Função / Cargo: <strong className="text-white block">{viewingFichaEmp.positionTitle}</strong></div>
                  <div>Vínculo: <strong className="text-emerald-400 block">{viewingFichaEmp.role.toUpperCase()}</strong></div>
                </div>
              </div>

              {/* Contrato de Trabalho */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider block">
                  2. Dados do Contrato de Trabalho
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-zinc-300">
                  <div>Data de Admissão: <strong className="text-white block font-mono">{viewingFichaEmp.admissionDate || '-'}</strong></div>
                  <div>Tipo de Contrato: <strong className="text-white block">{viewingFichaEmp.contractType || 'Indeterminado'}</strong></div>
                  <div>Escala Padrão: <strong className="text-white block font-mono">{viewingFichaEmp.scheduleType}</strong></div>
                  <div>Horário de Entrada: <strong className="text-white block font-mono">{viewingFichaEmp.defaultShiftStart}</strong></div>
                  <div>Horário de Saída: <strong className="text-white block font-mono">{viewingFichaEmp.defaultShiftEnd}</strong></div>
                  <div>Salário Base Inicial: <strong className="text-emerald-400 block font-mono font-bold">{fmtMoney(getEmployeeSalary(viewingFichaEmp.id))}</strong></div>
                </div>
              </div>

              {/* Dependentes */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider block">
                  3. Dependentes Cadastrados (Salário Família & IRPF)
                </span>
                {(!viewingFichaEmp.dependentsList || viewingFichaEmp.dependentsList.length === 0) ? (
                  <p className="text-zinc-500 italic text-[11px]">Nenhum dependente cadastrado no prontuário.</p>
                ) : (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {viewingFichaEmp.dependentsList.map((dep, idx) => (
                      <div key={dep.id || idx} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-white font-bold block">{dep.name}</span>
                          <span className="text-[10px] text-zinc-400 font-sans">
                            Parentesco: {dep.relationship} • Nascimento: {dep.birthDate} {dep.cpf ? `• CPF: ${dep.cpf}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-sans">
                          {dep.eligibleFamilyAllowance && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-400 text-[9px] font-bold">
                              Salário Família
                            </span>
                          )}
                          {dep.eligibleIrpfDeduction && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500 text-blue-400 text-[9px] font-bold">
                              Dedução IRPF
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dados Bancários */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider block">
                  4. Dados Bancários & Conta Salário
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-300 font-mono">
                  <div>Banco: <strong className="text-white block font-sans">{viewingFichaEmp.bankData?.bankName || 'Itaú Unibanco'}</strong></div>
                  <div>Agência: <strong className="text-white block">{viewingFichaEmp.bankData?.agency || '-'}</strong></div>
                  <div>Conta: <strong className="text-white block">{viewingFichaEmp.bankData?.account || '-'}</strong></div>
                  <div>Chave PIX: <strong className="text-emerald-400 block">{viewingFichaEmp.bankData?.pixKey || viewingFichaEmp.cpf || '-'}</strong></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setViewingFichaEmp(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
