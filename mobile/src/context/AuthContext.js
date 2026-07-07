import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and load user session from AsyncStorage
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn('Failed to load user session from AsyncStorage:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
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

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return user;
      
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser || !parsedUser.token) return user;

      // Re-fetch user profile from the backend using dynamic API_URL
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': 'Bearer ' + parsedUser.token }
      });
      const data = await res.json();
      if (data.success) {
        const userWithToken = { ...data.user, token: parsedUser.token };
        await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
        setUser(userWithToken);
        return userWithToken;
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
    return user;
  };

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
