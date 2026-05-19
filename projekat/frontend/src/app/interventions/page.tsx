"use client";
// export const runtime = "edge";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Download, Map as MapIcon, Pencil, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { ROUTES, UI, VALIDATION } from "@/constants";
import { PRIORITY } from "@shared/enums";
import {
  DataTable,
  FilterBar,
  PageHeader,
  PageLayout,
  PriorityBadge,
  InterventionStatusBadge,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  clearFieldError,
  getApiFieldErrors,
  validateRequired,
  validateSafeText,
} from "@/lib/form-validation";
import MonthCalendar from '@/components/shared/MonthCalendar';
import type { Category } from "@/models/Category";
import {
  createIntervention,
  downloadInterventionsPdf,
  getInterventionOptions,
  getInterventions,
  updateIntervention,
  type BulkActionResponse,
  type InterventionFormPayload,
  type InterventionListItem,
  type InterventionOptions,
} from "@/services/interventions.service";
import { getCategories } from "@/services/categories.service";
import { getPriorityLabel } from "@/services/sla.service";
import { AssignerModal } from "@/components/assignments/AssignerModal";
import { Users } from "lucide-react";
import { BulkActionToolbar } from "@/components/interventions/BulkActionToolbar";
import { BulkResultSummary } from "@/components/interventions/BulkResultSummary";

const ALL_CATEGORY = "ALL";
const ALL_STATUS = "ALL";
const ALL_TYPE = "ALL";
const ALL_SERVICERS = "ALL";
const UNASSIGNED_SERVICERS = "UNASSIGNED";
const NO_FAULT_REPORT = "NONE";
const COORDINATOR_ROLES = new Set([
  "koordinator",
  "coordinator",
  "Koordinator",
  "admin",
  "administrator",
]);
const MANAGEMENT_ROLES = new Set(["menadzment", "management"]);
const ADMIN_ROLES = new Set(["admin", "administrator"]);
const SUPPORT_AGENT_ROLES = new Set(["supportagent", "agentpodrske"]);
const EDITABLE_STATUSES = new Set(["NEW", "IN_PROGRESS"]);

type FormState = {
  name: string;
  description: string;
  location: string;
  startedAt: string;
  dueAt: string;
  faultReportId: string;
  companyId: string;
  categoryId: string;
  priority: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  location: "",
  startedAt: "",
  dueAt: "",
  faultReportId: NO_FAULT_REPORT,
  companyId: "",
  categoryId: "",
  priority: PRIORITY.MEDIUM,
};

const EMPTY_OPTIONS: InterventionOptions = {
  companies: [],
  categories: [],
  faultReports: [],
};

type SessionUser = {
  role?: string;
  roles?: string[];
};

type KeycloakTokenPayload = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

interface SelectAllCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}

function decodeTokenPayload(token: string): KeycloakTokenPayload | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(paddedPayload)) as KeycloakTokenPayload;
  } catch {
    return null;
  }
}

function getCurrentSessionRoles(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const roles = new Set<string>();
  const rawUser = window.localStorage.getItem("user");
  const token = window.localStorage.getItem("token");

  try {
    const user = rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
    if (user?.role) {
      roles.add(user.role);
    }

    user?.roles?.forEach((role) => roles.add(role));
  } catch {
    // Ignore malformed local session data and rely on the token roles below.
  }

  if (token) {
    const payload = decodeTokenPayload(token);
    payload?.realm_access?.roles?.forEach((role) => roles.add(role));
    Object.values(payload?.resource_access ?? {}).forEach((clientAccess) => {
      clientAccess.roles?.forEach((role) => roles.add(role));
    });
  }

  return Array.from(roles);
}

function hasCoordinatorRole(roles: string[]) {
  return roles.some((role) => COORDINATOR_ROLES.has(role.toLowerCase()));
}

function hasInterventionViewRole(roles: string[]) {
  return roles.some((role) => {
    const normalizedRole = role.toLowerCase();
    return (
      COORDINATOR_ROLES.has(normalizedRole) ||
      MANAGEMENT_ROLES.has(normalizedRole) ||
      ADMIN_ROLES.has(normalizedRole) ||
      SUPPORT_AGENT_ROLES.has(normalizedRole)
    );
  });
}

