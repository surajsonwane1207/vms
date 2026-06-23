import React, { useState } from 'react';
import api from '../../services/api';
import Card from '../ui/Card';
import { QrCode, AlertCircle, RefreshCw } from 'lucide-react';

export default function ArrivalsTerminal({ approvedVisits, loading, onActionSuccess }) {
  const [scanToken, setScanToken] = useState('');
  const [scanResult, setScanResult] = useState({ type: '', text: '' });
  const [scanLoading, setScanLoading] = useState(false);

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
      onActionSuccess();
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
      onActionSuccess();
    } catch (err) {
      alert(err.message || 'Failed to update visitor status');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
        
        {/* Manual lookup */}
        <Card className="space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-400" /> Virtual QR Scanner
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Manually search and scan a visitor's QR pass token (e.g. <code>VMS-XXXX-XXXX</code>).
          </p>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="VMS-ABC123XYZ-7890"
              value={scanToken}
              onChange={(e) => setScanToken(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl outline-none font-mono text-sm tracking-wider"
            />
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
        </Card>

        {/* Lobby desktop actions list */}
        <Card className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-white text-base">Arrivals Desk Quick Check</h3>
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
        </Card>

      </div>
    </div>
  );
}
