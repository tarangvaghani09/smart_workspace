import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';

export default function Approvals() {

  const [pendingBookings, setPendingBookings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const token = localStorage.getItem('token');

  /* ---------------- LOAD DEPARTMENTS ---------------- */
  useEffect(() => {
    fetch('https://localhost/api/departments')
      .then(res => res.json())
      .then(data => {
        setDepartments(data);

        // auto select first department
        if (data.length > 0) {
          setSelectedDepartment(data[0].id.toString());
        }
      })
      .catch(console.error);
  }, []);

  /* ---------------- FETCH PENDING ---------------- */
  useEffect(() => {
    if (!selectedDepartment) return;

    fetchPendingBookings();
  }, [selectedDepartment]);

  const fetchPendingBookings = async () => {

    setLoading(true);

    try {

      const res = await fetch(
        `https://localhost/api/approvals/pending?departmentId=${selectedDepartment}`,
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
      alert(err.message);
      setPendingBookings([]);
    }

    setLoading(false);
  };

  /* ---------------- APPROVE / REJECT ---------------- */
  const handleDecision = async (bookingId, action) => {

    try {
      setActionLoading(bookingId);

      const res = await fetch(
        'https://localhost/api/approve-booking',
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
        alert(data.error || 'Failed to process decision');
        return;
      }

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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">

          <div>
            <p className='text-md font-semibold'> ⏳ Pending Requests ({pendingBookings.length}) </p>
            <p className="text-sm text-gray-400 font-normal pt-2">
              {selectedDept ? selectedDept?.name : 'Loading...'} department
            </p>
          </div>

          {/* 🔥 Department Dropdown */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border rounded-xl border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 px-4 cursor-pointer"
          >
            {departments?.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

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
              className="px-6 py-6 flex justify-between items-center bg-white rounded-2xl shadow-sm border border-gray-300 m-5"
            >
              <div>
                <h3 className="font-semibold">{b.title}</h3>

                <p className="text-sm text-gray-500 flex flex-wrap gap-3 mt-2 items-center">

                  {b.Department && (
                    <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600">
                      📍 {b.Department.name}
                    </span>
                  )}

                  {b.Rooms?.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                      💺 {b.Rooms[0].name}
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
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={actionLoading === b.id}
                  onClick={() => handleDecision(b.id, 'REJECT')}
                  className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                >
                  Reject
                </button>

                <button
                  disabled={actionLoading === b.id}
                  onClick={() => handleDecision(b.id, 'APPROVE')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
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