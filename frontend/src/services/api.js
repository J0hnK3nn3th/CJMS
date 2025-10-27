import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout/');
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
};

export const dataService = {
  // Example API calls - customize based on your Django models
  getCases: async () => {
    const response = await api.get('/cases/');
    return response.data;
  },
  
  getCase: async (id) => {
    const response = await api.get(`/cases/${id}/`);
    return response.data;
  },
  
  createCase: async (caseData) => {
    const response = await api.post('/cases/', caseData);
    return response.data;
  },
  
  updateCase: async (id, caseData) => {
    const response = await api.put(`/cases/${id}/`, caseData);
    return response.data;
  },
  
  deleteCase: async (id) => {
    const response = await api.delete(`/cases/${id}/`);
    return response.data;
  },
};

export default api;

