import api from './api';

const authService = {
  login: (email, password) => {
    return api.post('/v1/auth/login', { email, password });
  },

  register: (email, username, password) => {
    return api.post('/v1/auth/register', { email, username, password });
  },

  refreshToken: (refreshToken) => {
    return api.post('/v1/auth/refresh', { refreshToken });
  },

  logout: () => {
    return api.post('/v1/auth/logout');
  },

  getProfile: () => {
    return api.get('/v1/auth/profile');
  },

  updateProfile: (data) => {
    return api.put('/v1/auth/profile', data);
  },
};

export default authService;