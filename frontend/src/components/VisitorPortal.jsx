import React, { useState, useEffect } from 'react';
import api from '../services/api';
import VisitorAppointments from './visitor/VisitorAppointments';
import BookAppointment from './visitor/BookAppointment';
import { PlusCircle } from 'lucide-react';

export default function VisitorPortal({ activeTab, setActiveTab, user }) {
  const [appointments, setAppointments] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    setFetching(true);
    try {
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setFetching(false);
    }
  };

  if (activeTab === 'book-visit') {
    return (
      <BookAppointment
        user={user}
        onBookingSuccess={() => setActiveTab('my-passes')}
        onCancel={() => setActiveTab('my-passes')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">My Entry Passes</h1>
          <p className="text-slate-400 text-sm mt-1">Select an approved pass to access security gates.</p>
        </div>
        <button
          onClick={() => setActiveTab('book-visit')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Schedule Visit
        </button>
      </div>

      <VisitorAppointments
        appointments={appointments}
        fetching={fetching}
        onRefresh={fetchAppointments}
        onNavigateToBook={() => setActiveTab('book-visit')}
      />
    </div>
  );
}
