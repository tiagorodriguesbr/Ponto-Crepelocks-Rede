import {
  PayrollEmployeeConfig,
  PayrollCalculationResult,
  UserAccount,
  PunchRecord,
  Store,
  DismissedEmployee,
  SeveranceReason
} from '../types';

/**
 * Calculadora Oficial CLT & Pró-Labore para a Crepelocks
 * Aplica as faixas progressivas vigentes do INSS e IRPF (Isenção até R$ 5.000,00),
 * além de permitir percentuais e valores manuais flexíveis.
 */

export interface InssBracket {
  rangeLabel: string;
  min: number;
  max: number;
  aliquotaPct: number;
  deducao: number;
}

export const INSS_BRACKETS_2026: InssBracket[] = [
  { rangeLabel: 'Até R$ 1.621,00', min: 0, max: 1621.00, aliquotaPct: 7.5, deducao: 0.00 },
  { rangeLabel: 'De R$ 1.621,01 até R$ 2.902,84', min: 1621.01, max: 2902.84, aliquotaPct: 9.0, deducao: 24.32 },
  { rangeLabel: 'De R$ 2.902,85 até R$ 4.354,27', min: 2902.85, max: 4354.27, aliquotaPct: 12.0, deducao: 111.40 },
  { rangeLabel: 'De R$ 4.354,28 até R$ 8.475,55', min: 4354.28, max: 8475.55, aliquotaPct: 14.0, deducao: 198.49 },
];

export const INSS_TETO_SALARIO = 8475.55;
export const INSS_TETO_CONTRIBUICAO = 988.09; // 8475.55 * 0.14 - 198.49

// Faixa de Isenção Legal de IRPF Vigente
export const IRPF_ISENCAO_TETO = 5000.00;

