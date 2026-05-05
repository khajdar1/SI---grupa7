import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { ServiceError, getErrorMessage } from './errors';

export interface AttachmentListItem {
  id: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  storageKey: string | null;
  url: string;
}

export interface AttachmentConfig {
  allowedMimeTypes: string[];
  maxFileSizeMb: number;
}

export async function getInterventionAttachments(interventionId: number): Promise<AttachmentListItem[]> {
  try {
    const response = await api.get<AttachmentListItem[]>(API_ENDPOINTS.INTERVENTIONS.ATTACHMENTS(interventionId));
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load attachments.'), error);
  }
}

export function buildDownloadUrl(attachmentId: number): string {
  return API_ENDPOINTS.ATTACHMENTS.DOWNLOAD(attachmentId);
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  try {
    await api.delete(API_ENDPOINTS.ATTACHMENTS.BY_ID(attachmentId));
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to delete attachment.'), error);
  }
}

export async function getAttachmentConfig(): Promise<AttachmentConfig> {
  try {
    const response = await api.get<AttachmentConfig>(API_ENDPOINTS.ATTACHMENTS.CONFIG);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load attachment configuration.'), error);
  }
}

export async function updateAttachmentConfig(config: AttachmentConfig): Promise<AttachmentConfig> {
  try {
    const response = await api.put<AttachmentConfig>(API_ENDPOINTS.ATTACHMENTS.CONFIG, config);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to update attachment configuration.'), error);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
