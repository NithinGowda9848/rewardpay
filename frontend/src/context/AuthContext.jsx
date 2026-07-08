import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userData) => {
    const data = await authService.login(userData);
    const userWithToken = { ...data.user, token: data.token };
    setUser(userWithToken);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    const userWithToken = { ...data.user, token: data.token };
    setUser(userWithToken);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return user;
      
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser || !parsedUser.token) return user;

      // Re-fetch user profile from the backend
      const res = await fetch('https://s-reward-pay.onrender.com/api/auth/me', {
        headers: { 'Authorization': 'Bearer ' + parsedUser.token }
      });
      const data = await res.json();
      if (data.success) {
        const userWithToken = { ...data.user, token: parsedUser.token };
        localStorage.setItem('user', JSON.stringify(userWithToken));
        setUser(userWithToken);
        return userWithToken;
      }
    } catch (err) {
      console.warn('Failed to refresh user profile');
    }
    return user;
  };

  useEffect(() => {
    if (!user) return;
    
    // Poll to refresh user profile (including wallet balance and earnings) every 30 seconds
    const interval = setInterval(() => {
      refreshUser();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
