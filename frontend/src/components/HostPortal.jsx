import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PendingRequests from './host/PendingRequests';
import VisitorsLog from './host/VisitorsLog';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSuccess = (message) => {
    setMsg({ type: 'success', text: message });
    fetchHostAppointments();
    setTimeout(() => setMsg({ type: '', text: '' }), 3005);
  };

  const handleActionError = (message) => {
    setMsg({ type: 'error', text: message });
  };

  const pendingRequests = appointments.filter(a => a.status === 'pending');
  const pastVisitors = appointments.filter(a => a.status !== 'pending');

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
        ) : (
          <PendingRequests
            pendingRequests={pendingRequests}
            onActionSuccess={handleActionSuccess}
            onActionError={handleActionError}
          />
        )}
      </div>
    );
  }

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
      ) : (
        <VisitorsLog pastVisitors={pastVisitors} />
      )}
    </div>
  );
}
