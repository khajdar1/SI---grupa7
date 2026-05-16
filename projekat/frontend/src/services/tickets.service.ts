import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData, withServiceError } from './errors';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketCategory = 'Technical question' | 'Application bug report' | 'Other';

export const TICKET_CATEGORIES: TicketCategory[] = [
  'Technical question',
  'Application bug report',
  'Other',
];

export interface TicketListItem {
  id: number;
  userId: number;
  title: string;
  category: string;
  status: TicketStatus;
  userBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: number;
  text: string;
  createdAt: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface TicketDetail extends TicketListItem {
  user: {
    active: boolean;
  };
  messages: TicketMessage[];
}

export interface CreateTicketPayload {
  title: string;
  category: string;
  message: string;
}

export interface AddMessagePayload {
  text: string;
}

export interface RequestAdminReviewPayload {
  adminUserId: number;
  reason: string;
}

export interface TicketAdminCandidate {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export interface BlockTicketUserPayload {
  reason: string;
}

export interface BlockedTicketUser {
  id: number;
  username: string;
  email: string;
  active: boolean;
  ticketUserBlocked: boolean;
}

export async function getUserTickets(): Promise<TicketListItem[]> {
  return getResponseData(
    () => api.get<TicketListItem[]>(API_ENDPOINTS.TICKETS.BASE),
    'Failed to load tickets.',
  );
}

export async function getTicketById(id: number): Promise<TicketDetail> {
  return getResponseData(
    () => api.get<TicketDetail>(API_ENDPOINTS.TICKETS.BY_ID(id)),
    'Failed to load ticket.',
  );
}

export async function createTicket(payload: CreateTicketPayload): Promise<TicketListItem> {
  return getResponseData(
    () => api.post<TicketListItem>(API_ENDPOINTS.TICKETS.BASE, payload),
    'Failed to create ticket.',
  );
}

export async function addTicketMessage(ticketId: number, payload: AddMessagePayload): Promise<TicketMessage> {
  return getResponseData(
    () => api.post<TicketMessage>(API_ENDPOINTS.TICKETS.MESSAGES(ticketId), payload),
    'Failed to send message.',
  );
}

export async function updateTicketStatus(ticketId: number, status: TicketStatus): Promise<TicketListItem> {
  return getResponseData(
    () => api.patch<TicketListItem>(API_ENDPOINTS.TICKETS.STATUS(ticketId), { status }),
    'Failed to update ticket status.',
  );
}

export async function getTicketAdminCandidates(): Promise<TicketAdminCandidate[]> {
  return getResponseData(
    () => api.get<TicketAdminCandidate[]>(API_ENDPOINTS.TICKETS.ADMIN_REVIEW_ADMINS),
    'Failed to load admins.',
  );
}

export async function requestTicketAdminReview(ticketId: number, payload: RequestAdminReviewPayload): Promise<void> {
  return withServiceError(
    async () => {
      await api.post(API_ENDPOINTS.TICKETS.ADMIN_REVIEW(ticketId), payload);
    },
    'Failed to request admin review.',
  );
}

export async function blockTicketUser(ticketId: number, payload: BlockTicketUserPayload): Promise<BlockedTicketUser> {
  return getResponseData(
    () => api.post<BlockedTicketUser>(API_ENDPOINTS.TICKETS.BLOCK_USER(ticketId), payload),
    'Failed to block ticket user.',
  );
}

export async function unblockTicketUser(ticketId: number): Promise<BlockedTicketUser> {
  return getResponseData(
    () => api.post<BlockedTicketUser>(API_ENDPOINTS.TICKETS.UNBLOCK_USER(ticketId)),
    'Failed to unblock ticket user.',
  );
}
