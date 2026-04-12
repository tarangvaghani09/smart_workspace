import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import AlertDialog from './components/AlertDialog';
import { Link } from 'react-router-dom';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'standard',
    capacity: '',
    creditsPerHour: ''
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    destructive: false,
    onConfirm: null
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const modalRef = useRef(null);

  const handleModalOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setEditingRoom(null);
    }
  };

  // Fetch rooms whenever filters change
  useEffect(() => {
    fetchRooms();
  }, [typeFilter, capacityFilter, minPrice, maxPrice, selectedDate, startTime, endTime]);

  const now = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];

  const fetchRooms = async () => {
    const hasStart = Boolean(startTime);
    const hasEnd = Boolean(endTime);

    // While auto-end-time is being filled, do not call API or show error toast.
    if (hasStart !== hasEnd) {
      return;
    }

    const payload = {
      date: selectedDate,
      ...(hasStart && hasEnd ? { startTime, endTime } : {}),
      timezone: 'Asia/Kolkata',
      capacity: capacityFilter ? Number(capacityFilter) : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    };

    try {
      const res = await fetch('http://localhost:3000/api/search/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid time selection');
        setRooms([]);
        return;
      }
      setRooms(Array.isArray(data) ? data : data.rooms || []);
      console.log('Fetched rooms:', data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      toast.error('Something went wrong while searching rooms');
      setRooms([]);
    }
  };

  /* ================= EDIT ================= */
  const startEdit = room => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      creditsPerHour: room.creditsPerHour
    });
  };

  const saveEdit = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:3000/api/rooms/${editingRoom.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            ...form,
            capacity: Number(form.capacity),
            creditsPerHour: Number(form.creditsPerHour)
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEditingRoom(null);
      await fetchRooms();
      toast.success('Room updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  /* ================= TOGGLE ================= */
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false, onConfirm: null }));
  };

  const runConfirmedAction = async () => {
    const action = confirmDialog.onConfirm;
    closeConfirmDialog();
    if (action) {
      await action();
    }
  };

  const performToggleRoom = async room => {
    try {
      const res = await fetch(`http://localhost:3000/api/rooms/${room.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isActive: !room.isActive
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update room status');

      await fetchRooms();
      toast.success(room.isActive ? 'Room disabled' : 'Room enabled');
    } catch (err) {
      toast.error(err.message || 'Failed to update room status');
    }
  };

  const toggleRoom = (room) => {
    const actionText = room.isActive ? 'Disable' : 'Enable';
    setConfirmDialog({
      open: true,
      title: `${actionText} this room?`,
      description: `This will ${room.isActive ? 'hide' : 'show'} the room for users.`,
      confirmText: actionText,
      destructive: false,
      onConfirm: () => performToggleRoom(room)
    });
  };

  /* ================= DELETE ================= */
  const performDeleteRoom = async roomId => {
    try {
      const res = await fetch(`http://localhost:3000/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete room');

      await fetchRooms();
      toast.success('Room deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete room');
    }
  };

  const deleteRoom = (roomId) => {
    setConfirmDialog({
      open: true,
      title: 'Delete this room?',
      description: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => performDeleteRoom(roomId)
    });
  };

  /* ================= SEARCH FILTER ================= */
  const normalizedSearch = search.trim().toLowerCase();

  const filteredRooms = rooms.filter(room => {
    const matchesSearch =
      !normalizedSearch ||
      room.name?.toLowerCase().includes(normalizedSearch);

    const matchesCapacity = !capacityFilter || room.capacity >= Number(capacityFilter);
    const matchesMinPrice = !minPrice || room.creditsPerHour >= Number(minPrice);
    const matchesMaxPrice = !maxPrice || room.creditsPerHour <= Number(maxPrice);
    const matchesType = typeFilter === 'all' || room.type === typeFilter;

    return matchesSearch && matchesCapacity && matchesMinPrice && matchesMaxPrice && matchesType;
  });

  const activeRooms = filteredRooms.filter(r => r.isActive);
  const inactiveRooms = filteredRooms.filter(r => !r.isActive);

  useEffect(() => {
    if (!startTime) return;

    // If endTime missing or invalid
    if (!endTime || endTime <= startTime) {
      const [h, m] = startTime.split(':').map(Number);

      let newHour = h + 1;
      let newMinute = m;

      // Clamp to 17:00 (5 PM)
      if (newHour > 17 || (newHour === 17 && newMinute > 0)) {
        setEndTime('17:00');
        return;
      }

      const paddedHour = String(newHour).padStart(2, '0');
      const paddedMinute = String(newMinute).padStart(2, '0');

      setEndTime(`${paddedHour}:${paddedMinute}`);
    }
  }, [startTime]);

  return (
    <AdminLayout>
      <Helmet>
        <title>Room Management</title>
      </Helmet>
      <div className="bg-white p-4 sm:p-6 lg:p-10 rounded-2xl shadow-sm border border-gray-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Room Management</h2>
          <p className="text-gray-500">Manage rooms, pricing & capacity.</p>
        </div>
        <Link
          to="/admin/rooms/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 self-start sm:self-auto w-full sm:w-auto text-center"
        >
          + Add New Room
        </Link>
      </div>

        {/* FILTER BAR */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
          <input
            className="border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
            placeholder="Search by name"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            className="border p-2 rounded-xl border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 cursor-pointer"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="standard">Standard</option>
            <option value="boardroom">Boardroom</option>
          </select>

          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            max={maxDateString}
            onChange={(e) => setSelectedDate(e.target.value)}
            onFocus={(e) => e.target.showPicker()}
            className="border p-2 text-gray-600 rounded-xl border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition cursor-pointer"
          />

          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            onFocus={(e) => e.target.showPicker()}
            className="border p-2 text-gray-600 rounded-xl border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition cursor-pointer"
          />

          <input
            type="time"
            disabled={!startTime}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            onFocus={(e) => e.target.showPicker()}
            className={`border p-2 text-gray-600 rounded-xl border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition ${!startTime ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          />

          <input
            type="number"
            className="border p-2 rounded-xl border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600"
            placeholder="Min Capacity"
            value={capacityFilter}
            min={1}
            onChange={e => setCapacityFilter(e.target.value)}
          />

          <input
            type="number"
            className="border p-2 rounded-xl border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600"
            placeholder="Min Price"
            value={minPrice}
            min={0}
            onChange={e => setMinPrice(e.target.value)}
          />

          <input
            type="number"
            className="border p-2 rounded-xl border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600"
            placeholder="Max Price"
            value={maxPrice}
            min={0}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </div>

        {/* ROOM CARDS */}
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeRooms.map(room => (
              <div
                key={room.id}
                className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl cursor-pointer transition duration-200"
              >
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <svg className="opacity-10 absolute inset-0 w-full h-full object-cover" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"></path>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)"></rect>
                  </svg>
                  <div className="bg-white/90 px-4 py-2 rounded-full text-sm font-semibold">
                    {room.type === 'boardroom' ? 'Board Room' : 'Standard Room'}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">{room.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                      ₹{room.creditsPerHour}/hr
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    Capacity: {room.capacity}
                  </p>

                  <div className="flex flex-wrap gap-2 sm:gap-4 mt-6">
                    <button
                      onClick={() => startEdit(room)}
                      className="group flex flex-1 min-w-[110px] items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 font-medium rounded-xl transition-all duration-200 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-95 cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleRoom(room)}
                      className="flex-1 min-w-[110px] bg-amber-50 text-amber-600 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-amber-600 hover:text-white hover:shadow-lg hover:shadow-amber-200 active:scale-95 cursor-pointer"
                    >
                      Disable
                    </button>

                    <button
                      onClick={() => deleteRoom(room.id)}
                      className="group flex flex-1 min-w-[110px] items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 font-medium rounded-xl transition-all duration-200 hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-200 active:scale-95 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DIVIDER (only if inactive exist) */}
          {inactiveRooms.length > 0 && (
            <div className="flex items-center gap-4">
              <hr className="flex-1 border-gray-300" />
              <span className="text-sm text-gray-400 font-medium">
                Disabled Rooms
              </span>
              <hr className="flex-1 border-gray-300" />
            </div>
          )}

          {/* INACTIVE ROOMS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {inactiveRooms.map(room => (
              <div
                key={room.id}
                className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl cursor-pointer transition duration-200"
              >
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <svg className="opacity-10 absolute inset-0 w-full h-full object-cover" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"></path>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)"></rect>
                  </svg>
                  <div className="bg-white/90 px-4 py-2 rounded-full text-sm font-semibold">
                    {room.type === 'boardroom' ? 'Board Room' : 'Standard Room'}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">{room.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                      ₹{room.creditsPerHour}/hr
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    Capacity: {room.capacity}
                  </p>

                  <div className="flex flex-wrap gap-2 sm:gap-4 mt-6">
                    <button
                      onClick={() => toggleRoom(room)}
                      className="group flex flex-1 min-w-[110px] items-center justify-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 font-medium rounded-xl transition-all duration-200 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-200 active:scale-95 cursor-pointer"
                    >
                      Enable
                    </button>

                    <button
                      onClick={() => deleteRoom(room.id)}
                      className="group flex flex-1 min-w-[110px] items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 font-medium rounded-xl transition-all duration-200 hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-200 active:scale-95 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <p className="text-gray-500">No rooms found.</p>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 cursor-pointer" onMouseDown={handleModalOutsideClick}>
          <div ref={modalRef} className="bg-white w-[420px] rounded-2xl shadow-lg overflow-hidden cursor-default">
            <div className="bg-blue-600 p-5 text-white flex justify-between">
              <div>
                <h2 className="font-bold text-lg">Edit Room</h2>
                <p className="text-sm opacity-90">
                  Update room details and pricing.
                </p>
              </div>
              <button onClick={() => setEditingRoom(null)} className="cursor-pointer text-lg">✕</button>
            </div>
            <div className="p-5">
              <input
                className="border p-3 w-full mb-2 rounded-xl border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="number"
                className="border p-3 w-full mb-2 rounded-xl border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
                value={form.capacity}
                min={1}
                onChange={e => setForm({ ...form, capacity: e.target.value })}
              />
              <input
                type="number"
                className="border p-3 w-full mb-2 rounded-xl border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
                value={form.creditsPerHour}
                min={0}
                onChange={e => setForm({ ...form, creditsPerHour: e.target.value })}
              />
              <select
                className="border p-3 w-full mb-2 rounded-xl border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition cursor-pointer"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="boardroom">Boardroom</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 p-5">
              <button
                onClick={() => setEditingRoom(null)}
                className="px-4 py-2 text-sm cursor-pointer rounded-xl font-semibold border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={loading}
                className={`px-5 py-2 rounded-xl font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors'}`}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      <AlertDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        destructive={confirmDialog.destructive}
        onCancel={closeConfirmDialog}
        onConfirm={runConfirmedAction}
      />
    </AdminLayout>
  );
}
