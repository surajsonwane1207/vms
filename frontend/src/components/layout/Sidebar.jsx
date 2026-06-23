import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LogOut, Shield, Calendar, Users, X, Clock 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getNavigationLinks = () => {
    if (user.role === 'superadmin') {
      return [
        { id: 'analytics', label: 'Global Analytics', icon: Shield },
        { id: 'companies', label: 'Manage Companies', icon: Calendar },
        { id: 'logs', label: 'Global Visitor Logs', icon: Users },
      ];
    } else if (user.role === 'admin') {
      return [
        { id: 'analytics', label: 'Analytics Dashboard', icon: Shield },
        { id: 'terminal', label: 'Lobby Check-In Desk', icon: Calendar },
        { id: 'employees', label: 'Manage Employees', icon: Users },
        { id: 'logs', label: 'All Visitor Logs', icon: Users },
      ];
    } else if (user.role === 'host') {
      return [
        { id: 'approvals', label: 'Visit Requests', icon: Clock },
        { id: 'my-visitors', label: 'My Visitors Log', icon: Users },
      ];
    } else {
      return [
        { id: 'my-passes', label: 'My Entry Passes', icon: Shield },
        { id: 'book-visit', label: 'Schedule Visit', icon: Calendar },
      ];
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar element */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800/80 p-6 flex flex-col justify-between
        transform transition-transform duration-300 lg:transform-none lg:static lg:flex
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-8">
          
          {/* Logo brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-md shadow-indigo-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  VMS Dashboard
                </span>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  System v1.0
                </span>
              </div>
            </div>
            <button 
              className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation link elements */}
          <nav className="space-y-1">
            {getNavigationLinks().map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-500/15' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-800'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Account Details */}
        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-indigo-400 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 font-medium truncate capitalize">
                {user.role} {user.department ? `(${user.department})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-950 text-red-400 hover:text-red-300 font-semibold rounded-xl text-sm transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
