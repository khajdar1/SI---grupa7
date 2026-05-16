export interface FaultReportCompanyOption {
  id: number;
  name: string;
  contact: string | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FaultReportCategoryOption {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FaultReportOptionsResponse {
  companies: FaultReportCompanyOption[];
  categories: FaultReportCategoryOption[];
}

export interface FaultReportAttachmentPayload {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileContent?: string;
}

export interface FaultReportSubmissionPayload {
  companyId?: number;
  categoryId?: number;
  location?: string;
  description?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  templateId: string;
  templateName: string;
  isAuthenticated?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  attachments: FaultReportAttachmentPayload[];
}

export interface FaultReportSubmissionResponse {
  faultReportId: number;
  interventionId: number;
  referenceNumber: string;
  receivedAt: string;
}

// PBI-025: Detekcija duplikata prijave kvara
export interface DuplicateCheckPayload {
  userId: number;
  companyId: number;
  location: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PotentialDuplicateItem {
  interventionId: number;
  faultReportId: number;
  location: string;
  description: string;
  reportedAt: string;
  status: string;
  similarityScore: number;
}

export interface DuplicateCheckResponse {
  hasPotentialDuplicates: boolean;
  duplicates: PotentialDuplicateItem[];
}
