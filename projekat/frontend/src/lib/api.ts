import axios from 'axios';
import { NETWORK } from '@/constants';

const isProduction = process.env.NODE_ENV === 'production';
const API_PREFIX = '/api/v1';
const AUTH_REDIRECT_MESSAGE_KEY = 'authRedirectMessage';
const AUTH_FLOW_ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/reset-password/confirm',
];

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

function isAuthFlowRequest(url?: string): boolean {
  if (!url) {
    return false;
  }

  return AUTH_FLOW_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function redirectWithMessage(path: string, message: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(AUTH_REDIRECT_MESSAGE_KEY, message);

  const targetUrl = new URL(path, window.location.origin);
  const currentPath = `${window.location.pathname}${window.location.search}`;
  const targetPath = `${targetUrl.pathname}${targetUrl.search}`;

  if (currentPath !== targetPath) {
    window.location.assign(path);
  }
}

function getTokenRoles(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const token = window.localStorage.getItem('token');
  if (!token) {
    return [];
  }

  try {
    const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
    };

    const realmRoles = payload.realm_access?.roles ?? [];
    const clientRoles = Object.values(payload.resource_access ?? {}).flatMap((access) => access.roles ?? []);
    return [...realmRoles, ...clientRoles].map((role) => role.toLowerCase());
  } catch {
    return [];
  }
}

function getForbiddenRedirectPath(): string {
  const roles = getTokenRoles();
  const isCompanyAdmin = roles.includes('kompanijaadmin') || roles.includes('companyadmin');
  const isSystemAdmin = roles.includes('admin') || roles.includes('administrator');

  return isCompanyAdmin && !isSystemAdmin
    ? '/company?unauthorized=1'
    : '/dashboard?unauthorized=1';
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url as string | undefined;

    if (!isAuthFlowRequest(requestUrl)) {
      if (status === 401) {
        if (typeof window !== 'undefined') {
          window.localStorage.clear();
          document.cookie = 'token=; Max-Age=0; path=/';
        }
        redirectWithMessage('/login?redirected=1', 'Your session has expired. Please sign in again.');
      } else if (status === 403) {
        if (
          typeof window !== 'undefined' &&
          (window.location.pathname === '/dashboard' || window.location.pathname === '/company')
        ) {
          window.sessionStorage.setItem(
            AUTH_REDIRECT_MESSAGE_KEY,
            'That action is not available for your role.',
          );
          return Promise.reject(error);
        }

        redirectWithMessage(getForbiddenRedirectPath(), 'You do not have permission to access that action.');
      }
    }

    return Promise.reject(error);
  },
);
