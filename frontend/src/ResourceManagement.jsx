import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import AdminLayout from './AdminLayout';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AlertDialog from './components/AlertDialog';
import { FaSpinner } from 'react-icons/fa6';
import { apiUrl } from './api';

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);

  const [editingResource, setEditingResource] = useState(null);
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    creditsPerHour: '',
    isMovable: true
  });

  /* filter */
  const [search, setSearch] = useState('');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [minCredits, setMinCredits] = useState('');
  const [maxCredits, setMaxCredits] = useState('');

  const [isFetching, setIsFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    destructive: false,
    onConfirm: null
  });

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
    setIsFetching(true);
    try {
      const res = await fetch(apiUrl('/api/listAllResources'), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setResources(data);
      setFilteredResources(data);
    } finally {
      setIsFetching(false);
    }
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
      creditsPerHour: resource.creditsPerHour,
      isMovable: Boolean(resource.isMovable)
    });
  };

  const saveEdit = async () => {
    setLoading(true);

    try {
      const res = await fetch(apiUrl(`/api/resources/${editingResource.id}`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            name: form.name,
            quantity: Number(form.quantity),
            creditsPerHour: Number(form.creditsPerHour),
            isMovable: form.isMovable
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEditingResource(null);
      await fetchResources();
      toast.success('Resource updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update resource');
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

  const performToggleResource = async resource => {
    try {
      const res = await fetch(apiUrl(`/api/resources/${resource.id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isActive: !resource.isActive
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update resource status');

      await fetchResources();
      toast.success(resource.isActive ? 'Resource disabled' : 'Resource enabled');
    } catch (err) {
      toast.error(err.message || 'Failed to update resource status');
    }
  };

  const toggleResource = (resource) => {
    const actionText = resource.isActive ? 'Disable' : 'Enable';
    setConfirmDialog({
      open: true,
      title: `${actionText} this resource?`,
      description: `This will ${resource.isActive ? 'hide' : 'show'} the resource for users.`,
      confirmText: actionText,
      destructive: false,
      onConfirm: () => performToggleResource(resource)
    });
  };

  /* ================= DELETE ================= */
  const performDeleteResource = async id => {
    try {
      const res = await fetch(apiUrl(`/api/resources/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete resource');

      await fetchResources();
      toast.success('Resource deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete resource');
    }
  };

  const deleteResource = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete this resource?',
      description: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => performDeleteResource(id)
    });
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Resource Management</title>
      </Helmet>
      <div className="bg-white p-4 sm:p-6 lg:p-10 rounded-2xl shadow-sm border border-gray-300">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold">Resource Management</h2>
            <p className="text-gray-500">
              Manage devices, quantities & credit cost.
            </p>
          </div>

          <Link
            to="/admin/resources/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 whitespace-nowrap self-start sm:self-auto w-full sm:w-auto text-center"
          >
            + Add New Resource
          </Link>
        </div>

        {/* FILTER BAR */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Resource Name
            </label>
            <input
              className="w-full border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
              placeholder="Search by name"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Min Quantity
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
              placeholder="Min Qty"
              value={minQty}
              min={1}
              onChange={e => setMinQty(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Max Quantity
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
              placeholder="Max Qty"
              value={maxQty}
              min={0}
              onChange={e => setMaxQty(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Min Credits
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
              placeholder="Min Credits"
              value={minCredits}
              min={1}
              onChange={e => setMinCredits(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Max Credits
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition text-gray-600 p-2 rounded-xl"
              placeholder="Max Credits"
              value={maxCredits}
              min={0}
              onChange={e => setMaxCredits(e.target.value)}
            />
          </div>
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
                  <p className={`text-xs mt-2 inline-flex items-center rounded-full px-2 py-1 ${resource.isMovable
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                    }`}>
                    {resource.isMovable ? 'Movable' : 'Fixed'}
                  </p>

                  <div className="flex flex-wrap gap-2 sm:gap-4 mt-6">
                    <button
                      onClick={() => startEdit(resource)}
                      className="flex-1 min-w-[110px] bg-indigo-50 text-indigo-700 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-95 cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleResource(resource)}
                      className="flex-1 min-w-[110px] bg-amber-50 text-amber-600 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-amber-600 hover:text-white hover:shadow-lg hover:shadow-amber-200 active:scale-95 cursor-pointer"
                    >
                      Disable
                    </button>

                    <button
                      onClick={() => deleteResource(resource.id)}
                      className="flex-1 min-w-[110px] bg-red-50 text-red-600 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200 active:scale-95 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isFetching && (
            <div className="w-full flex justify-center py-6">
              <FaSpinner className="animate-spin text-slate-400 text-2xl" />
            </div>
          )}

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
                  <p className={`text-xs mt-2 inline-flex items-center rounded-full px-2 py-1 ${resource.isMovable
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
                    }`}>
                    {resource.isMovable ? 'Movable' : 'Fixed'}
                  </p>

                  <div className="flex flex-wrap gap-2 sm:gap-4 mt-6">
                    <button
                      onClick={() => toggleResource(resource)}
                      className="flex-1 min-w-[110px] bg-green-100 text-green-700 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-200 active:scale-95 cursor-pointer"
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => deleteResource(resource.id)}
                      className="flex-1 min-w-[110px] bg-red-50 text-red-600 px-4 py-2 font-medium rounded-xl transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200 active:scale-95 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isFetching && activeResources.length === 0 && inactiveResources.length === 0 && (
            <div className="w-full flex justify-center py-6">
              <p className="text-gray-500">No Data Found</p>
            </div>
          )}

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
              <button onClick={() => setEditingResource(null)} className='cursor-pointer'>X</button>
            </div>

            <div className="p-5">
              <div className="flex flex-col gap-1 mb-2">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Resource Name
                </label>
                <input
                  className="border p-3 w-full rounded-xl active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1 mb-2">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Quantity
                </label>
                <input
                  type="number"
                  className="border p-3 w-full rounded-xl active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
                  value={form.quantity}
                  min={1}
                  onChange={e =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1 mb-2">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Credits Per Hour
                </label>
                <input
                  type="number"
                  className="border p-3 w-full rounded-xl active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
                  value={form.creditsPerHour}
                  min={1}
                  onChange={e =>
                    setForm({ ...form, creditsPerHour: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1 mb-2">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Movable
                </label>
                <select
                  className="border p-3 w-full rounded-xl active:border-blue-800 focus:border-blue-800 focus:ring-1 focus:ring-blue-800 outline-none transition border-gray-300"
                  value={form.isMovable ? 'true' : 'false'}
                  onChange={e =>
                    setForm({ ...form, isMovable: e.target.value === 'true' })
                  }
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
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
