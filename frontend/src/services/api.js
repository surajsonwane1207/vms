const API_BASE_URL = 'http://localhost:5000/api';

const api = {
  getToken: () => localStorage.getItem('vms_token'),
  
  setSession: (token, user) => {
    localStorage.setItem('vms_token', token);
    localStorage.setItem('vms_user', JSON.stringify(user));
  },
  
  clearSession: () => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_user');
  },
  
  getUser: () => {
    const user = localStorage.getItem('vms_user');
    return user ? JSON.parse(user) : null;
  },

  request: async (endpoint, options = {}) => {
    const token = api.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401 || response.status === 403) {
      api.clearSession();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  },

  login: async (email, password) => {
    const data = await api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    api.setSession(data.token, data.user);
    return data;
  },

  register: async (userData) => {
    return api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getProfile: async () => {
    return api.request('/auth/me');
  },

  getHosts: async () => {
    return api.request('/users/hosts');
  },

  getAppointments: async () => {
    return api.request('/appointments');
  },

  bookAppointment: async (appointmentData) => {
    return api.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
  },

  updateAppointmentStatus: async (id, status) => {
    return api.request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  checkInAppointment: async (id) => {
    return api.request(`/appointments/${id}/check-in`, {
      method: 'POST'
    });
  },

  checkOutAppointment: async (id) => {
    return api.request(`/appointments/${id}/check-out`, {
      method: 'POST'
    });
  },

  scanQrCode: async (qrToken, action) => {
    return api.request('/appointments/scan-qr', {
      method: 'POST',
      body: JSON.stringify({ qrToken, action })
    });
  },

  getNotifications: async () => {
    return api.request('/notifications');
  },

  readAllNotifications: async () => {
    return api.request('/notifications/read-all', {
      method: 'POST'
    });
  },

  getAdminAnalytics: async () => {
    return api.request('/admin/analytics');
  }
};

export default api;
