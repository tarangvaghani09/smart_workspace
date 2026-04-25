import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa6';
import { apiUrl } from './api';

export default function Approvals() {

  const [pendingBookings, setPendingBookings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const token = localStorage.getItem('token');

  /* ---------------- LOAD DEPARTMENTS ---------------- */
  useEffect(() => {
    setDepartmentsLoading(true);
    fetch(apiUrl('/api/departments'))
      .then(res => res.json())
      .then(data => {
        setDepartments(data);

        // auto select first department
        if (data.length > 0) {
          setSelectedDepartment(data[0].id.toString());
        }
      })
      .catch(console.error)
      .finally(() => setDepartmentsLoading(false));
  }, []);

  /* ---------------- FETCH PENDING ---------------- */
  useEffect(() => {
    if (!selectedDepartment) return;

    fetchPendingBookings();
  }, [selectedDepartment]);

  const fetchPendingBookings = async () => {

    setLoading(true);

    try {

      const res = await fetch(apiUrl(`/api/approvals/pending?departmentId=${selectedDepartment}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load approvals');
      }

      setPendingBookings(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load approvals');
      setPendingBookings([]);
    }

    setLoading(false);
  };

  /* ---------------- APPROVE / REJECT ---------------- */
  const handleDecision = async (bookingId, action) => {

    try {
      setActionLoading(bookingId);

      const res = await fetch(apiUrl('/api/approve-booking'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ bookingId, action })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to process decision');
        return;
      }

      toast.success(action === 'APPROVE' ? 'Booking approved' : 'Booking rejected');
      fetchPendingBookings();

    } finally {
      setActionLoading(null);
    }
  };


  const selectedDept = departments.find(
    d => d.id.toString() === selectedDepartment
  );

  return (
    <AdminLayout>
      <Helmet>
        <title>Approvals</title>
      </Helmet>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-300 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">

          <div>
            <h2 className="text-xl font-bold mb-2"> Pending Requests ({pendingBookings.length}) </h2>
            <p className="text-gray-500">
              {selectedDept ? selectedDept?.name : 'Loading...'} department
            </p>
          </div>

          {/* Department Dropdown */}
          {departmentsLoading ? (
            <div className="border rounded-xl border-gray-300 text-gray-600 p-2 px-4 w-full sm:w-[220px] flex items-center justify-center">
              <FaSpinner className="animate-spin text-slate-400" />
            </div>
          ) : (
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border rounded-xl border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 px-4 cursor-pointer w-full sm:w-auto"
            >
              {departments?.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

        </div>

        {/* LOADING */}
        {loading && (
          <div className="p-10 text-center text-gray-400">
            Loading approvals...
          </div>
        )}

        {/* EMPTY */}
        {!loading && pendingBookings.length === 0 && (
          <div className="p-16 text-center text-gray-400">
            No pending requests
          </div>
        )}

        {/* LIST */}
        <div className="divide-y">
          {pendingBookings?.map(b => (
            <div
              key={b.id}
              className="px-4 sm:px-6 py-5 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-300 m-4 sm:m-5"
            >
              <div>
                <h3 className="font-semibold">{b.title}</h3>

                <p className="text-sm text-gray-500 flex flex-wrap gap-3 mt-2 items-center">

                  {b.Department && (
                    <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600">
                      📍 {b.Department.name}
                    </span>
                  )}

                  {(b.Room?.name || b.Rooms?.[0]?.name) && (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                      💺 {b.Room?.name || b.Rooms?.[0]?.name}
                    </span>
                  )}

                  {b.Resources?.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                      🔌 {b.Resources.map(r =>
                        `${r.name}${r.BookingResource?.quantity > 1
                          ? ` ×${r.BookingResource.quantity}`
                          : ''}`
                      ).join(', ')}
                    </span>
                  )}

                  {b.User && (
                    <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-600">
                      👤 {b.User.name}
                    </span>
                  )}

                  {b.creditsUsed && (
                    <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      💳 {b.creditsUsed} credits
                    </span>
                  )}

                  <span className="text-gray-400">
                    • {new Date(b.startTime).toLocaleDateString('en-GB')}
                  </span>

                  <span className="text-gray-400">
                    • {new Date(b.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – {new Date(b.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3 sm:justify-end">
                <button
                  disabled={actionLoading === b.id}
                  onClick={() => handleDecision(b.id, 'REJECT')}
                  className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                >
                  Reject
                </button>

                <button
                  disabled={actionLoading === b.id}
                  onClick={() => handleDecision(b.id, 'APPROVE')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}
