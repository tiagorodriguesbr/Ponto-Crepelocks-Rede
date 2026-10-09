export type Role = 'dono' | 'gerente' | 'atendente';

export type ScheduleType = '6x1' | '12x36' | '5x2';

export interface UserPermissions {
  canEditSchedules: boolean;
  canApproveOccurrences: boolean;
  canManageEmployees: boolean;
  canViewFinancialReports: boolean;
  canUploadCertificates: boolean;
  canExportPayroll: boolean;
  canEditStores: boolean;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  cnpj?: string;
  address: string;
  city: string;
  active: boolean;
  managerName?: string;
  phone?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain/encrypted storage representation
  role: Role;
  storeId: string;
  payrollStoreId?: string; // Loja de Lotação / Pagamento do Contra-cheque
  hasAccessToAllStores?: boolean; // Vinculado a todas as lojas (atuais e futuras)
  positionTitle: string; // e.g. "Atendente de Balcão", "Gerente de Unidade", "Diretor Executivo"
  cpf?: string;
  phone?: string;
  admissionDate: string;
  contractType?: 'experiencia' | 'indeterminado';
  probationDaysInitial?: number; // Ex: 30, 45, 60 (máximo 90)
  probationExtended?: boolean; // Se teve prorrogação (máximo 1 vez)
  probationDaysExtension?: number; // Ex: 30, 45, 60 (soma <= 90)
  probationEndDate?: string; // Data final da experiência
  isProbationConvertedToIndefinite?: boolean; // Acima de 90 dias ou término do prazo
  scheduleType: ScheduleType;
  defaultShiftStart: string; // "08:00" or "14:00" or "10:00"
  defaultShiftEnd: string;   // "16:20" or "22:20" or "22:00"
  lunchDurationMin: number;  // typically 60 min
  active: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  exemptFromPunchClock?: boolean; // Cargo de Confiança (Art. 62 CLT) ou Perfil de Dono
  permissions: UserPermissions;
  avatarColor?: string;
}

export type PunchType = 'entry' | 'lunchStart' | 'lunchEnd' | 'exit';

export interface PunchRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  entry: string | null;       // HH:mm:ss
  lunchStart: string | null;  // HH:mm:ss
  lunchEnd: string | null;    // HH:mm:ss
  exit: string | null;        // HH:mm:ss
  
  // Computed adherence metrics
  scheduledStart: string;     // HH:mm
  scheduledEnd: string;       // HH:mm
  scheduledLunchMin: number;
  
  workedMinutes: number;
  expectedMinutes: number;
  delayMinutes: number;
  extraMinutes: number;
  adherencePercentage: number;
  
  // Status flag
  status: 'regular' | 'atraso' | 'incompleto' | 'falta_justificada' | 'falta_injustificada' | 'folga' | 'dia_extra' | 'abono';
  statusLabel?: string;
  
  // Security & Audit
  hashReceipt?: string;
  locationInfo?: string;
  locationIp?: string;
  ipAddress?: string;
  notes?: string;
  approvedAdjustment?: boolean;
}

export interface ScheduleDay {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftStart: string;
  shiftEnd: string;
  isOffDay: boolean; // Folga
  isExtraDay: boolean; // Dia Extra
  scheduleType: ScheduleType;
  notes?: string;
}

export type OccurrenceType = 'folga' | 'dia_extra' | 'falta_justificada' | 'falta_injustificada' | 'abono_horas';

export interface OccurrenceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  date: string;
  type: OccurrenceType;
  hoursAbono?: number;
  reason: string;
  registeredBy: string;
  createdAt: string;
  certificateId?: string;
  attachmentName?: string;
}

export interface MedicalCertificate {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  startDate: string;
  daysOff: number;
  cidCode?: string;
  doctorName: string;
  doctorCrm?: string;
  fileName: string;
  fileBase64?: string;
  fileSizeKb?: number;
  status: 'aprovado' | 'em_analise' | 'rejeitado';
  notes?: string;
  uploadedAt: string;
}

export interface SystemNotification {
  id: string;
  type: 'atraso' | 'ausencia' | 'ponto_pendente' | 'atestado_novo' | 'escala_modificada';
  employeeId: string;
  employeeName: string;
  storeId: string;
  storeName: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'warning' | 'error' | 'info';
}

export type ThemeStyle = 'dark-emerald' | 'dark-obsidian' | 'light-slate';

export interface MonthlyClosureSummary {
  employeeId: string;
  employeeName: string;
  role: Role;
  storeName: string;
  monthYear: string; // YYYY-MM
  totalDaysWorked: number;
  totalWorkedMinutes: number;
  totalExpectedMinutes: number;
  totalDelayMinutes: number;
  totalExtraMinutes: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  adherenceOverallPct: number;
  dsrDeductions: number;
}

// Configurações e Cálculos de Folha de Pagamento por Colaborador
export interface PayrollEmployeeConfig {
  employeeId: string;
  payrollStoreId?: string; // Loja de Lotação / Pagamento desta folha
  monthYear?: string; // e.g. "2026-10" ou global
  baseSalary: number; // Salário Bruto contratual / Pro-labore do dono
  bonusGratification: number; // Gratificação de função, bonificação ou prêmio
  insalubridadePct?: number; // % Adicional Insalubridade opcional (ex: 20% ou 0)
  periculosidadePct?: number; // % Adicional Periculosidade opcional (ex: 30% ou 0)
  familyAllowanceDependents?: number; // Salário família (dependentes)
  
