import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function Badge({ status }) {
  switch (status) {
    case 'approved':
      return (
        <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-full inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
        </span>
      );
    case 'declined':
      return (
        <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-full inline-flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5" /> Declined
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-semibold rounded-full inline-flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 animate-pulse">
          <Clock className="w-3.5 h-3.5" /> Pending
        </span>
      );
  }
}
