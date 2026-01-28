import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { FaSpinner } from "react-icons/fa";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className='flex items-center justify-center h-screen text-xl font-semibold'><FaSpinner size={50}/></div>; // optional spinner

  if (!user) return <Navigate to="/" />;

  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}