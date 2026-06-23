import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './components/Dashboard';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = React.useState('login');

  React.useEffect(() => {
    if (user) {
      setPage('dashboard');
    } else {
      // Allow switching between login and register manually if no user exists
      if (page === 'dashboard') {
        setPage('login');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-semibold text-sm">Restoring session details...</p>
      </div>
    );
  }

  switch (page) {
    case 'register':
      return <Register onNavigateToLogin={() => setPage('login')} />;
    case 'dashboard':
      return <Dashboard />;
    case 'login':
    default:
      return <Login onNavigateToRegister={() => setPage('register')} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
