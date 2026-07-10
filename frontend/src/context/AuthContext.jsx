import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

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

      const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
        : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? ''
          : 'https://s-reward-pay.onrender.com');
      // Re-fetch user profile from the backend
      const res = await fetch(`${baseUrl}/api/auth/me`, {
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
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://s-reward-pay.onrender.com');

    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('User Panel Socket.IO connected');
    });

    // Listen to changes affecting the current user
    newSocket.on('user_change', (change) => {
      if (change.documentKey && change.documentKey._id === user._id) {
        console.log('User change detected via socket, refreshing...');
        refreshUser();
      }
    });

    newSocket.on('deposit_change', () => {
      console.log('Deposit change detected via socket, refreshing user...');
      refreshUser();
    });

    newSocket.on('withdrawal_change', () => {
      console.log('Withdrawal change detected via socket, refreshing user...');
      refreshUser();
    });

    newSocket.on('new_notification', (notification) => {
      if (notification.userId === user._id || notification.userId === null) {
        console.log('New notification received via socket, refreshing user...');
        refreshUser();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  useEffect(() => {
    if (!user) return;
    
    // Poll to refresh user profile (including wallet balance and earnings) every 30 seconds
    const interval = setInterval(() => {
      refreshUser();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading, socket }}>
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
