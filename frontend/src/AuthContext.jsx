import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiUrl } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [successMessage, setSuccessMessage] = useState(null);

  const token = localStorage.getItem('token');

  // Fetch logged-in user from server
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(apiUrl('/api/me'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After") || 900;
          window.location.href = `/429.html?retry=${retry}`; // show 429.html
          return;
        }
        // Auth error
        if (res.status === 401 || res.status === 403) {
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Server error');
        return res.json();
      })
      .then(data => {
        console.log('Fetched user:', data);
        setUser(data);
        // setSuccessMessage({
        //   type: 'success',
        //   text: `Welcome, ${data.user.name}👋`
        // });
      })
      .catch((err) => {
        if (err.message === 'Unauthorized') {
          logout();
        } 
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = (token) => {
    localStorage.setItem('token', token);
    setLoading(true); // /me fetch
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // setSuccessMessage(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout
      // , successMessage, setSuccessMessage 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
