import express from "express";
import type { AddressInfo } from "node:net";
import type { Request, RequestHandler } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InterventionStatus, InterventionType, NotificationType, Priority, ReportStatus } from "@prisma/client";

const {
  categoryFindManyMock,
  categoryFindUniqueMock,
  companyFindManyMock,
  companyFindUniqueMock,
  faultReportFindManyMock,
  faultReportFindUniqueMock,
  interventionCreateMock,
  interventionCountMock,
  interventionFindManyMock,
  interventionFindFirstMock,
  interventionFindUniqueMock,
  interventionUpdateMock,
  reportFindManyMock,
  statusHistoryCreateMock,
  notificationFindFirstMock,
  notificationCreateMock,
  userPreferenceFindUniqueMock,
  userFindFirstMock,
  slaConfigurationFindUniqueMock,
  auditLogCreateMock,
  transactionMock,
} = vi.hoisted(() => ({
  categoryFindManyMock: vi.fn(),
  categoryFindUniqueMock: vi.fn(),
  companyFindManyMock: vi.fn(),
  companyFindUniqueMock: vi.fn(),
  faultReportFindManyMock: vi.fn(),
  faultReportFindUniqueMock: vi.fn(),
  interventionCreateMock: vi.fn(),
  interventionCountMock: vi.fn(),
  interventionFindManyMock: vi.fn(),
  interventionFindFirstMock: vi.fn(),
  interventionFindUniqueMock: vi.fn(),
  interventionUpdateMock: vi.fn(),
  reportFindManyMock: vi.fn(),
  statusHistoryCreateMock: vi.fn(),
  notificationFindFirstMock: vi.fn(),
  notificationCreateMock: vi.fn(),
  userPreferenceFindUniqueMock: vi.fn(),
  userFindFirstMock: vi.fn(),
  slaConfigurationFindUniqueMock: vi.fn(),
  auditLogCreateMock: vi.fn(),
  transactionMock: vi.fn((operations: Array<Promise<unknown> | unknown>) =>
    Promise.all(operations),
  ),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    category: {
      findMany: categoryFindManyMock,
      findUnique: categoryFindUniqueMock,
    },
    company: {
      findMany: companyFindManyMock,
      findUnique: companyFindUniqueMock,
    },
    faultReport: {
      findMany: faultReportFindManyMock,
      findUnique: faultReportFindUniqueMock,
    },
    intervention: {
      create: interventionCreateMock,
      count: interventionCountMock,
      findFirst: interventionFindFirstMock,
      findMany: interventionFindManyMock,
      findUnique: interventionFindUniqueMock,
      update: interventionUpdateMock,
    },
    report: {
      findMany: reportFindManyMock,
    },
    statusHistory: {
      create: statusHistoryCreateMock,
    },
    notification: {
      findFirst: notificationFindFirstMock,
      create: notificationCreateMock,
    },
    userPreference: {
      findUnique: userPreferenceFindUniqueMock,
    },
    user: {
      findFirst: userFindFirstMock,
    },
    slaConfiguration: {
      findUnique: slaConfigurationFindUniqueMock,
    },
    auditLog: {
      create: auditLogCreateMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("../src/middleware/auth.middleware", () => ({
  authorizeRoles: (allowedRoles: string[]) => {
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toLowerCase(),
    );

    return (
      req: { user?: { roles: string[] } },
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const normalizedUserRoles = (req.user?.roles ?? []).map((role) =>
        role.toLowerCase(),
      );
      const hasAllowedRole = normalizedAllowedRoles.some((role) =>
        normalizedUserRoles.includes(role),
      );

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!hasAllowedRole) {
        return res.status(403).json({ message: "Forbidden" });
      }

      return next();
    };
  },
}));

import interventionsRouter from "../src/modules/interventions/interventions.route";
import { AppError } from "../src/shared/errors";

type HttpMethod = "GET" | "POST" | "PATCH";

type TestResponse = {
  status: number;
  body: unknown;
};

type RouteStackItem = {
  handle: RequestHandler;
};

type RouterLayer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: RouteStackItem[];
  };
};

function dateMinutesFromNow(minutes: number): Date {
  const date = new Date(Date.now() + minutes * 60_000);
  date.setSeconds(0, 0);
  return date;
}

function isoMinutesFromNow(minutes: number): string {
  return dateMinutesFromNow(minutes).toISOString();
}

function buildBasePayload() {
  return {
    name: "Planirana intervencija",
    description: "Detaljan opis planirane intervencije.",
    location: "Objekat A",
    startedAt: isoMinutesFromNow(60),
    dueAt: isoMinutesFromNow(180),
    faultReportId: null,
    companyId: 3,
    categoryId: 4,
    priority: Priority.MEDIUM,
  };
}

