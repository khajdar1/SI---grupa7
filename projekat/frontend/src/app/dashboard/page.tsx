'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Factory,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Map,
  Paperclip,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Tag,
  Ticket,
  User,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';

import { EmptyState, PageHeader, PageLayout, StatCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants';
import { useI18n, type LanguageCode, type TranslationKey } from '@/lib/i18n';
import type { Company } from '@/models/Company';
import { getMyCompany } from '@/services/companies.service';
import { getDashboardSnapshot, type DashboardSnapshot } from '@/services/dashboard.service';
import {
  getInterventions,
  type InterventionListItem,
} from '@/services/interventions.service';
import {
  getManagementDashboard,
  type ManagementDashboardStats,
} from '@/services/management.service';
import { getUsers, type ManagedUser } from '@/services/users.service';

type DashboardRole =
  | 'ADMIN'
  | 'KOMPANIJA_ADMIN'
  | 'MENADZMENT'
  | 'KOORDINATOR'
  | 'SERVISER'
  | 'SUPPORT_AGENT'
  | 'KORISNIK';

type SessionUser = {
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roles?: string[];
};

type DashboardAction = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
};

type ActivityItem = {
  title: string;
  description: string;
  href: string;
  meta: string;
};

type RoleDashboardConfig = {
  label: string;
  title: string;
  subtitle: string;
  primaryAction: { label: string; href: string; icon: React.ReactNode };
  focusTitle: string;
  focusItems: string[];
  actions: DashboardAction[];
};

const ROLE_ALIASES: Record<DashboardRole, readonly string[]> = {
  ADMIN: ['admin', 'administrator'],
  KOMPANIJA_ADMIN: ['kompanijaadmin', 'companyadmin'],
  MENADZMENT: ['menadzment', 'management'],
  KOORDINATOR: ['koordinator', 'coordinator'],
  SERVISER: ['serviser'],
  SUPPORT_AGENT: ['supportagent', 'agentpodrske'],
  KORISNIK: ['korisnik'],
};

const ROLE_PRIORITY: readonly DashboardRole[] = [
  'ADMIN',
  'KOMPANIJA_ADMIN',
  'MENADZMENT',
  'KOORDINATOR',
  'SERVISER',
  'SUPPORT_AGENT',
  'KORISNIK',
];

const ACTIVE_STATUSES = new Set(['NEW', 'ASSIGNED', 'IN_PROGRESS']);

