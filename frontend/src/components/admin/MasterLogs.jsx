import React, { useState } from 'react';
import Badge from '../ui/Badge';
import { Users, Search, RefreshCw } from 'lucide-react';

export default function MasterLogs({ logs, loading }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(log => 
    log.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.host_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.qr_code_token && log.qr_code_token.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">All Visitor Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Full database records and activity history of all visitors in the system.</p>
        </div>

        {/* Search Input bar */}
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
                    <td className="p-4"><Badge status={log.status} /></td>
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
