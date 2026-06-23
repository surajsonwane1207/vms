import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
  LogOut, User, Bell, Shield, Calendar, Users, 
  Menu, X, Check, Eye, Clock, Building
} from 'lucide-react';
import VisitorPortal from './VisitorPortal';
import HostPortal from './HostPortal';
import AdminPortal from './AdminPortal';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notificationRef = useRef(null);

  // Set default tab based on role
  useEffect(() => {
    if (user.role === 'admin') {
      setActiveTab('analytics');
    } else if (user.role === 'host') {
      setActiveTab('approvals');
    } else {
      setActiveTab('my-passes');
    }
  }, [user]);

  // Notifications Poll (Every 5 seconds for simulated real-time notifications)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const list = await api.getNotifications();
        setNotifications(list);
        setUnreadCount(list.filter(n => n.is_read === 0).length);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.readAllNotifications();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const renderContent = () => {
    if (user.role === 'admin') {
      return <AdminPortal activeTab={activeTab} setActiveTab={setActiveTab} />;
    } else if (user.role === 'host') {
      return <HostPortal activeTab={activeTab} setActiveTab={setActiveTab} user={user} />;
    } else {
      return <VisitorPortal activeTab={activeTab} setActiveTab={setActiveTab} user={user} />;
    }
  };

  const getNavigationLinks = () => {
    if (user.role === 'admin') {
      return [
        { id: 'analytics', label: 'Analytics Dashboard', icon: Shield },
        { id: 'terminal', label: 'Lobby Check-In Desk', icon: Calendar },
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
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800/80 p-6 flex flex-col justify-between
        transform transition-transform duration-300 lg:transform-none lg:static lg:flex
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-8">
          {/* Sidebar Header */}
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
              className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
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
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Account details & Logout */}
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
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-950 text-red-400 hover:text-red-300 font-semibold rounded-xl text-sm transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white capitalize hidden md:block">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Notification Center */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700/80 text-slate-400 hover:text-white rounded-xl transition-all relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <span className="font-bold text-white flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-xs font-bold rounded-md">
                          {unreadCount} new
                        </span>
                      )}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            notification.is_read === 0
                              ? 'bg-indigo-950/20 border-indigo-900/30'
                              : 'bg-slate-950/20 border-slate-800/60'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-slate-200 text-sm">
                              {notification.title}
                            </span>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                              {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info Badge */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800/80">
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-bold text-white leading-none">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {user.role}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-bold text-white">
                  {user.name.charAt(0)}
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Dashboard Content Portal Body */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          {renderContent()}
        </main>

      </div>
    </div>
  );
}
