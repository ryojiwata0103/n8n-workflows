import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import translationService from '../services/translationService';

// 非同期アクション
export const executeTranslation = createAsyncThunk(
  'translation/execute',
  async ({ workflowId, targetLanguage, translationEngine }, { rejectWithValue }) => {
    try {
      const response = await translationService.executeTranslation(
        workflowId,
        targetLanguage,
        translationEngine
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Translation failed');
    }
  }
);

export const getTranslations = createAsyncThunk(
  'translation/getTranslations',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await translationService.getTranslations(page, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch translations');
    }
  }
);

export const getTranslation = createAsyncThunk(
  'translation/getTranslation',
  async (id, { rejectWithValue }) => {
    try {
      const response = await translationService.getTranslation(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch translation');
    }
  }
);

export const updateTranslation = createAsyncThunk(
  'translation/update',
  async ({ id, translatedTexts }, { rejectWithValue }) => {
    try {
      const response = await translationService.updateTranslation(id, translatedTexts);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update translation');
    }
  }
);

export const getSupportedLanguages = createAsyncThunk(
  'translation/getSupportedLanguages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await translationService.getSupportedLanguages();
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch supported languages');
    }
  }
);

const translationSlice = createSlice({
  name: 'translation',
  initialState: {
    translations: [],
    currentTranslation: null,
    supportedLanguages: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    },
    loading: false,
    executing: false,
    error: null,
    executionStatus: null, // 翻訳実行状況
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTranslation: (state) => {
      state.currentTranslation = null;
      state.executionStatus = null;
    },
    setExecutionStatus: (state, action) => {
      state.executionStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Execute Translation
      .addCase(executeTranslation.pending, (state) => {
        state.executing = true;
        state.error = null;
      })
      .addCase(executeTranslation.fulfilled, (state, action) => {
        state.executing = false;
        state.executionStatus = action.payload;
      })
      .addCase(executeTranslation.rejected, (state, action) => {
        state.executing = false;
        state.error = action.payload;
      })
      // Get Translations
      .addCase(getTranslations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTranslations.fulfilled, (state, action) => {
        state.loading = false;
        state.translations = action.payload.translations;
        state.pagination = action.payload.pagination;
      })
      .addCase(getTranslations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Translation
      .addCase(getTranslation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTranslation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTranslation = action.payload.translation;
      })
      .addCase(getTranslation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Translation
      .addCase(updateTranslation.fulfilled, (state, action) => {
        if (state.currentTranslation) {
          state.currentTranslation.qualityScore = action.payload.qualityScore;
        }
      })
      // Get Supported Languages
      .addCase(getSupportedLanguages.fulfilled, (state, action) => {
        state.supportedLanguages = action.payload.languages;
      });
  },
});

export const { clearError, clearCurrentTranslation, setExecutionStatus } = translationSlice.actions;
export default translationSlice.reducer;