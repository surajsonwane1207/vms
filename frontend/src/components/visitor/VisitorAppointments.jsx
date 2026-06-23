import React, { useState } from 'react';
import api from '../../services/api';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { 
  QrCode, AlertCircle, RefreshCw, ArrowRight, XCircle, User, Clock, Building
} from 'lucide-react';

export default function VisitorAppointments({ appointments, fetching, onRefresh, onNavigateToBook }) {
  const [selectedPass, setSelectedPass] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSimulateScan = async (action) => {
    if (!selectedPass) return;
    setSimulating(true);
    setMsg({ type: '', text: '' });
    try {
      const response = await api.scanQrCode(selectedPass.qr_code_token, action);
      setSelectedPass(response.appointment);
      setMsg({ type: 'success', text: response.message });
      onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Simulation failed' });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
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
            onClick={onNavigateToBook}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 font-semibold rounded-xl text-sm transition-all cursor-pointer"
          >
            Create your first pass <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appt) => (
            <Card
              key={appt.id}
              onClick={() => setSelectedPass(appt)}
              className="group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 font-mono tracking-wider">
                    {appt.qr_code_token}
                  </span>
                  <Badge status={appt.status} />
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
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Pass Popup Modal */}
      {selectedPass && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 md:p-8 relative space-y-6">
            
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

            <div className={`
              relative rounded-2xl p-6 border flex flex-col items-center gap-5 text-center overflow-hidden
              ${selectedPass.check_in_time && !selectedPass.check_out_time
                ? 'bg-gradient-to-b from-green-950/20 to-slate-950 border-green-500/30'
                : selectedPass.check_out_time
                ? 'bg-slate-950/50 border-slate-800'
                : 'bg-gradient-to-b from-indigo-950/20 to-slate-950 border-indigo-500/30'
              }
            `}>
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>

              <div>
                <h3 className="font-extrabold text-xl text-white">{selectedPass.purpose}</h3>
                <span className="block text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  {selectedPass.visitor_company || 'Independent Visitor'}
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative group">
                {selectedPass.status === 'approved' && !selectedPass.check_out_time && (
                  <div className="absolute inset-x-0 h-[2px] bg-indigo-500/80 animate-bounce top-1/2 shadow-[0_0_8px_rgba(99,102,241,1)]"></div>
                )}
                
                <svg className="w-40 h-40 text-slate-300" viewBox="0 0 100 100" fill="currentColor">
                  <rect x="0" y="0" width="30" height="30" />
                  <rect x="5" y="5" width="20" height="20" fill="black" />
                  <rect x="10" y="10" width="10" height="10" />

                  <rect x="70" y="0" width="30" height="30" />
                  <rect x="75" y="5" width="20" height="20" fill="black" />
                  <rect x="80" y="10" width="10" height="10" />

                  <rect x="0" y="70" width="30" height="30" />
                  <rect x="5" y="75" width="20" height="20" fill="black" />
                  <rect x="10" y="80" width="10" height="10" />

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

              <div className="font-mono text-sm tracking-widest text-slate-400 font-bold bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-lg shadow-inner">
                {selectedPass.qr_code_token}
              </div>

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
                  <span className="text-slate-500">Scheduled:</span>
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

            {selectedPass.status === 'approved' && (
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  <QrCode className="w-4 h-4" />
                  <span>Gate Reader Simulator</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Click below to simulate scanning this pass at the gate reader.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    disabled={simulating || selectedPass.check_in_time}
                    onClick={() => handleSimulateScan('check-in')}
                    className="py-2.5 bg-green-950/40 hover:bg-green-900/40 disabled:opacity-30 border border-green-800/30 text-green-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {simulating ? 'Scanning...' : 'Scan Check-In'}
                  </button>
                  <button
                    disabled={simulating || !selectedPass.check_in_time || selectedPass.check_out_time}
                    onClick={() => handleSimulateScan('check-out')}
                    className="py-2.5 bg-red-950/40 hover:bg-red-900/40 disabled:opacity-30 border border-red-800/30 text-red-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {simulating ? 'Scanning...' : 'Scan Check-Out'}
                  </button>
                </div>
              </div>
            )}

            {selectedPass.status === 'pending' && (
              <p className="text-slate-500 text-xs text-center font-medium">
                This pass is pending approval from host <strong className="text-slate-400">{selectedPass.host_name}</strong>.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
