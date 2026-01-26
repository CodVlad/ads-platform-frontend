import axios from 'axios';
import { setApiLoading } from '../utils/apiStatus';

// Create axios instance with base URL from environment
// Ensure baseURL includes /api if not already present
const envURL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const baseURL = envURL.endsWith('/api') ? envURL : `${envURL.replace(/\/+$/, '')}/api`;

// Simple in-flight map for request deduping
// key = method + url + JSON.stringify(data)
const inFlightRequests = new Map();

/**
 * Generate request key for deduping
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {any} data - Request data
 * @returns {string}
 */
const getRequestKey = (method, url, data) => {
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${dataStr}`;
};

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

// Response interceptor to clear loading and handle 429
api.interceptors.response.use(
  (response) => {
    setApiLoading(false);
    
    // Remove from in-flight map on success
    const requestKey = getRequestKey(
      response.config.method,
      response.config.url,
      response.config.data || response.config.params
    );
    inFlightRequests.delete(requestKey);
    
    return response;
  },
  async (error) => {
    setApiLoading(false);
    
    // Remove from in-flight map on error
    if (error.config) {
      const requestKey = getRequestKey(
        error.config.method,
        error.config.url,
        error.config.data || error.config.params
      );
      inFlightRequests.delete(requestKey);
    }
    
    // On 429: read retry-after header if exists
    if (error.response?.status === 429) {
      const retryAfterHeader = error.response.headers['retry-after'];
      const retryAfterMs = retryAfterHeader 
        ? parseInt(retryAfterHeader, 10) * 1000 
        : 1500; // fallback 1500ms
      
      // Throw error with { type:'RATE_LIMIT', retryAfterMs }
      const rateLimitError = new Error('Too many requests');
      rateLimitError.type = 'RATE_LIMIT';
      rateLimitError.retryAfterMs = retryAfterMs;
      rateLimitError.response = error.response;
      return Promise.reject(rateLimitError);
    }
    
    return Promise.reject(error);
  }
);

// Wrap axios methods to add deduping
const originalGet = api.get.bind(api);
const originalPost = api.post.bind(api);
const originalPut = api.put.bind(api);
const originalPatch = api.patch.bind(api);
const originalDelete = api.delete.bind(api);

const wrapRequest = (originalMethod, methodName) => {
  return function(url, dataOrConfig, config) {
    // For GET requests, dataOrConfig is actually config (params)
    // For POST/PUT/PATCH, dataOrConfig is data, config is config
    const requestData = methodName === 'get' ? null : dataOrConfig;
    const requestConfig = methodName === 'get' ? dataOrConfig : config;
    const params = requestConfig?.params;
    
    const requestKey = getRequestKey(methodName, url, requestData || params);
    
    // Check if request is already in-flight
    if (inFlightRequests.has(requestKey)) {
      return inFlightRequests.get(requestKey);
    }
    
    // Create new request promise
    const requestPromise = originalMethod(url, dataOrConfig, config)
      .finally(() => {
        // Clean up after request completes
        inFlightRequests.delete(requestKey);
      });
    
    // Store in-flight request
    inFlightRequests.set(requestKey, requestPromise);
    
    return requestPromise;
  };
};

api.get = wrapRequest(originalGet, 'get');
api.post = wrapRequest(originalPost, 'post');
api.put = wrapRequest(originalPut, 'put');
api.patch = wrapRequest(originalPatch, 'patch');
api.delete = wrapRequest(originalDelete, 'delete');

export default api;

