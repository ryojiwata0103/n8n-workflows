import api from './api';

const workflowService = {
  uploadWorkflow: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/v1/workflows/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getWorkflows: (page = 1, limit = 20) => {
    return api.get(`/v1/workflows?page=${page}&limit=${limit}`);
  },

  getWorkflow: (id) => {
    return api.get(`/v1/workflows/${id}`);
  },

  getWorkflowAnalysis: (id) => {
    return api.get(`/v1/workflows/${id}/analysis`);
  },

  deleteWorkflow: (id) => {
    return api.delete(`/v1/workflows/${id}`);
  },

  downloadWorkflow: (id) => {
    return api.get(`/v1/workflows/${id}/download`, {
      responseType: 'blob',
    });
  },
};

export default workflowService;