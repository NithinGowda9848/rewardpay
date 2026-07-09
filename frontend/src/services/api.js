import axios from 'axios';

const API = axios.create({
  baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://s-reward-pay.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    let token = null;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.token) {
        token = user.token;
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
