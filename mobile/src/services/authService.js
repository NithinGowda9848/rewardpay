import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const AUTH_API_URL = `${API_URL}/auth/`;

// Setup interceptor for global axios (used for auth specific requests)
axios.interceptors.request.use(
  async (config) => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.token) {
          config.headers['Authorization'] = 'Bearer ' + user.token;
        }
      }
    } catch (err) {
      console.warn('Error retrieving user token for axios interceptor:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Register user
const register = async (userData) => {
  const response = await axios.post(AUTH_API_URL + 'register', userData);
  if (response.data && response.data.token) {
    const userWithToken = { ...response.data.user, token: response.data.token };
    await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
  }
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(AUTH_API_URL + 'login', userData);
  if (response.data && response.data.token) {
    const userWithToken = { ...response.data.user, token: response.data.token };
    await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
  }
  return response.data;
};

// Reset password
const resetPassword = async (resetData) => {
  const response = await axios.post(AUTH_API_URL + 'reset-password', resetData);
  return response.data;
};

// Logout user
const logout = async () => {
  await AsyncStorage.removeItem('user');
};

const authService = {
  register,
  login,
  resetPassword,
  logout,
};

export default authService;
