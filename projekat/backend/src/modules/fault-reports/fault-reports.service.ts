import { BadRequestError } from "../../shared/errors";

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
}

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
        location: input.location!.trim(),
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

    return this.repository.createSubmission({
      ...input,
      companyId: companyIdToUse!,
      categoryId: categoryIdToUse!,
      location: input.location?.trim() ?? "",
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
