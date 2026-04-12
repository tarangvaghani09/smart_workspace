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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Admin Control Center
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Manage workspace resources and team permissions.
          </p>
        </div>

      </div>

      {/* TABS */}
      <div className="flex sm:flex-nowrap gap-2 mb-6 overflow-x-auto -mx-4 px-4 pb-2 whitespace-nowrap">
        <Link to="/admin/approvals" className={`${tabClass('/admin/approvals')} shrink-0`}>
          Booking Approvals
        </Link>
        <Link to="/admin/bookings/department" className={`${tabClass('/admin/bookings/department')} shrink-0`}>
          Department Bookings
        </Link>
        <Link to="/admin/rooms" className={`${tabClass('/admin/rooms')} shrink-0`}>
          Room Management
        </Link>
        <Link to="/admin/resources" className={`${tabClass('/admin/resources')} shrink-0`}>
          Resource Management
        </Link>
        {/* <Link to="/admin/requests" className={tabClass('/admin/requests')}>
          Admin Requests
        </Link>
        <Link to="/admin/users" className={tabClass('/admin/users')}>
          User Management
        </Link> */}
      </div>

      {/* TAB CONTENT */}
      {children}


    </>
  );
}
