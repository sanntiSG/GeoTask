import axios, { AxiosInstance, AxiosError } from 'axios';

const isDev = import.meta.env.DEV;
const BASE_URL = isDev ? (import.meta.env.VITE_API_URL ?? 'http://localhost:5000') : '';

const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
