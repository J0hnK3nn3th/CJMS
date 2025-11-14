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
      // Django REST Framework uses "Token" prefix by default
      config.headers.Authorization = `Token ${token}`;
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
      // Only redirect to login for organizer/admin authentication
      // Don't redirect for judge endpoints
      const isJudgeEndpoint = error.config?.url?.includes('/auth/judge-login') || 
                               error.config?.url?.includes('/subevents');
      
      if (!isJudgeEndpoint && localStorage.getItem('authToken')) {
        // Handle unauthorized access for authenticated organizers
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
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
  
  verifyPassword: async (password) => {
    const response = await api.post('/auth/verify-password/', { password });
    return response.data;
  },
  
  judgeLogin: async (code) => {
    const response = await api.post('/auth/judge-login/', { code });
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

export const eventService = {
  getEvents: async () => {
    const response = await api.get('/events/');
    return response.data;
  },
  
  getEvent: async (id) => {
    const response = await api.get(`/events/${id}/`);
    return response.data;
  },
  
  createEvent: async (eventData) => {
    const response = await api.post('/events/', eventData);
    return response.data;
  },
  
  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}/`, eventData);
    return response.data;
  },
  
  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}/`);
    return response.data;
  },
};

export const subEventService = {
  getSubEvents: async () => {
    const response = await api.get('/subevents/');
    return response.data;
  },
  
  getSubEvent: async (id) => {
    const response = await api.get(`/subevents/${id}/`);
    return response.data;
  },
  
  createSubEvent: async (subEventData) => {
    const response = await api.post('/subevents/', subEventData);
    return response.data;
  },
  
  updateSubEvent: async (id, subEventData) => {
    const response = await api.put(`/subevents/${id}/`, subEventData);
    return response.data;
  },
  
  deleteSubEvent: async (id) => {
    const response = await api.delete(`/subevents/${id}/`);
    return response.data;
  },
  
  getSubEventSettings: async (subEventId) => {
    const response = await api.get(`/subevents/${subEventId}/settings/`);
    return response.data;
  },
  
  saveSubEventSettings: async (subEventId, settings) => {
    const response = await api.post(`/subevents/${subEventId}/settings/`, settings);
    return response.data;
  },
};

export const scoreService = {
  getJudgeScores: async (judgeId) => {
    const response = await api.get(`/judges/${judgeId}/scores/`);
    return response.data;
  },
  
  saveJudgeScores: async (judgeId, scores) => {
    const response = await api.post(`/judges/${judgeId}/scores/save/`, { scores });
    return response.data;
  },
  
  getSubEventScores: async (subEventId) => {
    // Get all judges for the sub-event and their scores
    const settings = await subEventService.getSubEventSettings(subEventId);
    const judges = settings.judges || [];
    const allScores = {};
    
    for (const judge of judges) {
      try {
        const judgeScores = await api.get(`/judges/${judge.id}/scores/`);
        allScores[judge.id] = judgeScores.data;
      } catch (error) {
        console.error(`Error fetching scores for judge ${judge.id}:`, error);
        allScores[judge.id] = { scores: {}, comments: {} };
      }
    }
    
    return {
      judges,
      contestants: settings.contestants || [],
      criteria: settings.criteria || [],
      scores: allScores
    };
  },
};

export default api;

