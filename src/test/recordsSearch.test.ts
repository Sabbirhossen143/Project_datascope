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
  db: { select: mocks.select },
}));

import { GET } from "@/app/api/records/route";

const datasetId = "81f7f864-4784-4117-80c3-2401f923e78e";

function makeRequest(query: string) {
  return new NextRequest(`http://localhost/api/records?${query}`);
}

function mockDatabase() {
  mocks.select
    .mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([{ total: 12 }]),
      }),
    })
    .mockReturnValueOnce({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              offset: () => Promise.resolve([]),
            }),
          }),
        }),
      }),
    });
}

describe("Records API - Search, Filters and Sorting", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireRole.mockResolvedValue({
      authorized: true,
      session: {
        userId: "admin-123",
        email: "admin@example.com",
        role: "ADMIN",
      },
      response: null,
    });
  });

  it("accepts global search query", async () => {
    mockDatabase();

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&search=customer`),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.search).toBe("customer");
  });

  it("accepts a valid single field filter", async () => {
    mockDatabase();

    const filters = encodeURIComponent(
      JSON.stringify([
        { field: "status", operator: "eq", value: "completed" },
      ]),
    );

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&filters=${filters}`),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.appliedFilters).toHaveLength(1);
    expect(body.appliedFilters[0].field).toBe("status");
  });

  it("accepts multiple combined filters", async () => {
    mockDatabase();

    const filters = encodeURIComponent(
      JSON.stringify([
        { field: "status", operator: "eq", value: "completed" },
        { field: "region", operator: "contains", value: "Chattogram" },
        { field: "amount", operator: "gte", value: 500 },
      ]),
    );

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&filters=${filters}`),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.appliedFilters).toHaveLength(3);
  });

  it("accepts numeric between filter", async () => {
    mockDatabase();

    const filters = encodeURIComponent(
      JSON.stringify([
        { field: "amount", operator: "between", value: [100, 1000] },
      ]),
    );

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&filters=${filters}`),
    );

    expect(response.status).toBe(200);
  });

  it("rejects invalid between filter values", async () => {
    const filters = encodeURIComponent(
      JSON.stringify([
        { field: "amount", operator: "between", value: [100] },
      ]),
    );

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&filters=${filters}`),
    );

    expect(response.status).toBe(400);
  });

  it("accepts ascending sorting", async () => {
    mockDatabase();

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&sortBy=amount&sortOrder=asc`),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sorting).toEqual({
  sortBy: "amount",
  sortOrder: "asc",
  rules: [
    {
      field: "amount",
      direction: "asc",
    },
  ],
});
  });

  it("accepts descending sorting", async () => {
    mockDatabase();

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&sortBy=customerName&sortOrder=desc`),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sorting.sortOrder).toBe("desc");
  });

  it("rejects more than ten filters", async () => {
    const filters = encodeURIComponent(
      JSON.stringify(
        Array.from({ length: 11 }, () => ({
          field: "status",
          operator: "eq",
          value: "completed",
        })),
      ),
    );

    const response = await GET(
      makeRequest(`datasetId=${datasetId}&filters=${filters}`),
    );

    expect(response.status).toBe(400);
  });
});
