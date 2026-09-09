import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { NavigationTab } from './types';
import { AuthView } from './components/auth/AuthView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { PagesView } from './components/pages/PagesView';
import { GrowthView } from './components/growth/GrowthView';
import { EarningsView } from './components/earnings/EarningsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReportsView } from './components/reports/ReportsView';
import { GoalsView } from './components/goals/GoalsView';
import { SettingsView } from './components/settings/SettingsView';
import { EarningModal } from './components/earnings/EarningModal';
import { PageModal } from './components/pages/PageModal';
import { FollowerModal } from './components/growth/FollowerModal';
import { SqlSetupModal } from './components/common/SqlSetupModal';
import { Toast, ToastMessage } from './components/common/Toast';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading, isSchemaMissing } = useData();

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isOpenMobileNav, setIsOpenMobileNav] = useState(false);

  // Modals state
  const [isNewEarningOpen, setIsNewEarningOpen] = useState(false);
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [isFollowerModalOpen, setIsFollowerModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [followerModalDefaultPageId, setFollowerModalDefaultPageId] = useState<string | undefined>(undefined);

  // Growth View selected page for detail
  const [growthSelectedPageId, setGrowthSelectedPageId] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0d0f12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-neutral-900 dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            Carregando PageMoney...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleOpenRecordFollowers = (pageId?: string) => {
    setFollowerModalDefaultPageId(pageId);
    setIsFollowerModalOpen(true);
  };

  const handleSelectPageGrowth = (pageId: string) => {
    setActiveTab('growth');
    setGrowthSelectedPageId(pageId);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-[#0d0f12] flex flex-col md:flex-row text-neutral-900 dark:text-neutral-100 antialiased font-sans transition-colors duration-200">
      {/* Toast notifications container */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Main Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'growth') {
            setGrowthSelectedPageId(null);
          }
        }}
        isOpenMobile={isOpenMobileNav}
        setIsOpenMobile={setIsOpenMobileNav}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onOpenMobileNav={() => setIsOpenMobileNav(true)}
          onOpenNewEarning={() => setIsNewEarningOpen(true)}
          onOpenRecordFollowers={() => handleOpenRecordFollowers()}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {dataLoading && (
            <div className="mb-4 py-2 px-3 bg-neutral-200/60 rounded-xl flex items-center justify-between text-xs text-neutral-700 animate-pulse">
              <span>Sincronizando dados com o banco...</span>
            </div>
          )}

          {isSchemaMissing && (
            <div className="mb-5 p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                <div>
                  <span className="font-bold text-amber-950">Modo Local Seguro Ativo:</span>
                  <span className="ml-1 text-amber-800">
                    O Supabase está conectado, mas as tabelas ainda não foram criadas no banco de dados. Suas páginas e dados estão salvos com segurança no seu navegador.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Ativar Tabelas no Supabase (1 clique)
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView onOpenNewEarning={() => setIsNewEarningOpen(true)} />
          )}

          {activeTab === 'pages' && (
            <PagesView
              onOpenNewPage={() => setIsNewPageOpen(true)}
              onSelectPageGrowth={handleSelectPageGrowth}
              onOpenFollowerModalForPage={(pageId) => handleOpenRecordFollowers(pageId)}
              onToast={addToast}
            />
          )}

          {activeTab === 'growth' && (
            <GrowthView
              onOpenRecordFollowers={handleOpenRecordFollowers}
              onOpenNewPage={() => setIsNewPageOpen(true)}
              selectedPageId={growthSelectedPageId}
              setSelectedPageId={setGrowthSelectedPageId}
              onToast={addToast}
            />
          )}

          {activeTab === 'earnings' && (
            <EarningsView
              onOpenNewEarning={() => setIsNewEarningOpen(true)}
              onToast={addToast}
            />
          )}

          {activeTab === 'expenses' && <ExpensesView onToast={addToast} />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'goals' && <GoalsView onToast={addToast} />}

          {activeTab === 'settings' && (
            <SettingsView
              onToast={addToast}
              onOpenSqlModal={() => setIsSqlModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <EarningModal
        isOpen={isNewEarningOpen}
        onClose={() => setIsNewEarningOpen(false)}
        onSuccess={(msg) => addToast(msg, 'success')}
      />

      <PageModal
        isOpen={isNewPageOpen}
        onClose={() => setIsNewPageOpen(false)}
        onSuccess={(msg) => addToast(msg, 'success')}
      />

      <FollowerModal
        isOpen={isFollowerModalOpen}
        onClose={() => {
          setIsFollowerModalOpen(false);
          setFollowerModalDefaultPageId(undefined);
        }}
        defaultPageId={followerModalDefaultPageId}
        onSuccess={(msg) => addToast(msg, 'success')}
      />

      <SqlSetupModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        onSuccessToast={(msg) => addToast(msg, 'success')}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
