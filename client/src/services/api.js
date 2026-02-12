import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data.message || 'Invalid request');
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
      
      // Return structured error
      return Promise.reject({
        status,
        message: data.message || 'An error occurred',
        errors: data.errors || [],
        data: data
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response received');
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        isNetworkError: true
      });
    } else {
      // Error setting up request
      console.error('Request Setup Error:', error.message);
      return Promise.reject({
        status: -1,
        message: error.message || 'Failed to make request'
      });
    }
  }
);

// API helper methods
export const apiHelper = {
  // GET request
  get: async (url, params = {}) => {
    const response = await api.get(url, { params });
    return response.data;
  },
  
  // POST request
  post: async (url, data = {}) => {
    const response = await api.post(url, data);
    return response.data;
  },
  
  // PUT request
  put: async (url, data = {}) => {
    const response = await api.put(url, data);
    return response.data;
  },
  
  // DELETE request
  delete: async (url, data = {}) => {
    const response = await api.delete(url, { data });
    return response.data;
  },
  
  // PATCH request
  patch: async (url, data = {}) => {
    const response = await api.patch(url, data);
    return response.data;
  }
};

export default api;