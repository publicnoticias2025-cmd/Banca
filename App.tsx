
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import BankrollPage from './pages/BankrollPage';
import BetsPage from './pages/BetsPage';
import MarketPage from './pages/MarketPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('Dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage />;
      case 'Banca':
        return <BankrollPage />;
      case 'Apostas':
        return <BetsPage />;
      case 'Mercado':
        return <MarketPage />;
      case 'Estatísticas':
        return <StatisticsPage />;
      case 'Usuários':
        return user.role === 'admin' ? <UsersPage /> : <DashboardPage />;
      case 'Configurações':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 font-sans text-slate-300">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-500">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;

