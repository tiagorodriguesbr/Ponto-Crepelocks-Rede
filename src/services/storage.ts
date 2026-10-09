import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, testConnection, handleFirestoreError, OperationType } from '../firebase';
import {
  Store,
  UserAccount,
  PunchRecord,
  ScheduleDay,
  OccurrenceRecord,
  MedicalCertificate,
  SystemNotification,
  ThemeStyle,
  ScheduleType,
  PunchType,
  PayrollEmployeeConfig,
  DismissedEmployee
} from '../types';
import {
  INITIAL_STORES,
  INITIAL_USERS,
  INITIAL_PUNCHES,
  INITIAL_SCHEDULES,
  INITIAL_OCCURRENCES,
  INITIAL_CERTIFICATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYROLL_CONFIGS
} from '../data/initialData';

const STORAGE_KEYS = {
  STORES: 'crepelocks_stores_v2',
  USERS: 'crepelocks_users_v2',
  PUNCHES: 'crepelocks_punches_v2',
  SCHEDULES: 'crepelocks_schedules_v2',
  OCCURRENCES: 'crepelocks_occurrences_v2',
  CERTIFICATES: 'crepelocks_certificates_v2',
  NOTIFICATIONS: 'crepelocks_notifications_v2',
  PAYROLL_CONFIGS: 'crepelocks_payroll_configs_v2',
  DISMISSED_EMPLOYEES: 'crepelocks_dismissed_employees_v2',
  THEME: 'crepelocks_theme_v2',
  CURRENT_USER: 'crepelocks_current_user_v2',
  CLOUD_INITIALIZED: 'crepelocks_cloud_init_v2',
};

// Safe JSON parse with fallback
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// Simple SHA-256 simulation hash for digital time-clock stamp (Portaria 671 / MTP)
export function generatePunchReceiptHash(
  employeeId: string,
  timestamp: string,
  punchType: string,
  storeCode: string
): string {
  const seed = `${employeeId}|${timestamp}|${punchType}|${storeCode}|CREPELOCKS_SECURE_AUTH_2026`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  const extraHex = Math.abs((hash * 31) | 0).toString(16).padStart(8, '0').toUpperCase();
  const timeHex = Date.now().toString(16).toUpperCase().slice(-8);
  return `SHA256:CPK-${hex}-${extraHex}-${timeHex}`;
}

/**
 * Remove recursivamente campos com valor undefined para que o Firestore
 * nunca rejeite a gravação com o erro "Unsupported field value: undefined"
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        res[key] = cleanForFirestore(value);
      }
    }
    return res as T;
  }
  return data;
}

/**
 * Salva no Firestore garantindo que nenhum valor 'undefined' seja enviado.
 */
export function safeFirestoreSetDoc(docRef: any, data: any) {
  return setDoc(docRef, cleanForFirestore(data));
}

