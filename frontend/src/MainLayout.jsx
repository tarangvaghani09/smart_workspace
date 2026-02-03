import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';
import React from 'react';

export default function MainLayout() {
  return (
    <>
      <div className="flex min-h-screen bg-slate-50">
        <Navbar />
        {/* Main page */}
        <main className="ml-64 w-full p-10">
          <Outlet />
        </main>
      </div>

    </>
  );
}