export const PayrollCalculatorService = {
  // Faixas Progressivas Oficiais INSS
  // Salário de Contribuição           Alíquota (%)   Parcela a Deduzir
  // Até R$ 1.621,00                   7,5%           R$ 0,00
  // De R$ 1.621,01 até R$ 2.902,84    9%             R$ 24,32
  // De R$ 2.902,85 até R$ 4.354,27    12%            R$ 111,40
  // De R$ 4.354,28 até R$ 8.475,55    14%            R$ 198,49
  // Acima de R$ 8.475,55              Teto Máximo    (8475.55 * 0.14 - 198.49 = R$ 988,09)
  calculateCltInss(gross: number): { amount: number; effectivePct: number } {
    if (gross <= 0) return { amount: 0, effectivePct: 0 };
    
    let totalInss = 0;
    const f1Limit = 1621.00;
    const f2Limit = 2902.84;
    const f3Limit = 4354.27;
    const tetoLimit = 8475.55;

    if (gross <= f1Limit) {
      totalInss = gross * 0.075;
    } else if (gross <= f2Limit) {
      totalInss = (gross * 0.09) - 24.32;
    } else if (gross <= f3Limit) {
      totalInss = (gross * 0.12) - 111.40;
    } else if (gross <= tetoLimit) {
      totalInss = (gross * 0.14) - 198.49;
    } else {
      totalInss = (tetoLimit * 0.14) - 198.49; // Teto R$ 988,09
    }

    const rounded = Math.max(0, Math.round(totalInss * 100) / 100);
    const effectivePct = gross > 0 ? Math.round((rounded / gross) * 10000) / 100 : 0;
    return { amount: rounded, effectivePct };
  },

  getInssDetail(gross: number): {
    amount: number;
    effectivePct: number;
    rangeLabel: string;
    aliquotaPct: number;
    deducao: number;
    isTeto: boolean;
  } {
    if (gross <= 0) {
      return { amount: 0, effectivePct: 0, rangeLabel: 'Isento / Sem Remuneração', aliquotaPct: 0, deducao: 0, isTeto: false };
    }
    const res = this.calculateCltInss(gross);
    if (gross <= 1621.00) {
      return { ...res, rangeLabel: '1ª Faixa: Até R$ 1.621,00', aliquotaPct: 7.5, deducao: 0.00, isTeto: false };
    } else if (gross <= 2902.84) {
      return { ...res, rangeLabel: '2ª Faixa: De R$ 1.621,01 até R$ 2.902,84', aliquotaPct: 9.0, deducao: 24.32, isTeto: false };
    } else if (gross <= 4354.27) {
      return { ...res, rangeLabel: '3ª Faixa: De R$ 2.902,85 até R$ 4.354,27', aliquotaPct: 12.0, deducao: 111.40, isTeto: false };
    } else if (gross <= 8475.55) {
      return { ...res, rangeLabel: '4ª Faixa: De R$ 4.354,28 até R$ 8.475,55', aliquotaPct: 14.0, deducao: 198.49, isTeto: false };
    } else {
      return { ...res, rangeLabel: 'Teto Máximo Previdenciário (Acima de R$ 8.475,55)', aliquotaPct: 14.0, deducao: 198.49, isTeto: true };
    }
  },

  // Faixas Oficiais IRPF com Isenção Vigente até R$ 5.000,00
  // Base de cálculo = Salário Bruto - INSS - (Dependentes * 189,59)
  // Até R$ 5.000,00: ISENTO (R$ 0,00)
  // De R$ 5.000,01 até R$ 7.500,00: 22.5% (Dedução R$ 1.125,00)
  // Acima de R$ 7.500,00: 27.5% (Dedução R$ 1.500,00)
  calculateCltIrpf(
    gross: number,
    inssDeduction: number,
    dependentsCount: number = 0
  ): { amount: number; effectivePct: number } {
    if (gross <= IRPF_ISENCAO_TETO) {
      return { amount: 0, effectivePct: 0 };
    }

    const dependentDeduction = dependentsCount * 189.59;
    const baseCalculo = Math.max(0, gross - inssDeduction - dependentDeduction);

    let irpf = 0;
    if (baseCalculo <= IRPF_ISENCAO_TETO) {
      irpf = 0;
    } else if (baseCalculo <= 7500.00) {
      irpf = (baseCalculo * 0.225) - 1125.00;
    } else {
      irpf = (baseCalculo * 0.275) - 1500.00;
    }

    const rounded = Math.max(0, Math.round(irpf * 100) / 100);
    const effectivePct = gross > 0 ? Math.round((rounded / gross) * 10000) / 100 : 0;
    return { amount: rounded, effectivePct };
  },

  getIrpfDetail(
    gross: number,
    inssDeduction: number = 0,
    dependentsCount: number = 0
  ): {
    amount: number;
    effectivePct: number;
    rangeLabel: string;
    isExempt: boolean;
    baseCalculo: number;
  } {
    const dependentDeduction = dependentsCount * 189.59;
    const baseCalculo = Math.max(0, gross - inssDeduction - dependentDeduction);

    if (gross <= IRPF_ISENCAO_TETO || baseCalculo <= IRPF_ISENCAO_TETO) {
      return {
        amount: 0,
        effectivePct: 0,
        rangeLabel: 'Isento de IRPF (Até R$ 5.000,00)',
        isExempt: true,
        baseCalculo: Math.round(baseCalculo * 100) / 100
      };
    }

    const res = this.calculateCltIrpf(gross, inssDeduction, dependentsCount);
    if (baseCalculo <= 7500.00) {
      return {
        ...res,
        rangeLabel: 'Faixa 22,5% (De R$ 5.000,01 a R$ 7.500,00)',
        isExempt: false,
        baseCalculo: Math.round(baseCalculo * 100) / 100
      };
    } else {
      return {
        ...res,
        rangeLabel: 'Faixa 27,5% (Acima de R$ 7.500,00)',
        isExempt: false,
        baseCalculo: Math.round(baseCalculo * 100) / 100
      };
    }
  },

  // Salário Família (até teto limite previdenciário de R$ 1.819,26 recebe R$ 62,04 por dependente)
  calculateFamilyAllowance(gross: number, dependentsCount: number = 0): number {
    if (dependentsCount <= 0) return 0;
    if (gross <= 1819.26 && gross > 0) {
      return dependentsCount * 62.04;
    }
    return 0;
  },

  // Executa o cálculo completo e holerite de um colaborador
  calculatePayroll(
    employee: UserAccount,
    config: PayrollEmployeeConfig | undefined,
    store: Store | undefined,
    punches: PunchRecord[] = [],
    monthYear: string = '2026-10'
  ): PayrollCalculationResult {
    const baseSalary = Number(config?.baseSalary ?? 0);
    const bonusGratification = Number(config?.bonusGratification ?? 0);
    const insalubridadePct = Number(config?.insalubridadePct ?? 0);
    const dependents = Number(config?.familyAllowanceDependents ?? 0);

    // Cálculos de Ponto Eletrônico (Horas Extras e Atrasos se ativos)
    let extraHoursCount = 0;
    let extraHoursPay = 0;
    let unjustifiedAbsencesDiscount = 0;

    const hourlyRate = baseSalary > 0 ? baseSalary / 220 : 0; // Padrão 220h/mês CLT

    if (config?.includePunchesExtras !== false) {
      const userMonthPunches = punches.filter(
        (p) => p.employeeId === employee.id && p.date.startsWith(monthYear)
      );
      const totalExtraMin = userMonthPunches.reduce((acc, p) => acc + (p.extraMinutes || 0), 0);
      extraHoursCount = Math.round((totalExtraMin / 60) * 10) / 10;
      // Hora extra 50% conforme CLT
      extraHoursPay = Math.round(extraHoursCount * hourlyRate * 1.5 * 100) / 100;
    }

    if (config?.includeDelaysDiscount) {
      const userMonthPunches = punches.filter(
        (p) => p.employeeId === employee.id && p.date.startsWith(monthYear)
      );
      const totalDelayMin = userMonthPunches.reduce((acc, p) => acc + (p.delayMinutes || 0), 0);
      const delayHours = totalDelayMin / 60;
      unjustifiedAbsencesDiscount = Math.round(delayHours * hourlyRate * 100) / 100;
    }

    // Insalubridade (baseada no salário mínimo vigente R$ 1.412)
    const insalubridadePay = insalubridadePct > 0 ? Math.round(1412.00 * (insalubridadePct / 100) * 100) / 100 : 0;
    const familyAllowancePay = this.calculateFamilyAllowance(baseSalary, dependents);

    // Total Bruto dos Proventos
    const totalGross = Math.round((baseSalary + bonusGratification + extraHoursPay + insalubridadePay + familyAllowancePay) * 100) / 100;

    // Cálculo do INSS
    let inssDiscount = 0;
    let inssEffectivePct = 0;

    if (config?.manualInssOverride != null && config.manualInssOverride >= 0) {
      inssDiscount = Number(config.manualInssOverride);
      inssEffectivePct = totalGross > 0 ? Math.round((inssDiscount / totalGross) * 10000) / 100 : 0;
    } else if (config?.inssDiscountPct != null && config.inssDiscountPct >= 0) {
      inssEffectivePct = Number(config.inssDiscountPct);
      inssDiscount = Math.round(totalGross * (inssEffectivePct / 100) * 100) / 100;
    } else {
      // Cálculo progressivo legal CLT
      const res = this.calculateCltInss(totalGross);
      inssDiscount = res.amount;
      inssEffectivePct = res.effectivePct;
    }

    // Cálculo do IRPF
    let irpfDiscount = 0;
    let irpfEffectivePct = 0;

    if (config?.manualIrpfOverride != null && config.manualIrpfOverride >= 0) {
      irpfDiscount = Number(config.manualIrpfOverride);
      irpfEffectivePct = totalGross > 0 ? Math.round((irpfDiscount / totalGross) * 10000) / 100 : 0;
    } else if (config?.irpfDiscountPct != null && config.irpfDiscountPct >= 0) {
      irpfEffectivePct = Number(config.irpfDiscountPct);
      irpfDiscount = Math.round(totalGross * (irpfEffectivePct / 100) * 100) / 100;
    } else {
      // Cálculo oficial com tabela progressiva
      const res = this.calculateCltIrpf(totalGross, inssDiscount, dependents);
      irpfDiscount = res.amount;
      irpfEffectivePct = res.effectivePct;
    }

    // Vale Transporte (VT)
    let vtDiscount = 0;
    let vtEffectivePct = Number(config?.vtDiscountPct ?? 0);
    if (config?.manualVtOverride != null && config.manualVtOverride >= 0) {
      vtDiscount = Number(config.manualVtOverride);
      vtEffectivePct = baseSalary > 0 ? Math.round((vtDiscount / baseSalary) * 10000) / 100 : 0;
    } else if (vtEffectivePct > 0) {
      // Lei 7.418/85: limite de até 6% sobre o salário básico
      vtDiscount = Math.round(baseSalary * (vtEffectivePct / 100) * 100) / 100;
    }

    // Vale Refeição / Alimentação (VR/VA)
    let vrVaDiscount = 0;
    let vrVaEffectivePct = Number(config?.vrVaDiscountPct ?? 0);
    if (config?.manualVrVaOverride != null && config.manualVrVaOverride >= 0) {
      vrVaDiscount = Number(config.manualVrVaOverride);
      vrVaEffectivePct = baseSalary > 0 ? Math.round((vrVaDiscount / baseSalary) * 10000) / 100 : 0;
    } else if (vrVaEffectivePct > 0) {
      vrVaDiscount = Math.round(baseSalary * (vrVaEffectivePct / 100) * 100) / 100;
    }

    // Outros descontos (em R$ ou % adicional)
    let otherDiscounts = Number(config?.otherDiscountsAmount ?? 0);
    if (config?.customDeductionsPct && config.customDeductionsPct > 0) {
      otherDiscounts += Math.round(baseSalary * (config.customDeductionsPct / 100) * 100) / 100;
    }

    // Soma total dos Descontos
    const totalDiscounts = Math.round(
      (inssDiscount + irpfDiscount + vtDiscount + vrVaDiscount + unjustifiedAbsencesDiscount + otherDiscounts) * 100
    ) / 100;

    // Salário Líquido Final
    const netSalary = Math.round(Math.max(0, totalGross - totalDiscounts) * 100) / 100;

    // FGTS Informativo da Empresa (8% sobre o total bruto)
    const fgtsEmployer = Math.round(totalGross * 0.08 * 100) / 100;

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      positionTitle: employee.positionTitle || 'Colaborador',
      role: employee.role,
      storeName: store?.name || 'Sede Crepelocks',
      storeCode: store?.code || 'LJ-01',
      payrollStoreId: config?.payrollStoreId || employee.payrollStoreId || store?.id,
      monthYear,
      baseSalary,
      bonusGratification,
      extraHoursPay,
      extraHoursCount,
      insalubridadePay,
      familyAllowancePay,
      totalGross,
      inssDiscount,
      inssEffectivePct,
      irpfDiscount,
      irpfEffectivePct,
      vtDiscount,
      vtEffectivePct,
      vrVaDiscount,
      vrVaEffectivePct,
      unjustifiedAbsencesDiscount,
      otherDiscounts,
      totalDiscounts,
      netSalary,
      fgtsEmployer
    };
  },

  // Cálculo Oficial de Rescisão de Contrato de Trabalho (CLT & Artigo 479)
  calculateSeverance(params: {
    employee: UserAccount;
    baseSalary: number;
    admissionDate: string;
    dismissalDate: string;
    reason: SeveranceReason;
    contractType: 'experiencia' | 'indeterminado';
    probationDaysInitial?: number;
    probationExtended?: boolean;
    probationDaysExtension?: number;
    otherDiscounts?: number;
    storeName?: string;
    payrollStoreId?: string;
  }): DismissedEmployee {
    const {
      employee,
      baseSalary,
      admissionDate,
      dismissalDate,
      reason,
      contractType,
      probationDaysInitial = 45,
      probationExtended = false,
      probationDaysExtension = 45,
      otherDiscounts = 0,
      storeName = 'Crepelocks',
      payrollStoreId
    } = params;

    // Cálculo de Dias Trabalhados
    const dAdmission = new Date(admissionDate);
    const dDismissal = new Date(dismissalDate);
    const diffTime = Math.max(0, dDismissal.getTime() - dAdmission.getTime());
    const daysWorkedTotal = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // Duração do Contrato de Experiência
    const rawTotalProbation = probationDaysInitial + (probationExtended ? probationDaysExtension : 0);
    const probationTotalDays = Math.min(90, rawTotalProbation);
    const daysRemainingInProbation = Math.max(0, probationTotalDays - daysWorkedTotal);

    // Saldo de Salário (dias trabalhados no mês do desligamento)
    const dismissalDayOfMonth = Math.min(30, parseInt(dismissalDate.split('-')[2], 10) || 1);
    const saldoSalarioDias = dismissalDayOfMonth;
    const saldoSalarioValor = Math.round((baseSalary / 30) * saldoSalarioDias * 100) / 100;

    // Frações de 13º e Férias Proporcionais
    // Fração de 15 dias no mês dá direito a 1/12 avo
    const dismissalMonth = parseInt(dismissalDate.split('-')[1], 10) || 1;
    const admissionMonth = parseInt(admissionDate.split('-')[1], 10) || 1;
    const sameYear = admissionDate.split('-')[0] === dismissalDate.split('-')[0];

    let decimoTerceiroProporcionalMeses = 0;
    let feriasProporcionaisMeses = 0;

    if (reason !== 'com_justa_causa') {
      // 13º conta a partir de janeiro do ano corrente ou admissão
      const startMonth13 = sameYear ? admissionMonth : 1;
      let months13 = Math.max(1, dismissalMonth - startMonth13 + (dismissalDayOfMonth >= 15 ? 1 : 0));
      decimoTerceiroProporcionalMeses = Math.min(12, Math.max(1, months13));

      // Férias proporcionais baseadas nos meses de vínculo
      const approxMonthsWorked = Math.max(1, Math.round(daysWorkedTotal / 30));
      feriasProporcionaisMeses = Math.min(12, approxMonthsWorked);
    }

    const decimoTerceiroValor = reason === 'com_justa_causa'
      ? 0
      : Math.round((baseSalary / 12) * decimoTerceiroProporcionalMeses * 100) / 100;

    const feriasProporcionaisValor = reason === 'com_justa_causa'
      ? 0
      : Math.round((baseSalary / 12) * feriasProporcionaisMeses * 100) / 100;

    const tercoConstitucionalFerias = reason === 'com_justa_causa'
      ? 0
      : Math.round((feriasProporcionaisValor / 3) * 100) / 100;

    // Artigo 479 da CLT (50% dos salários faltantes na rescisão antecipada da experiência pelo empregador)
    let artigo479IndenizacaoDias = 0;
    let artigo479IndenizacaoValor = 0;

    if (contractType === 'experiencia' && reason === 'rescisao_antecipada_empregador') {
      artigo479IndenizacaoDias = daysRemainingInProbation;
      // 50% dos salários que faltariam para o contrato acabar
      artigo479IndenizacaoValor = Math.round(0.5 * (baseSalary / 30) * daysRemainingInProbation * 100) / 100;
    }

    // Aviso Prévio Indenizado (Contrato indeterminado sem justa causa)
    let avisoPrevioIndenizadoValor = 0;
    if (contractType === 'indeterminado' && reason === 'sem_justa_causa') {
      avisoPrevioIndenizadoValor = Math.round(baseSalary * 100) / 100;
    }

    // Multa FGTS 40% informativa e saque
    let multaFgts40PctValor = 0;
    let saqueFgtsLiberado = false;

    if (reason === 'sem_justa_causa' || reason === 'rescisao_antecipada_empregador') {
      saqueFgtsLiberado = true;
      const fgtsAcumulado = (baseSalary * 0.08) * (daysWorkedTotal / 30);
      multaFgts40PctValor = Math.round(fgtsAcumulado * 0.40 * 100) / 100;
    } else if (reason === 'termino_experiencia') {
      // No término do contrato de experiência não há multa de 40%, mas o saque é liberado
      saqueFgtsLiberado = true;
      multaFgts40PctValor = 0;
    }

    // Deduções Legais (INSS e IRPF)
    const inssSaldo = this.calculateCltInss(saldoSalarioValor).amount;
    const inss13 = this.calculateCltInss(decimoTerceiroValor).amount;

    // IRPF com Isenção até R$ 5.000,00
    const irpfSeverance = this.calculateCltIrpf(saldoSalarioValor + decimoTerceiroValor, inssSaldo + inss13).amount;

    // Totais Brutos e Descontos
    const totalGrossSeverance = Math.round(
      (saldoSalarioValor +
        decimoTerceiroValor +
        feriasProporcionaisValor +
        tercoConstitucionalFerias +
        artigo479IndenizacaoValor +
        avisoPrevioIndenizadoValor) * 100
    ) / 100;

    const totalDeductionsSeverance = Math.round(
      (inssSaldo + inss13 + irpfSeverance + otherDiscounts) * 100
    ) / 100;

    const netSeverancePay = Math.round(
      Math.max(0, totalGrossSeverance - totalDeductionsSeverance) * 100
    ) / 100;

    // Mapeamento de Rótulos e Artigos CLT
    const reasonLabels: Record<SeveranceReason, { label: string; clt: string }> = {
      termino_experiencia: {
        label: 'Término de Contrato de Experiência no Prazo',
        clt: 'CLT Art. 443, §2º c/c Art. 473 - Sem aviso prévio e sem multa de 40% do FGTS'
      },
      rescisao_antecipada_empregador: {
        label: 'Rescisão Antecipada pelo Empregador (Experiência)',
        clt: 'CLT Artigo 479 - Indenização de 50% dos salários faltantes até o término + Multa 40% FGTS'
      },
      rescisao_antecipada_empregado: {
        label: 'Rescisão Antecipada pelo Empregado (Experiência)',
        clt: 'CLT Artigo 480 - Sem aviso prévio, sem multa de FGTS'
      },
      sem_justa_causa: {
        label: 'Dispensa sem Justa Causa (Iniciativa do Empregador)',
        clt: 'CLT Art. 477 - Aviso Prévio Indenizado e Multa Rescisória de 40% do FGTS'
      },
      com_justa_causa: {
        label: 'Dispensa com Justa Causa (Falta Grave do Empregado)',
        clt: 'CLT Artigo 482 - Apenas saldo de salário e férias vencidas'
      },
      pedido_demissao: {
        label: 'Pedido de Demissão pelo Colaborador',
        clt: 'CLT Art. 487 - Sem multa rescisória e sem saque do FGTS'
      }
    };

    const currentReasonMeta = reasonLabels[reason] || {
      label: 'Rescisão de Contrato de Trabalho',
      clt: 'Consolidação das Leis do Trabalho (CLT)'
    };

    return {
      id: `rescisao-${employee.id}-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      cpf: employee.cpf || '000.000.000-00',
      positionTitle: employee.positionTitle || 'Colaborador',
      role: employee.role,
      storeId: employee.storeId,
      storeName,
      payrollStoreId: payrollStoreId || employee.payrollStoreId || employee.storeId,
      admissionDate,
      dismissalDate,
      contractType,
      probationDaysInitial,
      probationExtended,
      probationDaysExtension,
      probationTotalDays,
      daysWorkedTotal,
      daysRemainingInProbation,
      reason,
      reasonLabel: currentReasonMeta.label,
      cltArticle: currentReasonMeta.clt,
      baseSalary,
      saldoSalarioDias,
      saldoSalarioValor,
      decimoTerceiroProporcionalMeses,
      decimoTerceiroValor,
      feriasProporcionaisMeses,
      feriasProporcionaisValor,
      tercoConstitucionalFerias,
      artigo479IndenizacaoDias,
      artigo479IndenizacaoValor,
      avisoPrevioIndenizadoValor,
      multaFgts40PctValor,
      saqueFgtsLiberado,
      descontoInssSaldoSalario: inssSaldo,
      descontoInssDecimoTerceiro: inss13,
      descontoIrpf: irpfSeverance,
      outrosDescontos: otherDiscounts,
      totalGrossSeverance,
      totalDeductionsSeverance,
      netSeverancePay,
      createdAt: new Date().toISOString(),
      originalUserData: employee
    };
  }
};