  // Percentuais de Desconto (editáveis manualmente com cálculo dinâmico)
  vtDiscountPct: number; // Vale Transporte % (padrão legal até 6%, ou 0 se dispensou)
  vrVaDiscountPct: number; // Vale Refeição / Alimentação % (PAT até 20% ou fixo)
  inssDiscountPct?: number | null; // Se informado manualmente, usa; se null/vazio, calcula tabela oficial CLT progressiva
  irpfDiscountPct?: number | null; // Se informado manualmente, usa; se null/vazio, calcula tabela oficial IRPF com deduções
  otherDiscountsAmount: number; // Outros descontos em R$ (adiantamento, farmácia, coparticipação)
  otherDiscountsDescription?: string; // Descrição opcional dos outros descontos
  customDeductionsPct?: number; // Outros descontos percentuais adicionais

  // Ajustes manuais diretos
  manualInssOverride?: number | null; // R$ direto se desejar fixar
  manualIrpfOverride?: number | null; // R$ direto se desejar fixar
  manualVtOverride?: number | null; // R$ direto se desejar fixar
  manualVrVaOverride?: number | null; // R$ direto se desejar fixar

  // Adicionais automáticos calculados do ponto
  includePunchesExtras?: boolean; // Incorporar horas extras apuradas do ponto
  includeDelaysDiscount?: boolean; // Descontar atrasos/faltas injustificadas apurados do ponto
  
  notes?: string;
  updatedAt: string;
}

export interface PayrollCalculationResult {
  employeeId: string;
  employeeName: string;
  positionTitle: string;
  role: Role;
  storeName: string;
  storeCode?: string;
  payrollStoreId?: string;
  monthYear: string;
  
  // Proventos / Vencimentos
  baseSalary: number;
  bonusGratification: number;
  extraHoursPay: number; // Valor das horas extras
  extraHoursCount: number; // Quantidade de horas extras
  insalubridadePay: number;
  familyAllowancePay: number;
  totalGross: number; // Total Bruto (Salário + Gratificação + Extras)

  // Descontos
  inssDiscount: number;
  inssEffectivePct: number;
  irpfDiscount: number;
  irpfEffectivePct: number;
  vtDiscount: number;
  vtEffectivePct: number;
  vrVaDiscount: number;
  vrVaEffectivePct: number;
  unjustifiedAbsencesDiscount: number; // Desconto de faltas/atrasos
  otherDiscounts: number;
  totalDiscounts: number;

  // Resultado
  netSalary: number; // Salário Líquido (A Receber)
  fgtsEmployer: number; // FGTS patronal informativo (8% CLT)
}

// Rescisão Contratual & Colaboradores Desligados
export type SeveranceReason =
  | 'termino_experiencia' // Término no prazo acordado (sem aviso prévio, sem multa 40% FGTS)
  | 'rescisao_antecipada_empregador' // Demissão antecipada pelo empregador (Art. 479 CLT: 50% dos salários restantes + multa 40%)
  | 'rescisao_antecipada_empregado' // Pedido de demissão antecipado pelo empregado (Art. 480 CLT)
  | 'sem_justa_causa' // Demissão sem justa causa (contrato indeterminado - aviso prévio + multa 40% FGTS)
  | 'com_justa_causa' // Demissão com justa causa (Art. 482 CLT - apenas saldo salário e férias vencidas)
  | 'pedido_demissao'; // Pedido de demissão voluntário pelo colaborador

export interface DismissedEmployee {
  id: string; // ID da rescisão
  employeeId: string;
  employeeName: string;
  cpf: string;
  positionTitle: string;
  role: Role;
  storeId: string;
  storeName: string;
  payrollStoreId?: string;
  
  // Datas e Contrato
  admissionDate: string;
  dismissalDate: string;
  contractType: 'experiencia' | 'indeterminado';
  probationDaysInitial?: number;
  probationExtended?: boolean;
  probationDaysExtension?: number;
  probationTotalDays?: number;
  daysWorkedTotal: number;
  daysRemainingInProbation?: number;
  
  // Motivo e Classificação Legal
  reason: SeveranceReason;
  reasonLabel: string;
  cltArticle?: string;
  
  // Remuneração base de cálculo
  baseSalary: number;
  
  // Verbas Rescisórias (Proventos)
  saldoSalarioDias: number;
  saldoSalarioValor: number;
  decimoTerceiroProporcionalMeses: number;
  decimoTerceiroValor: number;
  feriasProporcionaisMeses: number;
  feriasProporcionaisValor: number;
  tercoConstitucionalFerias: number;
  
  // Indenizações CLT
  artigo479IndenizacaoDias?: number; // 50% dos dias faltantes
  artigo479IndenizacaoValor?: number; // 50% dos salários faltantes
  avisoPrevioIndenizadoValor?: number;
  
  // Multa FGTS informativa
  multaFgts40PctValor?: number;
  saqueFgtsLiberado: boolean;
  
  // Deduções Legais
  descontoInssSaldoSalario: number;
  descontoInssDecimoTerceiro: number;
  descontoIrpf: number;
  outrosDescontos: number;
  
  // Totais
  totalGrossSeverance: number;
  totalDeductionsSeverance: number;
  netSeverancePay: number;
  
  // Assinaturas e Auditoria
  signedByEmployer?: string;
  notes?: string;
  createdAt: string;
  originalUserData: UserAccount;
}

