import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

export default function AddRoom() {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [type, setType] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creditsPerHour, setCreditsPerHour] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!name || !capacity || !creditsPerHour) {
      setError('Room name, capacity and price are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('https://localhost:3000/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          capacity: Number(capacity),
          type,
          creditsPerHour: Number(creditsPerHour)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      setSuccess('Room created successfully');
      setName('');
      setCapacity('');
      setCreditsPerHour('');
      setType('standard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-300 max-w-xl">
        <h2 className="text-2xl font-bold mb-4">Add New Room</h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}
        {success && <p className="text-green-600 mb-3">{success}</p>}

        <input
          className="border p-3 w-full mb-3 rounded-xl border-gray-300 text-gray-600 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
          placeholder="Room Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <input
          type="number"
          className="border p-3 w-full mb-3 rounded-xl border-gray-300 text-gray-600 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
          placeholder="Capacity"
          min={1}
          value={capacity}
          onChange={e => setCapacity(e.target.value)}
        />

        <input
          type="number"
          className="border p-3 w-full mb-3 rounded-xl border-gray-300 text-gray-600 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
          placeholder="Credits per hour"
          value={creditsPerHour}
          min={0}
          onChange={e => setCreditsPerHour(e.target.value)}
        />

        <select
          className="border p-3 w-full mb-4 rounded-xl border-gray-300 text-gray-600 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition cursor-pointer"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="standard">Standard</option>
          <option value="boardroom">Boardroom</option>
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 mt-2 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition-colors duration-75"
        >
          {loading ? 'Saving...' : 'Save Room'}
        </button>
      </div>
    </AdminLayout>
  );
}
