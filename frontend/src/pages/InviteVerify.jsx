import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Key, Check, X, AlertCircle, ArrowLeft, RefreshCw, UserCheck } from 'lucide-react';

export default function InviteVerify({ token, onNavigateToLogin }) {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Accept fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInviteDetails();
  }, [token]);

  const fetchInviteDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getInvitationDetails(token);
      setInvite(data);
    } catch (err) {
      setError(err.message || 'Invalid or expired invitation token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action) => {
    if (action === 'approve') {
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await api.respondInvitation(token, action, password);
      setSuccess(res.message);
      fetchInviteDetails(); // refresh details
      if (action === 'approve') {
        setTimeout(() => {
          onNavigateToLogin();
        }, 2500);
      }
    } catch (err) {
      setError(err.message || 'Invitation update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-semibold text-sm">Validating invitation token...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden bg-slate-950">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-75"></div>

      <div className="w-full max-w-md z-10">
        
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20 mb-4">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Onboarding Portal
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Verify employee host registry</p>
        </div>

        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-indigo-950/20">
          
          <button
            onClick={onNavigateToLogin}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Login
          </button>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-6 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl mb-6 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
              <span>{success}</span>
            </div>
          )}

          {invite && (
            <div className="space-y-6">
              
              {/* Invitation Information Card */}
              <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl space-y-3 text-left">
                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Invitation Details</h3>
                <div className="text-sm font-semibold">
                  <p className="text-white">Host Employee: <strong className="text-indigo-400 font-bold">{invite.name}</strong></p>
                  <p className="text-slate-400 mt-1">Company: <strong className="text-slate-200">{invite.company_name}</strong></p>
                  <p className="text-slate-400 mt-1">Department: <strong className="text-slate-200">{invite.department || 'General'}</strong></p>
                  <p className="text-slate-400 mt-1">Phone: <strong className="text-slate-200">{invite.phone}</strong></p>
                </div>
              </div>

              {/* Action Forms */}
              {invite.status === 'pending_invite' && !success && (
                <div className="space-y-4 text-left">
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Set up your secure password below to approve your registration and activate your corporate host account.
                  </p>
                  
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-12 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl placeholder-slate-600 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-12 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl placeholder-slate-600 outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                      onClick={() => handleResponse('reject')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-1.5 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" /> Reject Invite
                    </button>
                    <button
                      onClick={() => handleResponse('approve')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Approve & Join
                    </button>
                  </div>
                </div>
              )}

              {invite.status === 'active' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mx-auto border border-green-500/20">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Onboarding Completed</h4>
                    <p className="text-xs text-slate-400 mt-1.5">
                      This invitation has already been accepted. Your host profile is fully active!
                    </p>
                  </div>
                  <button
                    onClick={onNavigateToLogin}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer transition-all"
                  >
                    Go to Log In
                  </button>
                </div>
              )}

              {invite.status === 'rejected' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                    <X className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Invitation Declined</h4>
                    <p className="text-xs text-slate-400 mt-1.5">
                      This registration invitation was declined. Contact your company administrator if this was an error.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
