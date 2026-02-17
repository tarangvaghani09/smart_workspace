import AdminLayout from './AdminLayout';
import React from 'react';
import { Helmet } from 'react-helmet';

export default function UserManagement() {
  return (
    <AdminLayout>
      <Helmet>
        <title>User Management</title>
      </Helmet>
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-300">
        <h2 className="text-xl font-bold mb-2">User Management</h2>
        <p className="text-gray-500">Manage users and roles.</p>
      </div>
    </AdminLayout>
  );
}
