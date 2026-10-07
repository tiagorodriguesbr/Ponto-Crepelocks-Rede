import React, { useState, useEffect } from 'react';
import {
  Store,
  UserAccount,
  PunchRecord,
  ScheduleDay,
  OccurrenceRecord,
  MedicalCertificate,
  SystemNotification,
  ThemeStyle
} from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { AdherenceMonitor } from './components/AdherenceMonitor';
import { ScheduleManager } from './components/ScheduleManager';
import { OccurrencesManager } from './components/OccurrencesManager';
import { StoresManager } from './components/StoresManager';
import { EmployeesAndUsersManager } from './components/EmployeesAndUsersManager';
import { ReportsAndPayroll } from './components/ReportsAndPayroll';
import { EmployeePunchScreen } from './components/EmployeePunchScreen';
import { NotificationDrawer } from './components/NotificationDrawer';
import { LoginModal } from './components/LoginModal';
import { RotateCcw, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<ThemeStyle>(() => StorageService.getTheme());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => StorageService.getCurrentUser());
  const [stores, setStores] = useState<Store[]>(() => StorageService.getStores());
  const [users, setUsers] = useState<UserAccount[]>(() => StorageService.getUsers());
  const [punches, setPunches] = useState<PunchRecord[]>(() => StorageService.getPunches());
  const [schedules, setSchedules] = useState<ScheduleDay[]>(() => StorageService.getSchedules());
  const [occurrences, setOccurrences] = useState<OccurrenceRecord[]>(() => StorageService.getOccurrences());
  const [certificates, setCertificates] = useState<MedicalCertificate[]>(() => StorageService.getCertificates());
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => StorageService.getNotifications());

  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>(() =>
    currentUser?.role === 'atendente' ? 'bater_ponto' : 'dashboard'
  );
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Apply theme to body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    StorageService.setTheme(theme);
  }, [theme]);

  // Real-time Firestore cloud synchronization
  useEffect(() => {
    const unsubs = StorageService.initializeCloudSync(() => {
      reloadData();
    });
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Adjust active tab when user changes
  useEffect(() => {
    if (currentUser?.role === 'atendente') {
      setActiveTab('bater_ponto');
    } else if (activeTab === 'bater_ponto') {
      setActiveTab('dashboard');
    }
  }, [currentUser]);

  // Sync state helper
  const reloadData = () => {
    setStores(StorageService.getStores());
    setUsers(StorageService.getUsers());
    setPunches(StorageService.getPunches());
    setSchedules(StorageService.getSchedules());
    setOccurrences(StorageService.getOccurrences());
    setCertificates(StorageService.getCertificates());
    setNotifications(StorageService.getNotifications());
    setCurrentUser(StorageService.getCurrentUser());
  };

  const handleThemeChange = (newTheme: ThemeStyle) => {
    setTheme(newTheme);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    reloadData();
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleMarkNotificationRead = (id: string) => {
    StorageService.markNotificationAsRead(id);
    reloadData();
  };

  const handleMarkAllNotificationsRead = () => {
    StorageService.markAllNotificationsAsRead();
    reloadData();
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const currentStore = stores.find((s) => s.id === currentUser?.storeId);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Top Navbar */}
      {currentUser && (
        <Navbar
          currentUser={currentUser}
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!currentUser ? (
          <div className="py-12 flex items-center justify-center">
            <LoginModal
              users={users}
              currentUser={currentUser}
              onLoginSuccess={handleLoginSuccess}
              isOpen={true}
              onClose={() => {}}
            />
          </div>
        ) : currentUser.role === 'atendente' ? (
          /* Restrito ao funcionário (Bater Ponto, Aderência e Comprovantes) */
          <EmployeePunchScreen
            currentUser={currentUser}
            currentStore={currentStore}
            punches={punches}
            schedules={schedules}
            onPunchRegistered={reloadData}
          />
        ) : (
          /* Painel Administrativo Completo para Dono e Gerente */
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard
                currentUser={currentUser}
                users={users}
                punches={punches}
                stores={stores}
                notifications={notifications}
                selectedStoreId={selectedStoreId}
                onNavigateTab={setActiveTab}
                onMarkNotificationRead={handleMarkNotificationRead}
              />
            )}

            {activeTab === 'aderencia' && (
              <AdherenceMonitor
                users={users}
                punches={punches}
                stores={stores}
                onDataUpdated={reloadData}
              />
            )}

            {activeTab === 'escalas' && (
              <ScheduleManager
                users={users}
                schedules={schedules}
                stores={stores}
                onDataUpdated={reloadData}
              />
            )}

            {activeTab === 'ocorrencias' && (
              <OccurrencesManager
                users={users}
                stores={stores}
                occurrences={occurrences}
                certificates={certificates}
                onDataUpdated={reloadData}
              />
            )}

            {activeTab === 'lojas' && (
              <StoresManager
                stores={stores}
                users={users}
                punches={punches}
                onDataUpdated={reloadData}
              />
            )}

            {activeTab === 'colaboradores' && (
              <EmployeesAndUsersManager
                users={users}
                stores={stores}
                currentUser={currentUser}
                onDataUpdated={reloadData}
              />
            )}

            {activeTab === 'relatorios' && (
              <ReportsAndPayroll
                users={users}
                punches={punches}
                stores={stores}
                occurrences={occurrences}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 mt-12 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Crepelocks Brasil</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conforme Portaria MTP 671/2021 & CLT</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-zinc-500">Acesso Corporativo Seguro • Criptografia SHA-256</span>
          </div>
        </div>
      </footer>

      {/* Notification Drawer */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigateToTab={(tab) => {
          setIsNotificationOpen(false);
          setActiveTab(tab);
        }}
      />

      {/* Login & Switch User Modal */}
      <LoginModal
        users={users}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
