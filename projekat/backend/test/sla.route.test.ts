import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  slaConfigurationFindManyMock,
  slaConfigurationFindUniqueMock,
  slaConfigurationUpsertMock,
} = vi.hoisted(() => ({
  slaConfigurationFindManyMock: vi.fn(),
  slaConfigurationFindUniqueMock: vi.fn(),
  slaConfigurationUpsertMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    slaConfiguration: {
      findMany: slaConfigurationFindManyMock,
      findUnique: slaConfigurationFindUniqueMock,
      upsert: slaConfigurationUpsertMock,
    },
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

import slaRouter from "../src/modules/sla/sla.route";
import { Priority } from "../src/modules/sla/sla.service";

type HttpMethod = "PATCH" | "PUT";

type TestResponse = {
  status: number;
  body: unknown;
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = {
      id: "kc-admin-001",
      localUserId: 1,
      username: "admin",
      roles: ["Admin"],
    };
    next();
  });
  app.use("/sla", slaRouter);
  return app;
}

async function request(
  method: HttpMethod,
  body: unknown,
): Promise<TestResponse> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/sla`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();

    return {
      status: response.status,
      body: text ? (JSON.parse(text) as unknown) : null,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

describe("SLA route updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    slaConfigurationFindManyMock.mockResolvedValue([
      {
        id: 1,
        priority: Priority.HIGH,
        deadlineHours: 8,
        updatedAt: new Date("2026-05-07T10:00:00.000Z"),
      },
    ]);
    slaConfigurationUpsertMock.mockImplementation(({ where, update }) =>
      Promise.resolve({
        id: 1,
        priority: where.priority,
        deadlineHours: update.deadlineHours,
        updatedAt: new Date("2026-05-07T11:00:00.000Z"),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates SLA configurations through PATCH", async () => {
    const response = await request("PATCH", {
      configurations: [{ priority: Priority.HIGH, deadlineHours: 10 }],
    });

    expect(response.status).toBe(200);
    expect(slaConfigurationUpsertMock).toHaveBeenCalledWith({
      where: { priority: Priority.HIGH },
      update: { deadlineHours: 10 },
      create: { priority: Priority.HIGH, deadlineHours: 10 },
    });
  });

  it("keeps PUT updates working with a direct array payload", async () => {
    const response = await request("PUT", [
      { priority: Priority.HIGH, deadlineHours: 12 },
    ]);

    expect(response.status).toBe(200);
    expect(slaConfigurationUpsertMock).toHaveBeenCalledWith({
      where: { priority: Priority.HIGH },
      update: { deadlineHours: 12 },
      create: { priority: Priority.HIGH, deadlineHours: 12 },
    });
  });
});
