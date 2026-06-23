import React from 'react';
import Card from '../ui/Card';
import { UserCheck, Users, Clock, Shield } from 'lucide-react';

export default function AnalyticsDashboard({ analytics }) {
  if (!analytics) return null;

  const maxDailyCount = analytics.dailyStats?.reduce((max, s) => s.count > max ? s.count : max, 0) || 5;

  return (
    <div className="space-y-8">
      {/* Cards stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card className="flex items-center gap-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/5 to-transparent rounded-bl-full"></div>
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Visitors</span>
            <span className="block text-3xl font-extrabold text-white mt-1">
              {analytics.activeVisitors}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full"></div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Today's Check-ins</span>
            <span className="block text-3xl font-extrabold text-white mt-1">
              {analytics.todayCheckIns}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/5 to-transparent rounded-bl-full"></div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <span className="block text-3xl font-extrabold text-white mt-1">
              {analytics.pendingApprovals}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full"></div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Registered Hosts</span>
            <span className="block text-3xl font-extrabold text-white mt-1">
              {analytics.totalHosts}
            </span>
          </div>
        </Card>

      </div>

      {/* Analytics chart and recent arrivals log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <Card className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-white text-lg">Weekly Visitor Traffic</h3>
          
          <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-l border-slate-800 px-4 relative">
            <div className="absolute inset-x-0 top-1/4 border-t border-slate-800/40 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-2/4 border-t border-slate-800/40 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-3/4 border-t border-slate-800/40 pointer-events-none"></div>

            {analytics.dailyStats?.map((s) => {
              const pct = maxDailyCount > 0 ? (s.count / maxDailyCount) * 100 : 0;
              return (
                <div key={s.day} className="flex-1 flex flex-col items-center gap-3 group relative z-10">
                  <span className="absolute -top-8 px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] font-bold text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                    {s.count} check-ins
                  </span>
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-600 via-purple-600 to-indigo-400 rounded-t-lg group-hover:from-indigo-500 group-hover:to-purple-400 transition-all duration-500 shadow-md shadow-indigo-600/10"
                    style={{ height: `${Math.max(pct, 6)}%` }}
                  ></div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">{s.day}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-bold text-white text-lg">Recent Arrivals</h3>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
            {analytics.recentLogs?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">No recent visitor records</p>
            ) : (
              analytics.recentLogs?.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-xs font-semibold">
                  <div>
                    <p className="text-white">{log.visitor_name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Host: {log.host_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {log.check_in_time ? 'Checked In' : log.status}
                    </span>
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
