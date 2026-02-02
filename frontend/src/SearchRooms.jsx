import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import BookRoom from './BookRoom';
import moment from 'moment-timezone';

export default function SearchRooms() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [error, setError] = useState('');
  // filters (existing)
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [capacity, setCapacity] = useState('');

  // NEW filters (added without removing anything)
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // fetch rooms whenever backend-related filters change
  useEffect(() => {
    fetchRooms();
  }, [date, startTime, endTime]);

  // apply frontend filters
  useEffect(() => {
    applyFilters();
  }, [search, type, capacity, rooms]);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];

  useEffect(() => {
    if (!startTime) return;

    // Convert startTime (hh:mm A) to moment
    const start = moment(startTime, 'hh:mm A');

    // If endTime missing OR endTime <= startTime
    if (
      !endTime ||
      moment(endTime, 'hh:mm A').isSameOrBefore(start)
    ) {
      let autoEnd = start.clone().add(1, 'hour');

      // Clamp to 5:00 PM
      const officeEnd = moment('5:00 PM', 'h:mm A');
      if (autoEnd.isAfter(officeEnd)) {
        autoEnd = officeEnd;
      }

      setEndTime(autoEnd.format('hh:mm A'));
    }
  }, [startTime]);
  const fetchRooms = async () => {

    const payload = {
      date,
      capacity: capacity ? Number(capacity) : undefined,
      timezone: moment.tz.guess(),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
    };

    try {
      const res = await fetch('https://localhost/api/search/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // BACKEND ERROR HANDLING
      if (!res.ok) {
        setError(data.error || 'Invalid time selection');
        setRooms([]);
        setFilteredRooms([]);
        return;
      }
      setError('');
      setRooms(Array.isArray(data) ? data : []);
      setFilteredRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Something went wrong while searching rooms');
      setRooms([]);
      setFilteredRooms([]);
    }
  };

  const applyFilters = () => {
    let data = [...rooms];

    if (search) {
      data = data.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type !== 'all') {
      data = data.filter(r => r.type === type);
    }

    if (capacity) {
      data = data.filter(r => r.capacity >= Number(capacity));
    }

    setFilteredRooms(data);
  };

  return (
    <>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">
            Search Rooms
          </h1>
          <p className="text-muted-foreground mt-1 text-slate-400">
            Find available rooms based on your needs
          </p>
        </div>

        {/* SEARCH INPUT */}
        <input
          type="text"
          placeholder="Search rooms..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-xl border-gray-300 text-gray-600 px-4 py-2 w-72 shadow-sm focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
        />
      </div>

      <div className="flex gap-6">
        {/* LEFT FILTER SIDEBAR */}
        <aside className="w-64 bg-white rounded-2xl shadow p-5 h-fit sticky top-6">
          <h3 className="font-bold mb-4 text-gray-600">Filters</h3>

          {/* DATE */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500">DATE</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              max={maxDateString}
              onChange={e => setDate(e.target.value)}
              onFocus={e => e.target.showPicker()}
              className="mt-1 w-full border p-2 rounded-xl text-gray-600 border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none cursor-pointer transition"
            />
          </div>

          {/* START TIME */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500">
              START TIME
            </label>
            <input
              type="time"
              value={startTime ? moment(startTime, 'hh:mm A').format('HH:mm') : ""}
              onChange={e =>
                setStartTime(
                  e.target.value ? moment(e.target.value, 'HH:mm').format('hh:mm A') : ""
                )
              }
              onFocus={e => e.target.showPicker()}
              className="mt-1 w-full border p-2 rounded-xl text-gray-600 border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none cursor-pointer transition"
            />
          </div>

          {/* END TIME */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500">
              END TIME
            </label>
            <input
              type="time"
              disabled={!startTime}
              value={endTime ? moment(endTime, 'hh:mm A').format('HH:mm') : ""}
              onChange={e =>
                setEndTime(
                  e.target.value ? moment(e.target.value, 'HH:mm').format('hh:mm A') : ""
                )
              }
              onFocus={e => e.target.showPicker()}
              className={`mt-1 w-full border p-2 rounded-xl text-gray-600 border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition ${!startTime ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            />
          </div>

          {/* ROOM TYPE */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500">
              ROOM TYPE
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="mt-1 w-full border rounded-xl border-gray-300 text-gray-600 p-2 cursor-pointer focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
            >
              <option value="all">All</option>
              <option value="standard">Standard</option>
              <option value="boardroom">Boardroom</option>
            </select>
          </div>

          {/* CAPACITY */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500">
              MIN CAPACITY
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              className="mt-1 w-full border rounded-xl border-gray-300 text-gray-600 p-2 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
            />
          </div>
        </aside>

        {error && (
          <div className="mb-4 p-3 w-full flex items-center justify-center rounded-xl bg-white text-red-700 text-lg">
            {error}
          </div>
        )}

        {/* ROOM CARDS */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {filteredRooms?.map(room => (
            <div
              key={room.id}
              className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl cursor-pointer transition duration-200"
            >
              <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                <svg className="opacity-10 absolute inset-0 w-full h-full object-cover" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"></path>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)"></rect>
                </svg>
                <div className="z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-sm font-semibold tracking-wide text-foreground">
                  {room.type === 'boardroom'
                    ? 'Boardroom'
                    : 'Standard Room'}
                </div>
              </div>

              <div className="mt-4 p-5">
                <div className="flex justify-between">
                  <h3 className="font-bold">{room.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                    ₹{room.creditsPerHour}/hr
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Capacity: {room.capacity}
                </p>

                <button
                  onClick={() => setSelectedRoom(room)}
                  className="mt-5 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none border border-primary min-h-9 px-4 w-full bg-slate-900 hover:bg-primary text-white shadow-lg rounded-xl py-6 transition-all duration-300 cursor-pointer"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}

          {!error && filteredRooms?.length === 0 && (
            <p className="text-gray-500">No rooms found.</p>
          )}
        </div>
      </div>

      {/* BOOK MODAL */}
      {selectedRoom && (
        <BookRoom
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </>
  );
}
