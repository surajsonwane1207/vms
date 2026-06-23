import React, { useState } from 'react';
import api from '../api';
import { LogIn, Key, Mail, Shield, User, Users, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess, onNavigateToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    let testEmail = '';
    let testPassword = 'visitor123'; // host123 / admin123

    if (role === 'admin') {
      testEmail = 'admin@vms.com';
      testPassword = 'admin123';
    } else if (role === 'host') {
      testEmail = 'sarah@vms.com';
      testPassword = 'host123';
    } else {
      testEmail = 'visitor@vms.com';
      testPassword = 'visitor123';
    }

    setError('');
    setLoading(true);
    try {
      const data = await api.login(testEmail, testPassword);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Quick login failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden bg-slate-950">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-75"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4 animate-bounce">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            VMS Portal
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Visitor Management & Security System</p>
        </div>

        {/* Card wrapper with glassmorphism */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-indigo-950/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>
          
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-6 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl placeholder-slate-600 outline-none transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl placeholder-slate-600 outline-none transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick login sandbox options */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Demo sandbox quick logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('visitor')}
                className="flex flex-col items-center justify-center p-3 bg-slate-800/40 hover:bg-indigo-950/30 hover:border-indigo-500/40 border border-slate-800/80 rounded-2xl text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-all cursor-pointer group"
              >
                <User className="w-5 h-5 mb-1 text-slate-400 group-hover:text-indigo-400" />
                Visitor
              </button>
              <button
                onClick={() => handleQuickLogin('host')}
                className="flex flex-col items-center justify-center p-3 bg-slate-800/40 hover:bg-purple-950/30 hover:border-purple-500/40 border border-slate-800/80 rounded-2xl text-xs font-semibold text-slate-300 hover:text-purple-400 transition-all cursor-pointer group"
              >
                <Users className="w-5 h-5 mb-1 text-slate-400 group-hover:text-purple-400" />
                Host
              </button>
              <button
                onClick={() => handleQuickLogin('admin')}
                className="flex flex-col items-center justify-center p-3 bg-slate-800/40 hover:bg-pink-950/30 hover:border-pink-500/40 border border-slate-800/80 rounded-2xl text-xs font-semibold text-slate-300 hover:text-pink-400 transition-all cursor-pointer group"
              >
                <Shield className="w-5 h-5 mb-1 text-slate-400 group-hover:text-pink-400" />
                Admin
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-400">
              Need a visitor account?{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
