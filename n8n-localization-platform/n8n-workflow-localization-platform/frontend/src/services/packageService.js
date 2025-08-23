import api from './api';

const packageService = {
  createPackage: (packageData) => {
    return api.post('/v1/packages/create', packageData);
  },

  searchPackages: (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
      }
    });
    return api.get(`/v1/packages/search?${searchParams.toString()}`);
  },

  getPackage: (id) => {
    return api.get(`/v1/packages/${id}`);
  },

  getMyPackages: (page = 1, limit = 20) => {
    return api.get(`/v1/packages/my-packages?page=${page}&limit=${limit}`);
  },

  updatePackage: (id, packageData) => {
    return api.put(`/v1/packages/${id}`, packageData);
  },

  deletePackage: (id) => {
    return api.delete(`/v1/packages/${id}`);
  },

  downloadPackage: (id) => {
    return api.post(`/v1/packages/${id}/download`, {}, {
      responseType: 'blob',
    });
  },

  getPopularPackages: (limit = 10) => {
    return api.get(`/v1/packages/popular?limit=${limit}`);
  },

  getCategories: () => {
    return api.get('/v1/packages/categories');
  },

  ratePackage: (id, rating) => {
    return api.post(`/v1/packages/${id}/rate`, { rating });
  },

  getPackageReviews: (id) => {
    return api.get(`/v1/packages/${id}/reviews`);
  },
};

export default packageService;