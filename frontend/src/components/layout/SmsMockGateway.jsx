import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Smartphone, X, MessageSquare, ExternalLink, Calendar, Check, Send } from 'lucide-react';

export default function SmsMockGateway({ onNavigateToInvite }) {
  const [open, setOpen] = useState(false);
  const [smsList, setSmsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSmsLogs();
      const interval = setInterval(fetchSmsLogs, 4000);
      return () => clearInterval(interval);
    }
  }, [open]);

  const fetchSmsLogs = async () => {
    try {
      const logs = await api.getSmsGatewayLogs();
      setSmsList(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'text-green-400 border border-green-500/30 bg-green-500/10';
      case 'rejected':
        return 'text-red-400 border border-red-500/30 bg-red-500/10';
      default:
        return 'text-yellow-400 border border-yellow-500/30 bg-yellow-500/10';
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-full shadow-lg shadow-emerald-500/30 active:scale-95 transition-all text-xs cursor-pointer tracking-wide"
      >
        <Smartphone className="w-5 h-5 animate-bounce" />
        <span>Mock SMS Gateway</span>
        {smsList.filter(s => s.status === 'sent').length > 0 && (
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>

      {/* Mock SmartPhone Container */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-slate-950 border border-slate-800 rounded-[40px] shadow-2xl p-3 shadow-indigo-950/20 overflow-hidden ring-8 ring-slate-900 flex flex-col h-[550px]">
          
          {/* Notch and status bar */}
          <div className="h-6 flex justify-between items-center px-6 text-[10px] text-slate-500 font-bold bg-slate-950">
            <span>9:41 AM</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3"></div>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2 bg-slate-500 rounded-sm"></div>
            </div>
          </div>

          {/* SMS App Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-900 bg-slate-900/40">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-full">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="font-extrabold text-white text-xs block">VMS SMS Gateway</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Sandbox Simulation</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Thread body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
            {smsList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 gap-3">
                <Smartphone className="w-10 h-10 opacity-30" />
                <p className="text-xs font-semibold max-w-[200px]">
                  No SMS notifications sent yet. Invitations sent to employees will appear here.
                </p>
              </div>
            ) : (
              smsList.map((sms) => {
                return (
                  <div key={sms.id} className="flex flex-col gap-1 items-start text-left">
                    <span className="text-[9px] text-slate-500 font-bold ml-2">
                      To: {sms.phone} • {new Date(sms.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {/* SMS Bubble */}
                    <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-2xl rounded-tl-none max-w-[85%] text-xs text-slate-300 leading-relaxed relative group">
                      <p>{sms.message}</p>
                      
                      {/* Invite Link Action inside SMS Bubble */}
                      {sms.token && sms.status === 'sent' && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
                          <button
                            onClick={() => {
                              onNavigateToInvite(sms.token);
                              setOpen(false);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide cursor-pointer transition-all shadow-md shadow-emerald-500/10"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open Invite Link
                          </button>
                        </div>
                      )}

                      {/* Display response status */}
                      {sms.status !== 'sent' && (
                        <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-right">
                          <span className={`px-2 py-0.5 rounded-full ${getStatusColor(sms.status)}`}>
                            Invite {sms.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Simulated footer input */}
          <div className="border-t border-slate-900 p-3 bg-slate-950 flex items-center gap-2">
            <input
              type="text"
              disabled
              placeholder="Simulation Only (Auto-receiver)"
              className="flex-1 bg-slate-900 border border-slate-800 text-[11px] px-3.5 py-2 rounded-full placeholder-slate-600 outline-none text-slate-500"
            />
            <button disabled className="p-2 bg-emerald-500/10 text-emerald-500/40 rounded-full">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
