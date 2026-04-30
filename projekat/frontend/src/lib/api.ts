import axios from 'axios';
import { NETWORK } from '@/constants';

const isProduction = process.env.NODE_ENV === 'production';
const API_PREFIX = '/api/v1';

function normalizeApiBaseUrl(rawBaseUrl: string): string {
  const baseUrlWithoutTrailingSlash = rawBaseUrl.replace(/\/+$/, '');

  if (baseUrlWithoutTrailingSlash.toLowerCase().endsWith(API_PREFIX)) {
    return baseUrlWithoutTrailingSlash.slice(0, -API_PREFIX.length);
  }

  return baseUrlWithoutTrailingSlash;
}

const configuredBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (isProduction ? '' : NETWORK.API_BASE_URL_FALLBACK);
const apiBaseUrl = configuredBaseUrl ? normalizeApiBaseUrl(configuredBaseUrl) : configuredBaseUrl;

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
