import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';

export default function Approvals() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    setLoading(true);

    const res = await fetch(
      'https://localhost/api/approvals/pending',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    setPendingBookings(data);
    setLoading(false);
  };

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
          body: JSON.stringify({ bookingId, action }) // ✅ FIX
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



  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300">
        <div className="px-6 py-4 border-b font-semibold border-gray-300">
          ⏳ Pending Requests ({pendingBookings.length})
        </div>

        {loading && (
          <div className="p-10 text-center text-gray-400">
            Loading approvals...
          </div>
        )}

        {!loading && pendingBookings.length === 0 && (
          <div className="p-16 text-center text-gray-400">
            No pending requests
          </div>
        )}

        <div className="divide-y">
          {pendingBookings?.map(b => (
            <div
              key={b.id}
              className="px-6 py-6 flex justify-between items-center bg-white rounded-2xl shadow-sm border border-gray-300 m-4"
            >
              <div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="text-sm text-gray-500 flex flex-wrap gap-3 mt-2  items-center">
                  {/* 🏢 ROOM */}

                  {b.roomId && b.Department && (
                    <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600">
                      📍 {b.Department.name}
                    </span>
                  )}

                  {b.roomId && b.Room && (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                      💺 {b.Room.name}
                    </span>
                  )}

                  {/* 🔌 DEVICE ONLY */}
                  {!b.roomId && b.Resources?.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                      🔌 {b.Resources.map(r =>
                        `${r.name}${r.BookingResource?.quantity > 1
                          ? ` ×${r.BookingResource.quantity}`
                          : ''}`
                      ).join(', ')}
                    </span>
                  )}

                  {/* 🏢 + 🔌 ROOM + DEVICE */}
                  {b.roomId && b.Resources?.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                      🔌 {b.Resources.map(r =>
                        `${r.name}${r.BookingResource?.quantity > 1
                          ? ` ×${r.BookingResource.quantity}`
                          : ''}`
                      ).join(', ')}
                    </span>
                  )}

                  {b.roomId && b.User && (
                    <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-600">
                      👤 {b.User.name}
                    </span>
                  )}

                  {b.creditsUsed && (
                    <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      💳  {b.creditsUsed} credits
                    </span>
                  )}

                  {/* ⏰ TIME */}
                  <span className="text-gray-400">
                    • {new Date(b.startTime).toLocaleDateString(('en-GB'))}
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
