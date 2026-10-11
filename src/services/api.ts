import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        setAccessToken(data.accessToken);
        refreshQueue.forEach((cb) => cb(data.accessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
