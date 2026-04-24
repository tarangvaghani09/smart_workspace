import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import AdminLayout from './AdminLayout';
import { apiUrl } from './api';
import { FaSpinner } from 'react-icons/fa6';

export default function DepartmentBookingList() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState('');

  const token = localStorage.getItem('token');

  // 🔹 Load departments
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

  // Load bookings when department changes
  useEffect(() => {
    if (!selectedDepartment) return;

    setLoading(true);

    fetch(apiUrl(`/api/bookings/department?departmentId=${selectedDepartment}`),
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          console.error('Error loading bookings:', data);
          throw new Error(data.message || 'Failed to load bookings');
        }

        return data;
      })
      .then(data => {
        setBookings(Array.isArray(data) ? data : []);
        console.log('Loaded bookings:', data);
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

  const statuses = Array.from(new Set(bookings.map(b => b.status)));

  const filteredBookings = status
    ? bookings.filter(b => b.status === status)
    : bookings;

  return (
    <AdminLayout>
      <Helmet>
        <title>Department Bookings</title>
      </Helmet>
      <div className="bg-white p-4 sm:p-6 lg:p-10 rounded-2xl shadow-sm border border-gray-300">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold mb-2">
              Department Bookings
            </h2>
            <p className="text-gray-500">
              {selectedDept ? selectedDept?.name : 'Loading...'} department
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">

            <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-xl border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 px-4 cursor-pointer w-full sm:w-auto" >
              <option value="">All Status</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

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
                {/* <option value="">Select Department</option> */}
                {departments?.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <p className="p-10 text-center text-gray-400">Loading bookings...</p>
        )}

        {!loading && bookings.length === 0 && selectedDepartment && (
          <p className="py-12 text-center text-sm text-gray-400">
            No bookings found for this department.
          </p>
        )}

        {/* LIST */}
        <div className="space-y-5">
          {filteredBookings?.map(b => (
            <div
              key={b.id}
              className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-indigo-200"
            >
              <div className="flex items-start justify-between gap-6">

                {/* LEFT */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {b.Room?.name || b.Rooms?.[0]?.name || 'Resource Booking'}
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
                        `${r.name}${r.BookingResource?.quantity > 1
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

        </div>

      </div>
    </AdminLayout>
  );
}