const ROLE_CONFIG: Record<DashboardRole, RoleDashboardConfig> = {
  ADMIN: {
    label: 'Admin',
    title: 'Admin Dashboard',
    subtitle: 'System governance, configuration, and account control from one place.',
    primaryAction: {
      label: 'Manage users',
      href: ROUTES.ADMIN,
      icon: <Users className="size-4" aria-hidden="true" />,
    },
    focusTitle: 'Administration focus',
    focusItems: [
      'Keep account roles and company ownership current.',
      'Review active categories, SLA profiles, and attachment rules.',
      'Use reports and management metrics to spot operational risk.',
    ],
    actions: [
      {
        title: 'Users',
        description: 'Create accounts, assign roles, and activate or deactivate users.',
        href: ROUTES.ADMIN,
        icon: <Users className="size-5 text-primary" aria-hidden="true" />,
      },
      {
        title: 'Companies',
        description: 'Approve registrations and assign company administrators.',
        href: ROUTES.ADMIN_COMPANIES,
        icon: <Building2 className="size-5 text-emerald-600" aria-hidden="true" />,
      },
      {
        title: 'Categories',
        description: 'Maintain the fault categories used by intake and interventions.',
        href: ROUTES.ADMIN_CATEGORY,
        icon: <Tag className="size-5 text-amber-600" aria-hidden="true" />,
      },
      {
        title: 'Attachment rules',
        description: 'Control upload limits and allowed file types.',
        href: ROUTES.ADMIN_ATTACHMENT_CONFIG,
        icon: <Paperclip className="size-5 text-violet-600" aria-hidden="true" />,
      },
    ],
  },
  KOMPANIJA_ADMIN: {
    label: 'Company Admin',
    title: 'Company Dashboard',
    subtitle: 'Company profile, fault intake, and service request follow-up.',
    primaryAction: {
      label: 'Company profile',
      href: ROUTES.COMPANY,
      icon: <Factory className="size-4" aria-hidden="true" />,
    },
    focusTitle: 'Company focus',
    focusItems: [
      'Keep contact, address, and identification data up to date.',
      'Submit service requests with enough location and category detail.',
      'Track accessible interventions connected to your reports.',
    ],
    actions: [
      {
        title: 'Company profile',
        description: 'Update the profile connected to your company admin account.',
        href: ROUTES.COMPANY,
        icon: <Factory className="size-5 text-primary" aria-hidden="true" />,
      },
      {
        title: 'Fault intake',
        description: 'Report a regular issue or emergency service request.',
        href: ROUTES.FAULT_REPORTS,
        icon: <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />,
      },
      {
        title: 'Profile',
        description: 'Review your account information and password settings.',
        href: ROUTES.PROFILE,
        icon: <User className="size-5 text-emerald-600" aria-hidden="true" />,
      },
    ],
  },
  MENADZMENT: {
    label: 'Management',
    title: 'Management Dashboard',
    subtitle: 'Executive overview of intervention volume, completion, and service quality.',
    primaryAction: {
      label: 'Open analytics',
      href: ROUTES.MANAGEMENT_DASHBOARD,
      icon: <BarChart2 className="size-4" aria-hidden="true" />,
    },
    focusTitle: 'Management focus',
    focusItems: [
      'Monitor active work, completed interventions, and resolution time.',
      'Use reports to evaluate SLA compliance and operational throughput.',
      'Review intervention history for recurring locations or categories.',
    ],
    actions: [
      {
        title: 'Analytics',
        description: 'Open the detailed management metrics workspace.',
        href: ROUTES.MANAGEMENT_DASHBOARD,
        icon: <BarChart2 className="size-5 text-primary" aria-hidden="true" />,
      },
      {
        title: 'Reports',
        description: 'Review intervention reports and service performance.',
        href: ROUTES.REPORTS,
        icon: <FileText className="size-5 text-emerald-600" aria-hidden="true" />,
      },
      {
        title: 'History',
        description: 'Inspect completed and archived intervention records.',
        href: ROUTES.HISTORY,
        icon: <Clock className="size-5 text-violet-600" aria-hidden="true" />,
      },
    ],
  },
  KOORDINATOR: {
    label: 'Coordinator',
    title: 'Coordinator Dashboard',
    subtitle: 'Plan interventions, assign servicers, and keep urgent work moving.',
    primaryAction: {
      label: 'New intervention',
      href: ROUTES.INTERVENTION_NEW,
      icon: <Plus className="size-4" aria-hidden="true" />,
    },
    focusTitle: 'Coordination focus',
    focusItems: [
      'Convert requests into planned work with clear priority and deadlines.',
      'Assign servicers before open work becomes overdue.',
      'Use map and reports views when triaging field operations.',
    ],
    actions: [
      {
        title: 'Plan work',
        description: 'Create planned maintenance or schedule new intervention work.',
        href: ROUTES.INTERVENTION_NEW,
        icon: <Plus className="size-5 text-primary" aria-hidden="true" />,
      },
      {
        title: 'Assignments',
        description: 'Balance workload and assign technicians.',
        href: ROUTES.ASSIGNMENTS,
        icon: <UserCheck className="size-5 text-emerald-600" aria-hidden="true" />,
      },
      {
        title: 'Map',
        description: 'Review intervention locations spatially.',
        href: ROUTES.MAP,
        icon: <Map className="size-5 text-violet-600" aria-hidden="true" />,
      },
      {
        title: 'Fault intake',
        description: 'Open reported faults that need operational follow-up.',
        href: ROUTES.FAULT_REPORTS,
        icon: <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />,
      },
    ],
  },
  SERVISER: {
    label: 'Technician',
    title: 'Technician Dashboard',
    subtitle: 'Your assigned interventions, deadlines, and field reporting shortcuts.',
    primaryAction: {
      label: 'My interventions',
      href: ROUTES.INTERVENTIONS,
      icon: <Wrench className="size-4" aria-hidden="true" />,
    },
    focusTitle: 'Field focus',
    focusItems: [
      'Start assigned work and keep intervention status current.',
      'Submit service reports when work is completed.',
      'Use history for context from similar previous interventions.',
    ],
    actions: [
      {
        title: 'Assigned work',
        description: 'Open your active intervention queue.',
        href: ROUTES.INTERVENTIONS,
        icon: <Wrench className="size-5 text-primary" aria-hidden="true" />,
      },
      {
        title: 'Reports',
        description: 'Write or update intervention reports.',
        href: ROUTES.REPORTS,
        icon: <FileText className="size-5 text-emerald-600" aria-hidden="true" />,
      },
      {
        title: 'History',
        description: 'Review resolved interventions and prior field notes.',
        href: ROUTES.HISTORY,
        icon: <Clock className="size-5 text-violet-600" aria-hidden="true" />,
      },
    ],
  },
  SUPPORT_AGENT: {
    label: 'Support Agent',
    title: 'Support Dashboard',
    subtitle: 'Follow support tickets and keep user conversations moving.',
    primaryAction: {
      label: 'Open tickets',
      href: ROUTES.TICKETS,
      icon: <Ticket className="size-4" aria-hidden="true" />,
    },
    focusTitle: 'Support focus',
    focusItems: [
      'Review new support tickets and respond inside the ticket thread.',
      'Escalate suspicious or sensitive conversations to an admin for review.',
      'Close tickets only after the support conversation is complete.',
    ],
    actions: [
      {
        title: 'Tickets',
        description: 'Open the support ticket queue and continue conversations.',
        href: ROUTES.TICKETS,
        icon: <Ticket className="size-5 text-primary" aria-hidden="true" />,
      },
      {
        title: 'Fault reports',
        description: 'Review submitted reports before answering user questions.',
        href: ROUTES.FAULT_REPORTS,
        icon: <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />,
      },
      {
        title: 'Interventions',
        description: 'Check intervention status, priority, assignment, and timing.',
        href: ROUTES.INTERVENTIONS,
        icon: <ClipboardList className="size-5 text-violet-600" aria-hidden="true" />,
      },
      {
        title: 'Profile',
        description: 'Review your support account information.',
        href: ROUTES.PROFILE,
        icon: <User className="size-5 text-emerald-600" aria-hidden="true" />,
      },
    ],
  },
  KORISNIK: {
    label: 'User',
    title: 'User Dashboard',
    subtitle: 'Submit faults and follow the interventions connected to your requests.',
    primaryAction: {
      label: 'Report a fault',
      href: ROUTES.FAULT_REPORTS,
      icon: <AlertTriangle className="size-4" aria-hidden="true" />,
    },
    focusTitle: 'User focus',
    focusItems: [
      'Report service problems with location, category, and attachments.',
      'Follow active interventions created from your reports.',
      'Keep your profile data current for service communication.',
    ],
    actions: [
      {
        title: 'Fault report',
        description: 'Submit a regular report or emergency request.',
        href: ROUTES.FAULT_REPORTS,
        icon: <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />,
      },
      {
        title: 'My interventions',
        description: 'Track interventions you are allowed to view.',
        href: ROUTES.INTERVENTIONS,
        icon: <ClipboardList className="size-5 text-primary" aria-hidden="true" />,
      },
      {
        title: 'Profile',
        description: 'Update your personal account details.',
        href: ROUTES.PROFILE,
        icon: <User className="size-5 text-emerald-600" aria-hidden="true" />,
      },
    ],
  },
};

