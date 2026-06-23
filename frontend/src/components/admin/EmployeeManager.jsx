import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { 
  Users, UserPlus, FileText, Plus, Trash2, Send, CheckCircle2, 
  XCircle, Clock, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function EmployeeManager() {
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // Row based bulk invite form
  const [inviteRows, setInviteRows] = useState([
    { name: '', email: '', phone: '', department: '' }
  ]);
  
  // Bulk text area form
  const [bulkText, setBulkText] = useState('');
  const [useTextarea, setUseTextarea] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.getHosts(); // defaults to active company hosts
      setEmployeesList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setInviteRows([...inviteRows, { name: '', email: '', phone: '', department: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (inviteRows.length === 1) return;
    setInviteRows(inviteRows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...inviteRows];
    updated[index][field] = value;
    setInviteRows(updated);
  };

  const handleBulkTextSubmit = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setLoading(true);
    setMsg({ type: '', text: '' });

    // Parse textarea. Format: Name, Email, Phone, Department
    const rows = bulkText.split('\n');
    const parsedEmployees = [];

    for (let row of rows) {
      if (!row.trim()) continue;
      const cols = row.split(',').map(c => c.trim());
      if (cols.length >= 3) {
        parsedEmployees.push({
          name: cols[0],
          email: cols[1],
          phone: cols[2],
          department: cols[3] || ''
        });
      }
    }

    if (parsedEmployees.length === 0) {
      setMsg({ type: 'error', text: 'Could not parse any valid employee rows. Format: Name, Email, Phone, Department' });
      setLoading(false);
      return;
    }

    try {
      await api.bulkInviteEmployees(parsedEmployees);
      setMsg({ type: 'success', text: `Successfully sent invites to ${parsedEmployees.length} employees!` });
      setBulkText('');
      fetchEmployees();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Bulk invitations failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRowsSubmit = async (e) => {
    e.preventDefault();
    // Validate rows
    const validRows = inviteRows.filter(r => r.name && r.email && r.phone);
    if (validRows.length === 0) {
      setMsg({ type: 'error', text: 'Please fill in Name, Email, and Phone for at least one row.' });
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await api.bulkInviteEmployees(validRows);
      setMsg({ type: 'success', text: `Successfully sent invites to ${validRows.length} employees!` });
      setInviteRows([{ name: '', email: '', phone: '', department: '' }]);
      fetchEmployees();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Bulk invitations failed.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-full">Active</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full">Declined</span>;
      default:
        return <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full animate-pulse">Pending Invite</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Manage Employees</h1>
        <p className="text-slate-400 text-sm mt-1">Bulk invite employees to register as corporate visitor hosts.</p>
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
        
        {/* Bulk Invite Card Panel */}
        <Card className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Bulk Invite Employees
            </h3>
            
            {/* Input switcher toggle */}
            <button
              onClick={() => setUseTextarea(!useTextarea)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              Switch to {useTextarea ? 'Row Input' : 'Raw Text Paste'}
            </button>
          </div>

          {useTextarea ? (
            /* TEXTAREA PASTE INPUT */
            <form onSubmit={handleBulkTextSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  CSV Raw Format Paste (one employee per line)
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Name, Email, Phone, Department&#10;John Doe, john@acme.com, +1234567, Operations&#10;Sarah Jenkins, sarah@acme.com, +9876543, HR"
                  className="w-full p-4 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl font-mono text-xs outline-none placeholder-slate-700 leading-relaxed"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !bulkText.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Send Bulk SMS Invites
              </button>
            </form>
          ) : (
            /* MULTIPLE INTERACTIVE ROWS INPUT */
            <form onSubmit={handleRowsSubmit} className="space-y-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide px-2">
                  <div className="col-span-3">Full Name *</div>
                  <div className="col-span-3">Email *</div>
                  <div className="col-span-3">Phone *</div>
                  <div className="col-span-2">Department</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                {inviteRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <input
                        type="text"
                        required
                        value={row.name}
                        placeholder="John Doe"
                        onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="email"
                        required
                        value={row.email}
                        placeholder="john@co.com"
                        onChange={(e) => handleRowChange(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="tel"
                        required
                        value={row.phone}
                        placeholder="+1234567"
                        onChange={(e) => handleRowChange(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={row.department}
                        placeholder="Sales"
                        onChange={(e) => handleRowChange(index, 'department', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        disabled={inviteRows.length === 1}
                        className="p-2 hover:bg-red-500/10 text-red-400 disabled:opacity-20 hover:text-red-300 rounded-lg cursor-pointer transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-lg text-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5 text-indigo-400" /> Add row
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Send SMS Invites
                </button>
              </div>
            </form>
          )}
        </Card>

        {/* Employee Status overview */}
        <Card className="space-y-4 flex flex-col justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Host Directory
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px] pr-1 pt-2">
            {loading && employeesList.length === 0 ? (
              <div className="text-center py-10"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" /></div>
            ) : employeesList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10 font-semibold">No employees invited yet.</p>
            ) : (
              employeesList.map((emp) => (
                <div key={emp.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white text-xs">{emp.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{emp.email} | {emp.phone}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">{emp.department || 'Staff'}</p>
                  </div>
                  <div>
                    {getStatusBadge(emp.status)}
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
