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
  name: string; // Nome Fantasia
  razaoSocial?: string; // Razão Social oficial da empresa (ex: Crepelocks Alimentação Ltda.)
  code: string;
  cnpj?: string;
  stateRegistration?: string; // Inscrição Estadual (I.E.)
  address: string; // Logradouro e número
  neighborhood?: string; // Bairro
  cep?: string; // CEP
  city: string; // Cidade e UF
  active: boolean;
  managerName?: string;
  phone?: string;
  email?: string; // E-mail corporativo / DP da unidade
  holeriteHeaderTitle?: string; // Título configurável (ex: "RECIBO DE PAGAMENTO DE SALÁRIO")
  holeriteSubtitle?: string; // Subtítulo configurável (ex: "Demonstrativo Mensal de Pagamento - CLT")
  holeriteFooterMessage?: string; // Mensagem configurável do rodapé do contracheque
}

export interface EmployeeDependent {
  id: string;
  name: string;
  cpf?: string;
  birthDate: string; // YYYY-MM-DD
  relationship: 'filho' | 'enteado' | 'tutela' | 'conjuge' | 'outro';
  eligibleFamilyAllowance: boolean; // Elegível para Salário-Família (menor de 14 anos ou deficiente)
  eligibleIrpfDeduction: boolean; // Dependente para dedução de IRPF
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
  defaultLunchStart?: string; // "12:00" ou horário previsto para saída para refeição
  lunchDurationMin: number;  // typically 60 min
  active: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  exemptFromPunchClock?: boolean; // Cargo de Confiança (Art. 62 CLT) ou Perfil de Dono
  permissions: UserPermissions;
  avatarColor?: string;
  receiveSalarioFamilia?: boolean; // Habilitado apenas se cadastrado expressamente
  dependentsList?: EmployeeDependent[]; // Dependentes cadastrados
  bankData?: {
    bankName?: string;
    agency?: string;
    account?: string;
    accountType?: 'corrente' | 'poupanca' | 'salario';
    pixKey?: string;
  };
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
  lunchStart?: string; // HH:mm horário previsto de almoço
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
  receiveSalarioFamilia?: boolean; // Habilitado expressamente mediante comprovação
  familyAllowanceDependents?: number; // Quantidade de cotas de salário família (dependentes até 14 anos)
  irpfDependentsCount?: number; // Quantidade de dependentes para dedução de IRPF
  
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
  manualDelaysMinutesOverride?: number | null; // Minutos manuais de atraso
  manualDelaysDiscountOverride?: number | null; // R$ direto de desconto de atrasos

  // Adicionais e Descontos automáticos apurados do ponto
  includePunchesExtras?: boolean; // Incorporar horas extras apuradas do ponto
  includeDelaysDiscount?: boolean; // Descontar atrasos/saídas antecipadas apurados do ponto
  delaysDeductionPolicy?: 'proporcional' | 'isento' | 'com_dsr'; // Política de cálculo de atraso
  
  notes?: string;
  updatedAt: string;
}

export interface PayrollCalculationResult {
  employeeId: string;
  employeeName: string;
  positionTitle: string;
  role: Role;
  storeName: string;
  storeRazaoSocial?: string;
  storeCnpj?: string;
  storeStateRegistration?: string;
  storeAddress?: string;
  storeNeighborhood?: string;
  storeCep?: string;
  storeCity?: string;
  storeCode?: string;
  storePhone?: string;
  storeEmail?: string;
  holeriteHeaderTitle?: string;
  holeriteSubtitle?: string;
  holeriteFooterMessage?: string;
  payrollStoreId?: string;
  monthYear: string;
  
  // Proventos / Vencimentos
  baseSalary: number;
  bonusGratification: number;
  extraHoursPay: number; // Valor das horas extras
  extraHoursCount: number; // Quantidade de horas extras (em horas decimais)
  dsrExtraHoursPay: number; // Reflexo DSR sobre Horas Extras (Lei 605/49)
  insalubridadePay: number;
  familyAllowancePay: number; // Salário Família Previdência Social
  familyAllowanceCount: number; // Quantidade de cotas pagas
  totalGross: number; // Total Bruto dos Proventos

  // Descontos
  inssDiscount: number;
  inssEffectivePct: number;
  irpfDiscount: number;
  irpfEffectivePct: number;
  vtDiscount: number;
  vtEffectivePct: number;
  vrVaDiscount: number;
  vrVaEffectivePct: number;
  delaysMinutesCount: number; // Minutos de atraso apurados
  delaysDiscount: number; // Desconto em R$ de atrasos e saídas antecipadas
  dsrLossDiscount: number; // Perda do DSR decorrente de falta/atraso
  unjustifiedAbsencesDiscount: number; // Faltas integrais injustificadas
  otherDiscounts: number;
  otherDiscountsDescription?: string;
  totalDiscounts: number;

