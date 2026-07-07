import axios from 'axios';

// Since the backend and frontend are likely on different ports in dev, 
// we might need the full URL or rely on proxy in vite.config.js.
// Assuming proxy is configured or they run on same origin in prod.
const API_URL = 'http://localhost:5000/api/auth/';

// Use interceptor to add token to headers
axios.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers['Authorization'] = 'Bearer ' + user.token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Register user
const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
  if (response.data && response.data.token) {
    const userWithToken = { ...response.data.user, token: response.data.token };
    localStorage.setItem('user', JSON.stringify(userWithToken));
  }
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData);
  if (response.data && response.data.token) {
    const userWithToken = { ...response.data.user, token: response.data.token };
    localStorage.setItem('user', JSON.stringify(userWithToken));
  }
  return response.data;
};

// Reset password
const resetPassword = async (resetData) => {
  const response = await axios.post(API_URL + 'reset-password', resetData);
  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem('user');
};

const authService = {
  register,
  login,
  resetPassword,
  logout,
};

export default authService;
