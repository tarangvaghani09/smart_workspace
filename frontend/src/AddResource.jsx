import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

export default function AddResource() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creditsPerHour, setCreditsPerHour] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!name || !quantity || !creditsPerHour) {
      setError('Resource name, quantity and credits per hour are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('https://localhost:3000/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          quantity: Number(quantity),
          creditsPerHour: Number(creditsPerHour)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create resource');
      }

      setSuccess('Resource created successfully');
      setName('');
      setQuantity('');
      setCreditsPerHour('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-300 max-w-xl">
        <h2 className="text-2xl font-bold mb-4">Add New Resource</h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}
        {success && <p className="text-green-600 mb-3">{success}</p>}

        <input
          className="border p-3 w-full mb-3 rounded-xl border-gray-300 text-gray-600 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
          placeholder="Resource Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <input
          type="number"
          className="border p-3 w-full mb-3 rounded-xl border-gray-300 text-gray-600 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
          placeholder="Quantity"
          min={1}
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
        />

        <input
          type="number"
          className="border p-3 w-full mb-3 rounded-xl border-gray-300 text-gray-600 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
          placeholder="Credits per hour"
          value={creditsPerHour}
          min={0}
          onChange={e => setCreditsPerHour(e.target.value)}
        />

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
