import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/permissions", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/db", () => ({
  db: {
    select: mocks.select,
  },
}));

import { GET } from "@/app/api/records/route";

const datasetId = "81f7f864-4784-4117-80c3-2401f923e78e";

const adminAuth = {
  authorized: true,
  session: {
    userId: "admin-123",
    email: "admin@example.com",
    role: "ADMIN",
  },
  response: null,
};

function makeRequest(query = "") {
  return new NextRequest(
    `http://localhost/api/records${query ? `?${query}` : ""}`,
  );
}

function mockDatabase(records: unknown[] = [], total = 0) {
  mocks.select
    .mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([{ total }]),
      }),
    })
    .mockReturnValueOnce({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              offset: () => Promise.resolve(records),
            }),
          }),
        }),
      }),
    });
}

describe("GET /api/records", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue(adminAuth);
  });

  it("returns 401 when authentication is missing", async () => {
    const unauthorized = {
      authorized: false,
      session: null,
      response: Response.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      ),
    };

    mocks.requireRole.mockResolvedValue(unauthorized);

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("returns 400 when datasetId is missing or invalid", async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(400);
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid pagination parameters", async () => {
    const response = await GET(
      makeRequest(`datasetId=${datasetId}&page=0`),
    );

    expect(response.status).toBe(400);
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid page size", async () => {
    const response = await GET(
      makeRequest(`datasetId=${datasetId}&pageSize=101`),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid sort field", async () => {
    const response = await GET(
      makeRequest(`datasetId=${datasetId}&sortBy=invalidField`),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid sort order", async () => {
    const response = await GET(
      makeRequest(`datasetId=${datasetId}&sortOrder=random`),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for malformed filters JSON", async () => {
    const response = await GET(
      makeRequest(`datasetId=${datasetId}&filters=invalid-json`),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for an unsupported filter field", async () => {
    const filters = encodeURIComponent(
      JSON.stringify([
        { field: "password", operator: "eq", value: "123" },
      ]),
    );

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&filters=${filters}`),
    );

    expect(response.status).toBe(400);
  });

  it("returns records and pagination metadata", async () => {
    const records = [
      {
        id: "record-1",
        externalId: "TXN-001",
        data: { customerName: "Test Customer", amount: 500 },
      },
    ];

    mockDatabase(records, 51);

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&page=2&pageSize=25`),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({
      page: 2,
      pageSize: 25,
      totalRecords: 51,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it("returns 403 when a non-admin user lacks dataset permission", async () => {
    mocks.requireRole.mockResolvedValue({
      authorized: true,
      session: {
        userId: "viewer-123",
        email: "viewer@example.com",
        role: "VIEWER",
      },
      response: null,
    });

    mocks.select.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    });

    const response = await GET(
      makeRequest(`datasetId=${datasetId}`),
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 when database query fails", async () => {
    mocks.select.mockImplementation(() => {
      throw new Error("Database failure");
    });

    const response = await GET(
      makeRequest(`datasetId=${datasetId}`),
    );

    expect(response.status).toBe(500);
  });
});
