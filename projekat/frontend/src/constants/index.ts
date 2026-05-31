export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  COMPANY_REGISTER: '/company-register',
  LOGOUT: '/logout',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  INTERVENTIONS: '/interventions',
  INTERVENTION: (id: string) => `/interventions/${id}`,
  INTERVENTION_NEW: '/interventions/new',
  INTERVENTION_EDIT: (id: string) => `/interventions/${id}/edit`,
  ASSIGNMENTS: '/assignments',
  REPORTS: '/reports',
  HISTORY: '/history',
  MAP: '/map',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  FAULT_REPORTS: '/fault-reports',
  TICKETS: '/tickets',
  TICKET_CREATE: '/tickets?create=1',
  ADMIN: '/admin',
  ADMIN_COMPANIES: '/admin/companies',
  ADMIN_CATEGORY: '/admin/categories',
  ADMIN_SLA_CONFIG: '/admin/sla-config',
  ADMIN_ATTACHMENT_CONFIG: '/admin/attachment-config',
  ADMIN_DETAIL: (id: string) => `/admin/${id}`,
  MANAGEMENT_DASHBOARD: '/management',
  MANAGEMENT_MATERIALS: '/management/materials', 
  COMPANY: '/company',
  BLOCKED_USERS: '/blocked-users',
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
    RESET_PASSWORD_CONFIRM: '/api/v1/auth/reset-password/confirm',
  },
  PROFILE: {
    ME: '/api/v1/profile/me',
    PASSWORD: '/api/v1/profile/me/password',
  },
  CATEGORIES: {
    BASE: '/api/v1/categories',
    BY_ID: (id: number | string) => `/api/v1/categories/${id}`,
    STATUS: (id: number | string) => `/api/v1/categories/${id}/status`,
  },
  FAULT_REPORTS: {
    BASE: '/api/v1/fault-reports',
    OPTIONS: '/api/v1/fault-reports/options',
    CHECK_DUPLICATES: '/api/v1/fault-reports/check-duplicates',
  },
  COMPANIES: {
    BASE: '/api/v1/companies',
    SELF_REGISTER: '/api/v1/companies/self-register',
    ME: '/api/v1/companies/me',
    BY_ID: (id: number | string) => `/api/v1/companies/${id}`,
    STATUS: (id: number | string) => `/api/v1/companies/${id}/status`,
    ADMIN: (id: number | string) => `/api/v1/companies/${id}/admin`,
  },
  USERS: {
    BASE: '/api/v1/users',
    BY_ID: (id: number | string) => `/api/v1/users/${id}`,
    ACTIVATE: (id: number | string) => `/api/v1/users/${id}/activate`,
    DEACTIVATE: (id: number | string) => `/api/v1/users/${id}/deactivate`,
  },
  SLA: {
    BASE: '/api/v1/sla',
  },
  INTERVENTIONS: {
    BASE: '/api/v1/interventions',
    BY_ID: (id: number | string) => `/api/v1/interventions/${id}`,
    EXPORT_PDF: '/api/v1/interventions/export/pdf',
    ATTACHMENTS: (id: number | string) => `/api/v1/interventions/${id}/attachments`,
    REPORT: (id: number | string) => `/api/v1/interventions/${id}/reports`,
    MATERIAL_SUGGESTIONS: (id: number | string) =>
      `/api/v1/interventions/${id}/reports/material-suggestions`,
    REPORT_FINALIZE: (id: number | string) => `/api/v1/interventions/${id}/reports/finalize`,
    REPORT_RECOMMENDATION: (id: number | string) => `/api/v1/interventions/${id}/reports/recommendation`,
    KNOWLEDGE_BASE: (id: number | string) => `/api/v1/interventions/${id}/knowledge-base`,
    BULK_ACTIONS: '/api/v1/interventions/bulk-actions',
  },
  ATTACHMENTS: {
    DOWNLOAD: (id: number | string) => `/api/v1/attachments/${id}/download`,
    BY_ID: (id: number | string) => `/api/v1/attachments/${id}`,
    CONFIG: '/api/v1/attachments/config',
  },
  ASSIGNMENTS: {
    BASE: '/api/v1/assignments',
  },
  AVAILABILITY: {
    ME: '/api/v1/availability/me',
    BY_ID: (id: number | string) => `/api/v1/availability/me/${id}`,
  },
  REPORTS: {
    BASE: '/api/v1/reports',
  },
  MANAGEMENT: {
    DASHBOARD: '/api/v1/management/dashboard',
    MATERIALS: '/api/v1/management/materials',
  },
  ESCALATIONS: {
    BY_INTERVENTION: (id: number | string) => `/api/v1/escalations/${id}`,
    LIST: '/api/v1/escalations',
    REVIEW: (id: number | string) => `/api/v1/escalations/${id}/review`,
  },
  MAPS: {
    INTERVENTIONS: '/api/v1/maps/interventions',
  },
  TICKETS: {
    BASE: '/api/v1/tickets',
    CATEGORIES: '/api/v1/tickets/categories',
    BY_ID: (id: number | string) => `/api/v1/tickets/${id}`,
    STATUS: (id: number | string) => `/api/v1/tickets/${id}/status`,
    MESSAGES: (id: number | string) => `/api/v1/tickets/${id}/messages`,
    ADMIN_REVIEW: (id: number | string) => `/api/v1/tickets/${id}/admin-review`,
    ADMIN_REVIEW_ADMINS: '/api/v1/tickets/admin-review/admins',
    BLOCK_USER: (id: number | string) => `/api/v1/tickets/${id}/block-user`,
    UNBLOCK_USER: (id: number | string) => `/api/v1/tickets/${id}/unblock-user`,
  },
  BLOCKING: {
    BASE: '/api/v1/blocking',
    UNBLOCK: (id: number | string) => `/api/v1/blocking/${id}/unblock`,
    BY_ID: (id: number | string) => `/api/v1/blocking/${id}`,
  },
  NOTIFICATIONS: {
    BASE: '/api/v1/notifications',
    UNREAD: '/api/v1/notifications/unread',
    MARK_READ: (id: number | string) => `/api/v1/notifications/${id}/read`,
  },
  USER_PREFERENCES: {
    BASE: '/api/v1/user-preferences',
  },
  FEEDBACK: {
    BY_INTERVENTION: (id: number | string) => `/api/v1/feedback/${id}`,
    ANALYTICS: '/api/v1/feedback/analytics',
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
    USER_STATUS: '110px',
    USER_ROLE: '150px',
    USER_COMPANY: '180px',
    USER_ACTIONS: '260px',
    COMPANY_STATUS: '130px',
    COMPANY_ADMIN: '190px',
    COMPANY_ACTIONS: '280px',
    SLA_HOURS: '90px',
    MATERIAL_NAME: '200px',
    MATERIAL_QUANTITY: '100px',
    MATERIAL_NOTE: '240px',
    MATERIAL_ACTIONS: '60px',
  },
} as const;

export const VALIDATION = {
  TITLE_MIN: 3,
  TITLE_MAX: 150,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 2000,
} as const;

export const MATERIAL_LIMITS = {
  NAME_MAX: 200,
  NOTE_MAX: 500,
  ITEMS_MAX: 50,
  QUANTITY_MIN: 0.01,
} as const;