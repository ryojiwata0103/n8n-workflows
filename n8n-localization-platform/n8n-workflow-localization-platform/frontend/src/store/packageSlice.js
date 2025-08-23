import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import packageService from '../services/packageService';

// 非同期アクション
export const createPackage = createAsyncThunk(
  'package/create',
  async (packageData, { rejectWithValue }) => {
    try {
      const response = await packageService.createPackage(packageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create package');
    }
  }
);

export const searchPackages = createAsyncThunk(
  'package/search',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await packageService.searchPackages(searchParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Search failed');
    }
  }
);

export const getPackage = createAsyncThunk(
  'package/getPackage',
  async (id, { rejectWithValue }) => {
    try {
      const response = await packageService.getPackage(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch package');
    }
  }
);

export const getMyPackages = createAsyncThunk(
  'package/getMyPackages',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await packageService.getMyPackages(page, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch packages');
    }
  }
);

export const updatePackage = createAsyncThunk(
  'package/update',
  async ({ id, packageData }, { rejectWithValue }) => {
    try {
      const response = await packageService.updatePackage(id, packageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update package');
    }
  }
);

export const deletePackage = createAsyncThunk(
  'package/delete',
  async (id, { rejectWithValue }) => {
    try {
      await packageService.deletePackage(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete package');
    }
  }
);

export const getPopularPackages = createAsyncThunk(
  'package/getPopular',
  async ({ limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await packageService.getPopularPackages(limit);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch popular packages');
    }
  }
);

export const getCategories = createAsyncThunk(
  'package/getCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await packageService.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch categories');
    }
  }
);

export const downloadPackage = createAsyncThunk(
  'package/download',
  async (id, { rejectWithValue }) => {
    try {
      const response = await packageService.downloadPackage(id);
      return { id, blob: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Download failed');
    }
  }
);

const packageSlice = createSlice({
  name: 'package',
  initialState: {
    packages: [],
    myPackages: [],
    currentPackage: null,
    popularPackages: [],
    categories: [],
    searchResults: [],
    searchPagination: {
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    },
    myPackagesPagination: {
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    },
    loading: false,
    creating: false,
    downloading: false,
    error: null,
    searchParams: {},
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPackage: (state) => {
      state.currentPackage = null;
    },
    setSearchParams: (state, action) => {
      state.searchParams = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchPagination = {
        total: 0,
        page: 1,
        limit: 20,
        pages: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Package
      .addCase(createPackage.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.creating = false;
        state.myPackages.unshift(action.payload.package);
      })
      .addCase(createPackage.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      // Search Packages
      .addCase(searchPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.packages;
        state.searchPagination = action.payload.pagination;
      })
      .addCase(searchPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Package
      .addCase(getPackage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPackage = action.payload.package;
      })
      .addCase(getPackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get My Packages
      .addCase(getMyPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.myPackages = action.payload.packages;
        state.myPackagesPagination = action.payload.pagination;
      })
      .addCase(getMyPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Package
      .addCase(updatePackage.fulfilled, (state, action) => {
        const index = state.myPackages.findIndex(p => p.id === action.payload.package.id);
        if (index !== -1) {
          state.myPackages[index] = action.payload.package;
        }
        if (state.currentPackage?.id === action.payload.package.id) {
          state.currentPackage = action.payload.package;
        }
      })
      // Delete Package
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.myPackages = state.myPackages.filter(p => p.id !== action.payload);
      })
      // Get Popular Packages
      .addCase(getPopularPackages.fulfilled, (state, action) => {
        state.popularPackages = action.payload.packages;
      })
      // Get Categories
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
      })
      // Download Package
      .addCase(downloadPackage.pending, (state) => {
        state.downloading = true;
      })
      .addCase(downloadPackage.fulfilled, (state) => {
        state.downloading = false;
      })
      .addCase(downloadPackage.rejected, (state, action) => {
        state.downloading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearCurrentPackage,
  setSearchParams,
  clearSearchResults,
} = packageSlice.actions;
export default packageSlice.reducer;