import { Store, UserAccount, PunchRecord, ScheduleDay, MedicalCertificate, OccurrenceRecord, SystemNotification } from '../types';

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1',
    name: 'Crepelocks Shopping Sul',
    code: 'LJ-01',
    address: 'Av. das Nações, 1500 - Piso L2',
    city: 'São Paulo - SP',
    active: true,
    managerName: 'Carlos Silveira',
    phone: '(11) 3456-7890'
  },
  {
    id: 'store-2',
    name: 'Crepelocks Centro Histórico',
    code: 'LJ-02',
    address: 'Rua Direita, 240',
    city: 'São Paulo - SP',
    active: true,
    managerName: 'Juliana Mendes',
    phone: '(11) 3210-9876'
  },
  {
    id: 'store-3',
    name: 'Crepelocks Express Norte',
    code: 'LJ-03',
    address: 'Av. Nova Cantareira, 890',
    city: 'São Paulo - SP',
    active: true,
    managerName: 'Roberto Lima',
    phone: '(11) 2987-6543'
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin',
    name: 'Tiago Rodrigues (Diretoria Crepelocks)',
    email: 'admin@admin.com',
    passwordHash: '123456',
    role: 'dono',
    storeId: 'store-1',
    positionTitle: 'Diretor / Sócio Proprietário',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    admissionDate: '2023-01-10',
    scheduleType: '5x2',
    defaultShiftStart: '09:00',
    defaultShiftEnd: '18:00',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    avatarColor: 'from-amber-500 to-orange-600',
    permissions: {
      canEditSchedules: true,
      canApproveOccurrences: true,
      canManageEmployees: true,
      canViewFinancialReports: true,
      canUploadCertificates: true,
      canExportPayroll: true,
      canEditStores: true
    }
  },
  {
    id: 'user-gerente-1',
    name: 'Carlos Silveira',
    email: 'carlos.gerente@crepelocks.com.br',
    passwordHash: '123456',
    role: 'gerente',
    storeId: 'store-1',
    positionTitle: 'Gerente Geral de Loja',
    cpf: '234.567.890-11',
    phone: '(11) 97654-3210',
    admissionDate: '2023-06-15',
    scheduleType: '6x1',
    defaultShiftStart: '08:00',
    defaultShiftEnd: '16:20',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    avatarColor: 'from-emerald-500 to-teal-700',
    permissions: {
      canEditSchedules: true,
      canApproveOccurrences: true,
      canManageEmployees: true,
      canViewFinancialReports: false,
      canUploadCertificates: true,
      canExportPayroll: true,
      canEditStores: false
    }
  },
  {
    id: 'user-maria',
    name: 'Maria Oliveira',
    email: 'maria@crepelocks.com.br',
    passwordHash: '123456',
    role: 'atendente',
    storeId: 'store-1',
    positionTitle: 'Atendente de Crepeira & Balcão',
    cpf: '345.678.901-22',
    phone: '(11) 96543-2109',
    admissionDate: '2024-02-01',
    scheduleType: '6x1',
    defaultShiftStart: '08:00',
    defaultShiftEnd: '16:20',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    avatarColor: 'from-rose-500 to-pink-600',
    permissions: {
      canEditSchedules: false,
      canApproveOccurrences: false,
      canManageEmployees: false,
      canViewFinancialReports: false,
      canUploadCertificates: false,
      canExportPayroll: false,
      canEditStores: false
    }
  },
  {
    id: 'user-lucas',
    name: 'Lucas Ferreira',
    email: 'lucas@crepelocks.com.br',
    passwordHash: '123456',
    role: 'atendente',
    storeId: 'store-2',
    positionTitle: 'Operador de Loja / Chapeiro',
    cpf: '456.789.012-33',
    phone: '(11) 95432-1098',
    admissionDate: '2024-03-10',
    scheduleType: '12x36',
    defaultShiftStart: '10:00',
    defaultShiftEnd: '22:00',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    avatarColor: 'from-blue-500 to-indigo-600',
    permissions: {
      canEditSchedules: false,
      canApproveOccurrences: false,
      canManageEmployees: false,
      canViewFinancialReports: false,
      canUploadCertificates: false,
      canExportPayroll: false,
      canEditStores: false
    }
  },
  {
    id: 'user-beatriz',
    name: 'Beatriz Santos',
    email: 'beatriz@crepelocks.com.br',
    passwordHash: '123456',
    role: 'atendente',
    storeId: 'store-3',
    positionTitle: 'Atendente de Caixa & Salão',
    cpf: '567.890.123-44',
    phone: '(11) 94321-0987',
    admissionDate: '2024-04-12',
    scheduleType: '6x1',
    defaultShiftStart: '14:00',
    defaultShiftEnd: '22:20',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    avatarColor: 'from-purple-500 to-violet-600',
    permissions: {
      canEditSchedules: false,
      canApproveOccurrences: false,
      canManageEmployees: false,
      canViewFinancialReports: false,
      canUploadCertificates: false,
      canExportPayroll: false,
      canEditStores: false
    }
  },
  {
    id: 'user-gabriel',
    name: 'Gabriel Martins',
    email: 'gabriel@crepelocks.com.br',
    passwordHash: '123456',
    role: 'atendente',
    storeId: 'store-1',
    positionTitle: 'Auxiliar de Cozinha & Crepes',
    cpf: '678.901.234-55',
    phone: '(11) 93210-9876',
    admissionDate: '2024-05-20',
    scheduleType: '12x36',
    defaultShiftStart: '10:00',
    defaultShiftEnd: '22:00',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    avatarColor: 'from-cyan-500 to-teal-600',
    permissions: {
      canEditSchedules: false,
      canApproveOccurrences: false,
      canManageEmployees: false,
      canViewFinancialReports: false,
      canUploadCertificates: false,
      canExportPayroll: false,
      canEditStores: false
    }
  }
];

