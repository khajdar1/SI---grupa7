import { BadRequestError } from "../../shared/errors";
import { resolvePersistableLocation } from "../../services/geocoding.service";

// Time window in hours used to search for potential duplicates.
export const DUPLICATE_DETECTION_WINDOW_HOURS = 48;

// Minimum similarity percentage (word-level Jaccard) required to mark a report as a duplicate.
export const DUPLICATE_SIMILARITY_THRESHOLD = 0.25;

// Maximum GPS distance in kilometers for locations to be treated as the same place.
export const DUPLICATE_LOCATION_RADIUS_KM = 0.5;

export interface PotentialDuplicateItem {
  interventionId: number;
  faultReportId: number;
  location: string;
  description: string;
  reportedAt: Date;
  status: string;
  similarityScore: number;
}

export interface DuplicateCheckInput {
  userId: number;
  companyId: number;
  location: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DuplicateCheckResult {
  hasPotentialDuplicates: boolean;
  duplicates: PotentialDuplicateItem[];
}

/** Word-set Jaccard similarity (case-insensitive, minimum 3 letters). */
export function computeTextSimilarity(a: string, b: string): number {
  const tokenize = (text: string): Set<string> =>
    new Set(
      text
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 2),
    );

  const setA = tokenize(a);
  const setB = tokenize(b);

  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

/** Haversine udaljenost u kilometrima */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Location similarity: GPS first, then text fallback. */
export function computeLocationSimilarity(
  locA: string,
  latA: number | null | undefined,
  lonA: number | null | undefined,
  locB: string,
  latB: number | null | undefined,
  lonB: number | null | undefined,
): number {
  if (latA != null && lonA != null && latB != null && lonB != null) {
    const distKm = haversineKm(latA, lonA, latB, lonB);
    return distKm < DUPLICATE_LOCATION_RADIUS_KM ? 1 : 0;
  }
  return computeTextSimilarity(locA, locB);
}

export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export interface FaultReportCompanyOption {
  id: number;
  name: string;
  contact: string | null;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaultReportCategoryOption {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaultReportInterventionListItem {
  id: number;
  name: string;
  description: string;
  location: string;
  priority: string;
  status: string;
  createdAt: Date;
  category: {
    id: number;
    name: string;
  };
  company: {
    id: number;
    name: string;
  };
}

export interface FaultReportAttachmentInput {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileContent?: string;
}

export interface FaultReportSubmissionInput {
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
  reporterUserId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  attachments: FaultReportAttachmentInput[];
}

export interface FaultReportSubmissionResult {
  faultReportId: number;
  interventionId: number;
  referenceNumber: string;
  receivedAt: Date;
}

export interface FaultReportSubmissionPayload extends Omit<
  FaultReportSubmissionInput,
  "description" | "reporterEmail"
> {
  description: string;
  reporterEmail: string;
  creatorId: number;
  reporterUserId?: number | null;
}

export interface RecentFaultReportCandidate {
  faultReportId: number;
  interventionId: number;
  location: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  reportedAt: Date;
  interventionStatus: string;
}

export interface FaultReportRepository {
  listCompanies(): Promise<FaultReportCompanyOption[]>;
  listActiveCategories(): Promise<FaultReportCategoryOption[]>;
  listActiveInterventions(): Promise<FaultReportInterventionListItem[]>;
  findCompanyById(
    companyId: number,
  ): Promise<{ id: number; name: string } | null>;
  findCategoryById(
    categoryId: number,
  ): Promise<{ id: number; name: string; active: boolean } | null>;
  findSystemUser(): Promise<{ id: number }>;
  createSubmission(
    input: FaultReportSubmissionPayload,
  ): Promise<FaultReportSubmissionResult>;
  getConfig(): Promise<{ allowedMimeTypes: string[]; maxFileSizeMb: number }>;
  findRecentFaultReports(
    userId: number,
    companyId: number,
    windowHours: number,
  ): Promise<RecentFaultReportCandidate[]>;
}

// Statuses that mean the intervention is complete and should not be treated as a duplicate.
const TERMINAL_STATUSES = new Set(["RESOLVED", "CANCELLED", "REJECTED"]);

export class FaultReportService {
  constructor(private readonly repository: FaultReportRepository) {}

  async listCompanies(): Promise<FaultReportCompanyOption[]> {
    return this.repository.listCompanies();
  }

  async listActiveCategories(): Promise<FaultReportCategoryOption[]> {
    return this.repository.listActiveCategories();
  }

  async listActiveInterventions(): Promise<FaultReportInterventionListItem[]> {
    return this.repository.listActiveInterventions();
  }

  async checkDuplicates(
    input: DuplicateCheckInput,
  ): Promise<DuplicateCheckResult> {
    const candidates = await this.repository.findRecentFaultReports(
      input.userId,
      input.companyId,
      DUPLICATE_DETECTION_WINDOW_HOURS,
    );

    const duplicates: PotentialDuplicateItem[] = [];

    for (const candidate of candidates) {
      // Skip completed interventions.
      if (TERMINAL_STATUSES.has(candidate.interventionStatus)) continue;

      const locationScore = computeLocationSimilarity(
        input.location,
        input.latitude,
        input.longitude,
        candidate.location,
        candidate.latitude,
        candidate.longitude,
      );

      // Skip when locations are completely different.
      if (locationScore === 0) continue;

      const descriptionScore = computeTextSimilarity(
        input.description,
        candidate.description,
      );

      // Combined score: location has higher weight (60%), description lower (40%).
      const combinedScore = locationScore * 0.6 + descriptionScore * 0.4;

      if (combinedScore >= DUPLICATE_SIMILARITY_THRESHOLD) {
        duplicates.push({
          interventionId: candidate.interventionId,
          faultReportId: candidate.faultReportId,
          location: candidate.location,
          description: candidate.description,
          reportedAt: candidate.reportedAt,
          status: candidate.interventionStatus,
          similarityScore: Math.round(combinedScore * 100),
        });
      }
    }

    // Sort by similarity descending.
    duplicates.sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      hasPotentialDuplicates: duplicates.length > 0,
      duplicates,
    };
  }

  async submitFaultReport(
    input: FaultReportSubmissionInput,
  ): Promise<FaultReportSubmissionResult> {
    const isRegular = input.templateId === "regular-report";
    const config = await this.repository.getConfig();
    const attachmentErrors = this.validateAttachments(
      input.attachments,
      Boolean(input.isAuthenticated),
      isRegular,
      config,
    );
    if (attachmentErrors.length > 0) {
      throw new BadRequestError("Invalid attachment data.", attachmentErrors);
    }

    // For regular reports we require authenticated user and core fields
    if (isRegular) {
      if (!input.isAuthenticated) {
        throw new BadRequestError(
          "Regular reports are allowed only for authenticated users.",
          [
            {
              field: "isAuthenticated",
              message: "Authentication required for regular report.",
            },
          ],
        );
      }

      if (!input.companyId) {
        throw new BadRequestError("Company is required for regular reports.", [
          {
            field: "companyId",
            message: "Company is required for regular reports.",
          },
        ]);
      }

      if (!input.categoryId) {
        throw new BadRequestError("Category is required for regular reports.", [
          {
            field: "categoryId",
            message: "Category is required for regular reports.",
          },
        ]);
      }

      if (!input.location || input.location.trim().length < 3) {
        throw new BadRequestError("Location is required for regular reports.", [
          {
            field: "location",
            message: "Location is required for regular reports.",
          },
        ]);
      }

      if (!input.description || input.description.trim().length === 0) {
        throw new BadRequestError(
          "Description is required for regular reports.",
          [
            {
              field: "description",
              message: "Description is required for regular reports.",
            },
          ],
        );
      }

      // Attachments are optional for regular reports now. If provided, they will be validated above.
      const resolvedLocation = await resolvePersistableLocation({
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        required: true,
      });

      // verify provided company and category
      const [company, category, systemUser] = await Promise.all([
        this.repository.findCompanyById(input.companyId),
        this.repository.findCategoryById(input.categoryId),
        this.repository.findSystemUser(),
      ]);

      if (!company) {
        throw new BadRequestError("Selected company is not available.", [
          { field: "companyId", message: "Selected company is not available." },
        ]);
      }

      if (!category) {
        throw new BadRequestError("Selected category is not available.", [
          {
            field: "categoryId",
            message: "Selected category is not available.",
          },
        ]);
      }

      if (!category.active) {
        throw new BadRequestError("Selected category is inactive.", [
          { field: "categoryId", message: "Selected category is inactive." },
        ]);
      }

      return this.repository.createSubmission({
        ...input,
        companyId: company.id,
        categoryId: category.id,
        location: resolvedLocation.location,
        latitude: resolvedLocation.latitude,
        longitude: resolvedLocation.longitude,
        description: input.description!.trim(),
        reporterName: input.reporterName?.trim() ?? "",
        reporterEmail: input.reporterEmail?.trim() ?? "",
        reporterPhone: input.reporterPhone?.trim() ?? "",
        templateId: input.templateId.trim(),
        templateName: input.templateName.trim(),
        isAuthenticated: Boolean(input.isAuthenticated),
        creatorId: systemUser.id,
        reporterUserId: input.reporterUserId ?? null,
        attachments: input.attachments.map((attachment) => ({
          fileName: attachment.fileName.trim(),
          mimeType: attachment.mimeType.trim(),
          fileSize: attachment.fileSize,
          fileContent: attachment.fileContent,
        })),
      });
    }

    // Emergency flow: only template + reporter details required for guests; for authenticated users reporter details are optional
    // If company/category were provided use them; otherwise pick sensible defaults
    const systemUser = await this.repository.findSystemUser();
    let companyIdToUse: number | undefined = input.companyId;
    let categoryIdToUse: number | undefined = input.categoryId;

    if (input.companyId) {
      const providedCompany = await this.repository.findCompanyById(
        input.companyId,
      );
      if (!providedCompany) {
        throw new BadRequestError("Selected company is not available.", [
          { field: "companyId", message: "Selected company is not available." },
        ]);
      }
      companyIdToUse = providedCompany.id;
    }

    if (input.categoryId) {
      const providedCategory = await this.repository.findCategoryById(
        input.categoryId,
      );
      if (!providedCategory) {
        throw new BadRequestError("Selected category is not available.", [
          {
            field: "categoryId",
            message: "Selected category is not available.",
          },
        ]);
      }

      if (!providedCategory.active) {
        throw new BadRequestError("Selected category is inactive.", [
          { field: "categoryId", message: "Selected category is inactive." },
        ]);
      }

      categoryIdToUse = providedCategory.id;
    }

    if (!companyIdToUse || !categoryIdToUse) {
      const [companies, categories] = await Promise.all([
        this.repository.listCompanies(),
        this.repository.listActiveCategories(),
      ]);

      const defaultCompany = companies[0];
      const defaultCategory = categories[0];

      if (!defaultCompany) {
        throw new BadRequestError(
          "No company available to associate with emergency report.",
          [{ field: "companyId", message: "No company available." }],
        );
      }

      if (!defaultCategory) {
        throw new BadRequestError(
          "No active category available to associate with emergency report.",
          [{ field: "categoryId", message: "No active category available." }],
        );
      }

      companyIdToUse = companyIdToUse ?? defaultCompany.id;
      categoryIdToUse = categoryIdToUse ?? defaultCategory.id;
    }

    // For guests, require reporter name and phone
    if (!input.isAuthenticated) {
      if (!input.reporterName || input.reporterName.trim().length < 2) {
        throw new BadRequestError(
          "Reporter name is required for emergency reports from guests.",
          [{ field: "reporterName", message: "Reporter name is required." }],
        );
      }

      if (!input.reporterPhone || input.reporterPhone.trim().length < 5) {
        throw new BadRequestError(
          "Reporter phone is required for emergency reports from guests.",
          [{ field: "reporterPhone", message: "Reporter phone is required." }],
        );
      }
    }

    const resolvedLocation = await resolvePersistableLocation({
      location: input.location,
      latitude: input.latitude,
      longitude: input.longitude,
      required: false,
    });

    return this.repository.createSubmission({
      ...input,
      companyId: companyIdToUse!,
      categoryId: categoryIdToUse!,
      location: resolvedLocation.location,
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
      description: input.description?.trim() ?? "",
      reporterName: input.reporterName?.trim() ?? "",
      reporterEmail: input.reporterEmail?.trim() ?? "",
      reporterPhone: input.reporterPhone?.trim() ?? "",
      templateId: input.templateId.trim(),
      templateName: input.templateName.trim(),
      isAuthenticated: Boolean(input.isAuthenticated),
      creatorId: systemUser.id,
      reporterUserId: input.reporterUserId ?? null,
      attachments: input.attachments.map((attachment) => ({
        fileName: attachment.fileName.trim(),
        mimeType: attachment.mimeType.trim(),
        fileSize: attachment.fileSize,
        fileContent: attachment.fileContent,
      })),
    });
  }

  private validateAttachments(
    attachments: FaultReportAttachmentInput[],
    isAuthenticated: boolean,
    isRegular: boolean,
    config: { allowedMimeTypes: string[]; maxFileSizeMb: number },
  ): Array<{ field: string; message: string }> {
    if (!isAuthenticated && !isRegular && attachments.length > 0) {
      return [
        {
          field: "attachments",
          message: "Attachments are allowed only for logged-in users.",
        },
      ];
    }

    const errors: Array<{ field: string; message: string }> = [];
    const allowedSet = new Set(config.allowedMimeTypes);
    const maxFileSizeBytes = config.maxFileSizeMb * 1024 * 1024;

    for (const attachment of attachments) {
      if (!allowedSet.has(attachment.mimeType)) {
        errors.push({
          field: "attachments",
          message: `Unsupported attachment type: ${attachment.mimeType}. Allowed: ${config.allowedMimeTypes.join(', ')}`,
        });
      }

      if (attachment.fileSize > maxFileSizeBytes) {
        errors.push({
          field: "attachments",
          message: `File '${attachment.fileName}' exceeds the maximum allowed size of ${config.maxFileSizeMb} MB.`,
        });
      }
    }

    return errors;
  }
}
