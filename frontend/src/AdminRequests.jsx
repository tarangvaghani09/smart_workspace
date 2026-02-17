import AdminLayout from './AdminLayout';
import React from 'react';
import { Helmet } from 'react-helmet';

export default function AdminRequests() {
  return (
    <AdminLayout>
      <Helmet>
        <title>Admin Requests</title>
      </Helmet>
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-300">
        <h2 className="text-xl font-bold mb-2">Admin Requests</h2>
        <p className="text-gray-500">Handle special admin access requests.</p>
      </div>
    </AdminLayout>
  );
}
