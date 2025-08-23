import axios from 'axios';
import { store } from '../store';
import { logout, refreshToken } from '../store/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Axiosインスタンス作成
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// リクエストインターセプター（認証トークン付与）
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（トークンリフレッシュ処理）
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // トークンリフレッシュを試行
        await store.dispatch(refreshToken()).unwrap();
        
        // 元のリクエストを再試行
        const token = store.getState().auth.accessToken;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // リフレッシュも失敗した場合はログアウト
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;