import { useEffect, useState, useRef } from 'react';
import React from 'react';
import Navbar from './Navbar';
import { RiDeleteBin6Line } from "react-icons/ri";

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetch('https://localhost:3000/api/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setBookings);
  }, []);

  const cancelBooking = async (bookingId) => {
    const ok = window.confirm(
      'Cancel this booking?\n\n• 90% refund if cancelled before 48 hours'
    );

    if (!ok) return;

    const res = await fetch(
      `https://localhost:3000/api/bookings/${bookingId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Failed to cancel booking');
      return;
    }

    alert('✅ Booking cancelled');

    // refresh list
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
      )
    );

    setOpenMenuId(null);
  };

  const checkInBooking = async (bookingId) => {
    const ok = window.confirm('Check in to this booking now?');
    if (!ok) return;

    const res = await fetch(
      `https://localhost:3000/api/bookings/${bookingId}/check-in`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Check-in failed');
      return;
    }

    alert('✅ Checked in successfully');

    // update UI
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, checkedIn: true } : b
      )
    );

    setOpenMenuId(null);
  };

  const checkOutBooking = async (bookingId) => {
    const ok = window.confirm('Check out of this room now?');
    if (!ok) return;

    const res = await fetch(
      `https://localhost:3000/api/bookings/${bookingId}/check-out`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Check-out failed');
      return;
    }

    alert('✅ Checked out successfully');

    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? { ...b, checkedOut: true }
          : b
      )
    );

    setOpenMenuId(null);
  };

  return (
    <div>


      {/* PAGE WRAPPER */}



      {/* CARD */}
      {/* <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"> */}
      {/* <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <span className="text-indigo-600">📋</span> My Bookings
              </h2>
              <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">
                {bookings.length} Total
              </span>
            </div> */}

      <div className='bg-white rounded-[2rem] shadow-sm overflow-hidden'>
        <div className="space-y-3">
          {bookings?.map(b => (
            <div
              key={b.id}
              className="group border border-gray-100 rounded-2xl p-5 flex items-center gap-6 hover:shadow-lg hover:border-indigo-100 transition-all duration-300"
            >
              {/* DATE */}
              <div className="bg-gray-50 rounded-xl px-5 py-3 text-center border border-gray-100 min-w-[90px] group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-tighter group-hover:text-indigo-400">
                  {new Date(b.startTime).toLocaleString('default', { month: 'short' })}
                </p>
                <p className="text-2xl font-black text-gray-800 group-hover:text-indigo-700">
                  {new Date(b.startTime).getDate()}
                </p>
              </div>

              {/* DETAILS */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">
                    {b.title}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${b.status === 'CONFIRMED'
                      ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-green-500/10 text-green-600 border-green-500/20'
                      : b.status === 'NO_SHOW' || b.status === 'REJECTED'
                        ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20'
                        : b.status === 'CANCELLED'
                          ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-500/10 text-gray-600 border border-gray-500/20'
                          : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert w-3 h-3"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>

                    <span className='ml-1 flex items-center justify-center'>{b.status}</span>
                  </span>
                  {b.status === 'CONFIRMED' && (
                    b.checkedIn && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider inline-flex gap-1 items-center text-xs font-semibold border bg-green-500/10 text-green-600 border-green-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert w-3 h-3"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
                        Checked In
                      </span>
                    )
                  )}

                  {b.checkedOut && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider inline-flex gap-1 items-center text-xs font-semibold border bg-blue-500/10 text-blue-600 border-blue-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert w-3 h-3"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
                      Checked Out
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-gray-500 flex-wrap">

                  {/* TIME */}
                  <span>
                    🕒 {new Date(b.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  {/* 🏢 ROOM */}
                  {b.roomId && b.Room && (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                      📍 {b.Room.name}
                    </span>
                  )}

                  {/* 🔌 DEVICE ONLY */}
                  {!b.roomId && b.Resources?.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-600">
                      🔌 {b.Resources.map(r =>
                        `${r.name}${r.BookingResource?.quantity > 1
                          ? ` × ${r.BookingResource.quantity}`
                          : ''}`
                      ).join(', ')}
                    </span>
                  )}

                  {/* 🏢 + 🔌 ROOM + DEVICE */}
                  {b.roomId && b.Resources?.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-600">
                      🔌 {b.Resources.map(r =>
                        `${r.name}${r.BookingResource?.quantity > 1
                          ? ` × ${r.BookingResource.quantity}`
                          : ''}`
                      ).join(', ')}
                    </span>
                  )}

                </div>
              </div>

              {/* MENU */}
              <div className="flex items-center gap-6 relative">

                {/* ✅ CHECK-IN */}
                {b.status === 'CONFIRMED' && !b.checkedIn && (
                  <button
                    onClick={() => checkInBooking(b.id)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                  >
                    Check In Now
                  </button>
                )}

                {/* ✅ CHECK-OUT */}
                {b.status === 'CONFIRMED' && b.checkedIn && !b.checkedOut && (
                  <button
                    onClick={() => checkOutBooking(b.id)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Check Out Now
                  </button>
                )}

                {/* ❌ Hide 3-dot menu after check-in */}
                {!b.checkedIn && b.status !== 'CANCELLED' && b.status !== 'NO_SHOW' && b.status !== 'REJECTED' &&(
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === b.id ? null : b.id)
                    }
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <span className="text-xl cursor-pointer">⋮</span>
                  </button>
                )}

                {/* CANCEL ONLY IF NOT CHECKED IN */}
                {openMenuId === b.id && !b.checkedIn && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-20"
                  >
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left rounded-xl cursor-pointer flex items-center gap-2"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-400 font-medium">
                No bookings scheduled yet.
              </p>
            </div>
          )}
        </div>
        {/* </div> */}


      </div>
    </div>
  );
}
