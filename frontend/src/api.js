const API_BASE_URL = 'http://localhost:5000/api';

const api = {
  // Get token from localStorage
  getToken: () => localStorage.getItem('vms_token'),
  
  // Set token and user in localStorage
  setSession: (token, user) => {
    localStorage.setItem('vms_token', token);
    localStorage.setItem('vms_user', JSON.stringify(user));
  },
  
  // Clear session
  clearSession: () => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_user');
  },
  
  // Get user details
  getUser: () => {
    const user = localStorage.getItem('vms_user');
    return user ? JSON.parse(user) : null;
  },

  // Helper for requests
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
      // Auto logout if token expires/fails
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

  // Auth APIs
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

  // Appointments APIs
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

  // Scan QR Code
  scanQrCode: async (qrToken, action) => {
    return api.request('/appointments/scan-qr', {
      method: 'POST',
      body: JSON.stringify({ qrToken, action })
    });
  },

  // Notifications APIs
  getNotifications: async () => {
    return api.request('/notifications');
  },

  readAllNotifications: async () => {
    return api.request('/notifications/read-all', {
      method: 'POST'
    });
  },

  // Admin APIs
  getAdminAnalytics: async () => {
    return api.request('/admin/analytics');
  }
};

export default api;
