import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';

function getApiErrorMessage(data, fallback) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors
      .map(item => item?.message || item?.field)
      .filter(Boolean)
      .join(' | ');
  }

  return data?.error || data?.message || fallback;
}

export default function AddResource() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [creditsPerHour, setCreditsPerHour] = useState('');
  const [isMovable, setIsMovable] = useState('');

  const handleSubmit = async () => {
    if (!name || !quantity || !creditsPerHour || isMovable === '') {
      toast.error('Resource name, quantity, credits per hour and movable selection are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          quantity: Number(quantity),
          creditsPerHour: Number(creditsPerHour),
          isMovable: isMovable === 'true'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, 'Failed to create resource'));
      }

      toast.success('Resource created successfully');
      setName('');
      setQuantity('');
      setCreditsPerHour('');
      setIsMovable('');
    } catch (err) {
      toast.error(err.message || 'Failed to create resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Add Resource</title>
      </Helmet>
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-300 max-w-xl">
        <h2 className="text-2xl font-bold mb-4">Add New Resource</h2>

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

        <select
          className="border p-3 w-full mb-3 rounded-xl border-gray-300 text-gray-600 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition"
          value={isMovable}
          onChange={e => setIsMovable(e.target.value)}
        >
          <option value="">Movable</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 mt-2 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition-colors duration-75"
        >
          {loading ? 'Saving...' : 'Save Resource'}
        </button>
      </div>
    </AdminLayout>
  );
}
