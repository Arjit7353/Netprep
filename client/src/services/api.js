// client/src/services/api.js

import axios from 'axios';

// ✅ FIX: Determine API URL correctly - no double /api/
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'apmock.icu' || hostname === 'www.apmock.icu') {
      return 'https://netprep-api.onrender.com/api';
    }
  }
  
  return '/api';
};

const API_URL = getApiUrl();

console.log('🌐 API URL:', API_URL);

// ✅ FIX: Flatten array params before sending
const flattenParams = (params) => {
  if (!params || typeof params !== 'object') return params;
  
  const flattened = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    
    if (Array.isArray(value)) {
      const cleaned = value.filter(v => v !== null && v !== undefined && v !== '');
      if (cleaned.length === 0) return;
      if (cleaned.length === 1) {
        flattened[key] = cleaned[0];
      } else {
        flattened[key] = cleaned.join(',');
      }
    } else {
      flattened[key] = value;
    }
  });
  return flattened;
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Server wake-up state
let isServerAwake = false;
let wakeUpPromise = null;

// Wake up server function
const wakeUpServer = async () => {
  if (isServerAwake) return true;
  if (wakeUpPromise) return wakeUpPromise;
  
  wakeUpPromise = new Promise(async (resolve) => {
    try {
      console.log('☕ Waking up server...');
      const response = await axios.get(`${API_URL}/health`, { timeout: 30000 });
      if (response.data.success) {
        isServerAwake = true;
        console.log('✅ Server is awake!');
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.log('⏳ Server still waking up, retrying...');
      setTimeout(async () => {
        try {
          await axios.get(`${API_URL}/health`, { timeout: 30000 });
          isServerAwake = true;
          console.log('✅ Server is awake after retry!');
          resolve(true);
        } catch (e) {
          console.error('❌ Server wake-up failed:', e.message);
          resolve(false);
        }
      }, 3000);
    }
  });
  
  const result = await wakeUpPromise;
  wakeUpPromise = null;
  return result;
};

// Reset server status after 10 minutes inactivity
setInterval(() => {
  isServerAwake = false;
}, 10 * 60 * 1000);

// ✅ Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Wake up server before first request
    if (!isServerAwake && !config.url.includes('/health') && !config.url.includes('/wake')) {
      await wakeUpServer();
    }
    
    // ✅ FIX: Flatten array params in GET requests
    if (config.method === 'get' && config.params) {
      config.params = flattenParams(config.params);
    }
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data || '');
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    isServerAwake = true;
    
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Retry on network error (server might be sleeping)
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('🔄 Retrying request after network error...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      isServerAwake = false;
      await wakeUpServer();
      
      return api(originalRequest);
    }
    
    // Handle different error types
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data.message || 'Invalid request');
          break;
        case 401:
          console.error('Unauthorized:', data.message || 'Please login again');
          break;
        case 404:
          console.error('Not Found:', data.message || 'Resource not found');
          break;
        case 500:
          console.error('Server Error:', data.message || 'Internal server error');
          break;
        default:
          console.error(`Error ${status}:`, data.message || 'An error occurred');
      }
      
      return Promise.reject({
        status,
        message: data.message || 'An error occurred',
        errors: data.errors || [],
        data: data
      });
    } else if (error.request) {
      console.error('Network Error: No response received');
      return Promise.reject({
        status: 0,
        message: 'सर्वर से कनेक्ट नहीं हो पा रहा। कृपया कुछ सेकंड बाद पुनः प्रयास करें। (Server is starting up, please wait...)',
        isNetworkError: true
      });
    } else {
      console.error('Request Setup Error:', error.message);
      return Promise.reject({
        status: -1,
        message: error.message || 'Failed to make request'
      });
    }
  }
);

// ✅ API helper methods
export const apiHelper = {
  get: async (url, params = {}) => {
    const response = await api.get(url, { params });
    return response.data;
  },
  
  post: async (url, data = {}) => {
    const response = await api.post(url, data);
    return response.data;
  },
  
  put: async (url, data = {}) => {
    const response = await api.put(url, data);
    return response.data;
  },
  
  delete: async (url, data = {}) => {
    const response = await api.delete(url, { data });
    return response.data;
  },
  
  patch: async (url, data = {}) => {
    const response = await api.patch(url, data);
    return response.data;
  }
};

// Health check function
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Wake up function export
export const ensureServerAwake = wakeUpServer;

export default api;