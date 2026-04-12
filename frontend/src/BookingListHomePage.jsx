import { useEffect, useState, useRef } from 'react';
import React from 'react';
import { toast } from 'react-toastify';
import AlertDialog from './components/AlertDialog';
import { BsThreeDotsVertical } from 'react-icons/bs';

export default function BookingListHomePage() {
  const [bookings, setBookings] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    destructive: false,
    onConfirm: null
  });

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
    fetch('http://localhost:3000/api/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setBookings);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const runConfirmedAction = async () => {
    const action = confirmDialog.onConfirm;
    setConfirmDialog(prev => ({ ...prev, open: false, onConfirm: null }));
    if (action) {
      await action();
    }
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false, onConfirm: null }));
  };

  const performCancelBooking = async (bookingId) => {
    const res = await fetch(
      `http://localhost:3000/api/bookings/${bookingId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || 'Failed to cancel booking');
      return;
    }
    toast.success('Booking cancelled successfully');

    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
      )
    );

    setOpenMenuId(null);
  };

  const cancelBooking = (bookingId) => {
    setOpenMenuId(null);
    setConfirmDialog({
      open: true,
      title: 'Cancel this booking',
      description: '90% refund if cancelled before 48 hours.',
      confirmText: 'Cancel Booking',
      destructive: true,
      onConfirm: () => performCancelBooking(bookingId)
    });
  };

  const performCheckInBooking = async (bookingId) => {
    const res = await fetch(
      `http://localhost:3000/api/bookings/${bookingId}/check-in`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || 'Check-in failed');
      return;
    }
    toast.success('Checked in successfully');

    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, checkedIn: true } : b
      )
    );

    setOpenMenuId(null);
  };

  const checkInBooking = (bookingId) => {
    setConfirmDialog({
      open: true,
      title: 'Check in now',
      description: 'You can only do this during your booking window.',
      confirmText: 'Check In',
      destructive: false,
      onConfirm: () => performCheckInBooking(bookingId)
    });
  };

  const performCheckOutBooking = async (bookingId) => {
    const res = await fetch(
      `http://localhost:3000/api/bookings/${bookingId}/check-out`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || 'Check-out failed');
      return;
    }
    toast.success('Checked out successfully');

    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? { ...b, checkedOut: true }
          : b
      )
    );

    setOpenMenuId(null);
  };

  const checkOutBooking = (bookingId) => {
    setConfirmDialog({
      open: true,
      title: 'Check out now',
      description: 'This will mark your booking as checked out.',
      confirmText: 'Check Out',
      destructive: false,
      onConfirm: () => performCheckOutBooking(bookingId)
    });
  };

  const canShowCheckIn = (startTime, endTime) => {
    const startMs = Date.parse(startTime);
    const endMs = Date.parse(endTime);
    return Number.isFinite(startMs) && Number.isFinite(endMs) && now >= startMs && now < endMs;
  };

  const isBookingEnded = (endTime) => {
    const endMs = Date.parse(endTime);
    return Number.isFinite(endMs) && now >= endMs;
  };

  return (
    <div>
      <div className='bg-white rounded-[2rem] shadow-sm overflow-hidden'>
        <div className="space-y-3">
          {bookings?.slice(0, 10).map(b => (
            <div
              key={b.id}
              className="group border border-gray-100 rounded-2xl p-5 flex items-center gap-6 hover:shadow-lg hover:border-indigo-100 transition-all duration-300"
            >
              <div className="bg-gray-50 rounded-xl px-4 py-2 text-center border border-gray-100 min-w-[72px] sm:min-w-[90px] group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                <p className="text-[9px] sm:text-[10px] uppercase font-black text-gray-400 tracking-tighter group-hover:text-indigo-400">
                  {new Date(b.startTime).toLocaleString('default', { month: 'short' })}
                </p>
                <p className="text-xl sm:text-2xl font-black text-gray-800 group-hover:text-indigo-700">
                  {new Date(b.startTime).getDate()}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-tight truncate max-w-[140px] sm:max-w-none">
                    {b.title}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${b.status === 'CONFIRMED'
                      ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-green-500/10 text-green-600 border-green-500/20'
                      : b.status === 'NO_SHOW' || b.status === 'REJECTED'
                        ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20'
                        : b.status === 'CANCELLED'
                          ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-500/10 text-gray-600 border border-gray-500/20'
                          : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}
                  >
                    <span className='ml-1 flex items-center justify-center'>{b.status}</span>
                  </span>
                  {b.status === 'CONFIRMED' && (
                    b.checkedIn && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider inline-flex gap-1 items-center text-xs font-semibold border bg-green-500/10 text-green-600 border-green-500/20">
                        Checked In
                      </span>
                    )
                  )}

                  {b.checkedOut && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider inline-flex gap-1 items-center text-xs font-semibold border bg-blue-500/10 text-blue-600 border-blue-500/20">
                      Checked Out
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold text-gray-500 flex-wrap">
                  <span>
                    {new Date(b.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  {(b.Room?.name || b.Rooms?.[0]?.name) && (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                      📍 {b.Room?.name || b.Rooms?.[0]?.name}
                    </span>
                  )}

                  {b.Resources?.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-600">
                      🔌 {b.Resources.map(r =>
                        `${r.name}${r.BookingResource?.quantity > 1
                          ? ` x ${r.BookingResource.quantity}`
                          : ''}`
                      ).join(', ')}
                    </span>
                  )}

                  {b.creditsUsed && (
                    <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      💳 {b.creditsUsed} credits
                    </span>
                  )}

                </div>
              </div>

              <div className="flex items-center gap-6 relative">
                {b.status === 'CONFIRMED' && !b.checkedIn && canShowCheckIn(b.startTime, b.endTime) && (
                  <button
                    onClick={() => checkInBooking(b.id)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                  >
                    Check In Now
                  </button>
                )}

                {b.status === 'CONFIRMED' && b.checkedIn && !b.checkedOut && !isBookingEnded(b.endTime) && (
                  <button
                    onClick={() => checkOutBooking(b.id)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Check Out Now
                  </button>
                )}

                {!b.checkedIn && b.status !== 'CANCELLED' && b.status !== 'NO_SHOW' && b.status !== 'REJECTED' && !isBookingEnded(b.endTime) && (
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === b.id ? null : b.id)
                    }
                    className="text-gray-400 hover:text-gray-700 inline-flex"
                  >
                    <BsThreeDotsVertical className="text-lg cursor-pointer" />
                  </button>
                )}

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
      </div>
      <AlertDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        destructive={confirmDialog.destructive}
        onCancel={closeConfirmDialog}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
}