const SUPPORT_TICKET_ACTION: DashboardAction = {
  title: 'Support ticket',
  description: 'Create a support ticket for application questions or problems.',
  href: ROUTES.TICKET_CREATE,
  icon: <Ticket className="size-5 text-rose-600" aria-hidden="true" />,
};

const DASHBOARD_TEXT_KEYS: Record<string, TranslationKey> = {
  Admin: 'dashboard.role.admin',
  'Admin Dashboard': 'dashboard.admin.title',
  'System governance, configuration, and account control from one place.': 'dashboard.admin.subtitle',
  'Manage users': 'dashboard.admin.primaryAction',
  'Administration focus': 'dashboard.admin.focusTitle',
  'Keep account roles and company ownership current.': 'dashboard.admin.focusRoles',
  'Review active categories, SLA profiles, and attachment rules.': 'dashboard.admin.focusRules',
  'Use reports and management metrics to spot operational risk.': 'dashboard.admin.focusReports',
  Users: 'dashboard.action.users',
  'Create accounts, assign roles, and activate or deactivate users.': 'dashboard.action.usersDescription',
  Companies: 'dashboard.action.companies',
  'Approve registrations and assign company administrators.': 'dashboard.action.companiesDescription',
  Categories: 'dashboard.action.categories',
  'Maintain the fault categories used by intake and interventions.': 'dashboard.action.categoriesDescription',
  'Attachment rules': 'dashboard.action.attachmentRules',
  'Control upload limits and allowed file types.': 'dashboard.action.attachmentRulesDescription',
  'Company Admin': 'dashboard.role.companyAdmin',
  'Company Dashboard': 'dashboard.company.title',
  'Company profile, fault intake, and service request follow-up.': 'dashboard.company.subtitle',
  'Company profile': 'dashboard.company.primaryAction',
  'Company focus': 'dashboard.company.focusTitle',
  'Keep contact, address, and identification data up to date.': 'dashboard.company.focusContact',
  'Submit service requests with enough location and category detail.': 'dashboard.company.focusRequests',
  'Track accessible interventions connected to your reports.': 'dashboard.company.focusTrack',
  'Update the profile connected to your company admin account.': 'dashboard.action.companyProfileDescription',
  'Fault intake': 'dashboard.action.faultIntake',
  'Report a regular issue or emergency service request.': 'dashboard.action.faultIntakeDescription',
  Profile: 'dashboard.action.profile',
  'Review your account information and password settings.': 'dashboard.action.profilePasswordDescription',
  Management: 'dashboard.role.management',
  'Management Dashboard': 'dashboard.management.title',
  'Executive overview of intervention volume, completion, and service quality.': 'dashboard.management.subtitle',
  'Open analytics': 'dashboard.management.primaryAction',
  'Management focus': 'dashboard.management.focusTitle',
  'Monitor active work, completed interventions, and resolution time.': 'dashboard.management.focusMonitor',
  'Use reports to evaluate SLA compliance and operational throughput.': 'dashboard.management.focusReports',
  'Review intervention history for recurring locations or categories.': 'dashboard.management.focusHistory',
  Analytics: 'dashboard.action.analytics',
  'Open the detailed management metrics workspace.': 'dashboard.action.analyticsDescription',
  Reports: 'dashboard.action.reports',
  'Review intervention reports and service performance.': 'dashboard.action.reportsDescription',
  History: 'dashboard.action.history',
  'Inspect completed and archived intervention records.': 'dashboard.action.historyDescription',
  Coordinator: 'dashboard.role.coordinator',
  'Coordinator Dashboard': 'dashboard.coordinator.title',
  'Plan interventions, assign servicers, and keep urgent work moving.': 'dashboard.coordinator.subtitle',
  'New intervention': 'dashboard.coordinator.primaryAction',
  'Coordination focus': 'dashboard.coordinator.focusTitle',
  'Convert requests into planned work with clear priority and deadlines.': 'dashboard.coordinator.focusPlan',
  'Assign servicers before open work becomes overdue.': 'dashboard.coordinator.focusAssign',
  'Use map and reports views when triaging field operations.': 'dashboard.coordinator.focusMap',
  'Plan work': 'dashboard.action.planWork',
  'Create planned maintenance or schedule new intervention work.': 'dashboard.action.planWorkDescription',
  Assignments: 'dashboard.action.assignments',
  'Balance workload and assign technicians.': 'dashboard.action.assignmentsDescription',
  Map: 'dashboard.action.map',
  'Review intervention locations spatially.': 'dashboard.action.mapDescription',
  'Open reported faults that need operational follow-up.': 'dashboard.action.faultFollowupDescription',
  Technician: 'dashboard.role.technician',
  'Technician Dashboard': 'dashboard.technician.title',
  'Your assigned interventions, deadlines, and field reporting shortcuts.': 'dashboard.technician.subtitle',
  'My interventions': 'dashboard.technician.primaryAction',
  'Field focus': 'dashboard.technician.focusTitle',
  'Start assigned work and keep intervention status current.': 'dashboard.technician.focusStart',
  'Submit service reports when work is completed.': 'dashboard.technician.focusReports',
  'Use history for context from similar previous interventions.': 'dashboard.technician.focusHistory',
  'Assigned work': 'dashboard.action.assignedWork',
  'Open your active intervention queue.': 'dashboard.action.assignedWorkDescription',
  'Write or update intervention reports.': 'dashboard.action.writeReportsDescription',
  'Review resolved interventions and prior field notes.': 'dashboard.action.fieldHistoryDescription',
  'Support Agent': 'dashboard.role.supportAgent',
  'Support Dashboard': 'dashboard.support.title',
  'Follow support tickets and keep user conversations moving.': 'dashboard.support.subtitle',
  'Open tickets': 'dashboard.support.primaryAction',
  'Support focus': 'dashboard.support.focusTitle',
  'Review new support tickets and respond inside the ticket thread.': 'dashboard.support.focusReview',
  'Escalate suspicious or sensitive conversations to an admin for review.': 'dashboard.support.focusEscalate',
  'Close tickets only after the support conversation is complete.': 'dashboard.support.focusClose',
  Tickets: 'dashboard.action.tickets',
  'Open the support ticket queue and continue conversations.': 'dashboard.action.ticketsDescription',
  'Fault reports': 'dashboard.action.faultReports',
  'Review submitted reports before answering user questions.': 'dashboard.action.faultReportsDescription',
  Interventions: 'dashboard.action.interventions',
  'Check intervention status, priority, assignment, and timing.': 'dashboard.action.interventionsDescription',
  'Review your support account information.': 'dashboard.action.supportProfileDescription',
  User: 'dashboard.role.user',
  'User Dashboard': 'dashboard.user.title',
  'Submit faults and follow the interventions connected to your requests.': 'dashboard.user.subtitle',
  'Report a fault': 'dashboard.user.primaryAction',
  'User focus': 'dashboard.user.focusTitle',
  'Report service problems with location, category, and attachments.': 'dashboard.user.focusReport',
  'Follow active interventions created from your reports.': 'dashboard.user.focusFollow',
  'Keep your profile data current for service communication.': 'dashboard.user.focusProfile',
  'Fault report': 'dashboard.action.faultReport',
  'Submit a regular report or emergency request.': 'dashboard.action.userFaultDescription',
  'Track interventions you are allowed to view.': 'dashboard.action.myInterventionsDescription',
  'Update your personal account details.': 'dashboard.action.personalProfileDescription',
  'Support ticket': 'dashboard.action.supportTicket',
  'Create a support ticket for application questions or problems.': 'dashboard.action.supportTicketDescription',
  'Active users': 'dashboard.stat.activeUsers',
  'Active interventions': 'dashboard.stat.activeInterventions',
  'API status': 'dashboard.stat.apiStatus',
  Completed: 'dashboard.stat.completed',
  'Avg. resolution': 'dashboard.stat.avgResolution',
  'High priority active': 'dashboard.stat.highPriorityActive',
  'Open work': 'dashboard.stat.openWork',
  Unassigned: 'dashboard.stat.unassigned',
  Overdue: 'dashboard.stat.overdue',
  'New requests': 'dashboard.stat.newRequests',
  'Assigned to me': 'dashboard.stat.assignedToMe',
  'In progress': 'dashboard.stat.inProgress',
  'Due soon': 'dashboard.stat.dueSoon',
  'High priority': 'dashboard.stat.highPriority',
  'Support tickets': 'dashboard.stat.supportTickets',
  'Open support': 'dashboard.stat.openSupport',
  'Admin escalations': 'dashboard.stat.adminEscalations',
  'Company status': 'dashboard.stat.companyStatus',
  'Open requests': 'dashboard.stat.openRequests',
  'Active categories': 'dashboard.stat.activeCategories',
  'My open requests': 'dashboard.stat.myOpenRequests',
  Assigned: 'dashboard.stat.assigned',
  New: 'dashboard.stat.new',
};

