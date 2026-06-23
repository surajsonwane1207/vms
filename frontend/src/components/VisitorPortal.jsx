import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Calendar, Clock, User, Building, QrCode, PlusCircle, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Check, ArrowRight
} from 'lucide-react';

export default function VisitorPortal({ activeTab, setActiveTab, user }) {
  const [appointments, setAppointments] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  // Book appointment states
  const [bookForm, setBookForm] = useState({
    hostId: '',
    purpose: '',
    scheduledStart: '',
    visitorName: user.name,
    visitorEmail: user.email,
    visitorPhone: user.phone || '',
    visitorCompany: user.company || ''
  });
  
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [selectedPass, setSelectedPass] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchAppointments();
    if (activeTab === 'book-visit') {
      fetchHosts();
    }
  }, [activeTab]);

  const fetchAppointments = async () => {
    setFetching(true);
    try {
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const fetchHosts = async () => {
    try {
      const list = await api.getHosts();
      setHosts(list);
      if (list.length > 0) {
        setBookForm(prev => ({ ...prev, hostId: list[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookForm.hostId || !bookForm.purpose || !bookForm.scheduledStart) {
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
      setBookForm({
        hostId: hosts.length > 0 ? hosts[0].id.toString() : '',
        purpose: '',
        scheduledStart: '',
        visitorName: user.name,
        visitorEmail: user.email,
        visitorPhone: user.phone || '',
        visitorCompany: user.company || ''
      });
      // Redirect to passes
      setTimeout(() => {
        setActiveTab('my-passes');
        setMsg({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Booking failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateScan = async (action) => {
    if (!selectedPass) return;
    setSimulating(true);
    setMsg({ type: '', text: '' });
    try {
      const response = await api.scanQrCode(selectedPass.qr_code_token, action);
      
      // Update selected pass view
      setSelectedPass(response.appointment);
      setMsg({ type: 'success', text: response.message });
      fetchAppointments();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Simulation failed' });
    } finally {
      setSimulating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
        </span>;
      case 'declined':
        return <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
          <XCircle className="w-3.5 h-3.5" /> Declined
        </span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </span>;
      default:
        return <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
          <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
        </span>;
    }
  };

  if (activeTab === 'book-visit') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Schedule an Appointment</h1>
            <p className="text-slate-400 text-sm mt-1">Book an office visit with one of our hosts/employees.</p>
          </div>
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
          <form onSubmit={handleBookSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Host / Employee *
                </label>
                <select
                  value={bookForm.hostId}
                  onChange={(e) => setBookForm({ ...bookForm, hostId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl outline-none transition-all duration-300 text-sm"
                >
                  {hosts.length === 0 ? (
                    <option>Loading hosts...</option>
                  ) : (
                    hosts.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} — {h.department || 'Staff'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Scheduled Visit Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bookForm.scheduledStart}
                  onChange={(e) => setBookForm({ ...bookForm, scheduledStart: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl outline-none transition-all duration-300 text-sm"
                />
              </div>
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
                placeholder="e.g. Quarterly Review, Product Demo, Job Interview"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl placeholder-slate-600 outline-none transition-all duration-300 text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('my-passes')}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
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

  // MY ENTRY PASSES LIST
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-sans">My Entry Passes</h1>
          <p className="text-slate-400 text-sm mt-1">Select an approved entry pass to access security gates or scan in.</p>
        </div>
        <button
          onClick={() => setActiveTab('book-visit')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Schedule Visit
        </button>
      </div>

      {fetching ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Updating entry passes...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No active visitor passes</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            You don't have any current visits or scheduled appointments booked under your name.
          </p>
          <button
            onClick={() => setActiveTab('book-visit')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 font-semibold rounded-xl text-sm transition-all cursor-pointer"
          >
            Create your first pass <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              onClick={() => setSelectedPass(appt)}
              className="group bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              {/* Subtle visual scan indicator for approved ones */}
              {appt.status === 'approved' && !appt.check_in_time && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-500/10 to-transparent pointer-events-none group-hover:scale-110 transition-transform"></div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 font-mono tracking-wider">
                    {appt.qr_code_token}
                  </span>
                  {getStatusBadge(appt.status)}
                </div>

                <div>
                  <h4 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                    {appt.purpose}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-medium">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Host: <strong className="text-slate-300">{appt.host_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Time: <strong className="text-slate-300">{new Date(appt.scheduled_start).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action scanner drawer trigger */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold group-hover:text-white transition-colors">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4.5 h-4.5 text-indigo-400" />
                  <span>
                    {appt.check_in_time 
                      ? (appt.check_out_time ? 'Visit completed' : 'Checked In') 
                      : 'View Digital Pass'}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Holographic digital pass modal overlay */}
      {selectedPass && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 md:p-8 relative space-y-6">
            
            {/* Header info */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 font-mono">
                VISITOR GATEWAY PASS
              </span>
              <button
                onClick={() => {
                  setSelectedPass(null);
                  setMsg({ type: '', text: '' });
                }}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {msg.text && (
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                msg.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{msg.text}</span>
              </div>
            )}

            {/* Holographic Entry Pass Component */}
            <div className={`
              relative rounded-2xl p-6 border flex flex-col items-center gap-5 text-center overflow-hidden
              ${selectedPass.check_in_time && !selectedPass.check_out_time
                ? 'bg-gradient-to-b from-green-950/20 to-slate-950 border-green-500/30 shadow-lg shadow-green-500/5'
                : selectedPass.check_out_time
                ? 'bg-slate-950/50 border-slate-800 shadow-none'
                : 'bg-gradient-to-b from-indigo-950/20 to-slate-950 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
              }
            `}>
              {/* Glowing vertical lines background simulation */}
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>

              {/* Header inside Pass */}
              <div>
                <h3 className="font-extrabold text-xl text-white">{selectedPass.purpose}</h3>
                <span className="block text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{selectedPass.visitor_company || 'Independent Visitor'}</span>
              </div>

              {/* Digital QR Scan block container */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative group">
                {/* Laser scan lines */}
                {selectedPass.status === 'approved' && !selectedPass.check_out_time && (
                  <div className="absolute inset-x-0 h-[2px] bg-indigo-500/80 animate-bounce top-1/2 shadow-[0_0_8px_rgba(99,102,241,1)]"></div>
                )}
                
                {/* Mock QR SVG layout */}
                <svg className="w-40 h-40 text-slate-300" viewBox="0 0 100 100" fill="currentColor">
                  {/* Corner Anchor 1 */}
                  <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                  <rect x="5" y="5" width="20" height="20" fill="black" />
                  <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                  {/* Corner Anchor 2 */}
                  <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                  <rect x="75" y="5" width="20" height="20" fill="black" />
                  <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                  {/* Corner Anchor 3 */}
                  <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                  <rect x="5" y="75" width="20" height="20" fill="black" />
                  <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                  {/* Random pixels to simulate real QR */}
                  <rect x="40" y="0" width="10" height="10" />
                  <rect x="50" y="10" width="10" height="20" />
                  <rect x="40" y="40" width="20" height="10" />
                  <rect x="55" y="55" width="10" height="10" />
                  <rect x="70" y="40" width="10" height="20" />
                  <rect x="85" y="45" width="10" height="15" />
                  
                  <rect x="10" y="40" width="15" height="10" />
                  <rect x="0" y="55" width="20" height="10" />
                  
                  <rect x="40" y="70" width="15" height="15" />
                  <rect x="70" y="75" width="20" height="10" />
                  <rect x="85" y="85" width="15" height="15" />
                </svg>
              </div>

              {/* Token Display */}
              <div className="font-mono text-sm tracking-widest text-slate-400 font-bold bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-lg shadow-inner">
                {selectedPass.qr_code_token}
              </div>

              {/* Status details inside pass */}
              <div className="w-full text-left space-y-2 border-t border-slate-800/80 pt-4 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">Visitor:</span>
                  <span className="text-white">{selectedPass.visitor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Host:</span>
                  <span className="text-white">{selectedPass.host_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Time:</span>
                  <span className="text-slate-300">{new Date(selectedPass.scheduled_start).toLocaleString()}</span>
                </div>
                
                {selectedPass.check_in_time && (
                  <div className="flex justify-between">
                    <span className="text-green-500">Check-In:</span>
                    <span className="text-green-400">{new Date(selectedPass.check_in_time).toLocaleTimeString()}</span>
                  </div>
                )}
                {selectedPass.check_out_time && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-Out:</span>
                    <span className="text-slate-400">{new Date(selectedPass.check_out_time).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SIMULATOR DRAWER (Simulate Gate Scanner for check-in / out) */}
            {selectedPass.status === 'approved' && (
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  <QrCode className="w-4 h-4" />
                  <span>Gate Reader Simulator</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  In a real setup, this QR code is scanned by a lobby camera. Click below to simulate scanning this pass at the gate.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    disabled={simulating || selectedPass.check_in_time}
                    onClick={() => handleSimulateScan('check-in')}
                    className="py-2.5 bg-green-950/40 hover:bg-green-900/40 disabled:opacity-30 disabled:hover:bg-green-950/40 border border-green-800/30 text-green-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {simulating ? 'Scanning...' : 'Scan Check-In'}
                  </button>
                  <button
                    disabled={simulating || !selectedPass.check_in_time || selectedPass.check_out_time}
                    onClick={() => handleSimulateScan('check-out')}
                    className="py-2.5 bg-red-950/40 hover:bg-red-900/40 disabled:opacity-30 disabled:hover:bg-red-950/40 border border-red-800/30 text-red-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {simulating ? 'Scanning...' : 'Scan Check-Out'}
                  </button>
                </div>
              </div>
            )}

            {selectedPass.status === 'pending' && (
              <p className="text-slate-500 text-xs text-center">
                This pass is pending approval from the host <strong className="text-slate-400">{selectedPass.host_name}</strong>. It cannot be scanned yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
