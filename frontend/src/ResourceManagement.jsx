import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { Link } from 'react-router-dom';

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);

  const [editingResource, setEditingResource] = useState(null);
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    creditsPerHour: ''
  });

  /* filter */
  const [search, setSearch] = useState('');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [minCredits, setMinCredits] = useState('');
  const [maxCredits, setMaxCredits] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeResources = filteredResources.filter(r => r.isActive);
  const inactiveResources = filteredResources.filter(r => !r.isActive);

  const modalRef = useRef(null);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, minQty, maxQty, minCredits, maxCredits, resources]);

  const fetchResources = async () => {
    const res = await fetch('https://localhost/api/listAllResources', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();
    setResources(data);
    setFilteredResources(data);
  };

  const applyFilters = () => {
    let data = [...resources];

    const normalizedSearch = search.trim().toLowerCase();

    if (normalizedSearch !== '') {
      data = data.filter(r =>
        r.name?.toLowerCase().includes(normalizedSearch)
      );
    }

    if (minQty) {
      data = data.filter(r => r.quantity >= Number(minQty));
    }

    if (maxQty) {
      data = data.filter(r => r.quantity <= Number(maxQty));
    }

    if (minCredits) {
      data = data.filter(r => r.creditsPerHour >= Number(minCredits));
    }

    if (maxCredits) {
      data = data.filter(r => r.creditsPerHour <= Number(maxCredits));
    }

    setFilteredResources(data);
  };

  /* ================= EDIT ================= */
  const startEdit = resource => {
    setEditingResource(resource);
    setForm({
      name: resource.name,
      quantity: resource.quantity,
      creditsPerHour: resource.creditsPerHour
    });
  };

  const saveEdit = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `https://localhost/api/resources/${editingResource.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            name: form.name,
            quantity: Number(form.quantity),
            creditsPerHour: Number(form.creditsPerHour)
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEditingResource(null);
      fetchResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= TOGGLE ================= */
  const toggleResource = async resource => {
    if (!window.confirm(`${resource.isActive ? 'Disable' : 'Enable'} this resource?`)) return;

    await fetch(`https://localhost/api/resources/${resource.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        isActive: !resource.isActive
      })
    });

    fetchResources();
  };

  /* ================= DELETE ================= */
  const deleteResource = async id => {
    if (!window.confirm('Delete this resource?')) return;

    await fetch(`https://localhost/api/resources/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    fetchResources();
  };

  return (
    <AdminLayout>
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-300">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Resource Management</h2>
            <p className="text-gray-500">
              Manage devices, quantities & credit cost.
            </p>
          </div>

          <Link
            to="/admin/resources/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 whitespace-nowrap"
          >
            + Add New Resource
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

          <input
            type="number"
            className="border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
            placeholder="Min Qty"
            value={minQty}
            min={1}
            onChange={e => setMinQty(e.target.value)}
          />

          <input
            type="number"
            className="border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
            placeholder="Max Qty"
            value={maxQty}
            min={0}
            onChange={e => setMaxQty(e.target.value)}
          />

          <input
            type="number"
            className="border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
            placeholder="Min Credits"
            value={minCredits}
            min={1}
            onChange={e => setMinCredits(e.target.value)}
          />

          <input
            type="number"
            className="border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
            placeholder="Max Credits"
            value={maxCredits}
            min={0}
            onChange={e => setMaxCredits(e.target.value)}
          />
        </div>

        {/* RESOURCE CARDS */}
        <div className="space-y-10">

          {/* ACTIVE RESOURCES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeResources.map(resource => (
              <div
                key={resource.id}
                className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl cursor-pointer transition duration-200"
              >
                <div className="h-32 bg-slate-100 flex items-center justify-center">
                  <span className="text-lg font-semibold">
                    {resource.name}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-sm text-gray-500">
                    Quantity: {resource.quantity}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Credits: {resource.creditsPerHour}/hr
                  </p>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => startEdit(resource)}
                      className="flex-1 bg-indigo-50 text-indigo-700 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-95 cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleResource(resource)}
                      className="flex-1 bg-amber-50 text-amber-600 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-amber-600 hover:text-white hover:shadow-lg hover:shadow-amber-200 active:scale-95 cursor-pointer"
                    >
                      Disable
                    </button>

                    <button
                      onClick={() => deleteResource(resource.id)}
                      className="flex-1 bg-red-50 text-red-600 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200 active:scale-95 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DIVIDER (only if inactive exist) */}
          {inactiveResources.length > 0 && (
            <div className="flex items-center gap-4">
              <hr className="flex-1 border-gray-300" />
              <span className="text-sm text-gray-400 font-medium">
                Disabled Resources
              </span>
              <hr className="flex-1 border-gray-300" />
            </div>
          )}

          {/* INACTIVE RESOURCES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {inactiveResources.map(resource => (
              <div
                key={resource.id}
                className="border border-gray-200 rounded-2xl overflow-hidden"
              >
                <div className="h-32 bg-slate-100 flex items-center justify-center">
                  <span className="text-lg font-semibold">
                    {resource.name}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-sm text-gray-500">
                    Quantity: {resource.quantity}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Credits: {resource.creditsPerHour}/hr
                  </p>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => toggleResource(resource)}
                      className="flex-1 bg-green-100 text-green-700 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-200 active:scale-95 cursor-pointer"
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => deleteResource(resource.id)}
                      className="flex-1 bg-red-50 text-red-600 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200 active:scale-95 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* EDIT MODAL */}
      {editingResource && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onMouseDown={e => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
              setEditingResource(null);
            }
          }}
        >
          <div ref={modalRef} className="bg-white w-[420px] rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-blue-600 p-5 text-white flex justify-between">
              <div>
                <h2 className="font-bold text-lg">Edit Resource</h2>
                <p className="text-sm opacity-90">
                  Update resource details and credits.
                </p>
              </div>
              <button onClick={() => setEditingResource(null)} className='cursor-pointer'>✕</button>
            </div>

            <div className="p-5">
              {error && <p className="text-red-600">{error}</p>}

              <input
                className="border p-3 w-full mb-2 rounded-xl active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />

              <input
                type="number"
                className="border p-3 w-full mb-2 rounded-xl active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
                value={form.quantity}
                min={1}
                onChange={e =>
                  setForm({ ...form, quantity: e.target.value })
                }
              />

              <input
                type="number"
                className="border p-3 w-full mb-2 rounded-xl active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
                value={form.creditsPerHour}
                min={1}
                onChange={e =>
                  setForm({ ...form, creditsPerHour: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-3 p-5">
              <button
                onClick={() => setEditingResource(null)}
                className="px-4 py-2 text-sm cursor-pointer rounded-xl font-semibold border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                disabled={loading}
                className={`px-5 py-2 rounded-xl font-semibold text-white ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors'
                  }`}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