function translateDashboardText(t: (key: TranslationKey) => string, value: string): string {
  const key = DASHBOARD_TEXT_KEYS[value];
  return key ? t(key) : value;
}

function translateAction(t: (key: TranslationKey) => string, action: DashboardAction): DashboardAction {
  return {
    ...action,
    title: translateDashboardText(t, action.title),
    description: translateDashboardText(t, action.description),
  };
}

function translateRoleConfig(
  t: (key: TranslationKey) => string,
  config: RoleDashboardConfig,
): RoleDashboardConfig {
  return {
    ...config,
    label: translateDashboardText(t, config.label),
    title: translateDashboardText(t, config.title),
    subtitle: translateDashboardText(t, config.subtitle),
    primaryAction: {
      ...config.primaryAction,
      label: translateDashboardText(t, config.primaryAction.label),
    },
    focusTitle: translateDashboardText(t, config.focusTitle),
    focusItems: config.focusItems.map((item) => translateDashboardText(t, item)),
    actions: config.actions.map((action) => translateAction(t, action)),
  };
}

function decodeJwtPayload(token: string): {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
} | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function readSession(): { user: SessionUser | null; roles: string[] } {
  if (typeof window === 'undefined') {
    return { user: null, roles: [] };
  }

  const roles = new Set<string>();
  const rawUser = window.localStorage.getItem('user');
  const token = window.localStorage.getItem('token');
  let user: SessionUser | null = null;

  try {
    user = rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
    if (user?.role) {
      roles.add(user.role.toLowerCase());
    }
    user?.roles?.forEach((role) => roles.add(role.toLowerCase()));
  } catch {
    user = null;
  }

  if (token) {
    const payload = decodeJwtPayload(token);
    payload?.realm_access?.roles?.forEach((role) => roles.add(role.toLowerCase()));
    Object.values(payload?.resource_access ?? {}).forEach((clientAccess) => {
      clientAccess.roles?.forEach((role) => roles.add(role.toLowerCase()));
    });
  }

  return { user, roles: Array.from(roles) };
}