export const StorageService = {
  // Theme
  getTheme(): ThemeStyle {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeStyle) || 'dark-emerald';
  },
  setTheme(theme: ThemeStyle): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // Current session
  getCurrentUser(): UserAccount | null {
    return getFromStorage<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);
  },
  setCurrentUser(user: UserAccount | null): void {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  },

  // Stores
  getStores(): Store[] {
    return getFromStorage<Store[]>(STORAGE_KEYS.STORES, INITIAL_STORES);
  },
  saveStores(stores: Store[]): void {
    saveToStorage(STORAGE_KEYS.STORES, stores);
  },
  addStore(store: Store): void {
    const cleaned = cleanForFirestore(store);
    const stores = this.getStores();
    stores.push(cleaned);
    this.saveStores(stores);
    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'stores', cleaned.id), cleaned).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `stores/${cleaned.id}`)
    );
  },
  updateStore(updated: Store): void {
    const cleaned = cleanForFirestore(updated);
    const stores = this.getStores().map((s) => (s.id === cleaned.id ? cleaned : s));
    this.saveStores(stores);
    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'stores', cleaned.id), cleaned).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `stores/${cleaned.id}`)
    );
  },
  deleteStore(storeId: string): void {
    const stores = this.getStores().filter((s) => s.id !== storeId);
    this.saveStores(stores);
    deleteDoc(doc(db, 'stores', storeId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `stores/${storeId}`)
    );
  },

  // Users
  getUsers(): UserAccount[] {
    let list = getFromStorage<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    
    // Purge old pre-seeded mock users so user can start clean as requested
    const MOCK_IDS_TO_PURGE = new Set([
      'user-marcos', 'user-fernando', 'user-carlos', 'user-juliana',
      'user-rafael', 'user-camila', 'user-maria', 'user-lucas',
      'user-gabriel', 'user-beatriz'
    ]);
    
    const hadMocks = list.some((u) => MOCK_IDS_TO_PURGE.has(u.id));
    if (hadMocks) {
      list = list.filter((u) => !MOCK_IDS_TO_PURGE.has(u.id));
      MOCK_IDS_TO_PURGE.forEach((mid) => {
        deleteDoc(doc(db, 'users', mid)).catch(() => {});
      });
      saveToStorage(STORAGE_KEYS.USERS, list);
    }

    // Ensure at least admin exists if list is somehow empty
    if (list.length === 0 && INITIAL_USERS.length > 0) {
      list = [...INITIAL_USERS];
      saveToStorage(STORAGE_KEYS.USERS, list);
    }

    // Ensure Tiago Rodrigues (user-admin) has Botafogo assigned as payment store
    let updatedAdmin = false;
    list.forEach((u) => {
      if (u.id === 'user-admin' && (!u.payrollStoreId || u.payrollStoreId !== 'store-botafogo')) {
        u.payrollStoreId = 'store-botafogo';
        updatedAdmin = true;
      }
    });
    if (updatedAdmin) {
      saveToStorage(STORAGE_KEYS.USERS, list);
    }

    return list;
  },
  saveUsers(users: UserAccount[]): void {
    saveToStorage(STORAGE_KEYS.USERS, users);
  },
  addUser(user: UserAccount): void {
    const cleaned = cleanForFirestore(user);
    const users = this.getUsers();
    users.push(cleaned);
    this.saveUsers(users);
    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'users', cleaned.id), cleaned).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `users/${cleaned.id}`)
    );
  },
  updateUser(updated: UserAccount): void {
    const cleaned = cleanForFirestore(updated);
    const users = this.getUsers().map((u) => (u.id === cleaned.id ? cleaned : u));
    this.saveUsers(users);
    const current = this.getCurrentUser();
    if (current && current.id === cleaned.id) {
      this.setCurrentUser(cleaned);
    }
    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'users', cleaned.id), cleaned).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `users/${cleaned.id}`)
    );
  },
  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.saveUsers(users);

    // Completely remove payroll configs for deleted user
    const configs = this.getPayrollConfigs().filter((c) => c.employeeId !== userId);
    this.savePayrollConfigs(configs);

    // Remove punches
    const punches = this.getPunches().filter((p) => p.employeeId !== userId);
    this.savePunches(punches);

    // Remove schedules
    const schedules = this.getSchedules().filter((s) => s.employeeId !== userId);
    this.saveSchedules(schedules);

    // Remove occurrences
    const occurrences = this.getOccurrences().filter((o) => o.employeeId !== userId);
    this.saveOccurrences(occurrences);

    // Remove certificates
    const certificates = this.getCertificates().filter((c) => c.employeeId !== userId);
    this.saveCertificates(certificates);

    // Remove notifications
    const notifications = this.getNotifications().filter((n) => n.employeeId !== userId);
    this.saveNotifications(notifications);

    // Sync to Firestore
    deleteDoc(doc(db, 'users', userId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`)
    );
    deleteDoc(doc(db, 'payrollConfigs', userId)).catch(() => {});
  },

  // Dismissed Employees (Banco de Desligados / Demitidos & Histórico de Rescisões)
  getDismissedEmployees(): DismissedEmployee[] {
    return getFromStorage<DismissedEmployee[]>(STORAGE_KEYS.DISMISSED_EMPLOYEES, []);
  },
  saveDismissedEmployees(list: DismissedEmployee[]): void {
    saveToStorage(STORAGE_KEYS.DISMISSED_EMPLOYEES, list);
  },
  addDismissedEmployee(record: DismissedEmployee): void {
    const cleaned = cleanForFirestore(record);
    const list = this.getDismissedEmployees();
    list.unshift(cleaned);
    this.saveDismissedEmployees(list);

    // Remove user from active users so they no longer appear in active lists, clocks, schedules and payroll
    const activeUsers = this.getUsers().filter((u) => u.id !== record.employeeId);
    this.saveUsers(activeUsers);

    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'dismissedEmployees', cleaned.id), cleaned).catch(() => {});
    deleteDoc(doc(db, 'users', record.employeeId)).catch(() => {});
  },
  deleteDismissedEmployee(id: string): void {
    const list = this.getDismissedEmployees().filter((d) => d.id !== id);
    this.saveDismissedEmployees(list);
    deleteDoc(doc(db, 'dismissedEmployees', id)).catch(() => {});
  },
  reactivateDismissedEmployee(id: string): UserAccount | null {
    const list = this.getDismissedEmployees();
    const item = list.find((d) => d.id === id);
    if (!item) return null;

    // Remove from dismissed
    this.saveDismissedEmployees(list.filter((d) => d.id !== id));
    deleteDoc(doc(db, 'dismissedEmployees', id)).catch(() => {});

    // Restore to active users
    const restoredUser: UserAccount = cleanForFirestore({
      ...item.originalUserData,
      active: true
    });
    const activeUsers = this.getUsers();
    activeUsers.push(restoredUser);
    this.saveUsers(activeUsers);
    safeFirestoreSetDoc(doc(db, 'users', restoredUser.id), restoredUser).catch(() => {});

    return restoredUser;
  },

  // Punches
  getPunches(): PunchRecord[] {
    return getFromStorage<PunchRecord[]>(STORAGE_KEYS.PUNCHES, INITIAL_PUNCHES);
  },
  savePunches(punches: PunchRecord[]): void {
    saveToStorage(STORAGE_KEYS.PUNCHES, punches);
  },
  registerPunch(
    employee: UserAccount,
    punchType: PunchType,
    customTime?: string,
    notes?: string
  ): { punch: PunchRecord; message: string } {
    const punches = this.getPunches();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = customTime || now.toTimeString().split(' ')[0]; // HH:mm:ss

    let existing = punches.find((p) => p.employeeId === employee.id && p.date === today);

    const store = this.getStores().find((s) => s.id === employee.storeId) || {
      code: 'LJ-01',
      name: 'Crepelocks'
    };

    const hash = generatePunchReceiptHash(employee.id, `${today}T${timeStr}`, punchType, store.code);

    const todaySchedule = this.getSchedules().find((s) => s.employeeId === employee.id && s.date === today);
    const effectiveShiftStart = todaySchedule?.shiftStart || employee.defaultShiftStart || '08:00';
    const effectiveShiftEnd = todaySchedule?.shiftEnd || employee.defaultShiftEnd || '16:20';

    const record: PunchRecord = existing ?? {
      id: `punch-${employee.id}-${today}-${Date.now()}`,
      employeeId: employee.id,
      date: today,
      entry: null,
      lunchStart: null,
      lunchEnd: null,
      exit: null,
      scheduledStart: effectiveShiftStart,
      scheduledEnd: effectiveShiftEnd,
      scheduledLunchMin: employee.lunchDurationMin,
      workedMinutes: 0,
      expectedMinutes: calculateExpectedMinutes(effectiveShiftStart, effectiveShiftEnd, employee.lunchDurationMin),
      delayMinutes: 0,
      extraMinutes: 0,
      adherencePercentage: 100,
      status: 'regular',
      statusLabel: 'Ponto Iniciado',
      hashReceipt: hash,
      locationIp: `189.120.45.10 (${store.name})`,
      notes: notes || undefined
    };

    if (!existing) {
      punches.push(record);
    }

    let statusMsg = '';

    if (punchType === 'entry') {
      const schedStartMins = timeToMinutes(record.scheduledStart);
      const actualStartMins = timeToMinutes(timeStr.slice(0, 5));
      const diff = actualStartMins - schedStartMins;

      // Limitador de entrada: só pode bater com no máximo 5 minutos de antecedência (a partir de schedStartMins - 5)
      // Cargo de confiança ou Dono é isento. Almoço e saída não têm restrição.
      if (!customTime && !employee.exemptFromPunchClock && actualStartMins < schedStartMins - 5) {
        const allowedMin = Math.max(0, schedStartMins - 5);
        const allowedH = Math.floor(allowedMin / 60).toString().padStart(2, '0');
        const allowedM = (allowedMin % 60).toString().padStart(2, '0');
        return {
          punch: record,
          message: `Horário bloqueado: Entrada agendada para ${record.scheduledStart}. O ponto só é liberado a partir das ${allowedH}:${allowedM} (5 min de antecedência).`
        };
      }

      record.entry = timeStr;
      record.hashReceipt = hash;
      statusMsg = 'Início de jornada registrado com sucesso!';
      
      if (diff > 10) {
        record.delayMinutes = diff;
        record.status = 'atraso';
        record.statusLabel = `Atraso de ${diff} min`;
        
        this.addNotification({
          id: `notif-delay-${Date.now()}`,
          type: 'atraso',
          employeeId: employee.id,
          employeeName: employee.name,
          storeId: employee.storeId,
          storeName: store.name,
          title: `Atraso detectado: ${employee.name}`,
          message: `Funcionário registrou entrada às ${timeStr} (${diff} min de atraso além da tolerância CLT).`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          read: false,
          severity: 'warning'
        });
      } else {
        record.delayMinutes = 0;
        record.status = 'regular';
        record.statusLabel = 'Em Jornada (Pontual)';
      }
    } else if (punchType === 'lunchStart') {
      record.lunchStart = timeStr;
      statusMsg = 'Saída para refeição/almoço registrada!';
      record.statusLabel = 'Em Horário de Refeição';
    } else if (punchType === 'lunchEnd') {
      record.lunchEnd = timeStr;
      statusMsg = 'Retorno da refeição registrado com sucesso!';
      record.statusLabel = 'Em Jornada (Tarde/Segundo Turno)';
    } else if (punchType === 'exit') {
      record.exit = timeStr;
      statusMsg = 'Fim de jornada registrado com sucesso! Bom descanso.';
      record.status = 'regular';
      record.statusLabel = 'Jornada Finalizada';
    }

    recomputePunchMetrics(record);

    this.savePunches(punches);

    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'punches', record.id), record).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `punches/${record.id}`)
    );

    return { punch: record, message: statusMsg };
  },

  // Schedules
  getSchedules(): ScheduleDay[] {
    const list = getFromStorage<ScheduleDay[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    let modified = false;
    INITIAL_SCHEDULES.forEach((initS) => {
      if (!list.some((s) => s.id === initS.id)) {
        list.push(initS);
        modified = true;
      }
    });
    if (modified) {
      saveToStorage(STORAGE_KEYS.SCHEDULES, list);
    }
    return list;
  },
  saveSchedules(schedules: ScheduleDay[]): void {
    saveToStorage(STORAGE_KEYS.SCHEDULES, schedules);
  },
  setScheduleDay(day: ScheduleDay): void {
    const list = this.getSchedules().filter(
      (s) => !(s.employeeId === day.employeeId && s.date === day.date)
    );
    list.push(day);
    this.saveSchedules(list);
    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'schedules', day.id), day).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `schedules/${day.id}`)
    );
  },

  generateMonthlySchedule(
    employeeId: string,
    scheduleType: ScheduleType,
    year: number,
    month: number,
    shiftStart: string,
    shiftEnd: string,
    weeklyDayOffIndices: number[] = [0],
    alternationStartWorking: boolean = true
  ): ScheduleDay[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const generated: ScheduleDay[] = [];
    const monthStr = month < 10 ? `0${month}` : `${month}`;

    if (scheduleType === '6x1') {
      const offDays = weeklyDayOffIndices.length > 0 ? weeklyDayOffIndices : [0];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();
        const dateStr = `${year}-${monthStr}-${day < 10 ? '0' + day : day}`;
        const isOff = offDays.includes(dayOfWeek);

        generated.push({
          id: `sch-${employeeId}-${dateStr}`,
          employeeId,
          date: dateStr,
          shiftStart,
          shiftEnd,
          isOffDay: isOff,
          isExtraDay: false,
          scheduleType: '6x1',
          notes: isOff ? 'Descanso Semanal Remunerado (DSR 6x1)' : undefined
        });
      }
    } else if (scheduleType === '12x36') {
      let isWorking = alternationStartWorking;
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${monthStr}-${day < 10 ? '0' + day : day}`;
        generated.push({
          id: `sch-${employeeId}-${dateStr}`,
          employeeId,
          date: dateStr,
          shiftStart,
          shiftEnd,
          isOffDay: !isWorking,
          isExtraDay: false,
          scheduleType: '12x36',
          notes: !isWorking ? 'Folga 36 horas Interjornada' : 'Plantão 12 Horas'
        });
        isWorking = !isWorking;
      }
    } else {
      // 5x2 scale: default to Saturday (6) and Sunday (0) if not specified, or use custom days selected
      const offDays = weeklyDayOffIndices.length > 0 ? weeklyDayOffIndices : [0, 6];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();
        const dateStr = `${year}-${monthStr}-${day < 10 ? '0' + day : day}`;
        const isOff = offDays.includes(dayOfWeek);

        generated.push({
          id: `sch-${employeeId}-${dateStr}`,
          employeeId,
          date: dateStr,
          shiftStart,
          shiftEnd,
          isOffDay: isOff,
          isExtraDay: false,
          scheduleType: '5x2',
          notes: isOff ? 'Descanso Semanal Remunerado (DSR 5x2)' : undefined
        });
      }
    }

    const current = this.getSchedules().filter(
      (s) => !(s.employeeId === employeeId && s.date.startsWith(`${year}-${monthStr}`))
    );
    const combined = [...current, ...generated];
    this.saveSchedules(combined);

    // Sync generated batch
    generated.forEach((sch) => {
      safeFirestoreSetDoc(doc(db, 'schedules', sch.id), sch).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `schedules/${sch.id}`)
      );
    });

    return generated;
  },

  // Occurrences
  getOccurrences(): OccurrenceRecord[] {
    return getFromStorage<OccurrenceRecord[]>(STORAGE_KEYS.OCCURRENCES, INITIAL_OCCURRENCES);
  },
  saveOccurrences(occurrences: OccurrenceRecord[]): void {
    saveToStorage(STORAGE_KEYS.OCCURRENCES, occurrences);
  },
  addOccurrence(occ: OccurrenceRecord): void {
    const list = this.getOccurrences();
    list.unshift(occ);
    this.saveOccurrences(list);

    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'occurrences', occ.id), occ).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `occurrences/${occ.id}`)
    );

    const punches = this.getPunches();
    let punch = punches.find((p) => p.employeeId === occ.employeeId && p.date === occ.date);
    if (!punch) {
      punch = {
        id: `punch-occ-${occ.employeeId}-${occ.date}-${Date.now()}`,
        employeeId: occ.employeeId,
        date: occ.date,
        entry: null,
        lunchStart: null,
        lunchEnd: null,
        exit: null,
        scheduledStart: '08:00',
        scheduledEnd: '16:20',
        scheduledLunchMin: 60,
        workedMinutes: 0,
        expectedMinutes: occ.type === 'folga' ? 0 : 440,
        delayMinutes: 0,
        extraMinutes: 0,
        adherencePercentage: occ.type === 'folga' || occ.type === 'falta_justificada' ? 100 : 0,
        status: occ.type === 'folga' ? 'folga' :
                occ.type === 'falta_justificada' ? 'falta_justificada' :
                occ.type === 'falta_injustificada' ? 'falta_injustificada' :
                occ.type === 'dia_extra' ? 'dia_extra' : 'abono',
        notes: occ.reason
      };
      punches.push(punch);
    } else {
      punch.status = occ.type === 'folga' ? 'folga' :
                     occ.type === 'falta_justificada' ? 'falta_justificada' :
                     occ.type === 'falta_injustificada' ? 'falta_injustificada' :
                     occ.type === 'dia_extra' ? 'dia_extra' : 'abono';
      punch.notes = occ.reason;
      if (occ.type === 'abono_horas' && occ.hoursAbono) {
        punch.workedMinutes += occ.hoursAbono * 60;
      }
    }
    this.savePunches(punches);
    safeFirestoreSetDoc(doc(db, 'punches', punch.id), punch).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `punches/${punch.id}`)
    );

    // Sincroniza diretamente com a escala (schedules) para o colaborador ver imediatamente
    if (occ.type === 'dia_extra' || occ.type === 'folga') {
      const user = this.getUsers().find((u) => u.id === occ.employeeId);
      if (user) {
        const schs = this.getSchedules();
        let sch = schs.find((s) => s.employeeId === occ.employeeId && s.date === occ.date);
        if (!sch) {
          sch = {
            id: `sch-occ-${occ.employeeId}-${occ.date}`,
            employeeId: occ.employeeId,
            date: occ.date,
            shiftStart: user.defaultShiftStart,
            shiftEnd: user.defaultShiftEnd,
            isOffDay: occ.type === 'folga',
            isExtraDay: occ.type === 'dia_extra',
            scheduleType: user.scheduleType,
            notes: occ.reason
          };
          schs.push(sch);
        } else {
          sch.isOffDay = occ.type === 'folga';
          sch.isExtraDay = occ.type === 'dia_extra';
          sch.notes = occ.reason;
        }
        this.saveSchedules(schs);
        safeFirestoreSetDoc(doc(db, 'schedules', sch.id), sch).catch(() => {});
      }
    }
  },
  updateOccurrence(updatedOcc: OccurrenceRecord): void {
    const list = this.getOccurrences().map((o) => (o.id === updatedOcc.id ? updatedOcc : o));
    this.saveOccurrences(list);

    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'occurrences', updatedOcc.id), updatedOcc).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `occurrences/${updatedOcc.id}`)
    );

    // Also update associated punch record if present
    const punches = this.getPunches();
    const punch = punches.find((p) => p.employeeId === updatedOcc.employeeId && p.date === updatedOcc.date);
    if (punch) {
      punch.status = updatedOcc.type === 'folga' ? 'folga' :
                     updatedOcc.type === 'falta_justificada' ? 'falta_justificada' :
                     updatedOcc.type === 'falta_injustificada' ? 'falta_injustificada' :
                     updatedOcc.type === 'dia_extra' ? 'dia_extra' : 'abono';
      punch.notes = updatedOcc.reason;
      this.savePunches(punches);
      safeFirestoreSetDoc(doc(db, 'punches', punch.id), punch).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `punches/${punch.id}`)
      );
    }

    // Sync directly to schedule day
    const schs = this.getSchedules();
    const sch = schs.find((s) => s.employeeId === updatedOcc.employeeId && s.date === updatedOcc.date);
    if (sch) {
      sch.isOffDay = updatedOcc.type === 'folga';
      sch.isExtraDay = updatedOcc.type === 'dia_extra';
      sch.notes = updatedOcc.reason;
      this.saveSchedules(schs);
      safeFirestoreSetDoc(doc(db, 'schedules', sch.id), sch).catch(() => {});
    }
  },
  deleteOccurrence(occId: string): void {
    const occ = this.getOccurrences().find((o) => o.id === occId);
    const list = this.getOccurrences().filter((o) => o.id !== occId);
    this.saveOccurrences(list);

    deleteDoc(doc(db, 'occurrences', occId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `occurrences/${occId}`)
    );

    // If occurrence was folga or dia extra, restore schedule day
    if (occ && (occ.type === 'folga' || occ.type === 'dia_extra')) {
      const schs = this.getSchedules();
      const sch = schs.find((s) => s.employeeId === occ.employeeId && s.date === occ.date);
      if (sch) {
        sch.isOffDay = false;
        sch.isExtraDay = false;
        sch.notes = 'Escala Padrão Regular';
        this.saveSchedules(schs);
        safeFirestoreSetDoc(doc(db, 'schedules', sch.id), sch).catch(() => {});
      }
    }
  },

  // Certificates
  getCertificates(): MedicalCertificate[] {
    return getFromStorage<MedicalCertificate[]>(STORAGE_KEYS.CERTIFICATES, INITIAL_CERTIFICATES);
  },
  saveCertificates(certs: MedicalCertificate[]): void {
    saveToStorage(STORAGE_KEYS.CERTIFICATES, certs);
  },
  addCertificate(cert: MedicalCertificate): void {
    const certs = this.getCertificates();
    certs.unshift(cert);
    this.saveCertificates(certs);

    safeFirestoreSetDoc(doc(db, 'certificates', cert.id), cert).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `certificates/${cert.id}`)
    );

    this.addOccurrence({
      id: `occ-cert-${Date.now()}`,
      employeeId: cert.employeeId,
      employeeName: cert.employeeName,
      storeId: cert.storeId,
      date: cert.startDate,
      type: 'falta_justificada',
      reason: `Atestado Médico (${cert.daysOff} dias) - CID: ${cert.cidCode || 'N/I'} - Dr(a): ${cert.doctorName}`,
      registeredBy: 'Prontuário Médico Digital Crepelocks',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      certificateId: cert.id,
      attachmentName: cert.fileName
    });

    const store = this.getStores().find((s) => s.id === cert.storeId);
    this.addNotification({
      id: `notif-cert-${Date.now()}`,
      type: 'atestado_novo',
      employeeId: cert.employeeId,
      employeeName: cert.employeeName,
      storeId: cert.storeId,
      storeName: store?.name || 'Crepelocks',
      title: `Novo Atestado no Prontuário`,
      message: `Atestado médico anexado para ${cert.employeeName} (${cert.daysOff} dia(s) a partir de ${cert.startDate}).`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      read: false,
      severity: 'info'
    });
  },
  updateCertificate(updatedCert: MedicalCertificate): void {
    const certs = this.getCertificates().map((c) => (c.id === updatedCert.id ? updatedCert : c));
    this.saveCertificates(certs);

    safeFirestoreSetDoc(doc(db, 'certificates', updatedCert.id), updatedCert).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `certificates/${updatedCert.id}`)
    );

    // Update associated occurrence if any
    const occs = this.getOccurrences();
    const relatedOcc = occs.find((o) => o.certificateId === updatedCert.id);
    if (relatedOcc) {
      relatedOcc.employeeId = updatedCert.employeeId;
      relatedOcc.employeeName = updatedCert.employeeName;
      relatedOcc.storeId = updatedCert.storeId;
      relatedOcc.date = updatedCert.startDate;
      relatedOcc.reason = `Atestado Médico (${updatedCert.daysOff} dias) - CID: ${updatedCert.cidCode || 'N/I'} - Dr(a): ${updatedCert.doctorName}`;
      relatedOcc.attachmentName = updatedCert.fileName;
      this.updateOccurrence(relatedOcc);
    }
  },
  deleteCertificate(certId: string): void {
    const certs = this.getCertificates().filter((c) => c.id !== certId);
    this.saveCertificates(certs);

    deleteDoc(doc(db, 'certificates', certId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `certificates/${certId}`)
    );

    // Also delete or dissociate linked occurrence if desired
    const occs = this.getOccurrences();
    const linkedOcc = occs.find((o) => o.certificateId === certId);
    if (linkedOcc) {
      this.deleteOccurrence(linkedOcc.id);
    }
  },

  // Notifications
  getNotifications(): SystemNotification[] {
    return getFromStorage<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  saveNotifications(notifs: SystemNotification[]): void {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },
  addNotification(notif: SystemNotification): void {
    const list = this.getNotifications();
    list.unshift(notif);
    this.saveNotifications(list);

    safeFirestoreSetDoc(doc(db, 'notifications', notif.id), notif).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`)
    );
  },
  markNotificationAsRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(list);
    const target = list.find((n) => n.id === id);
    if (target) {
      safeFirestoreSetDoc(doc(db, 'notifications', target.id), target).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `notifications/${target.id}`)
      );
    }
  },
  markAllNotificationsAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.saveNotifications(list);
    list.forEach((notif) => {
      safeFirestoreSetDoc(doc(db, 'notifications', notif.id), notif).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`)
      );
    });
  },

  // Payroll Configurations (Folha de Pagamento, Salário Bruto, VT, VR, INSS, IRPF, Gratificações)
  getPayrollConfigs(): PayrollEmployeeConfig[] {
    const list = getFromStorage<PayrollEmployeeConfig[]>(STORAGE_KEYS.PAYROLL_CONFIGS, INITIAL_PAYROLL_CONFIGS);
    let modified = false;
    INITIAL_PAYROLL_CONFIGS.forEach((initConfig) => {
      if (!list.some((c) => c.employeeId === initConfig.employeeId)) {
        list.push(initConfig);
        modified = true;
      }
    });
    // Ensure user-admin has payrollStoreId = store-botafogo
    list.forEach((c) => {
      if (c.employeeId === 'user-admin' && (!c.payrollStoreId || c.payrollStoreId !== 'store-botafogo')) {
        c.payrollStoreId = 'store-botafogo';
        modified = true;
      }
    });
    if (modified) {
      saveToStorage(STORAGE_KEYS.PAYROLL_CONFIGS, list);
    }
    return list;
  },
  savePayrollConfigs(configs: PayrollEmployeeConfig[]): void {
    saveToStorage(STORAGE_KEYS.PAYROLL_CONFIGS, configs);
  },
  getPayrollConfigForEmployee(employeeId: string): PayrollEmployeeConfig | undefined {
    const list = this.getPayrollConfigs();
    return list.find((c) => c.employeeId === employeeId);
  },
  updatePayrollConfig(config: PayrollEmployeeConfig): void {
    const list = this.getPayrollConfigs();
    const index = list.findIndex((c) => c.employeeId === config.employeeId);
    if (index >= 0) {
      list[index] = config;
    } else {
      list.push(config);
    }
    this.savePayrollConfigs(list);

    // Sync to Firestore
    safeFirestoreSetDoc(doc(db, 'payrollConfigs', config.employeeId), config).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `payrollConfigs/${config.employeeId}`)
    );
  },

  // Real-time Cloud Synchronization
  initializeCloudSync(onDataChange: () => void): Unsubscribe[] {
    testConnection();

    // Check if initial seed is needed in Firestore
    const cloudInitKey = localStorage.getItem(STORAGE_KEYS.CLOUD_INITIALIZED);
    if (!cloudInitKey) {
      // Seed stores and initial users to Firestore
      INITIAL_STORES.forEach((s) => {
        safeFirestoreSetDoc(doc(db, 'stores', s.id), s).catch(() => {});
      });
      INITIAL_USERS.forEach((u) => {
        safeFirestoreSetDoc(doc(db, 'users', u.id), u).catch(() => {});
      });
      INITIAL_PUNCHES.forEach((p) => {
        safeFirestoreSetDoc(doc(db, 'punches', p.id), p).catch(() => {});
      });
      localStorage.setItem(STORAGE_KEYS.CLOUD_INITIALIZED, 'true');
    }

    const unsubs: Unsubscribe[] = [];

    // Stores listener
    unsubs.push(
      onSnapshot(
        collection(db, 'stores'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as Store);
            this.saveStores(list);
            onDataChange();
          } else {
            INITIAL_STORES.forEach((s) => {
              safeFirestoreSetDoc(doc(db, 'stores', s.id), s).catch(() => {});
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'stores');
        }
      )
    );

    // Users listener
    unsubs.push(
      onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          if (!snapshot.empty) {
            const purgedIds = new Set([
              'user-marcos', 'user-fernando', 'user-carlos', 'user-juliana',
              'user-rafael', 'user-camila', 'user-maria', 'user-lucas',
              'user-gabriel', 'user-beatriz'
            ]);
            const list = snapshot.docs
              .map((d) => d.data() as UserAccount)
              .filter((u) => !purgedIds.has(u.id));
            if (list.length > 0) {
              this.saveUsers(list);
              onDataChange();
            }
          } else {
            INITIAL_USERS.forEach((u) => {
              safeFirestoreSetDoc(doc(db, 'users', u.id), u).catch(() => {});
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      )
    );

    // Punches listener (real-time timeclock)
    unsubs.push(
      onSnapshot(
        collection(db, 'punches'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as PunchRecord);
            this.savePunches(list);
            onDataChange();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'punches');
        }
      )
    );

    // Schedules listener
    unsubs.push(
      onSnapshot(
        collection(db, 'schedules'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as ScheduleDay);
            this.saveSchedules(list);
            onDataChange();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'schedules');
        }
      )
    );

    // Notifications listener
    unsubs.push(
      onSnapshot(
        collection(db, 'notifications'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as SystemNotification);
            this.saveNotifications(list);
            onDataChange();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'notifications');
        }
      )
    );

    // Payroll Configs listener (real-time sync of payroll settings & salaries)
    unsubs.push(
      onSnapshot(
        collection(db, 'payrollConfigs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as PayrollEmployeeConfig);
            this.savePayrollConfigs(list);
            onDataChange();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'payrollConfigs');
        }
      )
    );

    return unsubs;
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.STORES);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.PUNCHES);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.OCCURRENCES);
    localStorage.removeItem(STORAGE_KEYS.CERTIFICATES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.PAYROLL_CONFIGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CLOUD_INITIALIZED);
  }
};