function buildFaultReportPayload() {
  return {
    name: "Intervencija iz prijave",
    description: "Prijava kvara koja vec ima automatsku intervenciju.",
    location: "Objekat B",
    startedAt: isoMinutesFromNow(60),
    dueAt: isoMinutesFromNow(180),
    faultReportId: 7,
    priority: Priority.HIGH,
  };
}

function buildInterventionRecord(
  payload:
    | ReturnType<typeof buildBasePayload>
    | ReturnType<typeof buildFaultReportPayload>,
) {
  const hasFaultReport =
    "faultReportId" in payload &&
    payload.faultReportId !== null &&
    payload.faultReportId !== undefined;

  return {
    id: 21,
    name: "Planirana intervencija",
    description: "Detaljan opis planirane intervencije.",
    location: "Objekat A",
    priority: Priority.MEDIUM,
    status: InterventionStatus.NEW,
    type: hasFaultReport ? InterventionType.ISSUE : InterventionType.PREVENTIVE,
    createdAt: dateMinutesFromNow(5),
    startedAt: new Date(payload.startedAt),
    dueAt: new Date(payload.dueAt),
    category: { id: 4, name: "Elektricni kvar" },
    company: { id: 3, name: "Servis Alfa" },
    creator: { username: "milan.koordinator" },
    faultReport: hasFaultReport
      ? {
          id: payload.faultReportId ?? 7,
          description: "Prijava kvara",
          reportedAt: dateMinutesFromNow(-60),
        }
      : null,
  };
}

let basePayload: ReturnType<typeof buildBasePayload>;
let faultReportPayload: ReturnType<typeof buildFaultReportPayload>;
let interventionRecord: ReturnType<typeof buildInterventionRecord>;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = {
      id: req.header("x-test-subject") ?? "kc-coordinator-001",
      localUserId: Number(req.header("x-test-local-user-id") ?? "3"),
      username: req.header("x-test-username") ?? "milan.koordinator",
      roles: (req.header("x-test-roles") ?? "Koordinator")
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean),
    };
    next();
  });
  app.use("/interventions", interventionsRouter);
  app.use(
    (
      error: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            ...(error.fields ? { fields: error.fields } : {}),
          },
          path: req.originalUrl,
        });
      }

      return res.status(500).json({ message: "Unexpected test error" });
    },
  );

  return app;
}