function resolveDashboardRole(roles: readonly string[]): DashboardRole {
  const normalizedRoles = new Set(roles.map((role) => role.toLowerCase()));

  return (
    ROLE_PRIORITY.find((role) =>
      ROLE_ALIASES[role].some((alias) => normalizedRoles.has(alias)),
    ) ?? 'KORISNIK'
  );
}

function hasRole(roles: readonly string[], role: DashboardRole): boolean {
  const normalizedRoles = new Set(roles.map((item) => item.toLowerCase()));
  return ROLE_ALIASES[role].some((alias) => normalizedRoles.has(alias));
}

function formatDateTime(value: string | null, language: LanguageCode, t: (key: TranslationKey) => string): string {
  if (!value) {
    return t('dashboard.noDeadline');
  }

  return new Intl.DateTimeFormat(language === 'bs' ? 'bs-BA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatHours(hours: number | null): string {
  if (hours === null) {
    return '-';
  }

  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }

  return `${hours.toFixed(1)} h`;
}

function formatPriority(value: string, t: (key: TranslationKey) => string): string {
  const keyByPriority: Record<string, TranslationKey> = {
    LOW: 'priority.low',
    MEDIUM: 'priority.medium',
    HIGH: 'priority.high',
    CRITICAL: 'priority.critical',
  };

  return keyByPriority[value] ? t(keyByPriority[value]) : value;
}

