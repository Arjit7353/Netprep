const API_URL = 'http://localhost:5000/api';

const api = {
  // Helpers
  getHeaders: () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  },

  handleResponse: async (response) => {
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && data.message === 'Not authorized, token failed') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
      }
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  },

  // Auth
  auth: {
    login: async (credentials) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return api.handleResponse(res);
    },
    getProfile: async () => {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: api.getHeaders()
      });
      return api.handleResponse(res);
    }
  }
};
