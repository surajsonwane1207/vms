import React from 'react';
import Badge from '../ui/Badge';
import { User } from 'lucide-react';

export default function VisitorsLog({ pastVisitors }) {
  return (
    <div className="space-y-6">
      {pastVisitors.length === 0 ? (
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
                    <td className="p-4"><Badge status={appt.status} /></td>
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
