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
  positionTitle: string; // e.g. "Atendente de Balcão", "Gerente de Unidade", "Diretor Executivo"
  cpf?: string;
  phone?: string;
  admissionDate: string;
  scheduleType: ScheduleType;
  defaultShiftStart: string; // "08:00" or "14:00" or "10:00"
  defaultShiftEnd: string;   // "16:20" or "22:20" or "22:00"
  lunchDurationMin: number;  // typically 60 min
  active: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
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