// Helper to generate dates relative to current date (October 2026)
function getRecentDate(daysAgo: number): string {
  const d = new Date(2026, 9, 6); // October 6, 2026
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export const INITIAL_PUNCHES: PunchRecord[] = [
  // Maria Oliveira (store-1, 6x1, scheduled 08:00 - 16:20)
  {
    id: 'punch-m-today',
    employeeId: 'user-maria',
    date: '2026-10-06',
    entry: '08:02:14',
    lunchStart: '12:00:30',
    lunchEnd: '13:01:05',
    exit: null, // Still working currently
    scheduledStart: '08:00',
    scheduledEnd: '16:20',
    scheduledLunchMin: 60,
    workedMinutes: 240,
    expectedMinutes: 440,
    delayMinutes: 2, // within 10 min tolerance
    extraMinutes: 0,
    adherencePercentage: 99.5,
    status: 'regular',
    statusLabel: 'Em Jornada (Pontual)',
    hashReceipt: 'SHA256:7B8F9A01C4E2D38A4B9F0123ACDE5678',
    locationIp: '189.120.45.10 (Loja Sul - PDV 1)'
  },
  {
    id: 'punch-m-1',
    employeeId: 'user-maria',
    date: '2026-10-05',
    entry: '07:58:20',
    lunchStart: '12:05:00',
    lunchEnd: '13:05:00',
    exit: '16:22:15',
    scheduledStart: '08:00',
    scheduledEnd: '16:20',
    scheduledLunchMin: 60,
    workedMinutes: 444,
    expectedMinutes: 440,
    delayMinutes: 0,
    extraMinutes: 4,
    adherencePercentage: 100,
    status: 'regular',
    statusLabel: 'Completo (100% aderente)',
    hashReceipt: 'SHA256:9A01C4E2D38A4B9F7B8F0123ACDE9991',
    locationIp: '189.120.45.10 (Loja Sul - PDV 1)'
  },
  {
    id: 'punch-m-2',
    employeeId: 'user-maria',
    date: '2026-10-04',
    entry: '08:24:10', // late!
    lunchStart: '12:10:00',
    lunchEnd: '13:10:00',
    exit: '16:20:00',
    scheduledStart: '08:00',
    scheduledEnd: '16:20',
    scheduledLunchMin: 60,
    workedMinutes: 416,
    expectedMinutes: 440,
    delayMinutes: 24,
    extraMinutes: 0,
    adherencePercentage: 94.5,
    status: 'atraso',
    statusLabel: 'Atraso de 24 min',
    hashReceipt: 'SHA256:D38A4B9F7B8F0123ACDE99919A01C4E2',
    locationIp: '189.120.45.10 (Loja Sul - PDV 1)'
  },
  {
    id: 'punch-m-3',
    employeeId: 'user-maria',
    date: '2026-10-03',
    entry: '08:00:15',
    lunchStart: '12:00:00',
    lunchEnd: '13:00:00',
    exit: '17:35:00', // extra hours!
    scheduledStart: '08:00',
    scheduledEnd: '16:20',
    scheduledLunchMin: 60,
    workedMinutes: 515,
    expectedMinutes: 440,
    delayMinutes: 0,
    extraMinutes: 75,
    adherencePercentage: 98,
    status: 'dia_extra',
    statusLabel: 'Horas Extras (75 min)',
    hashReceipt: 'SHA256:3ACDE99919A01C4E2D38A4B9F7B8F012',
    locationIp: '189.120.45.10 (Loja Sul - PDV 1)'
  },
  {
    id: 'punch-m-4',
    employeeId: 'user-maria',
    date: '2026-10-02',
    entry: null,
    lunchStart: null,
    lunchEnd: null,
    exit: null,
    scheduledStart: '08:00',
    scheduledEnd: '16:20',
    scheduledLunchMin: 60,
    workedMinutes: 0,
    expectedMinutes: 0,
    delayMinutes: 0,
    extraMinutes: 0,
    adherencePercentage: 100,
    status: 'folga',
    statusLabel: 'Folga Escala 6x1 (DSR)',
    notes: 'Descanso Semanal Remunerado'
  },
  // Lucas Ferreira (store-2, 12x36, scheduled 10:00 - 22:00)
  {
    id: 'punch-l-today',
    employeeId: 'user-lucas',
    date: '2026-10-06',
    entry: '09:55:40',
    lunchStart: '14:00:00',
    lunchEnd: '15:00:00',
    exit: null,
    scheduledStart: '10:00',
    scheduledEnd: '22:00',
    scheduledLunchMin: 60,
    workedMinutes: 380,
    expectedMinutes: 660,
    delayMinutes: 0,
    extraMinutes: 0,
    adherencePercentage: 100,
    status: 'regular',
    statusLabel: 'Em Jornada 12x36',
    hashReceipt: 'SHA256:4C8F9A01C4E2D38A4B9F0123ACDE1111',
    locationIp: '177.85.90.12 (Loja Centro - PDV 1)'
  },
  {
    id: 'punch-l-1',
    employeeId: 'user-lucas',
    date: '2026-10-05',
    entry: null,
    lunchStart: null,
    lunchEnd: null,
    exit: null,
    scheduledStart: '10:00',
    scheduledEnd: '22:00',
    scheduledLunchMin: 60,
    workedMinutes: 0,
    expectedMinutes: 0,
    delayMinutes: 0,
    extraMinutes: 0,
    adherencePercentage: 100,
    status: 'folga',
    statusLabel: 'Folga 36h Interjornada',
    notes: 'Ciclo 12x36'
  },
  // Beatriz Santos (store-3, 6x1, scheduled 14:00 - 22:20)
  {
    id: 'punch-b-today',
    employeeId: 'user-beatriz',
    date: '2026-10-06',
    entry: '14:48:30', // Significant delay!
    lunchStart: null,
    lunchEnd: null,
    exit: null,
    scheduledStart: '14:00',
    scheduledEnd: '22:20',
    scheduledLunchMin: 60,
    workedMinutes: 120,
    expectedMinutes: 440,
    delayMinutes: 48,
    extraMinutes: 0,
    adherencePercentage: 89.1,
    status: 'atraso',
    statusLabel: 'Atraso Crítico (+48 min)',
    hashReceipt: 'SHA256:888F9A01C4E2D38A4B9F0123ACDE4444',
    locationIp: '201.33.10.8 (Loja Express - PDV 1)'
  },
  // Gabriel Martins (store-1, 12x36, absent today!)
  {
    id: 'punch-g-today',
    employeeId: 'user-gabriel',
    date: '2026-10-06',
    entry: null,
    lunchStart: null,
    lunchEnd: null,
    exit: null,
    scheduledStart: '10:00',
    scheduledEnd: '22:00',
    scheduledLunchMin: 60,
    workedMinutes: 0,
    expectedMinutes: 660,
    delayMinutes: 400,
    extraMinutes: 0,
    adherencePercentage: 0,
    status: 'falta_injustificada',
    statusLabel: 'Ausência Não Autorizada (Alerta)',
    notes: 'Funcionário escalado para 10:00, sem registro de ponto até o momento'
  }
];

export const INITIAL_SCHEDULES: ScheduleDay[] = [
  // Generate sample days for October 2026 for Maria (6x1)
  { id: 'sch-m-1', employeeId: 'user-maria', date: '2026-10-01', shiftStart: '08:00', shiftEnd: '16:20', isOffDay: false, isExtraDay: false, scheduleType: '6x1' },
  { id: 'sch-m-2', employeeId: 'user-maria', date: '2026-10-02', shiftStart: '08:00', shiftEnd: '16:20', isOffDay: true, isExtraDay: false, scheduleType: '6x1', notes: 'Folga DSR' },
  { id: 'sch-m-3', employeeId: 'user-maria', date: '2026-10-03', shiftStart: '08:00', shiftEnd: '16:20', isOffDay: false, isExtraDay: false, scheduleType: '6x1' },
  { id: 'sch-m-4', employeeId: 'user-maria', date: '2026-10-04', shiftStart: '08:00', shiftEnd: '16:20', isOffDay: false, isExtraDay: false, scheduleType: '6x1' },
  { id: 'sch-m-5', employeeId: 'user-maria', date: '2026-10-05', shiftStart: '08:00', shiftEnd: '16:20', isOffDay: false, isExtraDay: false, scheduleType: '6x1' },
  { id: 'sch-m-6', employeeId: 'user-maria', date: '2026-10-06', shiftStart: '08:00', shiftEnd: '16:20', isOffDay: false, isExtraDay: false, scheduleType: '6x1' },
  { id: 'sch-m-7', employeeId: 'user-maria', date: '2026-10-07', shiftStart: '08:00', shiftEnd: '16:20', isOffDay: false, isExtraDay: false, scheduleType: '6x1' },
  { id: 'sch-m-8', employeeId: 'user-maria', date: '2026-10-08', shiftStart: '08:00', shiftEnd: '16:20', isOffDay: false, isExtraDay: false, scheduleType: '6x1' },
  { id: 'sch-m-9', employeeId: 'user-maria', date: '2026-10-09', shiftStart: '08:00', shiftEnd: '16:20', isOffDay: true, isExtraDay: false, scheduleType: '6x1', notes: 'Folga DSR' },

  // Lucas Ferreira (12x36)
  { id: 'sch-l-1', employeeId: 'user-lucas', date: '2026-10-01', shiftStart: '10:00', shiftEnd: '22:00', isOffDay: true, isExtraDay: false, scheduleType: '12x36' },
  { id: 'sch-l-2', employeeId: 'user-lucas', date: '2026-10-02', shiftStart: '10:00', shiftEnd: '22:00', isOffDay: false, isExtraDay: false, scheduleType: '12x36' },
  { id: 'sch-l-3', employeeId: 'user-lucas', date: '2026-10-03', shiftStart: '10:00', shiftEnd: '22:00', isOffDay: true, isExtraDay: false, scheduleType: '12x36' },
  { id: 'sch-l-4', employeeId: 'user-lucas', date: '2026-10-04', shiftStart: '10:00', shiftEnd: '22:00', isOffDay: false, isExtraDay: false, scheduleType: '12x36' },
  { id: 'sch-l-5', employeeId: 'user-lucas', date: '2026-10-05', shiftStart: '10:00', shiftEnd: '22:00', isOffDay: true, isExtraDay: false, scheduleType: '12x36' },
  { id: 'sch-l-6', employeeId: 'user-lucas', date: '2026-10-06', shiftStart: '10:00', shiftEnd: '22:00', isOffDay: false, isExtraDay: false, scheduleType: '12x36' },
  { id: 'sch-l-7', employeeId: 'user-lucas', date: '2026-10-07', shiftStart: '10:00', shiftEnd: '22:00', isOffDay: true, isExtraDay: false, scheduleType: '12x36' },

  // Gabriel Martins (12x36)
  { id: 'sch-g-6', employeeId: 'user-gabriel', date: '2026-10-06', shiftStart: '10:00', shiftEnd: '22:00', isOffDay: false, isExtraDay: false, scheduleType: '12x36' },

  // Beatriz Santos (6x1)
  { id: 'sch-b-6', employeeId: 'user-beatriz', date: '2026-10-06', shiftStart: '14:00', shiftEnd: '22:20', isOffDay: false, isExtraDay: false, scheduleType: '6x1' }
];

export const INITIAL_OCCURRENCES: OccurrenceRecord[] = [
  {
    id: 'occ-1',
    employeeId: 'user-maria',
    employeeName: 'Maria Oliveira',
    storeId: 'store-1',
    date: '2026-10-02',
    type: 'folga',
    reason: 'Descanso Semanal Remunerado escala 6x1',
    registeredBy: 'Carlos Silveira (Gerente)',
    createdAt: '2026-10-01 10:00:00'
  },
  {
    id: 'occ-2',
    employeeId: 'user-maria',
    employeeName: 'Maria Oliveira',
    storeId: 'store-1',
    date: '2026-09-28',
    type: 'falta_justificada',
    reason: 'Atestado médico odontológico apresentado',
    registeredBy: 'Carlos Silveira (Gerente)',
    createdAt: '2026-09-28 14:30:00',
    certificateId: 'cert-1',
    attachmentName: 'atestado_maria_odonto_28set.pdf'
  },
  {
    id: 'occ-3',
    employeeId: 'user-gabriel',
    employeeName: 'Gabriel Martins',
    storeId: 'store-1',
    date: '2026-10-06',
    type: 'falta_injustificada',
    reason: 'Não compareceu ao plantão 12x36 sem comunicação prévia',
    registeredBy: 'Sistema Crepelocks (Alerta Automático)',
    createdAt: '2026-10-06 14:00:00'
  },
  {
    id: 'occ-4',
    employeeId: 'user-lucas',
    employeeName: 'Lucas Ferreira',
    storeId: 'store-2',
    date: '2026-10-03',
    type: 'abono_horas',
    hoursAbono: 2,
    reason: 'Abono autorizado para consulta médica preventiva',
    registeredBy: 'Tiago Rodrigues (Diretoria)',
    createdAt: '2026-10-03 16:00:00'
  }
];

export const INITIAL_CERTIFICATES: MedicalCertificate[] = [
  {
    id: 'cert-1',
    employeeId: 'user-maria',
    employeeName: 'Maria Oliveira',
    storeId: 'store-1',
    startDate: '2026-09-28',
    daysOff: 1,
    cidCode: 'K08.1 - Perda de dentes devido a trauma/extração',
    doctorName: 'Dra. Camila Albuquerque',
    doctorCrm: 'CRO-SP 89432',
    fileName: 'atestado_maria_odonto_28set.pdf',
    fileSizeKb: 142,
    status: 'aprovado',
    notes: 'Atestado válido com carimbo e assinatura digital. Ponto abonado sem desconto de DSR.',
    uploadedAt: '2026-09-28 14:22:00'
  },
  {
    id: 'cert-2',
    employeeId: 'user-beatriz',
    employeeName: 'Beatriz Santos',
    storeId: 'store-3',
    startDate: '2026-09-15',
    daysOff: 2,
    cidCode: 'J06.9 - Infecção aguda das vias aéreas superiores',
    doctorName: 'Dr. Fernando Paes',
    doctorCrm: 'CRM-SP 142.339',
    fileName: 'atestado_beatriz_respiratorio.pdf',
    fileSizeKb: 218,
    status: 'aprovado',
    notes: 'Afastamento de 2 dias deferido conforme CLT.',
    uploadedAt: '2026-09-15 09:12:00'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    type: 'ausencia',
    employeeId: 'user-gabriel',
    employeeName: 'Gabriel Martins',
    storeId: 'store-1',
    storeName: 'Crepelocks Shopping Sul',
    title: 'Alerta de Ausência Não Autorizada',
    message: 'Gabriel Martins está escalado hoje (10:00 - 22:00) e não registrou ponto de entrada até agora.',
    timestamp: '2026-10-06 11:30:00',
    read: false,
    severity: 'error'
  },
  {
    id: 'notif-2',
    type: 'atraso',
    employeeId: 'user-beatriz',
    employeeName: 'Beatriz Santos',
    storeId: 'store-3',
    storeName: 'Crepelocks Express Norte',
    title: 'Atraso Registrado (> 40 min)',
    message: 'Beatriz Santos registrou ponto com atraso de 48 minutos na jornada de hoje.',
    timestamp: '2026-10-06 14:49:00',
    read: false,
    severity: 'warning'
  },
  {
    id: 'notif-3',
    type: 'atestado_novo',
    employeeId: 'user-maria',
    employeeName: 'Maria Oliveira',
    storeId: 'store-1',
    storeName: 'Crepelocks Shopping Sul',
    title: 'Atestado Médico no Prontuário',
    message: 'Atestado odontológico arquivado com sucesso no prontuário de Maria Oliveira.',
    timestamp: '2026-09-28 14:30:00',
    read: true,
    severity: 'info'
  }
];
