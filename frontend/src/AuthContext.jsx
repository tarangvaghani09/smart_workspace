import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [successMessage, setSuccessMessage] = useState(null);

  const token = localStorage.getItem('token');

  // 🔐 Fetch logged-in user from server
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('https://localhost/api/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        // setSuccessMessage({
        //   type: 'success',
        //   text: `Welcome, ${data.user.name}👋`
        // });
      })
      .catch(() => {
        logout(); // invalid / expired token
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = (token) => {
    localStorage.setItem('token', token);
    setLoading(true); // triggers /me fetch
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