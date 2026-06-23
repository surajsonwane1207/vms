import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import InviteVerify from './pages/InviteVerify';
import Dashboard from './components/Dashboard';
import SmsMockGateway from './components/layout/SmsMockGateway';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('login'); // 'login', 'register', 'dashboard', 'invite'
  const [inviteToken, setInviteToken] = useState('');

  // Extract invitation token on start or route change
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      if (path.startsWith('/invite/')) {
        const token = path.split('/invite/')[1];
        if (token) {
          setInviteToken(token);
          setPage('invite');
        }
      } else if (path === '/register') {
        setPage('register');
      } else if (user) {
        setPage('dashboard');
      } else {
        setPage('login');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, [user]);

  const handleNavigateToLogin = () => {
    window.history.pushState({}, '', '/login');
    setPage('login');
  };

  const handleNavigateToRegister = () => {
    window.history.pushState({}, '', '/register');
    setPage('register');
  };

  const handleNavigateToInvite = (token) => {
    window.history.pushState({}, '', `/invite/${token}`);
    setInviteToken(token);
    setPage('invite');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-semibold text-sm">Restoring session details...</p>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'invite':
        return <InviteVerify token={inviteToken} onNavigateToLogin={handleNavigateToLogin} />;
      case 'register':
        return <Register onNavigateToLogin={handleNavigateToLogin} />;
      case 'dashboard':
        return <Dashboard />;
      case 'login':
      default:
        return <Login onNavigateToRegister={handleNavigateToRegister} />;
    }
  };

  return (
    <>
      {renderPage()}
      
      {/* Simulation Helper Panel: Mock SMS phone console */}
      <SmsMockGateway onNavigateToInvite={handleNavigateToInvite} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
