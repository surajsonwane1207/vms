import React, { useState, useEffect } from 'react';
import api from '../api';
import { Check, X, Calendar, Clock, User, Building, AlertCircle, RefreshCw } from 'lucide-react';

export default function HostPortal({ activeTab, setActiveTab, user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchHostAppointments();
  }, [activeTab]);

  const fetchHostAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, status);
      setMsg({ type: 'success', text: `Appointment successfully ${status}` });
      fetchHostAppointments();
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Action failed' });
    }
  };

  const pendingRequests = appointments.filter(a => a.status === 'pending');
  const pastVisitors = appointments.filter(a => a.status !== 'pending');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-full">Approved</span>;
      case 'declined':
        return <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-full">Declined</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-semibold rounded-full">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full animate-pulse">Pending</span>;
    }
  };

  if (activeTab === 'approvals') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Visit Requests</h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve scheduled visits prior to arrival.</p>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            msg.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{msg.text}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-slate-500 text-sm font-semibold">Updating visit requests...</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No pending requests</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              You are completely caught up! New visitor requests will appear here for approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingRequests.map((appt) => (
              <div 
                key={appt.id} 
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden"
              >
                {/* Visual glow indicator */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-yellow-500 to-transparent"></div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-white text-lg">{appt.visitor_name}</h4>
                      <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold">
                        {appt.visitor_company || 'Independent'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider bg-slate-950 px-2.5 py-1 rounded-md">
                      {appt.qr_code_token}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs font-semibold">
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Scheduled: <strong className="text-slate-200">{new Date(appt.scheduled_start).toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <AlertCircle className="w-4 h-4 text-slate-500" />
                      <span>Purpose: <strong className="text-slate-200">{appt.purpose}</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Building className="w-4 h-4 text-slate-500" />
                      <span>Contact: <strong className="text-slate-200">{appt.visitor_email} {appt.visitor_phone ? `| ${appt.visitor_phone}` : ''}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-6 mt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => handleUpdateStatus(appt.id, 'declined')}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 hover:text-red-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Decline
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(appt.id, 'approved')}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-green-950/40 hover:bg-green-900/40 border border-green-900/30 text-green-400 hover:text-green-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // MY VISITORS LOG
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">My Visitors Log</h1>
        <p className="text-slate-400 text-sm mt-1">Full history of visitors registered to meet with you.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Updating visitor logs...</p>
        </div>
      ) : pastVisitors.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No visit history</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Once visitors complete appointments, check-in, or check-out, their records will display here.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-4 pl-6">Visitor</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Checked In</th>
                  <th className="p-4 pr-6">Checked Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300 text-sm font-medium">
                {pastVisitors.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-800/20 transition-all">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-white">{appt.visitor_name}</div>
                      <div className="text-xs text-slate-500 font-semibold">{appt.visitor_company || 'Independent'}</div>
                    </td>
                    <td className="p-4 max-w-[200px] truncate">{appt.purpose}</td>
                    <td className="p-4">{new Date(appt.scheduled_start).toLocaleString()}</td>
                    <td className="p-4">{getStatusBadge(appt.status)}</td>
                    <td className="p-4 font-semibold font-mono text-xs">
                      {appt.check_in_time 
                        ? <span className="text-green-400">{new Date(appt.check_in_time).toLocaleTimeString()}</span> 
                        : <span className="text-slate-600">—</span>
                      }
                    </td>
                    <td className="p-4 pr-6 font-semibold font-mono text-xs">
                      {appt.check_out_time 
                        ? <span className="text-slate-400">{new Date(appt.check_out_time).toLocaleTimeString()}</span> 
                        : (appt.check_in_time && appt.status === 'approved'
                          ? <span className="text-green-400 animate-pulse">Present</span>
                          : <span className="text-slate-600">—</span>)
                      }
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