function formatInterventionStatus(value: string, t: (key: TranslationKey) => string): string {
  const keyByStatus: Record<string, TranslationKey> = {
    NEW: 'interventionStatus.new',
    ASSIGNED: 'interventionStatus.assigned',
    IN_PROGRESS: 'interventionStatus.inProgress',
    COMPLETED: 'interventionStatus.completed',
    CANCELLED: 'interventionStatus.cancelled',
  };

  return keyByStatus[value] ? t(keyByStatus[value]) : value.replace(/_/g, ' ');
}

function getInterventionSummary(interventions: InterventionListItem[], currentUserId?: number) {
  const now = new Date();
  const dueSoonLimit = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const activeInterventions = interventions.filter((item) => ACTIVE_STATUSES.has(item.status));
  const assignedToMe = currentUserId
    ? activeInterventions.filter((item) =>
        item.assignments?.some((assignment) => assignment.userId === currentUserId),
      )
    : activeInterventions;

  return {
    active: activeInterventions.length,
    newItems: activeInterventions.filter((item) => item.status === 'NEW').length,
    assigned: activeInterventions.filter((item) => item.status === 'ASSIGNED').length,
    inProgress: activeInterventions.filter((item) => item.status === 'IN_PROGRESS').length,
    highPriority: activeInterventions.filter((item) => item.priority === 'HIGH' || item.priority === 'CRITICAL').length,
    overdue: activeInterventions.filter((item) => item.isOverdue).length,
    unassigned: activeInterventions.filter((item) => (item.assignments?.length ?? 0) === 0).length,
    assignedToMe: assignedToMe.length,
    dueSoon: assignedToMe.filter((item) => {
      if (!item.dueAt) {
        return false;
      }

      const dueAt = new Date(item.dueAt);
      return dueAt >= now && dueAt <= dueSoonLimit;
    }).length,
  };
}

function getRecentItems(
  interventions: InterventionListItem[],
  language: LanguageCode,
  t: (key: TranslationKey) => string,
): ActivityItem[] {
  return interventions.slice(0, 5).map((item) => ({
    title: item.name,
    description: `${item.companyName} - ${item.location}`,
    href: ROUTES.INTERVENTION(item.id),
    meta: `${formatPriority(item.priority, t)} / ${formatInterventionStatus(item.status, t)} / ${formatDateTime(item.dueAt, language, t)}`,
  }));
}

function StatSkeletonGrid() {
  const { t } = useI18n();

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('dashboard.loadingStats')}>
      {[...Array(4)].map((_, index) => (
        <StatCard key={index} title={t('dashboard.loading')} value="-" isLoading />
      ))}
    </section>
  );
}