  // Resultado & Bases de Cálculo Oficiais
  netSalary: number; // Salário Líquido (A Receber)
  inssBase: number; // Base de Cálculo INSS
  irpfBase: number; // Base de Cálculo IRPF
  fgtsBase: number; // Base de Cálculo FGTS
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

// ==========================================
// RH COMPLETO & GESTÃO TRABALHISTA CLT
// ==========================================

export interface VacationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  // Períodos
  aquisitiveStart: string; // YYYY-MM-DD
  aquisitiveEnd: string;   // YYYY-MM-DD
  concessiveEnd: string;   // YYYY-MM-DD (limite para concessão sem multa dobro)
  // Parâmetros de gozo
  daysEntitled: number;    // Dias de direito (padrão 30, reduzido por faltas injustificadas art. 130 CLT)
  daysTaken: number;       // Dias efetivamente gozados
  startDate: string;       // Início do gozo
  endDate: string;         // Término do gozo
  sellAbonoPecuniario: boolean; // Venda de até 1/3 (10 dias)
  abonoDays: number;
  advanceFirstThirteenth: boolean; // Adiantamento da 1ª parcela do 13º
  // Valores calculados
  baseSalary: number;
  bonusGratification?: number; // Gratificação de função ou mensal habitual (CLT Art. 457 § 1º)
  totalRemuneration?: number;  // Remuneração integral de cálculo (base + gratificação)
  vacationPay: number;      // Salário dos dias de férias
  oneThirdBonus: number;    // 1/3 Constitucional (Art. 7º, XVII CF/88)
  abonoPay: number;         // Valor do abono pecuniário
  abonoOneThirdPay: number; // 1/3 sobre o abono
  advanceThirteenthAmount: number;
  inssDiscount: number;
  irpfDiscount: number;
  netVacationPay: number;
  // Status do fluxo de DP
  status: 'planejada' | 'aprovada' | 'em_gozo' | 'concluida' | 'cancelada';
  noticeDate?: string;      // Aviso de férias emitido 30 dias antes
  paymentDate?: string;     // Prazo de pagamento: 2 dias antes do início do gozo (art. 145 CLT)
  notes?: string;
  createdAt: string;
}

export interface ThirteenthSalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  year: number;
  monthsWorked: number;     // Avos de direito (fração >= 15 dias trabalhados no mês)
  baseSalary: number;
  bonusGratification?: number; // Gratificação mensal que integra o cálculo (CLT Art. 457 § 1º)
  totalRemuneration?: number;  // Remuneração integral de cálculo
  firstInstallmentGross: number; // 50% sem descontos (pago até 30/nov)
  secondInstallmentGross: number; // Valor integral - 1ª parcela
  inssSecondInstallment: number;
  irpfSecondInstallment: number;
  secondInstallmentNet: number;  // Valor líquido da 2ª parcela (pago até 20/dez)
  totalGrossYear: number;
  totalNetYear: number;
  paidFirstInstallment: boolean;
  firstInstallmentPaymentDate?: string;
  paidSecondInstallment: boolean;
  secondInstallmentPaymentDate?: string;
  createdAt: string;
}

export interface MedicalExamRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  examType: 'admissional' | 'periodico' | 'retorno_trabalho' | 'mudanca_risco' | 'demissional';
  clinicName: string;
  doctorName: string;
  doctorCrm: string;
  examDate: string; // YYYY-MM-DD
  expirationDate: string; // Validade (geralmente 1 ano ou conforme PCMSO)
  result: 'apto' | 'inapto' | 'apto_com_restricao';
  restrictionsNotes?: string;
  certificateFileUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface DisciplinaryNoticeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  type: 'orientacao_verbal' | 'advertencia_escrita' | 'suspensao_disciplinar';
  suspensionDays?: number; // 1 a 3 dias de suspensão sem remuneração e perda de DSR
  cltReason: 'desidia' | 'indisciplina_insubordinacao' | 'desrespeito_chefia' | 'atrasos_reiterados' | 'abandono_posto' | 'outros';
  cltReasonLabel: string;
  occurrenceDate: string;
  incidentDetails: string;
  witness1Name?: string;
  witness2Name?: string;
  signedByEmployee: boolean;
  refusedSignatureNotes?: string;
  managerSignerName: string;
  createdAt: string;
}

export interface EmployeeBenefitCard {
  id: string;
  employeeId: string;
  type: 'vale_transporte' | 'vale_refeicao' | 'plano_saude' | 'plano_odontologico' | 'seguro_vida';
  providerName: string;
  cardNumber?: string;
  monthlyAmount: number;
  employeeDiscountPct: number; // Ex: 6% VT, 5% VR
  employeeDeductionAmount: number;
  status: 'ativo' | 'suspenso' | 'cancelado';
}

