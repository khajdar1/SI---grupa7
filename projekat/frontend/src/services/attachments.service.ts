import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData, withServiceError } from './errors';

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
  return getResponseData(
    () => api.get<AttachmentListItem[]>(API_ENDPOINTS.INTERVENTIONS.ATTACHMENTS(interventionId)),
    'Failed to load attachments.',
  );
}

export async function downloadAttachment(attachmentId: number, fileName: string): Promise<void> {
  return withServiceError(async () => {
    const response = await api.get<Blob>(API_ENDPOINTS.ATTACHMENTS.DOWNLOAD(attachmentId), {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'Failed to download attachment.');
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  return withServiceError(async () => {
    await api.delete(API_ENDPOINTS.ATTACHMENTS.BY_ID(attachmentId));
  }, 'Failed to delete attachment.');
}

export async function getAttachmentConfig(): Promise<AttachmentConfig> {
  return getResponseData(
    () => api.get<AttachmentConfig>(API_ENDPOINTS.ATTACHMENTS.CONFIG),
    'Failed to load attachment configuration.',
  );
}

export async function updateAttachmentConfig(config: AttachmentConfig): Promise<AttachmentConfig> {
  return getResponseData(
    () => api.put<AttachmentConfig>(API_ENDPOINTS.ATTACHMENTS.CONFIG, config),
    'Failed to update attachment configuration.',
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
