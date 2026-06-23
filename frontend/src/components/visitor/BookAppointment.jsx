import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PlusCircle, AlertCircle, Building, User, Clock } from 'lucide-react';

export default function BookAppointment({ user, onBookingSuccess, onCancel }) {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHosts, setFetchingHosts] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const [bookForm, setBookForm] = useState({
    hostId: '',
    purpose: '',
    scheduledStart: '',
    visitorName: user.name,
    visitorEmail: user.email,
    visitorPhone: user.phone || '',
    visitorCompany: user.company || ''
  });

  // Fetch companies list on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch hosts whenever company selection changes
  useEffect(() => {
    if (selectedCompanyId) {
      fetchHosts(selectedCompanyId);
    } else {
      setHosts([]);
      setBookForm(prev => ({ ...prev, hostId: '' }));
    }
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      const list = await api.getPublicCompanies();
      setCompanies(list);
      if (list.length > 0) {
        setSelectedCompanyId(list[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchHosts = async (companyId) => {
    setFetchingHosts(true);
    try {
      const list = await api.getHosts(companyId);
      setHosts(list);
      if (list.length > 0) {
        setBookForm(prev => ({ ...prev, hostId: list[0].id.toString() }));
      } else {
        setBookForm(prev => ({ ...prev, hostId: '' }));
      }
    } catch (err) {
      console.error('Error fetching hosts:', err);
    } finally {
      setFetchingHosts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompanyId || !bookForm.hostId || !bookForm.purpose || !bookForm.scheduledStart) {
      setMsg({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await api.bookAppointment({
        ...bookForm,
        hostId: parseInt(bookForm.hostId)
      });
      setMsg({ type: 'success', text: 'Visit scheduled successfully! Awaiting host approval.' });
      setTimeout(() => {
        onBookingSuccess();
      }, 1500);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Booking failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Schedule an Appointment</h1>
        <p className="text-slate-400 text-sm mt-1">Book an office visit with one of our hosts/employees.</p>
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

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SELECT COMPANY TENANT */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-400" /> Select Company *
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl outline-none transition-all duration-300 text-sm"
              >
                {companies.length === 0 ? (
                  <option>Loading companies...</option>
                ) : (
                  companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* SELECT HOST */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" /> Select Host / Employee *
              </label>
              <select
                value={bookForm.hostId}
                onChange={(e) => setBookForm({ ...bookForm, hostId: e.target.value })}
                disabled={fetchingHosts || hosts.length === 0}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl outline-none transition-all duration-300 text-sm disabled:opacity-50"
              >
                {fetchingHosts ? (
                  <option>Updating hosts list...</option>
                ) : hosts.length === 0 ? (
                  <option>No active hosts at this company</option>
                ) : (
                  hosts.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.department || 'Staff'}
                    </option>
                  ))
                )}
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" /> Scheduled Visit Time *
              </label>
              <input
                type="datetime-local"
                required
                value={bookForm.scheduledStart}
                onChange={(e) => setBookForm({ ...bookForm, scheduledStart: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl outline-none transition-all duration-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Purpose of Visit *
              </label>
              <input
                type="text"
                required
                value={bookForm.purpose}
                onChange={(e) => setBookForm({ ...bookForm, purpose: e.target.value })}
                placeholder="e.g. Product Demo, Job Interview, Client Meeting"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl placeholder-slate-600 outline-none transition-all duration-300 text-sm"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 rounded-xl text-sm transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || hosts.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Book Appointment
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