async function request(
  method: HttpMethod,
  path: string,
  options: { body?: unknown; roles?: string[]; localUserId?: number } = {},
): Promise<TestResponse> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-test-roles": (options.roles ?? ["Koordinator"]).join(","),
        "x-test-local-user-id": String(options.localUserId ?? 3),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();

    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function getPatchHandler(): RequestHandler {
  const layer = interventionsRouter.stack.find((entry) => {
    const route = (entry as RouterLayer).route;
    return route?.path === "/:id" && Boolean(route.methods?.patch);
  }) as RouterLayer | undefined;

  if (!layer?.route) {
    throw new Error("Patch route handler not found.");
  }

  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function seedHappyPathMocks() {
  userFindFirstMock.mockResolvedValue({ id: 3, username: "milan.koordinator" });
  faultReportFindUniqueMock.mockResolvedValue({
    id: 7,
    companyId: 3,
    categoryId: 4,
    location: "Objekat A",
    latitude: null,
    longitude: null,
  });
  companyFindUniqueMock.mockResolvedValue({ id: 3 });
  categoryFindUniqueMock.mockResolvedValue({ id: 4, active: true });
  interventionCreateMock.mockImplementation((args) => {
    return Promise.resolve({
      ...interventionRecord,
      ...args.data,
      category: { id: args.data.categoryId ?? 4, name: "Elektricni kvar" },
      company: { id: args.data.companyId ?? 3, name: "Servis Alfa" },
      creator: { id: 3, username: "milan.koordinator" },
      faultReport: args.data.faultReportId
        ? {
            id: args.data.faultReportId,
            description: "Prijava kvara",
            reportedAt: dateMinutesFromNow(-60),
          }
        : null,
    });
  });
  interventionUpdateMock.mockImplementation((args) => {
    return Promise.resolve({
      ...interventionRecord,
      ...args.data,
      category: { id: args.data.categoryId ?? 4, name: "Elektricni kvar" },
      company: { id: args.data.companyId ?? 3, name: "Servis Alfa" },
      creator: { id: 3, username: "milan.koordinator" },
      faultReport: args.data.faultReportId
        ? {
            id: args.data.faultReportId,
            description: "Prijava kvara",
            reportedAt: dateMinutesFromNow(-60),
          }
        : null,
    });
  });
  slaConfigurationFindUniqueMock.mockResolvedValue({ priority: Priority.MEDIUM, deadlineHours: 24 });
  auditLogCreateMock.mockResolvedValue({});
}

describe("PBI-004 interventions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    basePayload = buildBasePayload();
    faultReportPayload = buildFaultReportPayload();
    interventionRecord = buildInterventionRecord(basePayload);
    interventionCountMock.mockResolvedValue(1);
    interventionFindFirstMock.mockResolvedValue(null);
    notificationFindFirstMock.mockResolvedValue(null);
    notificationCreateMock.mockResolvedValue({});
    userPreferenceFindUniqueMock.mockResolvedValue(null);
    seedHappyPathMocks();
  });

  it("creates planned maintenance without a fault report", async () => {
    const response = await request("POST", "/interventions", {
      body: basePayload,
    });

    expect(response.status).toBe(201);
    expect(interventionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: basePayload.name,
        status: InterventionStatus.NEW,
        type: InterventionType.PREVENTIVE,
        creatorId: 3,
        faultReportId: null,
        companyId: 3,
        categoryId: 4,
        priority: Priority.MEDIUM,
      }),
      include: expect.any(Object),
    });
    expect(response.body).toMatchObject({
      id: "21",
      owner: "milan.koordinator",
      status: InterventionStatus.NEW,
      type: InterventionType.PREVENTIVE,
      faultReport: null,
      priority: Priority.MEDIUM,
    });
  });

  it("does not set startedAt when creating a planned intervention", async () => {
    const response = await request("POST", "/interventions", {
      body: basePayload,
    });

    expect(response.status).toBe(201);
    expect(interventionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        startedAt: null,
      }),
      include: expect.any(Object),
    });
  });

  it("rejects creation when fault report is provided", async () => {
    const response = await request("POST", "/interventions", {
      body: faultReportPayload,
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        code: "BAD_REQUEST",
        fields: expect.arrayContaining([
          expect.objectContaining({ field: "faultReportId" }),
        ]),
      },
    });
    expect(interventionCreateMock).not.toHaveBeenCalled();
  });

  it("rejects intervention creation for non-coordinator roles", async () => {
    const response = await request("POST", "/interventions", {
      body: basePayload,
      roles: ["Korisnik"],
    });

    expect(response.status).toBe(403);
    expect(interventionCreateMock).not.toHaveBeenCalled();
  });

  it("allows admins to create planned maintenance", async () => {
    const response = await request("POST", "/interventions", {
      body: basePayload,
      roles: ["Admin"],
    });

    expect(response.status).toBe(201);
    expect(interventionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creatorId: 3,
          status: InterventionStatus.NEW,
        }),
      }),
    );
  });

  it("rejects missing required fields before saving", async () => {
    const response = await request("POST", "/interventions", {
      body: {
        ...basePayload,
        name: "",
        location: "",
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        code: "BAD_REQUEST",
        fields: expect.arrayContaining([
          expect.objectContaining({ field: "name" }),
          expect.objectContaining({ field: "location" }),
        ]),
      },
    });
    expect(interventionCreateMock).not.toHaveBeenCalled();
  });

  it("rejects planned start dates in the past", async () => {
    const response = await request("POST", "/interventions", {
      body: {
        ...basePayload,
        startedAt: isoMinutesFromNow(-1),
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        fields: expect.arrayContaining([
          expect.objectContaining({
            field: "startedAt",
            message: "Planned start date cannot be in the past.",
          }),
        ]),
      },
    });
  });

  it("rejects due dates in the past", async () => {
    const response = await request("POST", "/interventions", {
      body: {
        ...basePayload,
        dueAt: isoMinutesFromNow(-1),
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        fields: expect.arrayContaining([
          expect.objectContaining({
            field: "dueAt",
            message: "Due date cannot be in the past.",
          }),
        ]),
      },
    });
  });

  it("rejects due dates before the planned start", async () => {
    const response = await request("POST", "/interventions", {
      body: {
        ...basePayload,
        startedAt: isoMinutesFromNow(240),
        dueAt: isoMinutesFromNow(180),
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        fields: expect.arrayContaining([
          expect.objectContaining({
            field: "dueAt",
            message:
              "Due date must be after or equal to the planned start date.",
          }),
        ]),
      },
    });
  });

  it("rejects creation when the authenticated coordinator is not linked locally", async () => {
    userFindFirstMock.mockResolvedValue(null);

    const response = await request("POST", "/interventions", {
      body: basePayload,
    });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      error: {
        code: "FORBIDDEN",
        message:
          "Authenticated coordinator is not linked to a local user record.",
      },
    });
    expect(interventionCreateMock).not.toHaveBeenCalled();
  });

  it("requires company and category for planned maintenance", async () => {
    const response = await request("POST", "/interventions", {
      body: {
        ...basePayload,
        companyId: undefined,
        categoryId: undefined,
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        fields: expect.arrayContaining([
          expect.objectContaining({ field: "companyId" }),
        ]),
      },
    });
  });

  it("requires category for planned maintenance when company is present", async () => {
    const response = await request("POST", "/interventions", {
      body: {
        ...basePayload,
        companyId: 3,
        categoryId: undefined,
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        fields: expect.arrayContaining([
          expect.objectContaining({ field: "categoryId" }),
        ]),
      },
    });
    expect(interventionCreateMock).not.toHaveBeenCalled();
  });

  it("returns not found when planned maintenance company does not exist", async () => {
    companyFindUniqueMock.mockResolvedValue(null);

    const response = await request("POST", "/interventions", {
      body: {
        ...basePayload,
        companyId: 404,
        categoryId: 4,
      },
    });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: "Company not found.",
      },
    });
    expect(interventionCreateMock).not.toHaveBeenCalled();
  });

  it("returns not found when planned maintenance category is inactive", async () => {
    categoryFindUniqueMock.mockResolvedValue({ id: 4, active: false });

    const response = await request("POST", "/interventions", {
      body: {
        ...basePayload,
        companyId: 3,
        categoryId: 4,
      },
    });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: "Active category not found.",
      },
    });
    expect(interventionCreateMock).not.toHaveBeenCalled();
  });

  it("returns not found when editing with missing fault report", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      status: InterventionStatus.NEW,
      priority: Priority.MEDIUM,
    });
    faultReportFindUniqueMock.mockResolvedValue(null);

    const response = await request("PATCH", "/interventions/21", {
      body: faultReportPayload,
    });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: "Fault report not found.",
      },
    });
  });

  it("updates intervention details while status is open", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      status: InterventionStatus.NEW,
      priority: Priority.MEDIUM,
    });

    const response = await request("PATCH", "/interventions/21", {
      body: faultReportPayload,
    });

    expect(response.status).toBe(200);
    expect(interventionUpdateMock).toHaveBeenCalledWith({
      where: { id: 21 },
      data: expect.objectContaining({
        name: faultReportPayload.name,
        faultReportId: 7,
        priority: Priority.HIGH,
      }),
      include: expect.any(Object),
    });
  });

  it("updates intervention details while status is in progress", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      status: InterventionStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
    });

    const response = await request("PATCH", "/interventions/21", {
      body: faultReportPayload,
    });

    expect(response.status).toBe(200);
    expect(interventionUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("returns not found when editing a missing intervention", async () => {
    interventionFindUniqueMock.mockResolvedValue(null);

    const response = await request("PATCH", "/interventions/21", {
      body: faultReportPayload,
    });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: "Intervention not found.",
      },
    });
    expect(interventionUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects edits when intervention status is no longer editable", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      status: InterventionStatus.RESOLVED,
    });

    const response = await request("PATCH", "/interventions/21", {
      body: faultReportPayload,
    });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      error: {
        code: "FORBIDDEN",
        message: "Intervention can only be edited while open or in progress.",
      },
    });
    expect(interventionUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects invalid intervention identifiers on edit", async () => {
    const response = await request("PATCH", "/interventions/not-a-number", {
      body: faultReportPayload,
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        fields: expect.arrayContaining([
          expect.objectContaining({ field: "id" }),
        ]),
      },
    });
  });

  it("rejects non-string intervention identifiers in patch handler", async () => {
    const handler = getPatchHandler();
    const req: Partial<Request<{ id: string | string[] }>> = {
      params: { id: ["21"] },
    };
    const res = {} as express.Response;
    const nextMock = vi.fn();

    await new Promise<void>((resolve) => {
      handler(
        req as Request<{ id: string | string[] }>,
        res,
        (error?: Error) => {
          nextMock(error);
          resolve();
        },
      );
    });

    const error = nextMock.mock.calls[0]?.[0] as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe("Invalid intervention identifier.");
  });

  it("moves an open intervention to in progress and records status history", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      status: InterventionStatus.NEW,
    });

    const response = await request("PATCH", "/interventions/21/status", {
      body: { status: InterventionStatus.IN_PROGRESS },
      roles: ["Serviser"],
    });

    expect(response.status).toBe(200);
    expect(interventionUpdateMock).toHaveBeenCalledWith({
      where: { id: 21 },
      data: {
        status: InterventionStatus.IN_PROGRESS,
        startedAt: expect.any(Date),
      },
      include: expect.any(Object),
    });
    expect(statusHistoryCreateMock).toHaveBeenCalledWith({
      data: {
        interventionId: 21,
        authorId: 3,
        oldStatus: InterventionStatus.NEW,
        newStatus: InterventionStatus.IN_PROGRESS,
      },
    });
    expect(response.body).toMatchObject({
      id: "21",
      status: InterventionStatus.IN_PROGRESS,
    });
  });

  it("closes an in-progress intervention and makes it eligible for history", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      name: "Planirana intervencija",
      status: InterventionStatus.IN_PROGRESS,
    });

    const response = await request("PATCH", "/interventions/21/status", {
      body: { status: InterventionStatus.RESOLVED },
    });

    expect(response.status).toBe(200);
    expect(interventionUpdateMock).toHaveBeenCalledWith({
      where: { id: 21 },
      data: { status: InterventionStatus.RESOLVED },
      include: expect.any(Object),
    });
    expect(statusHistoryCreateMock).toHaveBeenCalledWith({
      data: {
        interventionId: 21,
        authorId: 3,
        oldStatus: InterventionStatus.IN_PROGRESS,
        newStatus: InterventionStatus.RESOLVED,
      },
    });
    expect(response.body).toMatchObject({
      id: "21",
      status: InterventionStatus.RESOLVED,
    });
  });

  it("notifies the reporting user once when an intervention is resolved", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      name: "Popravka grijanja",
      status: InterventionStatus.IN_PROGRESS,
      archived: false,
      faultReport: { userId: 14 },
    });

    const response = await request("PATCH", "/interventions/21/status", {
      body: { status: InterventionStatus.RESOLVED },
    });

    expect(response.status).toBe(200);
    expect(notificationFindFirstMock).toHaveBeenCalledWith({
      where: {
        userId: 14,
        interventionId: 21,
        type: NotificationType.FEEDBACK_REQUEST,
      },
      select: { id: true },
    });
    expect(userPreferenceFindUniqueMock).toHaveBeenCalledWith({
      where: { userId: 14 },
      select: { language: true },
    });
    expect(notificationCreateMock).toHaveBeenCalledWith({
      data: {
        userId: 14,
        interventionId: 21,
        type: NotificationType.FEEDBACK_REQUEST,
        title: "Intervention resolved",
        text: expect.stringContaining("Popravka grijanja"),
      },
    });
  });

  it("does not create a duplicate feedback request notification", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      name: "Popravka grijanja",
      status: InterventionStatus.IN_PROGRESS,
      archived: false,
      faultReport: { userId: 14 },
    });
    notificationFindFirstMock.mockResolvedValue({ id: 99 });

    const response = await request("PATCH", "/interventions/21/status", {
      body: { status: InterventionStatus.RESOLVED },
    });

    expect(response.status).toBe(200);
    expect(notificationCreateMock).not.toHaveBeenCalled();
  });

  it("uses the reporting user's language for feedback request notifications", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      name: "Popravka grijanja",
      status: InterventionStatus.IN_PROGRESS,
      archived: false,
      faultReport: { userId: 14 },
    });
    userPreferenceFindUniqueMock.mockResolvedValue({ language: "bs" });

    const response = await request("PATCH", "/interventions/21/status", {
      body: { status: InterventionStatus.RESOLVED },
    });

    expect(response.status).toBe(200);
    expect(notificationCreateMock).toHaveBeenCalledWith({
      data: {
        userId: 14,
        interventionId: 21,
        type: NotificationType.FEEDBACK_REQUEST,
        title: "Intervencija zavrsena",
        text: expect.stringContaining("je zavrsena"),
      },
    });
  });

  it("rejects status changes that skip the predefined workflow", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      status: InterventionStatus.NEW,
    });

    const response = await request("PATCH", "/interventions/21/status", {
      body: { status: InterventionStatus.RESOLVED },
    });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      error: {
        code: "FORBIDDEN",
        message:
          "Intervention status cannot be changed in the requested direction.",
      },
    });
    expect(interventionUpdateMock).not.toHaveBeenCalled();
    expect(statusHistoryCreateMock).not.toHaveBeenCalled();
  });

  it("rejects status changes after an intervention is closed", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      status: InterventionStatus.RESOLVED,
    });

    const response = await request("PATCH", "/interventions/21/status", {
      body: { status: InterventionStatus.IN_PROGRESS },
    });

    expect(response.status).toBe(403);
    expect(interventionUpdateMock).not.toHaveBeenCalled();
    expect(statusHistoryCreateMock).not.toHaveBeenCalled();
  });

  it("returns options only to coordinators", async () => {
    companyFindManyMock.mockResolvedValue([{ id: 3, name: "Servis Alfa" }]);
    categoryFindManyMock.mockResolvedValue([
      { id: 4, name: "Elektricni kvar" },
    ]);
    faultReportFindManyMock.mockResolvedValue([
      {
        id: 7,
        description: "Prijava kvara",
        location: "Objekat A",
        reportedAt: new Date("2026-05-05T11:00:00.000Z"),
        company: { id: 3, name: "Servis Alfa" },
        category: { id: 4, name: "Elektricni kvar" },
      },
    ]);

    const response = await request("GET", "/interventions/options");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      companies: [{ id: 3, name: "Servis Alfa" }],
      categories: [{ id: 4, name: "Elektricni kvar" }],
      faultReports: [
        {
          id: 7,
          reportedAt: "2026-05-05T11:00:00.000Z",
        },
      ],
    });
  });

  it("lists only owned interventions for regular users", async () => {
    interventionFindManyMock.mockResolvedValue([
      buildInterventionRecord(faultReportPayload),
    ]);

    const response = await request("GET", "/interventions", {
      roles: ["Korisnik"],
      localUserId: 4,
    });

    expect(response.status).toBe(200);
    expect(interventionFindManyMock).toHaveBeenCalledWith({
      where: expect.objectContaining({
        archived: false,
        OR: [
          {
            faultReport: {
              is: {
                userId: 4,
              },
            },
          },
          {
            assignments: {
              some: {
                userId: 4,
              },
            },
          },
        ],
      }),
      include: expect.any(Object),
    });
    expect(response.body).toMatchObject([
      {
        id: "21",
      },
    ]);
  });

  it("lists active interventions with their original fault report link", async () => {
    interventionFindManyMock.mockResolvedValue([
      {
        ...buildInterventionRecord(faultReportPayload),
        assignments: [
          {
            id: 55,
            userId: 8,
            assignedAt: new Date("2026-05-07T09:00:00.000Z"),
            user: {
              id: 8,
              firstName: "Marko",
              lastName: "Serviser",
              username: "marko.serviser",
              email: "marko.serviser@example.com",
            },
          },
        ],
      },
    ]);

    const response = await request("GET", "/interventions");

    expect(response.status).toBe(200);
    expect(interventionFindManyMock).toHaveBeenCalledWith({
      where: {
        archived: false,
        status: {
          in: [
            InterventionStatus.NEW,
            InterventionStatus.ASSIGNED,
            InterventionStatus.IN_PROGRESS,
          ],
        },
      },
      include: expect.any(Object),
    });

    expect(response.body).toMatchObject([
      {
        id: "21",
        title: "Planirana intervencija",
        owner: "milan.koordinator",
        faultReport: {
          id: 7,
          description: "Prijava kvara",
        },
        assignments: [
          {
            id: 55,
            userId: 8,
            assignedAt: "2026-05-07T09:00:00.000Z",
            user: {
              id: 8,
              firstName: "Marko",
              lastName: "Serviser",
              username: "marko.serviser",
              email: "marko.serviser@example.com",
            },
          },
        ],
        isOverdue: expect.any(Boolean),
      },
    ]);
  });

  it("allows a user to view an intervention created from their fault report", async () => {
    interventionFindFirstMock.mockResolvedValue({ id: 21 });
    interventionFindUniqueMock.mockResolvedValue({
      ...interventionRecord,
      assignments: [],
    });

    const response = await request("GET", "/interventions/21", {
      roles: ["Korisnik"],
      localUserId: 4,
    });

    expect(response.status).toBe(200);
    expect(interventionFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: 21,
        OR: [
          {
            faultReport: {
              is: {
                userId: 4,
              },
            },
          },
          {
            assignments: {
              some: {
                userId: 4,
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    expect(response.body).toMatchObject({
      id: "21",
      title: "Planirana intervencija",
    });
  });

  it("rejects a user viewing someone else's intervention", async () => {
    interventionFindFirstMock.mockResolvedValue(null);

    const response = await request("GET", "/interventions/21", {
      roles: ["Korisnik"],
      localUserId: 4,
    });

    expect(response.status).toBe(403);
    expect(interventionFindUniqueMock).not.toHaveBeenCalled();
  });

  it("calculates dueAt based on SLA hours", async () => {
    slaConfigurationFindUniqueMock.mockResolvedValue({ priority: Priority.HIGH, deadlineHours: 8 });

    const { dueAt: _ignored, ...payloadWithoutDueAt } = basePayload;
    const response = await request("POST", "/interventions", {
      body: {
        ...payloadWithoutDueAt,
        priority: Priority.HIGH,
      },
    });

    expect(response.status).toBe(201);
    
    // The backend uses getCurrentMinute() to normalize dates
    const startedDate = new Date(basePayload.startedAt);
    startedDate.setSeconds(0, 0);
    startedDate.setMilliseconds(0);
    
    const expectedDueAt = new Date(startedDate.getTime() + 8 * 60 * 60 * 1000).toISOString();
    
    // Compare without milliseconds to avoid tiny discrepancies
    const actualDueAt = new Date(response.body.dueAt).toISOString();
    expect(actualDueAt).toBe(expectedDueAt);
  });

  it("identifies overdue interventions", async () => {
    const overdueIntervention = {
      ...interventionRecord,
      dueAt: new Date(Date.now() - 3600000), // 1 hour ago
      status: InterventionStatus.IN_PROGRESS,
    };
    interventionFindManyMock.mockResolvedValue([overdueIntervention]);

    const response = await request("GET", "/interventions");

    expect(response.status).toBe(200);
    expect(response.body[0].isOverdue).toBe(true);
  });

  describe("/interventions/history", () => {
  it("returns intervention history filtered by location", async () => {
    interventionFindManyMock.mockResolvedValue([
      {
        id: 11,
        description: "Ranije curenje vode u šahtu.",
        location: "Ilidza",
        status: InterventionStatus.RESOLVED,
        priority: Priority.HIGH,
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        category: {
          id: 1,
          name: "Vodoinstalacije",
        },
        assignments: [
          {
            user: {
              firstName: "Serviser",
              lastName: "Test",
            },
          },
        ],
      },
    ]);

    const response = await request(
      "GET",
      "/interventions/history?location=Ilidza",
      {
        roles: ["Serviser"],
      },
    );

    expect(response.status).toBe(200);

    expect(interventionFindManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.any(Object),
      orderBy: [{ createdAt: "desc" }],
      skip: 0,
      take: 10,
      select: expect.any(Object),
    }));
    expect(interventionCountMock).toHaveBeenCalledWith({
      where: expect.any(Object),
    });

    expect(response.body).toMatchObject({
      message: "Intervention history loaded successfully.",
      data: [
        {
          id: "11",
          location: "Ilidza",
          categoryName: "Vodoinstalacije",
          servicer: "Serviser Test",
          status: InterventionStatus.RESOLVED,
        },
      ],
    });
  });

  it("returns intervention history filtered by category name", async () => {
    interventionFindManyMock.mockResolvedValue([
      {
        id: 12,
        description: "Raniji kvar instalacija.",
        location: "Centar",
        status: InterventionStatus.RESOLVED,
        priority: Priority.MEDIUM,
        createdAt: new Date("2026-05-02T10:00:00.000Z"),
        category: {
          id: 2,
          name: "Vodoinstalacije",
        },
        assignments: [],
      },
    ]);

    const response = await request(
      "GET",
      "/interventions/history?category=Vodoinstalacije",
      {
        roles: ["Serviser"],
      },
    );

    expect(response.status).toBe(200);
    expect(interventionFindManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        AND: expect.arrayContaining([
          {
            category: {
              is: {
                name: {
                  contains: "Vodoinstalacije",
                },
              },
            },
          },
        ]),
      },
      orderBy: [{ createdAt: "desc" }],
      skip: 0,
      take: 10,
      select: expect.any(Object),
    }));
  });

  it("rejects history access for unauthorized roles", async () => {
    const response = await request(
      "GET",
      "/interventions/history?location=Ilidza",
      {
        roles: ["Korisnik"],
      },
    );

    expect(response.status).toBe(403);
    expect(interventionFindManyMock).not.toHaveBeenCalled();
  });

  it("loads paginated history without filters", async () => {
    interventionFindManyMock.mockResolvedValue([]);
    interventionCountMock.mockResolvedValue(0);

    const response = await request("GET", "/interventions/history", {
      roles: ["Serviser"],
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1,
      },
    });
  });
});

