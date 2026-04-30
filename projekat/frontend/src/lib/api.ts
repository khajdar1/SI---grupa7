import axios from 'axios';
import { NETWORK } from '@/constants';

const isProduction = process.env.NODE_ENV === 'production';
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (isProduction ? '' : NETWORK.API_BASE_URL_FALLBACK);

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('token');

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
