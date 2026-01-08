import axios from 'axios';
import { setApiLoading } from '../utils/apiStatus';

// Create axios instance with base URL from environment
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and set loading
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Set loading state
  setApiLoading(true);
  return config;
});

// Response interceptor to clear loading
api.interceptors.response.use(
  (response) => {
    setApiLoading(false);
    return response;
  },
  (error) => {
    setApiLoading(false);
    return Promise.reject(error);
  }
);

export default api;

