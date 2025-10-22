import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Important for session cookies
  timeout: 10000,
});

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed later
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;