function getCurrentDatetimeLocal() {
  const now = new Date();
  now.setSeconds(0, 0);
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return offsetDate.toISOString().slice(0, 16);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFaultReportCode(id: number) {
  return `FR-${String(id).padStart(5, "0")}`;
}

function needsScheduling(intervention: InterventionListItem) {
  return !intervention.startedAt || !intervention.dueAt;
}

function buildFormFromIntervention(
  intervention: InterventionListItem,
): FormState {
  return {
    name: intervention.name,
    description: intervention.description,
    location: intervention.location,
    startedAt: toDatetimeLocal(intervention.startedAt),
    dueAt: toDatetimeLocal(intervention.dueAt),
    faultReportId: intervention.faultReport
      ? String(intervention.faultReport.id)
      : NO_FAULT_REPORT,
    companyId: String(intervention.companyId),
    categoryId: String(intervention.categoryId),
    priority: intervention.priority,
  };
}

function SelectAllCheckbox({ checked, indeterminate, onChange }: SelectAllCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
 
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);
 
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all interventions"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer rounded border-border"
    />
  );
}

export default function InterventionsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<InterventionOptions>({
    companies: [],
    categories: [],
    faultReports: [],
  });
  const [rows, setRows] = useState<InterventionListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUS);
  const [selectedType, setSelectedType] = useState(ALL_TYPE);
  const [selectedServicer, setSelectedServicer] = useState(ALL_SERVICERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPlanInterventions, setCanPlanInterventions] = useState(false);
  const [canViewInterventions, setCanViewInterventions] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] =
    useState<InterventionListItem | null>(null);
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAssignerModalOpen, setIsAssignerModalOpen] = useState(false);
  const [assignedServicerIds, setAssignedServicerIds] = useState<number[]>([]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkActionResponse | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);


  const loadData = async (canLoadPlanningOptions = canPlanInterventions) => {
    try {
      setIsLoading(true);
      setError(null);

      const [categoryList, interventionsResult, formOptions] =
        await Promise.all([
          getCategories(),
          getInterventions(),
          canLoadPlanningOptions
            ? getInterventionOptions()
            : Promise.resolve(EMPTY_OPTIONS),
      ]);

      setCategories(categoryList);
      setRows(interventionsResult.items);
      setOptions(formOptions);
      return interventionsResult.items;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load interventions data.",
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const sessionRoles = getCurrentSessionRoles();
    const hasPlanningAccess = hasCoordinatorRole(sessionRoles);
    const hasViewAccess = hasInterventionViewRole(sessionRoles);

    setCanPlanInterventions(hasPlanningAccess);
    setCanViewInterventions(hasViewAccess);

    void loadData(hasPlanningAccess);
  }, []);

  const selectedFaultReport = useMemo(
    () =>
      options.faultReports.find(
        (item) => String(item.id) === formState.faultReportId,
      ) ?? null,
    [formState.faultReportId, options.faultReports],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (selectedCategory !== ALL_CATEGORY) {
        const category = categories.find(
          (item) => String(item.id) === selectedCategory,
        );

        if (!category || row.categoryName !== category.name) {
          return false;
        }
      }

      if (selectedStatus !== ALL_STATUS && row.status !== selectedStatus) {
        return false;
      }

      if (selectedType !== ALL_TYPE && row.type !== selectedType) {
        return false;
      }

      if (selectedServicer === UNASSIGNED_SERVICERS) {
        return !row.assignments || row.assignments.length === 0;
      }

      if (selectedServicer !== ALL_SERVICERS) {
        return Boolean(
          row.assignments?.some(
            (assignment) => String(assignment.userId) === selectedServicer,
          ),
        );
      }

      return true;
    });
  }, [categories, rows, selectedCategory, selectedServicer, selectedStatus, selectedType]);

  const allFilteredSelected = filteredRows.length > 0 && selectedIds.length === filteredRows.length;
 
  const someFilteredSelected = selectedIds.length > 0 && selectedIds.length < filteredRows.length;

  const filterOptions = [
    { value: ALL_CATEGORY, label: "All categories" },
    ...categories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];
  const statusFilterOptions = [
    { value: ALL_STATUS, label: "All statuses" },
    { value: "NEW", label: "Open" },
    { value: "ASSIGNED", label: "Assigned" },
    { value: "IN_PROGRESS", label: "In progress" },
  ];
  const typeFilterOptions = [
    { value: ALL_TYPE, label: "All types" },
    { value: "ISSUE", label: "Issue" },
    { value: "PREVENTIVE", label: "Preventive" },
  ];
  const servicerFilterOptions = useMemo(() => {
    const servicers = new Map<string, string>();

    rows.forEach((row) => {
      row.assignments?.forEach((assignment) => {
        servicers.set(
          String(assignment.userId),
          `${assignment.user.firstName} ${assignment.user.lastName}`,
        );
      });
    });

    return [
      { value: ALL_SERVICERS, label: "All servicers" },
      { value: UNASSIGNED_SERVICERS, label: "Unassigned" },
      ...Array.from(servicers.entries())
        .sort((a, b) => a[1].localeCompare(b[1], "en"))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [rows]);
  const isFiltered =
    selectedCategory !== ALL_CATEGORY ||
    selectedStatus !== ALL_STATUS ||
    selectedType !== ALL_TYPE ||
    selectedServicer !== ALL_SERVICERS;

  const clearFilters = () => {
    setSelectedCategory(ALL_CATEGORY);
    setSelectedStatus(ALL_STATUS);
    setSelectedType(ALL_TYPE);
    setSelectedServicer(ALL_SERVICERS);
  };

  const emptyDescription = "No intervention records available yet.";
  const activeViewMode = canPlanInterventions ? viewMode : "list";

  const clearError = (field: string) => {
    setFieldErrors((previous) => clearFieldError(previous, field));
    setFormError("");
    setSuccessMessage("");
  };

  const updateField = (field: keyof FormState, value: string) => {
    setFormState((current) => {
      const next = { ...current, [field]: value };

      if (field === "faultReportId") {
        const report = options.faultReports.find(
          (item) => String(item.id) === value,
        );
        if (report) {
          next.companyId = String(report.company.id);
          next.categoryId = String(report.category.id);
          next.location = report.location;
        }
      }

      return next;
    });
    clearError(field);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const nameError = validateSafeText(formState.name, {
      requiredMessage: "Name is required.",
      minLength: VALIDATION.TITLE_MIN,
      maxLength: VALIDATION.TITLE_MAX,
    });
    const descriptionError = validateSafeText(formState.description, {
      requiredMessage: "Description is required.",
      maxLength: VALIDATION.DESCRIPTION_MAX,
    });
    const locationError = validateRequired(
      formState.location,
      "Location is required.",
    );
    const startedAtError = formState.startedAt && formState.startedAt < getCurrentDatetimeLocal()
      ? "Planned start date cannot be in the past."
      : undefined;

    const dueAtError = formState.dueAt && formState.dueAt < getCurrentDatetimeLocal()
      ? "Due date cannot be in the past."
      : undefined;

    const priorityError = validateRequired(
      formState.priority,
      "Priority is required.",
    );

    if (nameError) nextErrors.name = nameError;
    if (descriptionError) nextErrors.description = descriptionError;
    if (locationError) nextErrors.location = locationError;
    if (startedAtError) nextErrors.startedAt = startedAtError;
    if (dueAtError) nextErrors.dueAt = dueAtError;
    if (priorityError) nextErrors.priority = priorityError;

    if (!locationError && formState.location.trim().length < 3) {
      nextErrors.location = "Location must have at least 3 characters.";
    }

    if (
      formState.startedAt &&
      formState.dueAt &&
      new Date(formState.dueAt) < new Date(formState.startedAt)
    ) {
      nextErrors.dueAt = "Due date must be after or equal to planned start date.";
    }

    if (formState.faultReportId === NO_FAULT_REPORT) {
      if (!formState.companyId) {
        nextErrors.companyId = "Company is required for planned maintenance.";
      }

      if (!formState.categoryId) {
        nextErrors.categoryId = "Category is required for planned maintenance.";
      }
    }

    return nextErrors;
  };

  const buildPayload = (): InterventionFormPayload => ({
    name: formState.name.trim(),
    description: formState.description.trim(),
    location: formState.location.trim(),
    startedAt: formState.startedAt ? new Date(formState.startedAt).toISOString() : undefined,
    dueAt: formState.dueAt ? new Date(formState.dueAt).toISOString() : undefined,
    faultReportId:
      formState.faultReportId === NO_FAULT_REPORT
        ? null
        : Number(formState.faultReportId),
    companyId: formState.companyId ? Number(formState.companyId) : undefined,
    categoryId: formState.categoryId ? Number(formState.categoryId) : undefined,
    priority: formState.priority as any,
  });

  const openCreateDialog = () => {
    setEditingIntervention(null);
    setFormState(EMPTY_FORM);
    setFieldErrors({});
    setFormError("");
    setSuccessMessage("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (intervention: InterventionListItem) => {
    setEditingIntervention(intervention);
    setFormState(buildFormFromIntervention(intervention));
    setFieldErrors({});
    setFormError("");
    setSuccessMessage("");
    setIsDialogOpen(true);
  };

  const openAssignerModal = () => {
    if (!editingIntervention) return;
    setAssignedServicerIds(
      editingIntervention.assignments?.map((assignment) => assignment.userId) ?? [],
    );
    setIsAssignerModalOpen(true);
  };

  const handleAssignersChange = async (userIds: number[]) => {
    setAssignedServicerIds(userIds);
    setSuccessMessage(`${userIds.length} servicer(s) assigned.`);
    const refreshedRows = await loadData();
    const updatedIntervention = refreshedRows?.find(
      (row) => row.id === editingIntervention?.id,
    );

    if (updatedIntervention) {
      setEditingIntervention(updatedIntervention);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      const saved = editingIntervention
        ? await updateIntervention(editingIntervention.id, buildPayload())
        : await createIntervention(buildPayload());

      await loadData();
      setSuccessMessage(
        editingIntervention
          ? "Intervention updated."
          : "Intervention created.",
      );
      setIsDialogOpen(false);
    } catch (requestError: unknown) {
      const serviceDetails =
        typeof requestError === "object" && requestError !== null
          ? (requestError as { details?: unknown }).details
          : undefined;
      const backendFieldErrors = getApiFieldErrors(
        serviceDetails ?? requestError,
      );

      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors(backendFieldErrors);
      }

      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to save intervention.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRows.length && filteredRows.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map((row) => Number(row.id)));
    }
  };
 
  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearSelection = () => setSelectedIds([]);
 
const handleBulkActionComplete = async (
  result: BulkActionResponse,
  _action: 'STATUS_CHANGE' | 'ASSIGN_SERVICER',) => {
      setBulkResult(result);
      await loadData();
  };
 
  const handleBulkError = (message: string) => {
    setError(message);
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      setError(null);
      await downloadInterventionsPdf();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to export interventions to PDF.",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const pageSecondaryActions = [
    ...(canViewInterventions
      ? [
          {
            label: "Export PDF",
            onClick: handleExportPdf,
            icon: <Download className="mr-2 h-4 w-4" />,
            variant: "outline" as const,
            isLoading: isExportingPdf,
          },
        ]
      : []),
    ...(canPlanInterventions
      ? [
          {
            label: "Map",
            href: ROUTES.MAP,
            icon: <MapIcon className="mr-2 h-4 w-4" />,
            variant: "outline" as const,
          },
          {
            label: activeViewMode === "list" ? "Calendar" : "List",
            onClick: () => setViewMode((v) => (v === "list" ? "calendar" : "list")),
          },
        ]
      : []),
  ];

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Interventions"
        subtitle="Plan and track active intervention work with clear ownership and deadlines."
        breadcrumbs={[
          { label: "Dashboard", href: ROUTES.DASHBOARD },
          { label: "Interventions" },
        ]}
        secondaryActions={pageSecondaryActions.length > 0 ? pageSecondaryActions : undefined}
        primaryAction={
          canPlanInterventions
            ? {
                label: "New Intervention",
                href: ROUTES.INTERVENTION_NEW,
                icon: <Plus className="mr-2 h-4 w-4" />,
              }
            : undefined
        }
      />

      {successMessage ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-emerald-600">{successMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      <FilterBar
        filters={[
          {
            key: "category",
            label: "Category",
            options: filterOptions,
            value: selectedCategory,
            onChange: setSelectedCategory,
          },
          {
            key: "status",
            label: "Status",
            options: statusFilterOptions,
            value: selectedStatus,
            onChange: setSelectedStatus,
          },
          {
            key: "type",
            label: "Type",
            options: typeFilterOptions,
            value: selectedType,
            onChange: setSelectedType,
          },
          {
            key: "servicer",
            label: "Servicer",
            options: servicerFilterOptions,
            value: selectedServicer,
            onChange: setSelectedServicer,
          },
        ]}
        isFiltered={isFiltered}
        onClear={clearFilters}
      />

      {canPlanInterventions && (
        <BulkActionToolbar
          selectedIds={selectedIds}
          selectedRows={rows.filter((r) => selectedIds.includes(Number(r.id)))}
          onClearSelection={clearSelection}
          onActionComplete={handleBulkActionComplete}
          onError={handleBulkError}
        />
      )}
 
      {bulkResult && (
        <BulkResultSummary
          result={bulkResult}
          onDismiss={() => setBulkResult(null)}
        />
      )}

      {activeViewMode === 'list' ? (
        <DataTable<InterventionListItem>
        columns={[
         ...(canPlanInterventions
          ? [
              {
                key: "select" as keyof InterventionListItem,
                header: (
                  <SelectAllCheckbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected}
                    onChange={toggleSelectAll}
                  />
                ) as unknown as string,
                width: "48px",
                render: (_value: unknown, row: InterventionListItem) => (
                  <input
                    type="checkbox"
                    aria-label={`Select intervention ${row.id}`}
                    checked={selectedIds.includes(Number(row.id))}
                    onChange={(e) => { e.stopPropagation(); toggleSelectRow(Number(row.id)); }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 cursor-pointer rounded border-border"
                  />
                ),
              },
            ]
          : []),
          {
            key: "id",
            header: "ID",
            width: UI.TABLE_COLUMN_WIDTHS.INTERVENTIONS_ID,
            render: (value) => (
              <Link
                href={ROUTES.INTERVENTION(String(value))}
                className="font-medium text-primary hover:underline"
              >
                #{value as string | number}
              </Link>
            ),
          },
          {
            key: "title",
            header: "Title",
            render: (value, row) => (
              <Link
                href={ROUTES.INTERVENTION(String(row.id))}
                className="hover:text-primary hover:underline"
              >
                {value as string}
              </Link>
            ),
          },
          {
            key: "location",
            header: "Location",
            width: "16rem",
            render: (value) => {
              const location = String(value ?? "");
              return (
                <span className="block max-w-64 truncate" title={location}>
                  {location}
                </span>
              );
            },
          },
          { key: "categoryName", header: "Category" },
          {
            key: "priority",
            header: "Priority",
            width: UI.TABLE_COLUMN_WIDTHS.INTERVENTIONS_PRIORITY,
            render: (value) => (
              <PriorityBadge
                priority={value as InterventionListItem["priority"]}
              />
            ),
          },
          {
            key: "status",
            header: "Status",
            width: UI.TABLE_COLUMN_WIDTHS.INTERVENTIONS_STATUS,
            render: (value) => (
              <InterventionStatusBadge
                status={value as InterventionListItem["status"]}
              />
            ),
          },

          {
            key: "faultReport",
            header: "Fault Report",
            render: (_value, row) =>
              row.faultReport ? (
                <span className="text-sm text-muted-foreground">
                  FR-{String(row.faultReport.id).padStart(5, "0")}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Planned</span>
              ),
          },
          {
            key: "dueAt",
            header: "Due",
            render: (value, row) => (
              <div className="flex flex-col gap-1">
                <span>{formatDateTime(value as string | null)}</span>
                {row.isOverdue && (
                  <Badge variant="destructive" className="w-fit text-[10px] py-0 px-1">
                    <TriangleAlert className="mr-1 h-3 w-3" />
                    Overdue
                  </Badge>
                )}
              </div>
            ),
          },
          {
            key: "createdAt",
            header: "Created",
            render: (value) => (
              <span>{formatDateTime(value as string | null)}</span>
            ),
          },
          {
            key: "owner",
            header: "Owner",
            width: UI.TABLE_COLUMN_WIDTHS.INTERVENTIONS_OWNER,
          },
          {
            key: "assignments",
            header: "Assigned",
            render: (_value: unknown, row: InterventionListItem) => {
              if (!row.assignments || row.assignments.length === 0) {
                return <span className="text-xs text-muted-foreground">—</span>;
              }
              return (
                <div className="space-y-1">
                  {row.assignments.slice(0, 2).map((a) => (
                    <div key={a.id} className="text-xs">
                      {a.user.firstName} {a.user.lastName}
                    </div>
                  ))}
                  {row.assignments.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{row.assignments.length - 2} more
                    </div>
                  )}
                </div>
              );
            },
          },
          ...(canPlanInterventions
            ? [
                {
                  key: "actions",
                  header: "",
                  align: "right" as const,
                  render: (_value: unknown, row: InterventionListItem) => {
                    const isEditable = EDITABLE_STATUSES.has(row.status);

                    if (!isEditable) {
                      return (
                        <Button type="button" variant="ghost" size="sm" disabled>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      );
                    }

                    return (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        asChild
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Link href={ROUTES.INTERVENTION_EDIT(row.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    );
                  },
                },
              ]
            : []),
        ]}
        data={filteredRows}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => loadData()}
        onRowClick={(row) => router.push(ROUTES.INTERVENTION(row.id))}
        emptyTitle="No interventions in this category"
        emptyDescription={emptyDescription}
        />
      ) : (
        <MonthCalendar
          events={filteredRows
            .map((r) => ({ id: r.id, title: r.title ?? r.name, date: r.dueAt ?? r.startedAt ?? '', priority: r.priority }))
            .filter((e) => !!e.date)
          }
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIntervention ? "Edit Intervention" : "New Intervention"}
            </DialogTitle>
            <DialogDescription>
              {editingIntervention
                ? "Changes are allowed while the intervention is open or in progress."
                : "Create a scheduled intervention from a fault report or as planned maintenance."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            {editingIntervention ? (
              <div className="space-y-2">
                <Label htmlFor="fault-report">Fault Report</Label>
                <Select
                  value={formState.faultReportId}
                  onValueChange={(value) =>
                    updateField("faultReportId", value ?? NO_FAULT_REPORT)
                  }
                >
                  <SelectTrigger id="fault-report" className="w-full">
                    <SelectValue placeholder="No fault report" />
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    className="w-[min(36rem,var(--available-width))]"
                  >
                    <SelectItem value={NO_FAULT_REPORT}>
                      No fault report - planned maintenance
                    </SelectItem>
                    {options.faultReports.map((faultReport) => (
                      <SelectItem
                        key={faultReport.id}
                        value={String(faultReport.id)}
                        className="items-start py-2"
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-1 whitespace-normal">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="font-medium text-foreground">
                              {formatFaultReportCode(faultReport.id)}
                            </span>
                            <span className="truncate text-foreground">
                              {faultReport.category.name}
                            </span>
                          </span>
                          <span className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="truncate">
                              {faultReport.company.name}
                            </span>
                            <span>
                              {formatDateTime(faultReport.reportedAt)}
                            </span>
                            <span className="truncate">
                              {faultReport.location || "No location"}
                            </span>
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFaultReport ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {formatFaultReportCode(selectedFaultReport.id)}
                      </span>
                      <span className="text-muted-foreground">
                        Reported{" "}
                        {formatDateTime(selectedFaultReport.reportedAt)}
                      </span>
                    </div>
                    <div className="grid gap-1 text-muted-foreground sm:grid-cols-2">
                      <span>Company: {selectedFaultReport.company.name}</span>
                      <span>Category: {selectedFaultReport.category.name}</span>
                      <span className="sm:col-span-2">
                        Location:{" "}
                        {selectedFaultReport.location || "No location"}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="intervention-name">Name</Label>
                <Input
                  id="intervention-name"
                  value={formState.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={
                    fieldErrors.name ? "intervention-name-error" : undefined
                  }
                />
                {fieldErrors.name ? (
                  <p
                    id="intervention-name-error"
                    className="text-xs text-destructive"
                  >
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervention-location">Location</Label>
                <Input
                  id="intervention-location"
                  value={formState.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.location)}
                  aria-describedby={
                    fieldErrors.location
                      ? "intervention-location-error"
                      : undefined
                  }
                />
                {fieldErrors.location ? (
                  <p
                    id="intervention-location-error"
                    className="text-xs text-destructive"
                  >
                    {fieldErrors.location}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formState.priority}
                  onValueChange={(value) => updateField("priority", value ?? "")}
                >
                  <SelectTrigger
                    id="priority"
                    aria-invalid={Boolean(fieldErrors.priority)}
                    aria-describedby={
                      fieldErrors.priority ? "priority-error" : undefined
                    }
                  >
                    <SelectValue placeholder="Select priority">
                      {formState.priority
                        ? getPriorityLabel(formState.priority as any)
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PRIORITY.CRITICAL}>
                      {getPriorityLabel(PRIORITY.CRITICAL)}
                    </SelectItem>
                    <SelectItem value={PRIORITY.HIGH}>
                      {getPriorityLabel(PRIORITY.HIGH)}
                    </SelectItem>
                    <SelectItem value={PRIORITY.MEDIUM}>
                      {getPriorityLabel(PRIORITY.MEDIUM)}
                    </SelectItem>
                    <SelectItem value={PRIORITY.LOW}>
                      {getPriorityLabel(PRIORITY.LOW)}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.priority ? (
                  <p id="priority-error" className="text-xs text-destructive">
                    {fieldErrors.priority}
                  </p>
                ) : null}
              </div>
            </div>

            {formState.faultReportId === NO_FAULT_REPORT ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Select
                    value={formState.companyId}
                    onValueChange={(value) =>
                      updateField("companyId", value ?? "")
                    }
                  >
                    <SelectTrigger
                      id="company"
                      aria-invalid={Boolean(fieldErrors.companyId)}
                      aria-describedby={
                        fieldErrors.companyId ? "company-error" : undefined
                      }
                    >
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.companies.map((company) => (
                        <SelectItem key={company.id} value={String(company.id)}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.companyId ? (
                    <p id="company-error" className="text-xs text-destructive">
                      {fieldErrors.companyId}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formState.categoryId}
                    onValueChange={(value) =>
                      updateField("categoryId", value ?? "")
                    }
                  >
                    <SelectTrigger
                      id="category"
                      aria-invalid={Boolean(fieldErrors.categoryId)}
                      aria-describedby={
                        fieldErrors.categoryId ? "category-error" : undefined
                      }
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={String(category.id)}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.categoryId ? (
                    <p id="category-error" className="text-xs text-destructive">
                      {fieldErrors.categoryId}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="started-at">Planned Start</Label>
                <Input
                  id="started-at"
                  type="datetime-local"
                  min={getCurrentDatetimeLocal()}
                  value={formState.startedAt}
                  onChange={(event) =>
                    updateField("startedAt", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.startedAt)}
                  aria-describedby={
                    fieldErrors.startedAt ? "started-at-error" : undefined
                  }
                />
                {fieldErrors.startedAt ? (
                  <p id="started-at-error" className="text-xs text-destructive">
                    {fieldErrors.startedAt}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due-at">Due Date</Label>
                <Input
                  id="due-at"
                  type="datetime-local"
                  min={getCurrentDatetimeLocal()}
                  value={formState.dueAt}
                  onChange={(event) => updateField("dueAt", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.dueAt)}
                  aria-describedby={
                    fieldErrors.dueAt ? "due-at-error" : undefined
                  }
                />
                {fieldErrors.dueAt ? (
                  <p id="due-at-error" className="text-xs text-destructive">
                    {fieldErrors.dueAt}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={
                  fieldErrors.description ? "description-error" : undefined
                }
              />
              {fieldErrors.description ? (
                <p id="description-error" className="text-xs text-destructive">
                  {fieldErrors.description}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              {editingIntervention && canPlanInterventions && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={openAssignerModal}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign Servicers
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Intervention"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {editingIntervention && (
        <AssignerModal
          interventionId={Number(editingIntervention.id)}
          isOpen={isAssignerModalOpen}
          onClose={() => setIsAssignerModalOpen(false)}
          onSave={handleAssignersChange}
          currentAssignedUserIds={assignedServicerIds}
        />
      )}
    </PageLayout>
  );
}
