import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../ui/Card';
import { 
  Building, User, Shield, Key, Plus, RefreshCw, AlertCircle, Calendar 
} from 'lucide-react';

export default function CompanyManager() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Form states
  const [form, setForm] = useState({
    companyName: '',
    companyCode: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await api.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName || !form.companyCode || !form.adminName || !form.adminEmail || !form.adminPassword) {
      setMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }

    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      await api.createCompany(form);
      setMsg({ type: 'success', text: `Company "${form.companyName}" registered, and admin account provisioned!` });
      setForm({
        companyName: '',
        companyCode: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });
      fetchCompanies();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Company registration failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white font-sans">Manage Tenant Companies</h1>
        <p className="text-slate-400 text-sm mt-1">Register new corporate companies and provision their local administrators.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Company Form Card */}
        <Card className="space-y-5 flex flex-col justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" /> Add Corporate Tenant
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleInputChange}
                placeholder="e.g. Google India"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Company Code (Slug) *
              </label>
              <input
                type="text"
                name="companyCode"
                value={form.companyCode}
                onChange={handleInputChange}
                placeholder="e.g. google"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl text-xs outline-none font-mono tracking-wider"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Admin Account Credentials</h4>
              
              <div className="space-y-3">
                <input
                  type="text"
                  name="adminName"
                  value={form.adminName}
                  onChange={handleInputChange}
                  placeholder="Admin Full Name"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl text-xs outline-none"
                />
                <input
                  type="email"
                  name="adminEmail"
                  value={form.adminEmail}
                  onChange={handleInputChange}
                  placeholder="Admin Email Address"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl text-xs outline-none"
                />
                <input
                  type="password"
                  name="adminPassword"
                  value={form.adminPassword}
                  onChange={handleInputChange}
                  placeholder="Admin Password (Min 6)"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Register Tenant Company
                </>
              )}
            </button>
          </form>
        </Card>

        {/* Companies List Directory */}
        <Card className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-white text-base">Active Tenants</h3>
          
          {loading && companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-20 font-semibold">No companies registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-3 pl-4">Company Name</th>
                    <th className="p-3">Slug Code</th>
                    <th className="p-3 text-center">Admins</th>
                    <th className="p-3 text-center">Hosts</th>
                    <th className="p-3 pr-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300 font-semibold">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-850/10">
                      <td className="p-3 pl-4 font-bold text-white text-sm">{c.name}</td>
                      <td className="p-3 font-mono text-indigo-400">{c.code}</td>
                      <td className="p-3 text-center text-slate-200">{c.admin_count}</td>
                      <td className="p-3 text-center text-slate-200">{c.host_count}</td>
                      <td className="p-3 pr-4 text-slate-500">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