describe("PBI-055 knowledge base recommendations", () => {
  it("returns only coordinator-recommended finalized reports for same category or similar location", async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 21,
      categoryId: 4,
      location: "Objekat A",
    });
    reportFindManyMock.mockResolvedValue([
      {
        id: 31,
        description: "Zamijenjen osigurac i testiran rad.",
        material: "Osigurac 16A",
        notes: null,
        reportDate: new Date("2026-05-20T10:00:00.000Z"),
        isRecommended: true,
        recommendedAt: new Date("2026-05-21T10:00:00.000Z"),
        author: {
          firstName: "Amir",
          lastName: "Servis",
          username: "amir.servis",
        },
        intervention: {
          id: 11,
          name: "Raniji elektricni kvar",
          description: "Kvar na pumpi.",
          location: "Objekat A",
          createdAt: new Date("2026-05-19T10:00:00.000Z"),
          category: { id: 4, name: "Elektricni kvar" },
          company: { id: 3, name: "Servis Alfa" },
          assignments: [
            {
              user: {
                firstName: "Amir",
                lastName: "Servis",
                username: "amir.servis",
              },
            },
          ],
        },
      },
    ]);

    const response = await request("GET", "/interventions/21/knowledge-base", {
      roles: ["Serviser"],
    });

    expect(response.status).toBe(200);
    expect(reportFindManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: ReportStatus.FINALIZED,
        isRecommended: true,
        interventionId: { not: 21 },
        intervention: {
          OR: expect.arrayContaining([
            { categoryId: 4 },
            { location: { contains: "Objekat A" } },
          ]),
        },
      }),
      orderBy: [
        { isRecommended: "desc" },
        { recommendedAt: "desc" },
        { reportDate: "desc" },
      ],
      take: 8,
      select: expect.any(Object),
    }));
    expect(response.body).toMatchObject({
      message: "Knowledge base solutions loaded successfully.",
      data: [
        {
          reportId: 31,
          interventionId: "11",
          solution: "Zamijenjen osigurac i testiran rad.",
          isRecommended: true,
        },
      ],
    });
  });

  it("rejects knowledge base access for unauthorized roles", async () => {
    const response = await request("GET", "/interventions/21/knowledge-base", {
      roles: ["Korisnik"],
    });

    expect(response.status).toBe(403);
    expect(reportFindManyMock).not.toHaveBeenCalled();
  });
});

