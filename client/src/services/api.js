import axios from 'axios';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'apmock.icu' || hostname === 'www.apmock.icu') {
      return 'https://netprep-api.onrender.com/api';
    }
  }
  return '/api';
};

const API_URL = getApiUrl();

const flattenParams = (params) => {
  if (!params || typeof params !== 'object') return params;
  const flattened = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value)) {
      const cleaned = value.filter((v) => v !== null && v !== undefined && v !== '');
      if (cleaned.length === 0) return;
      flattened[key] = cleaned.length === 1 ? cleaned[0] : cleaned.join(',');
    } else {
      flattened[key] = value;
    }
  });
  return flattened;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — NO blocking wake-up ───
api.interceptors.request.use(
  (config) => {
    if (config.method === 'get' && config.params) {
      config.params = flattenParams(config.params);
    }
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor with smart retry ───
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once on network error (server might be cold-starting)
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true;
      await new Promise((r) => setTimeout(r, 3000));
      return api(originalRequest);
    }

    // Build structured error
    if (error.response) {
      const { status, data } = error.response;
      return Promise.reject({
        status,
        message: data.message || 'An error occurred',
        errors: data.errors || [],
        data,
      });
    } else if (error.request) {
      return Promise.reject({
        status: 0,
        message:
          'Server se connect nahi ho pa raha. Kuch seconds baad try karein.',
        isNetworkError: true,
      });
    }
    return Promise.reject({ status: -1, message: error.message || 'Request failed' });
  }
);

// ─── Helper methods ───
export const apiHelper = {
  get: async (url, params = {}) => {
    const r = await api.get(url, { params });
    return r.data;
  },
  post: async (url, data = {}) => {
    const r = await api.post(url, data);
    return r.data;
  },
  put: async (url, data = {}) => {
    const r = await api.put(url, data);
    return r.data;
  },
  delete: async (url, data = {}) => {
    const r = await api.delete(url, { data });
    return r.data;
  },
  patch: async (url, data = {}) => {
    const r = await api.patch(url, data);
    return r.data;
  },
};

export const checkServerHealth = async () => {
  try {
    const r = await api.get('/health');
    return r.data;
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Keep this export for backward-compatibility but make it non-blocking
export const ensureServerAwake = async () => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};

export default api;