import React, { useState, useEffect } from 'react';
import api from './api';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login'); // 'login', 'register', 'dashboard'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const savedUser = api.getUser();
    const token = api.getToken();

    if (savedUser && token) {
      setUser(savedUser);
      setPage('dashboard');
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setPage('dashboard');
  };

  const handleLogout = () => {
    api.clearSession();
    setUser(null);
    setPage('login');
  };

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
      return (
        <Register 
          onRegisterSuccess={() => setPage('login')} 
          onNavigateToLogin={() => setPage('login')} 
        />
      );
    case 'dashboard':
      return (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      );
    case 'login':
    default:
      return (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onNavigateToRegister={() => setPage('register')} 
        />
      );
  }
}