describe("PBI-022 recurring interventions", () => {
    it("creates intervention with recurringPeriod and sets nextGenerationAt", async () => {
      const recurringPayload = {
        ...basePayload,
        recurringPeriod: "MONTHLY",
      };

      const response = await request("POST", "/interventions", {
        body: recurringPayload,
      });

      expect(response.status).toBe(201);
      expect(interventionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recurringPeriod: "MONTHLY",
          nextGenerationAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it("creates intervention without recurrence when recurringPeriod is null", async () => {
      const response = await request("POST", "/interventions", {
        body: { ...basePayload, recurringPeriod: null },
      });

      expect(response.status).toBe(201);
      expect(interventionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recurringPeriod: null,
          nextGenerationAt: null,
        }),
        include: expect.any(Object),
      });
    });

    it("rejects invalid recurringPeriod value", async () => {
      const response = await request("POST", "/interventions", {
        body: { ...basePayload, recurringPeriod: "HOURLY" },
      });

      expect(response.status).toBe(400);
      expect(interventionCreateMock).not.toHaveBeenCalled();
    });

    it("updates recurringPeriod on existing intervention", async () => {
      interventionFindUniqueMock.mockResolvedValue({
        id: 21,
        startedAt: new Date("2026-05-16T10:00:00.000Z"),
      });

      const response = await request("PATCH", "/interventions/21/recurrence", {
        body: { recurringPeriod: "WEEKLY" },
      });

      expect(response.status).toBe(200);
      expect(interventionUpdateMock).toHaveBeenCalledWith({
        where: { id: 21 },
        data: expect.objectContaining({
          recurringPeriod: "WEEKLY",
          nextGenerationAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it("stops recurrence by setting recurringPeriod to null", async () => {
      interventionFindUniqueMock.mockResolvedValue({
        id: 21,
        startedAt: new Date("2026-05-16T10:00:00.000Z"),
      });

      const response = await request("PATCH", "/interventions/21/recurrence", {
        body: { recurringPeriod: null },
      });

      expect(response.status).toBe(200);
      expect(interventionUpdateMock).toHaveBeenCalledWith({
        where: { id: 21 },
        data: expect.objectContaining({
          recurringPeriod: null,
          nextGenerationAt: null,
        }),
        include: expect.any(Object),
      });
    });

    it("returns 404 when updating recurrence for missing intervention", async () => {
      interventionFindUniqueMock.mockResolvedValue(null);

      const response = await request("PATCH", "/interventions/999/recurrence", {
        body: { recurringPeriod: "MONTHLY" },
      });

      expect(response.status).toBe(404);
      expect(interventionUpdateMock).not.toHaveBeenCalled();
    });

    it("rejects recurrence update for non-coordinator roles", async () => {
      const response = await request("PATCH", "/interventions/21/recurrence", {
        body: { recurringPeriod: "MONTHLY" },
        roles: ["Korisnik"],
      });

      expect(response.status).toBe(403);
      expect(interventionUpdateMock).not.toHaveBeenCalled();
    });
  });
});
