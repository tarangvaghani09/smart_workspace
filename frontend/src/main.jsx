import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './Login';
import Dashboard from './Dashboard';
import SearchRooms from './SearchRooms';
import Approvals from './Approvals';
import BookRoom from './BookRoom';
import ProtectedRoute from './ProtectedRoute';

// Admin pages (create empty components if not yet created)
import RoomManagement from './RoomManagement';
import AddRoom from './AddRoom';
import AdminRequests from './AdminRequests';
import UserManagement from './UserManagement';

import './index.css';
import AdminLayout from './AdminLayout';
import BookingList from './BookingList';
import MainLayout from './MainLayout';
import ResourceManagement from './ResourceManagement';
import AddResource from './AddResource';
import DepartmentBookingList from './DepartmentBookingList';
import Register from './Register';
import { AuthProvider } from './AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* ================= USER ================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchRooms />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingList />
              </ProtectedRoute>
            }
          />

          {/* ================= ADMIN ================= */}

          <Route
            path="/admin/layout"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute adminOnly>
                <Approvals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/bookings/department"
            element={
              <ProtectedRoute adminOnly>
                <DepartmentBookingList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute adminOnly>
                <RoomManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/resources"
            element={
              <ProtectedRoute adminOnly>
                <ResourceManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/resources/new"
            element={
              <ProtectedRoute adminOnly>
                <AddResource />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/rooms/new"
            element={
              <ProtectedRoute adminOnly>
                <AddRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute adminOnly>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);
