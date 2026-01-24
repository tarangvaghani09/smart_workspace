import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';

export default function DepartmentBookingList() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  // 🔹 Load departments
  useEffect(() => {
    fetch('https://localhost:3000/api/departments')
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

  // 🔹 Load bookings when department changes
  useEffect(() => {
    if (!selectedDepartment) return;

    setLoading(true);

    fetch(
      `https://localhost:3000/api/bookings/department?departmentId=${selectedDepartment}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
      .then(async res => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load bookings');
        }

        return data;
      })
      .then(data => {
        setBookings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert(err.message);
        setBookings([]);
        setLoading(false);
      });
  }, [selectedDepartment]);

  const selectedDept = departments.find(
    d => d.id.toString() === selectedDepartment
  );

  return (
    <AdminLayout>
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-300">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-2">
              Department Bookings
            </h2>
            <p className="text-gray-500">
              {selectedDept ? selectedDept?.name : 'Loading...'} department
            </p>
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border rounded-xl border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 px-4 cursor-pointer"
          >
            {/* <option value="">Select Department</option> */}
            {departments?.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-gray-400 font-medium">Loading bookings...</p>
        )}

        {/* LIST */}
        <div className="space-y-5">
          {bookings?.map(b => (
            <div
              key={b.id}
              className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-indigo-200"
            >
              <div className="flex items-start justify-between gap-6">

                {/* LEFT */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {b.Room?.name || 'Resource Booking'}
                  </h3>

                  <p className="text-xs text-gray-500 font-medium">
                    👤 {b.User.name} ({b.User.email})
                  </p>

                  <p className="text-xs text-gray-500 font-medium">
                    🕒 {new Date(b.startTime).toLocaleString()} –{' '}
                    {new Date(b.endTime).toLocaleTimeString()}
                  </p>

                  {b.Resources?.length > 0 && (
                    <p className="text-xs font-semibold text-blue-600 mt-2">
                      🔌 {b.Resources.map(r =>
                        `${r.name}${r.BookingResource.quantity > 1
                          ? ` × ${r.BookingResource.quantity}`
                          : ''}`
                      ).join(', ')}
                    </p>
                  )}
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end gap-2 text-right">

                  {b.status === 'CONFIRMED' && (
                    <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-600">
                      {b.status}
                    </span>
                  )}

                  {b.status === 'PENDING' && (
                    <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
                      {b.status}
                    </span>
                  )}

                  {(b.status === 'NO_SHOW' || b.status === 'REJECTED') && (
                    <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600">
                      {b.status}
                    </span>
                  )}

                  {b.status === 'CANCELLED' && (
                    <span className="inline-flex items-center rounded-full border border-gray-400/30 bg-gray-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {b.status}
                    </span>
                  )}

                  <p className="mt-2 text-xs font-bold text-gray-500">
                    💳 {b.creditsUsed} credits
                  </p>
                </div>

              </div>

              {/* Decorative gradient hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
          ))}

          {!loading && bookings.length === 0 && selectedDepartment && (
            <p className="py-12 text-center text-sm font-medium text-gray-400">
              No bookings found for this department.
            </p>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
