import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workflowService from '../services/workflowService';

// 非同期アクション
export const uploadWorkflow = createAsyncThunk(
  'workflow/upload',
  async (file, { rejectWithValue }) => {
    try {
      const response = await workflowService.uploadWorkflow(file);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Upload failed');
    }
  }
);

export const getWorkflows = createAsyncThunk(
  'workflow/getWorkflows',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await workflowService.getWorkflows(page, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch workflows');
    }
  }
);

export const getWorkflow = createAsyncThunk(
  'workflow/getWorkflow',
  async (id, { rejectWithValue }) => {
    try {
      const response = await workflowService.getWorkflow(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch workflow');
    }
  }
);

export const getWorkflowAnalysis = createAsyncThunk(
  'workflow/getAnalysis',
  async (id, { rejectWithValue }) => {
    try {
      const response = await workflowService.getWorkflowAnalysis(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch analysis');
    }
  }
);

export const deleteWorkflow = createAsyncThunk(
  'workflow/delete',
  async (id, { rejectWithValue }) => {
    try {
      await workflowService.deleteWorkflow(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete workflow');
    }
  }
);

const workflowSlice = createSlice({
  name: 'workflow',
  initialState: {
    workflows: [],
    currentWorkflow: null,
    analysis: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    },
    loading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentWorkflow: (state) => {
      state.currentWorkflow = null;
      state.analysis = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Workflow
      .addCase(uploadWorkflow.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadWorkflow.fulfilled, (state, action) => {
        state.uploading = false;
        // 成功時は一覧を再取得するため、ここでは状態更新のみ
      })
      .addCase(uploadWorkflow.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      // Get Workflows
      .addCase(getWorkflows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWorkflows.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows = action.payload.workflows;
        state.pagination = action.payload.pagination;
      })
      .addCase(getWorkflows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Workflow
      .addCase(getWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkflow = action.payload.workflow;
      })
      .addCase(getWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Workflow Analysis
      .addCase(getWorkflowAnalysis.fulfilled, (state, action) => {
        state.analysis = action.payload;
      })
      // Delete Workflow
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter(w => w.id !== action.payload);
      });
  },
});

export const { clearError, clearCurrentWorkflow } = workflowSlice.actions;
export default workflowSlice.reducer;