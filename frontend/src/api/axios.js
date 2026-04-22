import axios from 'axios';

// Create a base axios instance so all API calls use the same configuration
const api = axios.create({
  baseURL: `http://${window.location.hostname}:8000/api`, // Uses current device IP so it works on local network too
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically before every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    // If token exists, add it to request header for authentication
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized errors (token expired or invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {

    // If backend returns 401, remove token and send user back to login page
    if (error.response && error.response.status === 401) {

      localStorage.removeItem('token');

      // Avoid redirect loop if already on public pages
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register' &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;