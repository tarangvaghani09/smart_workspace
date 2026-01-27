import React from 'react';

export default function BookingForm() {
  const token = localStorage.getItem('token');

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      title: e.target.title.value,
      roomId: Number(e.target.roomId.value),
      startTime: new Date(`${e.target.date.value}T${e.target.start.value}:00+05:30`).toISOString(),
      endTime: new Date(`${e.target.date.value}T${e.target.end.value}:00+05:30`).toISOString()
    };

    const res = await fetch('https://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (!res.ok) { alert('Booking failed'); return; }
    alert('Booking created successfully');
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Reserve Room</h2>
          <p className="text-indigo-100 text-sm mt-1 opacity-80">Quickly schedule your next session.</p>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500 rounded-full opacity-50"></div>
      </div>

      <form onSubmit={submit} className="p-8 space-y-6">
        <div>
          <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Meeting Title</label>
          <input name="title" placeholder="What's the occasion?" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300 font-medium" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Room Number</label>
            <input name="roomId" type="number" placeholder="ID" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" required />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Date</label>
            <input name="date" type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Start Time</label>
            <input name="start" type="time" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" required />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">End Time</label>
            <input name="end" type="time" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" required />
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 py-4 font-black text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all transform active:scale-[0.98] mt-4">
          Confirm Booking
        </button>
      </form>
    </div>
  );
}