import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // optional spinner

  if (!user) return <Navigate to="/" />;

  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace/>;

  return children;
}