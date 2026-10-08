import { Store, UserAccount, PunchRecord, ScheduleDay, MedicalCertificate, OccurrenceRecord, SystemNotification, PayrollEmployeeConfig } from '../types';

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
    name: 'Tiago Rodrigues',
    email: 'admin@admin.com',
    passwordHash: '123456',
    role: 'dono',
    storeId: 'all',
    hasAccessToAllStores: true,
    positionTitle: 'Diretor Executivo',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    admissionDate: '2023-01-10',
    scheduleType: '5x2',
    defaultShiftStart: '09:00',
    defaultShiftEnd: '18:00',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: true,
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
    id: 'user-marcos',
    name: 'Marcos Andrade',
    email: 'marcos.financeiro@crepelocks.com',
    passwordHash: '123456',
    role: 'dono',
    storeId: 'all',
    hasAccessToAllStores: true,
    positionTitle: 'Diretor Financeiro',
    cpf: '234.567.890-11',
    phone: '(11) 98111-2233',
    admissionDate: '2023-03-15',
    scheduleType: '5x2',
    defaultShiftStart: '09:00',
    defaultShiftEnd: '18:00',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: true,
    avatarColor: 'from-amber-600 to-yellow-600',
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
    id: 'user-fernando',
    name: 'Fernando Rocha',
    email: 'fernando.operacoes@crepelocks.com',
    passwordHash: '123456',
    role: 'dono',
    storeId: 'all',
    hasAccessToAllStores: true,
    positionTitle: 'Diretor Operacional',
    cpf: '345.678.901-22',
    phone: '(11) 98222-3344',
    admissionDate: '2023-04-01',
    scheduleType: '5x2',
    defaultShiftStart: '08:00',
    defaultShiftEnd: '17:00',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: true,
    avatarColor: 'from-orange-500 to-amber-700',
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
    id: 'user-carlos',
    name: 'Carlos Silveira',
    email: 'gerente@crepelocks.com',
    passwordHash: '123456',
    role: 'gerente',
    storeId: 'store-1',
    hasAccessToAllStores: false,
    positionTitle: 'Gerente de Loja',
    cpf: '456.789.012-33',
    phone: '(11) 98333-4455',
    admissionDate: '2023-06-10',
    scheduleType: '6x1',
    defaultShiftStart: '08:00',
    defaultShiftEnd: '16:20',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: false,
    avatarColor: 'from-emerald-500 to-teal-700',
    permissions: {
      canEditSchedules: true,
      canApproveOccurrences: true,
      canManageEmployees: false,
      canViewFinancialReports: true,
      canUploadCertificates: true,
      canExportPayroll: true,
      canEditStores: false
    }
  },
  {
    id: 'user-juliana',
    name: 'Juliana Mendes',
    email: 'juliana.vendas@crepelocks.com',
    passwordHash: '123456',
    role: 'gerente',
    storeId: 'all',
    hasAccessToAllStores: true,
    positionTitle: 'Gerente de Vendas',
    cpf: '567.890.123-44',
    phone: '(11) 98444-5566',
    admissionDate: '2023-08-20',
    scheduleType: '6x1',
    defaultShiftStart: '09:00',
    defaultShiftEnd: '17:20',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: false,
    avatarColor: 'from-teal-600 to-cyan-700',
    permissions: {
      canEditSchedules: true,
      canApproveOccurrences: true,
      canManageEmployees: false,
      canViewFinancialReports: true,
      canUploadCertificates: true,
      canExportPayroll: true,
      canEditStores: false
    }
  },
  {
    id: 'user-rafael',
    name: 'Rafael Souza',
    email: 'rafael.marketing@crepelocks.com',
    passwordHash: '123456',
    role: 'gerente',
    storeId: 'all',
    hasAccessToAllStores: true,
    positionTitle: 'Gerente de Marketing',
    cpf: '678.901.234-55',
    phone: '(11) 98555-6677',
    admissionDate: '2023-09-01',
    scheduleType: '5x2',
    defaultShiftStart: '09:00',
    defaultShiftEnd: '18:00',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: true,
    avatarColor: 'from-purple-500 to-indigo-600',
    permissions: {
      canEditSchedules: false,
      canApproveOccurrences: false,
      canManageEmployees: false,
      canViewFinancialReports: true,
      canUploadCertificates: false,
      canExportPayroll: true,
      canEditStores: false
    }
  },
  {
    id: 'user-camila',
    name: 'Camila Duarte',
    email: 'camila.admin@crepelocks.com',
    passwordHash: '123456',
    role: 'atendente',
    storeId: 'store-1',
    hasAccessToAllStores: false,
    positionTitle: 'Auxiliar Administrativo',
    cpf: '789.012.345-66',
    phone: '(11) 98666-7788',
    admissionDate: '2024-01-15',
    scheduleType: '5x2',
    defaultShiftStart: '08:00',
    defaultShiftEnd: '17:48',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: false,
    avatarColor: 'from-blue-500 to-indigo-700',
    permissions: {
      canEditSchedules: false,
      canApproveOccurrences: false,
      canManageEmployees: false,
      canViewFinancialReports: false,
      canUploadCertificates: true,
      canExportPayroll: false,
      canEditStores: false
    }
  },
  {
    id: 'user-maria',
    name: 'Maria Oliveira',
    email: 'maria@crepelocks.com',
    passwordHash: '123456',
    role: 'atendente',
    storeId: 'store-1',
    hasAccessToAllStores: false,
    positionTitle: 'Atendente',
    cpf: '890.123.456-77',
    phone: '(11) 98777-8899',
    admissionDate: '2024-02-01',
    scheduleType: '6x1',
    defaultShiftStart: '08:00',
    defaultShiftEnd: '16:20',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: false,
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
    email: 'lucas@crepelocks.com',
    passwordHash: '123456',
    role: 'gerente',
    storeId: 'store-2',
    hasAccessToAllStores: false,
    positionTitle: 'Gerente de Loja',
    cpf: '901.234.567-88',
    phone: '(11) 98888-9900',
    admissionDate: '2023-11-10',
    scheduleType: '12x36',
    defaultShiftStart: '10:00',
    defaultShiftEnd: '22:00',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: false,
    avatarColor: 'from-emerald-600 to-green-700',
    permissions: {
      canEditSchedules: true,
      canApproveOccurrences: true,
      canManageEmployees: false,
      canViewFinancialReports: true,
      canUploadCertificates: true,
      canExportPayroll: true,
      canEditStores: false
    }
  },
  {
    id: 'user-beatriz',
    name: 'Beatriz Santos',
    email: 'beatriz@crepelocks.com',
    passwordHash: '123456',
    role: 'atendente',
    storeId: 'store-3',
    hasAccessToAllStores: false,
    positionTitle: 'Atendente',
    cpf: '012.345.678-99',
    phone: '(11) 98999-0011',
    admissionDate: '2024-03-20',
    scheduleType: '6x1',
    defaultShiftStart: '14:00',
    defaultShiftEnd: '22:20',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: false,
    avatarColor: 'from-violet-500 to-purple-600',
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
    email: 'gabriel@crepelocks.com',
    passwordHash: '123456',
    role: 'atendente',
    storeId: 'store-1',
    hasAccessToAllStores: false,
    positionTitle: 'Atendente',
    cpf: '123.234.345-00',
    phone: '(11) 98000-1122',
    admissionDate: '2024-04-10',
    scheduleType: '12x36',
    defaultShiftStart: '10:00',
    defaultShiftEnd: '22:00',
    lunchDurationMin: 60,
    active: true,
    mfaEnabled: false,
    exemptFromPunchClock: false,
    avatarColor: 'from-blue-600 to-sky-700',
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

const generateFullMonthSchedules = (): ScheduleDay[] => {
  const schedules: ScheduleDay[] = [];
  const daysInOct = 31;

  for (let d = 1; d <= daysInOct; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateStr = `2026-10-${dayStr}`;
    const dateObj = new Date(2026, 9, d); // October 2026
    const dayOfWeek = dateObj.getDay(); // 0 = Dom, 5 = Sex, 6 = Sáb

    // 1. Maria Oliveira (6x1, 08:00 - 16:20, Folga DSR às sextas / ciclo)
    const mariaOff = d === 2 || d === 9 || d === 16 || d === 23 || d === 30;
    schedules.push({
      id: `sch-m-${d}`,
      employeeId: 'user-maria',
      date: dateStr,
      shiftStart: '08:00',
      shiftEnd: '16:20',
      isOffDay: mariaOff,
      isExtraDay: false,
      scheduleType: '6x1',
      notes: mariaOff ? 'Folga DSR (Escala 6x1)' : undefined
    });

    // 2. Lucas Ferreira (12x36, 10:00 - 22:00, dias pares trabalham, dias ímpares folga)
    const lucasOff = d % 2 !== 0;
    schedules.push({
      id: `sch-l-${d}`,
      employeeId: 'user-lucas',
      date: dateStr,
      shiftStart: '10:00',
      shiftEnd: '22:00',
      isOffDay: lucasOff,
      isExtraDay: false,
      scheduleType: '12x36',
      notes: lucasOff ? 'Folga 36h (Plantão 12x36)' : 'Plantão 12h'
    });

    // 3. Gabriel Martins (12x36, 10:00 - 22:00, dias ímpares trabalham, dias pares folga)
    const gabrielOff = d % 2 === 0;
    schedules.push({
      id: `sch-g-${d}`,
      employeeId: 'user-gabriel',
      date: dateStr,
      shiftStart: '10:00',
      shiftEnd: '22:00',
      isOffDay: gabrielOff,
      isExtraDay: false,
      scheduleType: '12x36',
      notes: gabrielOff ? 'Folga 36h (Plantão 12x36)' : 'Plantão 12h'
    });

    // 4. Beatriz Santos (6x1, 14:00 - 22:20, Folga DSR aos domingos)
    const beatrizOff = dayOfWeek === 0;
    schedules.push({
      id: `sch-b-${d}`,
      employeeId: 'user-beatriz',
      date: dateStr,
      shiftStart: '14:00',
      shiftEnd: '22:20',
      isOffDay: beatrizOff,
      isExtraDay: false,
      scheduleType: '6x1',
      notes: beatrizOff ? 'Folga DSR Domingo (Escala 6x1)' : undefined
    });

    // 5. Carlos Silveira (Gerente de Loja, 6x1, 08:00 - 16:20, DSR aos domingos)
    const carlosOff = dayOfWeek === 0;
    schedules.push({
      id: `sch-carlos-${d}`,
      employeeId: 'user-carlos',
      date: dateStr,
      shiftStart: '08:00',
      shiftEnd: '16:20',
      isOffDay: carlosOff,
      isExtraDay: false,
      scheduleType: '6x1',
      notes: carlosOff ? 'Folga DSR Gerência' : undefined
    });

    // 6. Camila Duarte (Auxiliar Administrativo, 5x2, 08:00 - 17:48, Folga Sábado e Domingo)
    const camilaOff = dayOfWeek === 0 || dayOfWeek === 6;
    schedules.push({
      id: `sch-c-${d}`,
      employeeId: 'user-camila',
      date: dateStr,
      shiftStart: '08:00',
      shiftEnd: '17:48',
      isOffDay: camilaOff,
      isExtraDay: false,
      scheduleType: '5x2',
      notes: camilaOff ? (dayOfWeek === 6 ? 'Folga Sábado (DSR 5x2)' : 'Folga Domingo (DSR 5x2)') : undefined
    });

    // 7. Rafael Souza (Gerente de Marketing, 5x2, 09:00 - 18:00, Folga Sábado e Domingo)
    const rafaelOff = dayOfWeek === 0 || dayOfWeek === 6;
    schedules.push({
      id: `sch-r-${d}`,
      employeeId: 'user-rafael',
      date: dateStr,
      shiftStart: '09:00',
      shiftEnd: '18:00',
      isOffDay: rafaelOff,
      isExtraDay: false,
      scheduleType: '5x2',
      notes: rafaelOff ? (dayOfWeek === 6 ? 'Folga Sábado (DSR 5x2)' : 'Folga Domingo (DSR 5x2)') : undefined
    });
  }

  return schedules;
};

export const INITIAL_SCHEDULES: ScheduleDay[] = generateFullMonthSchedules();

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
  },
  {
    id: 'cert-3',
    employeeId: 'user-lucas',
    employeeName: 'Lucas Ferreira',
    storeId: 'store-2',
    startDate: '2026-10-03',
    daysOff: 1,
    cidCode: 'Z00.0 - Exame médico de rotina',
    doctorName: 'Dr. Roberto Silveira',
    doctorCrm: 'CRM-SP 189.201',
    fileName: 'atestado_lucas_consulta.pdf',
    fileSizeKb: 135,
    status: 'aprovado',
    notes: 'Declaração de comparecimento homologada para abono de horas.',
    uploadedAt: '2026-10-03 16:15:00'
  },
  {
    id: 'cert-4',
    employeeId: 'user-gabriel',
    employeeName: 'Gabriel Martins',
    storeId: 'store-1',
    startDate: '2026-09-20',
    daysOff: 1,
    cidCode: 'M54.5 - Dor lombar baixa',
    doctorName: 'Dra. Patricia Lima',
    doctorCrm: 'CRM-SP 165.412',
    fileName: 'atestado_gabriel_ortopedia.pdf',
    fileSizeKb: 160,
    status: 'aprovado',
    notes: 'Atestado ortopédico apresentado e arquivado no prontuário.',
    uploadedAt: '2026-09-20 11:45:00'
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

export const INITIAL_PAYROLL_CONFIGS: PayrollEmployeeConfig[] = [
  {
    employeeId: 'user-admin', // Tiago Rodrigues (Dono / Diretor Executivo)
    baseSalary: 12500.00, // Pró-labore
    bonusGratification: 2500.00,
    vtDiscountPct: 0, // Dono não desconta VT
    vrVaDiscountPct: 0,
    inssDiscountPct: null, // Cálculo automático ou teto
    irpfDiscountPct: null,
    otherDiscountsAmount: 0,
    otherDiscountsDescription: '',
    familyAllowanceDependents: 1,
    includePunchesExtras: false,
    includeDelaysDiscount: false,
    notes: 'Pró-labore de Diretor Executivo',
    updatedAt: '2026-10-01'
  },
  {
    employeeId: 'user-marcos', // Marcos Andrade (Diretor Financeiro)
    baseSalary: 9500.00,
    bonusGratification: 1500.00,
    vtDiscountPct: 0,
    vrVaDiscountPct: 0,
    inssDiscountPct: null,
    irpfDiscountPct: null,
    otherDiscountsAmount: 0,
    otherDiscountsDescription: '',
    familyAllowanceDependents: 0,
    includePunchesExtras: false,
    includeDelaysDiscount: false,
    notes: 'Pró-labore de Diretor Financeiro',
    updatedAt: '2026-10-01'
  },
  {
    employeeId: 'user-fernando', // Fernando Rocha (Diretor Operacional)
    baseSalary: 9500.00,
    bonusGratification: 1500.00,
    vtDiscountPct: 0,
    vrVaDiscountPct: 0,
    inssDiscountPct: null,
    irpfDiscountPct: null,
    otherDiscountsAmount: 0,
    otherDiscountsDescription: '',
    familyAllowanceDependents: 2,
    includePunchesExtras: false,
    includeDelaysDiscount: false,
    notes: 'Pró-labore de Diretor Operacional',
    updatedAt: '2026-10-01'
  },
  {
    employeeId: 'user-carlos', // Carlos Silveira (Gerente de Loja)
    baseSalary: 4200.00,
    bonusGratification: 800.00,
    vtDiscountPct: 6,
    vrVaDiscountPct: 5,
    inssDiscountPct: null,
    irpfDiscountPct: null,
    otherDiscountsAmount: 120.00,
    otherDiscountsDescription: 'Plano Odontológico',
    familyAllowanceDependents: 1,
    includePunchesExtras: true,
    includeDelaysDiscount: true,
    notes: 'Gratificação por atingimento de meta de vendas',
    updatedAt: '2026-10-01'
  },
  {
    employeeId: 'user-juliana', // Juliana Mendes (Gerente de Vendas)
    baseSalary: 4500.00,
    bonusGratification: 1200.00,
    vtDiscountPct: 6,
    vrVaDiscountPct: 5,
    inssDiscountPct: null,
    irpfDiscountPct: null,
    otherDiscountsAmount: 0,
    familyAllowanceDependents: 0,
    includePunchesExtras: true,
    includeDelaysDiscount: true,
    notes: 'Comissão e gratificação de gestão comercial',
    updatedAt: '2026-10-01'
  },
  {
    employeeId: 'user-rafael', // Rafael Souza (Gerente de Marketing)
    baseSalary: 4800.00,
    bonusGratification: 600.00,
    vtDiscountPct: 0,
    vrVaDiscountPct: 5,
    inssDiscountPct: null,
    irpfDiscountPct: null,
    otherDiscountsAmount: 0,
    familyAllowanceDependents: 0,
    includePunchesExtras: false,
    includeDelaysDiscount: false,
    notes: 'Home-office híbrido (sem desconto de VT)',
    updatedAt: '2026-10-01'
  },
  {
    employeeId: 'user-camila', // Camila Duarte (Auxiliar Administrativo)
    baseSalary: 2350.00,
    bonusGratification: 250.00,
    vtDiscountPct: 6,
    vrVaDiscountPct: 4,
    inssDiscountPct: null,
    irpfDiscountPct: null,
    otherDiscountsAmount: 45.00,
    otherDiscountsDescription: 'Seguro de Vida',
    familyAllowanceDependents: 1,
    includePunchesExtras: true,
    includeDelaysDiscount: true,
    notes: '',
    updatedAt: '2026-10-01'
  },
  {
    employeeId: 'user-maria', // Maria Oliveira (Atendente)
    baseSalary: 1980.00,
    bonusGratification: 300.00,
    insalubridadePct: 20, // 20% insalubridade (chapa quente / cozinha)
    vtDiscountPct: 6,
    vrVaDiscountPct: 5,
    inssDiscountPct: null,
    irpfDiscountPct: null,
    otherDiscountsAmount: 0,
    familyAllowanceDependents: 2,
    includePunchesExtras: true,
    includeDelaysDiscount: true,
    notes: 'Adicional de insalubridade de cozinha de crepes',
    updatedAt: '2026-10-01'
  },
  {
    employeeId: 'user-lucas', // Lucas Gabriel (Atendente)
    baseSalary: 1980.00,
    bonusGratification: 200.00,
    insalubridadePct: 20,
    vtDiscountPct: 6,
    vrVaDiscountPct: 5,
    inssDiscountPct: null,
    irpfDiscountPct: null,
    otherDiscountsAmount: 50.00,
    otherDiscountsDescription: 'Vale Farmácia',
    familyAllowanceDependents: 0,
    includePunchesExtras: true,
    includeDelaysDiscount: true,
    notes: '',
    updatedAt: '2026-10-01'
  },
  {
    employeeId: 'user-beatriz', // Beatriz Santos (Atendente)
    baseSalary: 1980.00,
    bonusGratification: 150.00,
    insalubridadePct: 20,
    vtDiscountPct: 6,
    vrVaDiscountPct: 5,
    inssDiscountPct: null,
    irpfDiscountPct: null,
    otherDiscountsAmount: 0,
    familyAllowanceDependents: 0,
    includePunchesExtras: true,
    includeDelaysDiscount: true,
    notes: '',
    updatedAt: '2026-10-01'
  }
];

