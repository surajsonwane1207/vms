import React from 'react';
import api from '../../services/api';
import Card from '../ui/Card';
import { Clock, AlertCircle, Building, X, Check } from 'lucide-react';

export default function PendingRequests({ pendingRequests, onActionSuccess, onActionError }) {

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, status);
      onActionSuccess(`Appointment successfully ${status}`);
    } catch (err) {
      onActionError(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {pendingRequests.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No pending requests</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            You are completely caught up! New visitor requests will appear here for approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingRequests.map((appt) => (
            <Card 
              key={appt.id} 
              className="flex flex-col justify-between"
            >
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