function QuickActionCard({ action }: { action: DashboardAction }) {
  const { t } = useI18n();

  return (
    <Card className="border border-slate-200/70 bg-white/90 shadow-[0_2px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="icon-bg-primary flex size-11 items-center justify-center rounded-xl">
            {action.icon}
          </div>
          <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">{action.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{action.description}</p>
        </div>
        <Button asChild variant="outline" className="mt-auto justify-between">
          <Link href={action.href}>
            {t('dashboard.open')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function FocusPanel({ config }: { config: RoleDashboardConfig }) {
  return (
    <Card className="border border-slate-200/70 bg-white/90 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="size-5 text-primary" aria-hidden="true" />
          {config.focusTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {config.focusItems.map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityList({
  items,
  isLoading,
}: {
  items: ActivityItem[];
  isLoading: boolean;
}) {
  const { t } = useI18n();

  return (
    <Card className="border border-slate-200/70 bg-white/90 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5 text-primary" aria-hidden="true" />
          {t('dashboard.recentActiveWork')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-1 py-3 transition-colors hover:text-primary sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">{item.meta}</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('dashboard.noActiveWork')}
            description={t('dashboard.noActiveWorkDescription')}
            className="min-h-40"
          />
        )}
      </CardContent>
    </Card>
  );
}

function buildRoleStats(params: {
  role: DashboardRole;
  snapshot: DashboardSnapshot | null;
  interventions: InterventionListItem[];
  managementStats: ManagementDashboardStats | null;
  users: ManagedUser[];
  company: Company | null;
  currentUserId?: number;
  t: (key: TranslationKey) => string;
}) {
  const { role, snapshot, interventions, managementStats, users, company, currentUserId, t } = params;
  const summary = getInterventionSummary(interventions, currentUserId);

  if (role === 'ADMIN') {
    const activeUsers = users.filter((user) => user.active).length;
    return [
      { title: t('dashboard.stat.users'), value: users.length, icon: <Users className="size-5 text-primary" aria-hidden="true" /> },
      { title: t('dashboard.stat.activeUsers'), value: activeUsers, icon: <UserCheck className="size-5 text-emerald-600" aria-hidden="true" /> },
      { title: t('dashboard.stat.activeInterventions'), value: summary.active, icon: <Wrench className="size-5 text-violet-600" aria-hidden="true" /> },
      {
        title: t('dashboard.stat.apiStatus'),
        value: snapshot?.stats.find((stat) => stat.title === 'API status')?.value ?? '-',
        icon: <Shield className="size-5 text-amber-600" aria-hidden="true" />,
      },
    ];
  }

  if (role === 'MENADZMENT') {
    return [
      {
        title: t('dashboard.stat.activeInterventions'),
        value: managementStats?.activeCount ?? summary.active,
        icon: <Wrench className="size-5 text-primary" aria-hidden="true" />,
      },
      {
        title: t('dashboard.stat.completed'),
        value: managementStats?.completedCount ?? '-',
        icon: <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />,
      },
      {
        title: t('dashboard.stat.avgResolution'),
        value: managementStats ? formatHours(managementStats.averageResolutionHours) : '-',
        icon: <Clock className="size-5 text-violet-600" aria-hidden="true" />,
      },
      {
        title: t('dashboard.stat.highPriorityActive'),
        value: summary.highPriority,
        icon: <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />,
      },
    ];
  }

  if (role === 'KOORDINATOR') {
    return [
      { title: t('dashboard.stat.openWork'), value: summary.active, icon: <ClipboardList className="size-5 text-primary" aria-hidden="true" /> },
      { title: t('dashboard.stat.unassigned'), value: summary.unassigned, icon: <UserCheck className="size-5 text-emerald-600" aria-hidden="true" /> },
      { title: t('dashboard.stat.overdue'), value: summary.overdue, icon: <Clock className="size-5 text-rose-600" aria-hidden="true" /> },
      { title: t('dashboard.stat.newRequests'), value: summary.newItems, icon: <Ticket className="size-5 text-amber-600" aria-hidden="true" /> },
    ];
  }

  if (role === 'SERVISER') {
    return [
      { title: t('dashboard.stat.assignedToMe'), value: summary.assignedToMe, icon: <Wrench className="size-5 text-primary" aria-hidden="true" /> },
      { title: t('dashboard.stat.inProgress'), value: summary.inProgress, icon: <RefreshCw className="size-5 text-emerald-600" aria-hidden="true" /> },
      { title: t('dashboard.stat.dueSoon'), value: summary.dueSoon, icon: <Clock className="size-5 text-amber-600" aria-hidden="true" /> },
      { title: t('dashboard.stat.highPriority'), value: summary.highPriority, icon: <AlertTriangle className="size-5 text-rose-600" aria-hidden="true" /> },
    ];
  }

  if (role === 'SUPPORT_AGENT') {
    return [
      { title: t('dashboard.stat.supportTickets'), value: '-', icon: <Ticket className="size-5 text-primary" aria-hidden="true" /> },
      { title: t('dashboard.stat.openSupport'), value: '-', icon: <ClipboardList className="size-5 text-emerald-600" aria-hidden="true" /> },
      { title: t('dashboard.stat.adminEscalations'), value: '-', icon: <Shield className="size-5 text-amber-600" aria-hidden="true" /> },
      {
        title: t('dashboard.stat.apiStatus'),
        value: snapshot?.stats.find((stat) => stat.title === 'API status')?.value ?? '-',
        icon: <Shield className="size-5 text-violet-600" aria-hidden="true" />,
      },
    ];
  }

  if (role === 'KOMPANIJA_ADMIN') {
    return [
      {
        title: t('dashboard.stat.companyStatus'),
        value: company?.status ?? '-',
        icon: <Factory className="size-5 text-primary" aria-hidden="true" />,
      },
      {
        title: t('dashboard.stat.openRequests'),
        value: summary.active,
        icon: <ClipboardList className="size-5 text-emerald-600" aria-hidden="true" />,
      },
      {
        title: t('dashboard.stat.activeCategories'),
        value: snapshot?.stats.find((stat) => stat.title === 'Active categories')?.value ?? '-',
        icon: <Tag className="size-5 text-violet-600" aria-hidden="true" />,
      },
      {
        title: t('dashboard.stat.apiStatus'),
        value: snapshot?.stats.find((stat) => stat.title === 'API status')?.value ?? '-',
        icon: <Shield className="size-5 text-amber-600" aria-hidden="true" />,
      },
    ];
  }

  return [
    { title: t('dashboard.stat.myOpenRequests'), value: summary.active, icon: <ClipboardList className="size-5 text-primary" aria-hidden="true" /> },
    { title: t('dashboard.stat.inProgress'), value: summary.inProgress, icon: <RefreshCw className="size-5 text-emerald-600" aria-hidden="true" /> },
    { title: t('dashboard.stat.assigned'), value: summary.assigned, icon: <UserCheck className="size-5 text-violet-600" aria-hidden="true" /> },
    { title: t('dashboard.stat.new'), value: summary.newItems, icon: <Ticket className="size-5 text-amber-600" aria-hidden="true" /> },
  ];
}

export default function DashboardPage() {
  const { language, t } = useI18n();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionRoles, setSessionRoles] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [interventions, setInterventions] = useState<InterventionListItem[]>([]);
  const [managementStats, setManagementStats] = useState<ManagementDashboardStats | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = useMemo(() => resolveDashboardRole(sessionRoles), [sessionRoles]);
  const baseConfig = ROLE_CONFIG[role];
  const config = useMemo(() => translateRoleConfig(t, baseConfig), [baseConfig, t]);
  const currentUserId = sessionUser?.id;

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const session = readSession();
      const resolvedRole = resolveDashboardRole(session.roles);
      const canLoadManagement = hasRole(session.roles, 'MENADZMENT') || hasRole(session.roles, 'ADMIN');
      const canLoadAdmin = hasRole(session.roles, 'ADMIN');
      const canLoadCompany = resolvedRole === 'KOMPANIJA_ADMIN';

      setSessionUser(session.user);
      setSessionRoles(session.roles);

      const [
        snapshotResult,
        interventionsResult,
        managementResult,
        usersResult,
        companyResult,
      ] = await Promise.allSettled([
        getDashboardSnapshot(),
        getInterventions(),
        canLoadManagement ? getManagementDashboard() : Promise.resolve(null),
        canLoadAdmin ? getUsers() : Promise.resolve([]),
        canLoadCompany ? getMyCompany() : Promise.resolve(null),
      ]);

      if (snapshotResult.status === 'fulfilled') {
        setSnapshot(snapshotResult.value);
      } else {
        setSnapshot(null);
        setError(snapshotResult.reason instanceof Error ? snapshotResult.reason.message : t('dashboard.loadSnapshotError'));
      }

      setInterventions(interventionsResult.status === 'fulfilled' ? interventionsResult.value.items : []);
      setManagementStats(managementResult.status === 'fulfilled' ? managementResult.value : null);
      setUsers(usersResult.status === 'fulfilled' ? usersResult.value : []);
      setCompany(companyResult.status === 'fulfilled' ? companyResult.value : null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const roleStats = useMemo(
    () =>
      buildRoleStats({
        role,
        snapshot,
        interventions,
        managementStats,
        users,
        company,
        currentUserId,
        t,
      }),
    [company, currentUserId, interventions, managementStats, role, snapshot, t, users],
  );
  const recentItems = useMemo(() => getRecentItems(interventions, language, t), [interventions, language, t]);
  const quickActions = useMemo(
    () => (role === 'SUPPORT_AGENT' ? config.actions : [...config.actions, translateAction(t, SUPPORT_TICKET_ACTION)]),
    [config.actions, role, t],
  );
  const displayName = sessionUser?.firstName
    ? `${sessionUser.firstName}${sessionUser.lastName ? ` ${sessionUser.lastName}` : ''}`
    : sessionUser?.username;

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={config.title}
        subtitle={displayName ? `${config.subtitle} ${t('dashboard.signedInAs')} ${displayName}.` : config.subtitle}
        breadcrumbs={[{ label: t('nav.home'), href: ROUTES.HOME }, { label: t('nav.dashboard') }]}
        primaryAction={{
          ...config.primaryAction,
        }}
        secondaryActions={[
          {
            label: t('dashboard.refresh'),
            onClick: () => void loadDashboard(),
            variant: 'outline',
            icon: <RefreshCw className="size-4" aria-hidden="true" />,
            isLoading,
          },
        ]}
      />

      {error ? (
        <EmptyState title={t('dashboard.snapshotUnavailable')} description={error} action={{ label: t('dashboard.retry'), onClick: loadDashboard }} />
      ) : null}

      {isLoading ? (
        <StatSkeletonGrid />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={`${config.label} ${t('dashboard.statsAria')}`}>
          {roleStats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              isLoading={isLoading}
            />
          ))}
        </section>
      )}

      <FocusPanel config={config} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label={`${config.label} ${t('dashboard.shortcutsAria')}`}>
        {quickActions.map((action) => (
          <QuickActionCard key={action.title} action={action} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <ActivityList items={recentItems} isLoading={isLoading} />

        <Card className="border border-slate-200/70 bg-white/90 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="size-5 text-primary" aria-hidden="true" />
              {t('dashboard.systemSnapshot')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, index) => (
                  <Skeleton key={index} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            ) : snapshot?.stats.length ? (
              <div className="space-y-2">
                {snapshot.stats.map((stat) => (
                  <div key={stat.title} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/70 px-3 py-2">
                    <span className="text-sm text-muted-foreground">{translateDashboardText(t, stat.title)}</span>
                    <span className="text-sm font-semibold tabular-nums">{stat.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('dashboard.noSnapshotData')}</p>
            )}

            <Button asChild className="mt-4 w-full justify-between" variant="outline">
              <Link href={ROUTES.SETTINGS}>
                {t('dashboard.openSettings')}
                <Settings className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
