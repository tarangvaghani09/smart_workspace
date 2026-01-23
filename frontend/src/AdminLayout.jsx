import Navbar from './Navbar';
import { Link, useLocation } from 'react-router-dom';
import React from 'react';

export default function AdminLayout({ children }) {
  const location = useLocation();

  const isRouteActive = path =>
    location.pathname === path ||
    location.pathname.startsWith(path + '/');

  const tabClass = path =>
    isRouteActive(path)
      ? 'bg-white shadow px-4 py-2 rounded-lg font-medium'
      : 'text-gray-500 px-4 py-2 rounded-lg hover:bg-white hover:shadow';

  return (
    <>
      {/* <Navbar /> */}



      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Control Center
          </h1>
          <p className="text-gray-500">
            Manage workspace resources and team permissions.
          </p>
        </div>

        <Link
          to="/admin/rooms/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
        >
          + Add New Room
        </Link>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        <Link to="/admin/approvals" className={tabClass('/admin/approvals')}>
          Booking Approvals
        </Link>
        <Link to="/admin/bookings/department" className={tabClass('/admin/bookings/department')}>
          Department Bookings
        </Link>
        <Link to="/admin/rooms" className={tabClass('/admin/rooms')}>
          Room Management
        </Link>
        <Link to="/admin/resources" className={tabClass('/admin/resources')}>
          Resource Management
        </Link>
        <Link to="/admin/requests" className={tabClass('/admin/requests')}>
          Admin Requests
        </Link>
        <Link to="/admin/users" className={tabClass('/admin/users')}>
          User Management
        </Link>
      </div>

      {/* TAB CONTENT */}
      {children}


    </>
  );
}
