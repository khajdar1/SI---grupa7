import { ROUTES } from './index';

export interface NavItem {
  label: string;
  to: string;
}

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', to: ROUTES.HOME },
  { label: 'Dashboard', to: ROUTES.DASHBOARD },
  { label: 'Fault Reports', to: ROUTES.FAULT_REPORTS },
  { label: 'Interventions', to: ROUTES.INTERVENTIONS },
  { label: 'Assignments', to: ROUTES.ASSIGNMENTS },
  { label: 'Reports', to: ROUTES.REPORTS },
] as const;

export const OPERATIONS_NAV_ITEMS: readonly NavItem[] = [
  { label: 'New Intervention', to: ROUTES.INTERVENTION_NEW },
  { label: 'History', to: ROUTES.HISTORY },
  { label: 'Tickets', to: ROUTES.TICKETS },
  { label: 'Map', to: ROUTES.MAP },
  { label: 'Blocked Users', to: ROUTES.BLOCKED_USERS },
  { label: 'Reopen Requests', to: ROUTES.REOPEN_REQUESTS },
];

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Users', to: ROUTES.ADMIN },
  { label: 'Companies', to: ROUTES.ADMIN_COMPANIES },
  { label: 'Categories', to: ROUTES.ADMIN_CATEGORY },
  { label: 'SLA Config', to: ROUTES.ADMIN_SLA_CONFIG },
  { label: 'Attachment Config', to: ROUTES.ADMIN_ATTACHMENT_CONFIG },
];

export const MANAGEMENT_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Management', to: ROUTES.MANAGEMENT_DASHBOARD },
];

export const ACCOUNT_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Profile', to: ROUTES.PROFILE },
  { label: 'Company', to: ROUTES.COMPANY },
  { label: 'Settings', to: ROUTES.SETTINGS },
  { label: 'Logout', to: ROUTES.LOGOUT },
] as const;

export const AUTH_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Login', to: ROUTES.LOGIN },
  { label: 'Register', to: ROUTES.REGISTER },
  { label: 'Register Company', to: ROUTES.COMPANY_REGISTER },
  { label: 'Forgot Password', to: ROUTES.RESET_PASSWORD },
] as const;

export const HOME_CAPABILITY_CARDS = [
  {
    title: 'Fault intake',
    description: 'Anonymous or logged-in fault reporting with categories and location capture.',
  },
  {
    title: 'Dispatch',
    description: 'Coordinator workflow for priority ranking and team assignment balancing.',
  },
  {
    title: 'Operations',
    description: 'Status tracking, intervention history, and audit trail visibility.',
  },
  {
    title: 'Control plane',
    description: 'User management, company segregation, SLA rules, and notifications.',
  },
] as const;

