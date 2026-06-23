import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Shield, Users, Clock, CheckCircle2, UserCheck, Search,
  RefreshCw, QrCode, AlertCircle, Calendar, UserPlus, Check, X
} from 'lucide-react';

export default function AdminPortal({ activeTab, setActiveTab }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lobby Desk scanner states
  const [scanToken, setScanToken] = useState('');
  const [scanResult, setScanResult] = useState({ type: '', text: '' });
  const [scanLoading, setScanLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const stats = await api.getAdminAnalytics();
        setAnalytics(stats);
      } else if (activeTab === 'logs' || activeTab === 'terminal') {
        const list = await api.getAppointments();
        setLogs(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLobbyScan = async (action) => {
    if (!scanToken.trim()) {
      setScanResult({ type: 'error', text: 'Please enter a valid QR Pass Token' });
      return;
    }

    setScanLoading(true);
    setScanResult({ type: '', text: '' });
    try {
      const response = await api.scanQrCode(scanToken.trim().toUpperCase(), action);
      setScanResult({ type: 'success', text: response.message });
      setScanToken('');
      fetchData(); // reload log grid
    } catch (err) {
      setScanResult({ type: 'error', text: err.message || 'Scanning process failed.' });
    } finally {
      setScanLoading(false);
    }
  };

  const handleTerminalAction = async (id, action) => {
    try {
      if (action === 'check-in') {
        await api.checkInAppointment(id);
      } else {
        await api.checkOutAppointment(id);
      }
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update visitor status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-full">Approved</span>;
      case 'declined':
        return <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-full">Declined</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-semibold rounded-full">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">Pending</span>;
    }
  };

  // Filter logs based on search query
  const filteredLogs = logs.filter(log => 
    log.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.host_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.qr_code_token && log.qr_code_token.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const approvedVisits = logs.filter(log => log.status === 'approved');

  // Find max value in daily stats for graph rendering
  const maxDailyCount = analytics?.dailyStats?.reduce((max, s) => s.count > max ? s.count : max, 0) || 5;

  if (activeTab === 'analytics') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white">System Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time oversight of site visitor operations and security metrics.</p>
        </div>

        {loading || !analytics ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-slate-500 text-sm font-semibold">Generating metrics dashboard...</p>
          </div>
        ) : (
          <>
            {/* Card metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/5 to-transparent rounded-bl-full"></div>
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Visitors</span>
                  <span className="block text-3xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform duration-300">
                    {analytics.activeVisitors}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full"></div>
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Today's Check-ins</span>
                  <span className="block text-3xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform duration-300">
                    {analytics.todayCheckIns}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/5 to-transparent rounded-bl-full"></div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
                  <span className="block text-3xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform duration-300">
                    {analytics.pendingApprovals}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full"></div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Registered Hosts</span>
                  <span className="block text-3xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform duration-300">
                    {analytics.totalHosts}
                  </span>
                </div>
              </div>

            </div>

            {/* Custom Interactive Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Visitor chart bar graph */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl lg:col-span-2 space-y-6">
                <h3 className="font-bold text-white text-lg">Weekly Visitor Traffic</h3>
                
                <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-l border-slate-800 px-4 relative">
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-1/4 border-t border-slate-800/40 pointer-events-none"></div>
                  <div className="absolute inset-x-0 top-2/4 border-t border-slate-800/40 pointer-events-none"></div>
                  <div className="absolute inset-x-0 top-3/4 border-t border-slate-800/40 pointer-events-none"></div>

                  {analytics.dailyStats?.map((s) => {
                    const pct = maxDailyCount > 0 ? (s.count / maxDailyCount) * 100 : 0;
                    return (
                      <div key={s.day} className="flex-1 flex flex-col items-center gap-3 group relative z-10">
                        {/* Tooltip */}
                        <span className="absolute -top-8 px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] font-bold text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                          {s.count} check-ins
                        </span>
                        
                        {/* Glowing Bar */}
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-600 via-purple-600 to-indigo-400 rounded-t-lg group-hover:from-indigo-500 group-hover:to-purple-400 transition-all duration-500 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/30"
                          style={{ height: `${Math.max(pct, 6)}%` }}
                        ></div>
                        
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          {s.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick logs overview */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-lg">Recent Arrivals</h3>
                
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {analytics.recentLogs?.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-10">No recent visitor records</p>
                  ) : (
                    analytics.recentLogs?.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-xs font-semibold">
                        <div>
                          <p className="text-white">{log.visitor_name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Host: {log.host_name}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {log.check_in_time ? 'Checked In' : log.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    );
  }

  if (activeTab === 'terminal') {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Lobby Check-In Desk</h1>
          <p className="text-slate-400 text-sm mt-1">Reception terminal to check visitors in or out by scanning or selecting details.</p>
        </div>

        {scanResult.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            scanResult.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{scanResult.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Virtual QR Code Scanner lookup panel */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-400" /> Virtual QR Token Scanner
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Manually search and scan a visitor's QR pass token (e.g. <code>VMS-XXXX-XXXX</code>).
            </p>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="VMS-ABC123XYZ-7890"
                  value={scanToken}
                  onChange={(e) => setScanToken(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl outline-none font-mono text-sm tracking-wider"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={scanLoading}
                  onClick={() => handleLobbyScan('check-in')}
                  className="py-2.5 bg-green-950/40 hover:bg-green-900/40 border border-green-800/30 text-green-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Check-In
                </button>
                <button
                  disabled={scanLoading}
                  onClick={() => handleLobbyScan('check-out')}
                  className="py-2.5 bg-red-950/40 hover:bg-red-900/40 border border-red-800/30 text-red-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Check-Out
                </button>
              </div>
            </div>
          </div>

          {/* Quick Desk List (Approved scheduled visits today) */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 md:col-span-2 space-y-4">
            <h3 className="font-bold text-white text-base">Quick Lobby Arrivals Action Desk</h3>
            <p className="text-slate-400 text-xs">
              Quickly check in or out currently approved visitors scheduled for today.
            </p>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-10"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" /></div>
              ) : approvedVisits.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">No currently approved visitor appointments.</p>
              ) : (
                approvedVisits.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/85 rounded-2xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{appt.visitor_name}</span>
                        <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {appt.qr_code_token}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs font-semibold">
                        Host: {appt.host_name} ({appt.visitor_company || 'Independent'})
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Schedule: {new Date(appt.scheduled_start).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {!appt.check_in_time ? (
                        <button
                          onClick={() => handleTerminalAction(appt.id, 'check-in')}
                          className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Check In
                        </button>
                      ) : !appt.check_out_time ? (
                        <button
                          onClick={() => handleTerminalAction(appt.id, 'check-out')}
                          className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Check Out
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-semibold px-2">Departed</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ALL VISITOR LOGS LIST
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">All Visitor Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Full database records and activity history of all visitors in the system.</p>
        </div>

        {/* Search input */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search visitor, host, QR token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white rounded-xl text-sm placeholder-slate-500 outline-none transition-all duration-300"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Loading master visit registry...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No visit logs found</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Try matching a different search term or booking a test appointment visitor pass.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-4 pl-6">Visitor Pass Token</th>
                  <th className="p-4">Visitor Name</th>
                  <th className="p-4">Host Name</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Check-In</th>
                  <th className="p-4 pr-6">Check-Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300 text-sm font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/20 transition-all">
                    <td className="p-4 pl-6 font-mono text-xs font-bold text-indigo-400">
                      {log.qr_code_token}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{log.visitor_name}</div>
                      <div className="text-xs text-slate-500 font-semibold">{log.visitor_company || 'Independent'}</div>
                    </td>
                    <td className="p-4 text-slate-200">{log.host_name}</td>
                    <td className="p-4 max-w-[150px] truncate">{log.purpose}</td>
                    <td className="p-4">{getStatusBadge(log.status)}</td>
                    <td className="p-4 font-semibold font-mono text-xs text-green-400">
                      {log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString() : '—'}
                    </td>
                    <td className="p-4 pr-6 font-semibold font-mono text-xs text-slate-400">
                      {log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