function timeToMinutes(t: string | null): number {
  if (!t) return 0;
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function calculateExpectedMinutes(start: string, end: string, lunchMin: number): number {
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  let span = endMins - startMins;
  if (span < 0) span += 24 * 60;
  return Math.max(0, span - lunchMin);
}

function recomputePunchMetrics(punch: PunchRecord): void {
  if (!punch.entry) {
    punch.workedMinutes = 0;
    return;
  }

  const entryMins = timeToMinutes(punch.entry);
  let exitMins = punch.exit ? timeToMinutes(punch.exit) : entryMins;
  
  let totalSpan = exitMins - entryMins;
  if (totalSpan < 0) totalSpan += 24 * 60;

  let lunchUsed = 0;
  if (punch.lunchStart && punch.lunchEnd) {
    const lStart = timeToMinutes(punch.lunchStart);
    const lEnd = timeToMinutes(punch.lunchEnd);
    lunchUsed = lEnd - lStart;
    if (lunchUsed < 0) lunchUsed += 24 * 60;
  } else if (punch.exit) {
    lunchUsed = punch.scheduledLunchMin || 60;
  }

  const worked = Math.max(0, totalSpan - lunchUsed);
  punch.workedMinutes = worked;

  if (punch.expectedMinutes > 0 && worked > punch.expectedMinutes) {
    punch.extraMinutes = worked - punch.expectedMinutes;
  } else {
    punch.extraMinutes = 0;
  }

  if (punch.expectedMinutes > 0) {
    const ratio = Math.min(100, Math.round((worked / punch.expectedMinutes) * 100));
    punch.adherencePercentage = ratio;
  } else {
    punch.adherencePercentage = 100;
  }
}
