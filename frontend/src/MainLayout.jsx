import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';
import React from 'react';

export default function MainLayout() {
  return (
    <>
      <div className="flex min-h-screen bg-slate-50 overflow-x-hidden flex-col lg:flex-row">
        <Navbar />
        {/* Main page */}
        <main className="w-full p-4 sm:p-6 lg:p-10 lg:ml-64">
          <Outlet />
        </main>
      </div>

    </>
  );
}
