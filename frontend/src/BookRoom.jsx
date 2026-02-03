import React, { useEffect, useState, useRef } from 'react';

export default function BookRoom({ room = null, onClose }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(false);

  const [recurrenceType, setRecurrenceType] = useState('ONE_TIME');
  const [weeks, setWeeks] = useState(4);

  const [bookingTarget, setBookingTarget] = useState(
    room ? 'ROOM' : 'DEVICE'
  );

  const [allResources, setAllResources] = useState([]);
  const [resources, setResources] = useState([]);

  const [credits, setCredits] = useState({
    availableCredits: 0,
    lockedCredits: 0
  });

  const modalRef = useRef(null);
  const token = localStorage.getItem('token');

  // date helper 
  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];
  const isToday = date === todayDate;
  const minTime = isToday ? today.toTimeString().slice(0, 5) : '00:00';

  // max date (1 year) 
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // close overlay
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // fetch credit 
  useEffect(() => {
    fetch('https://localhost/api/credits', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setCredits)
      .catch(() =>
        setCredits({ availableCredits: 0, lockedCredits: 0 })
      );
  }, [token]);

  // fetch resource 
  useEffect(() => {
    fetch('https://localhost/api/resources', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setAllResources)
      .catch(() => setAllResources([]));
  }, [token]);

  // room credits
  const roomCredits =
    bookingTarget !== 'DEVICE' && room
      ? room.creditsPerHour * hours
      : 0;

  // resource credits
  const deviceCredits = resources.reduce((sum, r) => {
    const resource = allResources.find(x => x.id === r.resourceId);
    if (!resource) return sum;

    return (
      sum +
      resource.creditsPerHour *
      r.quantity *
      hours
    );
  }, 0);

  const multiplier = recurrenceType === 'WEEKLY' ? weeks : 1;

  const estimatedCredits =
    (roomCredits + deviceCredits) * multiplier;

  const insufficientCredits =
    bookingTarget !== 'DEVICE' &&
    credits.availableCredits < estimatedCredits;

  const submit = async () => {
    if (!title || !date || !start) {
      alert('❌ Please fill all fields');
      return;
    }

    if (
      bookingTarget !== 'ROOM' &&
      resources.length === 0
    ) {
      alert('❌ Select at least one device');
      return;
    }

    if (
      bookingTarget !== 'DEVICE' &&
      insufficientCredits
    ) {
      alert('❌ Not enough credits');
      return;
    }

    setLoading(true);

    try {
      const startLocal = new Date(`${date}T${start}:00`);
      const endLocal = new Date(startLocal);
      endLocal.setHours(endLocal.getHours() + Number(hours));

      const payload = {
        title,
        startTime: startLocal.toISOString(),
        endTime: endLocal.toISOString(),
        recurrenceType,
        weeks: recurrenceType === 'WEEKLY' ? weeks : 1
      };

      if (bookingTarget !== 'DEVICE') {
        payload.roomId = room.id;
      }

      if (bookingTarget !== 'ROOM') {
        payload.resources = resources;
      }

      const res = await fetch(
        'https://localhost/api/bookings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // check status of first booking
      const status = data.bookings?.[0]?.status;

      if (status === 'PENDING') {
        alert('⏳ Booking request sent for approval');
      } else {
        alert('✅ Booking confirmed successfully');
      }
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-[440px] max-h-[90vh] rounded-2xl shadow-lg overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="bg-blue-600 p-5 text-white flex justify-between">
          <div>
            <h2 className="font-bold text-lg">
              {room ? `Book ${room.name}` : 'Book Device'}
            </h2>
            <p className="text-sm opacity-90">
              Reserve room or devices
            </p>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 overflow-y-auto">

          <input
            className="border p-3 rounded-xl w-full active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
            placeholder="Event title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              min={todayDate}
              max={maxDateString}
              className="border p-3 rounded-xl active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300 cursor-pointer"
              onChange={e => setDate(e.target.value)}
              onFocus={(e) => e.target.showPicker()}
            />
            <input
              type="time"
              min={minTime}
              className="border p-3 rounded-xl active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300 cursor-pointer"
              onChange={e => setStart(e.target.value)}
              onFocus={(e) => e.target.showPicker()}
            />
          </div>

          <select
            value={bookingTarget}
            onChange={e => setBookingTarget(e.target.value)}
            className="border p-3 rounded-xl w-full active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300 cursor-pointer"
          >
            {room && <option value="ROOM">Room Only</option>}
            <option value="DEVICE">Device Only</option>
            {room && <option value="BOTH">Room + Device</option>}
          </select>

          <select
            value={recurrenceType}
            onChange={e => setRecurrenceType(e.target.value)}
            className="border p-3 rounded-xl w-full active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300 cursor-pointer"
          >
            <option value="ONE_TIME">One Time</option>
            <option value="WEEKLY">Weekly</option>
          </select>

          {recurrenceType === 'WEEKLY' && (
            <select
              value={weeks}
              onChange={e => setWeeks(Number(e.target.value))}
              className="border p-3 rounded-xl w-full active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300 cursor-pointer"
            >
              <option value={2}>2 Weeks</option>
              <option value={4}>4 Weeks</option>
              <option value={5}>5 Weeks</option>
              <option value={8}>8 Weeks</option>
            </select>
          )}

          <select
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            className="border p-3 rounded-xl w-full active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300 cursor-pointer"
          >
            {[1, 2, 3, 4].map(h => (
              <option key={h} value={h}>{h} Hour</option>
            ))}
          </select>

          {bookingTarget !== 'ROOM' && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Devices</p>

              {allResources.map(r => {
                const selected = resources.find(
                  x => x.resourceId === r.id
                );

                return (
                  <div
                    key={r.id}
                    className="flex justify-between items-center border rounded-xl p-3 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
                  >
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-gray-500">
                        {r.creditsPerHour} credits / hour
                      </p>
                      {selected && (
                        <p className="text-xs text-blue-600">
                          Total: {r.creditsPerHour * selected.quantity * hours} credits
                        </p>
                      )}
                    </div>

                    <input
                      type="number"
                      min={0}
                      max={r.quantity}
                      value={selected?.quantity || 0}
                      onChange={e => {
                        const qty = Number(e.target.value);
                        setResources(prev => {
                          const rest = prev.filter(
                            x => x.resourceId !== r.id
                          );
                          if (qty === 0) return rest;
                          return [...rest, { resourceId: r.id, quantity: qty }];
                        });
                      }}
                      className="w-20 border rounded-lg p-1 text-center active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* <div className="sticky bottom-0 bg-white pt-4 space-y-4"> */}
          <div className="bg-gray-50 p-4 rounded-xl flex justify-between">
            <div>
              <p className="text-xs">Estimated Credits</p>
              <p className="font-bold text-blue-600">
                {estimatedCredits}
              </p>
            </div>
            <div className='flex flex-col items-end'>
              <p className="text-xs">Balance</p>
              <p className="font-bold">
                {credits.availableCredits}
              </p>
              <p className="text-xs text-amber-600">🔒 {credits.lockedCredits} locked in pending
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm cursor-pointer rounded-xl font-semibold border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading || insufficientCredits}
              className={`px-5 py-2 rounded-xl font-semibold text-white ${loading || insufficientCredits
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors'
                }`}
            >
              {insufficientCredits
                ? 'Not enough credits'
                : loading
                  ? 'Booking...'
                  : 'Confirm'}
            </button>
          </div>
          {/* </div> */}
        </div>
      </div>
    </div>
  );
}
