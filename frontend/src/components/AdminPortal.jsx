import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AnalyticsDashboard from './admin/AnalyticsDashboard';
import ArrivalsTerminal from './admin/ArrivalsTerminal';
import MasterLogs from './admin/MasterLogs';
import { RefreshCw } from 'lucide-react';

export default function AdminPortal({ activeTab, setActiveTab }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

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
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSuccess = () => {
    fetchData();
  };

  const approvedVisits = logs.filter(log => log.status === 'approved');

  if (activeTab === 'analytics') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white">System Analytics</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Real-time oversight of site visitor operations and security metrics.</p>
        </div>

        {loading || !analytics ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-slate-500 text-sm font-semibold">Generating metrics dashboard...</p>
          </div>
        ) : (
          <AnalyticsDashboard analytics={analytics} />
        )}
      </div>
    );
  }

  if (activeTab === 'terminal') {
    return (
      <ArrivalsTerminal
        approvedVisits={approvedVisits}
        loading={loading}
        onActionSuccess={handleActionSuccess}
      />
    );
  }

  return (
    <MasterLogs
      logs={logs}
      loading={loading}
    />
  );
}
