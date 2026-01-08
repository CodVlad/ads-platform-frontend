import axios from 'axios';

// Create axios instance with base URL from environment
const baseURL = import.meta.env.VITE_API_URL;
console.log("API_BASE_URL:", import.meta.env.VITE_API_URL);
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log("TOKEN_IN_STORAGE:", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("REQ_AUTH_HEADER:", config.headers.Authorization);
  return config;
});

export default api;

