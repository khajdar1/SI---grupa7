import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData, withServiceError } from './errors';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketCategory = 'Tehničko pitanje' | 'Prijava greške u aplikaciji' | 'Ostalo';

export const TICKET_CATEGORIES: TicketCategory[] = [
  'Tehničko pitanje',
  'Prijava greške u aplikaciji',
  'Ostalo',
];

export interface TicketListItem {
  id: number;
  userId: number;
  title: string;
  category: string;
  status: TicketStatus;
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
