import { PayrollEmployeeConfig, PayrollCalculationResult, UserAccount, PunchRecord, Store } from '../types';

/**
 * Calculadora Oficial CLT & Pró-Labore para a Crepelocks
 * Aplica as faixas progressivas vigentes do INSS e IRPF,
 * além de permitir percentuais e valores manuais flexíveis.
 */

export const PayrollCalculatorService = {
  // Faixas Progressivas Oficiais INSS
  // 1ª faixa: até R$ 1.412,00 -> 7.5%
  // 2ª faixa: de R$ 1.412,01 até R$ 2.666,68 -> 9%
  // 3ª faixa: de R$ 2.666,69 até R$ 4.000,03 -> 12%
  // 4ª faixa: de R$ 4.000,04 até Teto R$ 7.786,02 -> 14%
  calculateCltInss(gross: number): { amount: number; effectivePct: number } {
    if (gross <= 0) return { amount: 0, effectivePct: 0 };
    
    let totalInss = 0;
    const f1Limit = 1412.00;
    const f2Limit = 2666.68;
    const f3Limit = 4000.03;
    const tetoLimit = 7786.02;

    if (gross <= f1Limit) {
      totalInss = gross * 0.075;
    } else if (gross <= f2Limit) {
      totalInss = (f1Limit * 0.075) + ((gross - f1Limit) * 0.09);
    } else if (gross <= f3Limit) {
      totalInss = (f1Limit * 0.075) + ((f2Limit - f1Limit) * 0.09) + ((gross - f2Limit) * 0.12);
    } else {
      const taxable = Math.min(gross, tetoLimit);
      totalInss = (f1Limit * 0.075) + 
                  ((f2Limit - f1Limit) * 0.09) + 
                  ((f3Limit - f2Limit) * 0.12) + 
                  ((taxable - f3Limit) * 0.14);
    }

    const rounded = Math.round(totalInss * 100) / 100;
    const effectivePct = gross > 0 ? Math.round((rounded / gross) * 10000) / 100 : 0;
    return { amount: rounded, effectivePct };
  },

  // Faixas Oficiais IRPF com Dedução da Base
  // Base de cálculo = Salário Bruto - INSS - (Dependentes * 189,59)
  // Até 2.259,20: Isento
  // De 2.259,21 até 2.826,65: 7.5% (Dedução 169,44)
  // De 2.826,66 até 3.751,05: 15% (Dedução 381,44)
  // De 3.751,06 até 4.664,68: 22.5% (Dedução 662,77)
  // Acima de 4.664,68: 27.5% (Dedução 896,00)
  calculateCltIrpf(
    gross: number,
    inssDeduction: number,
    dependentsCount: number = 0
  ): { amount: number; effectivePct: number } {
    const dependentDeduction = dependentsCount * 189.59;
    const baseCalculo = Math.max(0, gross - inssDeduction - dependentDeduction);

    let irpf = 0;
    if (baseCalculo <= 2259.20) {
      irpf = 0;
    } else if (baseCalculo <= 2826.65) {
      irpf = (baseCalculo * 0.075) - 169.44;
    } else if (baseCalculo <= 3751.05) {
      irpf = (baseCalculo * 0.15) - 381.44;
    } else if (baseCalculo <= 4664.68) {
      irpf = (baseCalculo * 0.225) - 662.77;
    } else {
      irpf = (baseCalculo * 0.275) - 896.00;
    }

    const rounded = Math.max(0, Math.round(irpf * 100) / 100);
    const effectivePct = gross > 0 ? Math.round((rounded / gross) * 10000) / 100 : 0;
    return { amount: rounded, effectivePct };
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
  }
};
