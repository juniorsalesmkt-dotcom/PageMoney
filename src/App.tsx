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
import { Toast, ToastMessage } from './components/common/Toast';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isOpenMobileNav, setIsOpenMobileNav] = useState(false);

  // Modals state
  const [isNewEarningOpen, setIsNewEarningOpen] = useState(false);
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [isFollowerModalOpen, setIsFollowerModalOpen] = useState(false);
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-neutral-600">
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
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row text-neutral-900 antialiased font-sans">
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

          {activeTab === 'settings' && <SettingsView onToast={addToast} />}
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
