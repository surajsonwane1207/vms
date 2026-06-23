import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';
import Sidebar from './layout/Sidebar';
import NotificationsPopover from './layout/NotificationsPopover';
import VisitorPortal from './VisitorPortal';
import HostPortal from './HostPortal';
import AdminPortal from './AdminPortal';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set default tab based on role
  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      setActiveTab('analytics');
    } else if (user.role === 'host') {
      setActiveTab('approvals');
    } else {
      setActiveTab('my-passes');
    }
  }, [user]);

  if (!user) return null;

  const renderContent = () => {
    if (user.role === 'admin') {
      return <AdminPortal activeTab={activeTab} setActiveTab={setActiveTab} />;
    } else if (user.role === 'host') {
      return <HostPortal activeTab={activeTab} setActiveTab={setActiveTab} user={user} />;
    } else {
      return <VisitorPortal activeTab={activeTab} setActiveTab={setActiveTab} user={user} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Panel Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white capitalize hidden md:block">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Notification Popover */}
            <NotificationsPopover />

            {/* Profile Info Badge */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800/80">
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-bold text-white leading-none">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
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
