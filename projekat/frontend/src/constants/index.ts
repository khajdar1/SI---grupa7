export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  LOGOUT: '/logout',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  INTERVENTIONS: '/interventions',
  INTERVENTION: (id: string) => `/interventions/${id}`,
  INTERVENTION_NEW: '/interventions/new',
  ASSIGNMENTS: '/assignments',
  REPORTS: '/reports',
  HISTORY: '/history',
  MAP: '/map',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  FAULT_REPORTS: '/fault-reports',
  TICKETS: '/tickets',
  ADMIN: '/admin',
  ADMIN_CATEGORY: '/admin/categories',
  ADMIN_SLA_CONFIG: '/admin/sla-config',
  ADMIN_DETAIL: (id: string) => `/admin/${id}`,
} as const;

export const API_ENDPOINTS = {
  HEALTH: {
    BASE: '/api/v1/health',
  },
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REGISTER: '/api/v1/auth/register',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
  },
  CATEGORIES: {
    BASE: '/api/v1/categories',
    BY_ID: (id: number | string) => `/api/v1/categories/${id}`,
    STATUS: (id: number | string) => `/api/v1/categories/${id}/status`,
  },
  SLA: {
    BASE: '/api/v1/sla',
  },
  INTERVENTIONS: {
    BASE: '/api/v1/interventions',
  },
  ASSIGNMENTS: {
    BASE: '/api/v1/assignments',
  },
  REPORTS: {
    BASE: '/api/v1/reports',
  },
} as const;

export const NETWORK = {
  API_BASE_URL_FALLBACK: 'http://localhost:4000',
  SOCKET_URL_FALLBACK: 'http://localhost:4000',
} as const;

export const UI = {
  TABLE_PAGE_SIZE: 20,
  TOAST_DURATION_MS: 4000,
  DEBOUNCE_DELAY_MS: 300,
  SKELETON_ROWS: 8,
  MODAL_ANIMATION_MS: 200,
  MAX_FILE_SIZE_MB: 10,
  SESSION_COOKIE_DAYS: 1,
  REGISTER_REDIRECT_DELAY_MS: 2500,
  TABLE_COLUMN_WIDTHS: {
    INTERVENTIONS_ID: '120px',
    INTERVENTIONS_PRIORITY: '140px',
    INTERVENTIONS_STATUS: '160px',
    INTERVENTIONS_OWNER: '160px',
    CATEGORY_STATUS: '110px',
    CATEGORY_CREATED: '120px',
    CATEGORY_ACTIONS: '220px',
    SLA_HOURS: '90px',
  },
} as const;

export const VALIDATION = {
  TITLE_MIN: 3,
  TITLE_MAX: 150,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 2000,
} as const;
