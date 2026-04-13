import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { FaInbox, FaLock, FaSpinner } from 'react-icons/fa6';
import { useAuth } from './AuthContext';
import BookingListHomePage from './BookingListHomePage';
import { apiUrl } from './api';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [credits, setCredits] = useState({ availableCredits: 0, lockedCredits: 0 });
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    setBookingsLoading(true);
    fetch(apiUrl('/api/bookings'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [token]);

  useEffect(() => {
    setCreditsLoading(true);
    fetch(apiUrl('/api/credits'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCredits(data))
      .catch(() => setCredits({ availableCredits: 0, lockedCredits: 0 }))
      .finally(() => setCreditsLoading(false));
  }, [token]);

  const now = new Date();

  const confirmedBookings = bookings.filter(b => {
    if (b.status !== 'CONFIRMED') return false;
    if (b.checkedOut) return false;
    if (b.status === 'CANCELLED') return false;
    if (b.status === 'NO_SHOW') return false;

    const start = new Date(b.startTime);
    return (
      start >= now &&
      start.getMonth() === now.getMonth() &&
      start.getFullYear() === now.getFullYear()
    );
  });

  const upNext = bookings
    .filter(b => {
      if (b.status !== 'CONFIRMED') return false;
      if (b.checkedOut) return false;
      if (b.status === 'CANCELLED') return false;
      if (b.status === 'NO_SHOW') return false;

      const start = new Date(b.startTime);
      const end = new Date(b.endTime);

      return start > now && end > now;
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];

  const getResourceNames = (booking) => {
    if (!booking?.Resources?.length) return '-';
    return booking.Resources.map((r) =>
      `${r.name}${r.BookingResource?.quantity > 1 ? ` x ${r.BookingResource.quantity}` : ''}`
    ).join(', ');
  };

  const getUpNextLabel = (booking) => {
    const roomName = booking?.Room?.name || booking?.Rooms?.[0]?.name || '-';
    const resourceNames = getResourceNames(booking);

    if (booking?.bookingType === 'RESOURCE') {
      return `Resource: ${resourceNames}`;
    }
    if (booking?.bookingType === 'ROOM_RESOURCE') {
      return `Room + Resource: ${roomName} | ${resourceNames}`;
    }
    return `Room: ${roomName}`;
  };

  console.log('Confirmed bookings:', confirmedBookings.length);
  console.log('Up next booking:', upNext);

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">
            Welcome back, <span className="capitalize">{user?.name || 'User'}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg text-slate-500">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <Link
          to="/search"
          className="bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <span className="text-xl">+</span>
          New Booking
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-slate-500 font-medium text-muted-foreground uppercase tracking-wider">Available Credits</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-credit-card h-4 w-4 text-accent"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900">{creditsLoading ? <FaSpinner className="animate-spin text-slate-400" /> : credits.availableCredits}</div>
          <p className="text-xs text-slate-500 text-muted-foreground mt-1">Refreshes on the 1st of next month</p>
          {credits.lockedCredits > 0 && (
            <p className="text-xs text-amber-600 font-medium mt-2 inline-flex items-center gap-1">
              <FaLock className="text-[11px]" />
              {credits.lockedCredits} locked in pending
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-slate-500 font-medium text-muted-foreground uppercase tracking-wider">Upcoming Events</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar h-4 w-4 text-primary"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900">  {bookingsLoading ? <FaSpinner className="animate-spin text-slate-400" /> : confirmedBookings ? confirmedBookings.length : 0}</div>
          {/* {bookings.length} */}
          <p className="text-xs text-slate-500 text-muted-foreground mt-1">Scheduled for this month</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-blue-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            {/* left border */}
            {/* border-l-4 border-l-indigo-500 */}
            <span className="text-sm font-medium text-primary uppercase tracking-wider text-blue-700">Department</span>
            <div class="h-4 w-4 rounded-full bg-primary/20"></div>
          </div>
          <div className="text-2xl font-display font-bold text-slate-900 truncate">{user?.department?.name || '-'}</div>
          <p className="text-xs text-primary/80 mt-1 font-medium text-blue-700">Standard Allocation</p>
        </div>

      </div>

      {/* Featured "Up Next" Gradient Card */}
      <div className="mb-10 relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-900/20 p-6 sm:p-8 md:p-10">
        <div className="relative z-10">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-medium backdrop-blur-md border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="green" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Up Next</span>
            </div>

            <div className="sm:text-right">
              <p className="text-slate-400 text-xs sm:text-sm">Status</p>
              <p className="font-bold uppercase tracking-wide text-yellow-400 text-sm sm:text-base">
                {upNext ? upNext.status : 'No Upcoming Bookings'}
              </p>
            </div>
          </div>

          {/* BODY */}
          {bookingsLoading ? (
            <>
              <h2 className="text-xl text-slate-300 font-semibold text-center mt-10">
                <FaSpinner className="inline-block animate-spin text-slate-400" />
              </h2>
            </>
          ) : upNext ? (
            <>
              <h2 className="text-slate-400 mt-2 text-lg">
                {new Date(upNext.startTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}{' '}
                at{' '}
                {new Date(upNext.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </h2>

              <p className="mt-5 flex items-center gap-2 text-sm text-slate-300">
                <span className="w-2 h-2 rounded-full bg-green-600"></span>
                {getUpNextLabel(upNext)}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl text-slate-300 font-semibold text-center mt-10 inline-flex items-center justify-center gap-2">
                <FaInbox className="text-slate-400" />
                No Data Found
              </h2>
              <p className="text-sm text-slate-400 text-center mt-2">
                Your next confirmed booking will appear here.
              </p>
            </>
          )}
        </div>

        {/* Background Decorative Element */}
        <div className="absolute right-[-5%] top-[-20%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>


      {/* Schedule List Section */}
      <section>
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-xl font-display font-bold text-slate-900">Your Schedule</h3>
          <Link
            to="/bookings"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <BookingListHomePage />
        </div>
      </section>

    </>
  );
}

