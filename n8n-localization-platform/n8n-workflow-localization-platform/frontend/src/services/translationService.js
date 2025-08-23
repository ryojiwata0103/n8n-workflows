import api from './api';

const translationService = {
  executeTranslation: (workflowId, targetLanguage, translationEngine) => {
    return api.post('/v1/translations/execute', {
      workflowId,
      targetLanguage,
      translationEngine,
    });
  },

  getTranslations: (page = 1, limit = 20) => {
    return api.get(`/v1/translations?page=${page}&limit=${limit}`);
  },

  getTranslation: (id) => {
    return api.get(`/v1/translations/${id}`);
  },

  updateTranslation: (id, translatedTexts) => {
    return api.patch(`/v1/translations/${id}`, { translatedTexts });
  },

  downloadTranslatedWorkflow: (id) => {
    return api.get(`/v1/translations/${id}/download`, {
      responseType: 'blob',
    });
  },

  getSupportedLanguages: () => {
    return api.get('/v1/translations/languages/supported');
  },
};

export default translationService;