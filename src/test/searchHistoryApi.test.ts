import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/permissions", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/db", () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
  },
}));

import {
  GET,
  POST,
} from "@/app/api/search-history/route";

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

const viewerAuth = {
  authorized: true,
  session: {
    userId: "viewer-123",
    email: "viewer@example.com",
    role: "VIEWER",
  },
  response: null,
};

const validHistory = {
  datasetId,
  query: "customer",
  filters: {
    filters: [],
    sortBy: "createdAt",
    sortOrder: "desc",
    pageSize: 25,
  },
};

function makeGetRequest(query = "") {
  return new Request(
    `http://localhost/api/search-history${query ? `?${query}` : ""}`,
  );
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/search-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockSelectQueue(results: unknown[][]) {
  let index = 0;

  mocks.select.mockImplementation(() => {
    const result = results[index++] ?? [];

    return {
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(result),
          orderBy: () => ({
            limit: () => Promise.resolve(result),
          }),
        }),
        orderBy: () => ({
          limit: () => Promise.resolve(result),
        }),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve(result).then(resolve),
      }),
    };
  });
}

describe("Search History API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue(adminAuth);
  });

  it("returns 401 when authentication is missing", async () => {
    mocks.requireRole.mockResolvedValue({
      authorized: false,
      session: null,
      response: Response.json(
        { message: "Authentication required." },
        { status: 401 },
      ),
    });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(401);
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid dataset ID", async () => {
    const response = await GET(
      makeGetRequest("datasetId=invalid"),
    );

    expect(response.status).toBe(400);
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("returns an empty list when user has no accessible datasets", async () => {
    mockSelectQueue([]);

    const response = await GET(makeGetRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns search history for an admin", async () => {
    const history = [
      {
        id: "history-1",
        datasetId,
        query: "customer",
      },
    ];

    mockSelectQueue([
      [{ id: datasetId }],
      history,
    ]);

    const response = await GET(makeGetRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(history);
  });

  it("returns 400 for invalid history data", async () => {
    const response = await POST(
      makePostRequest({
        datasetId: "invalid",
        query: "customer",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns 403 when Viewer lacks dataset permission", async () => {
    mocks.requireRole.mockResolvedValue(viewerAuth);
    mockSelectQueue([[]]);

    const response = await POST(
      makePostRequest(validHistory),
    );

    expect(response.status).toBe(403);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("creates search history for an admin", async () => {
    const createdHistory = {
      id: "history-123",
      userId: "admin-123",
      datasetId,
      query: "customer",
    };

    mockSelectQueue([[{ id: datasetId }]]);

    mocks.insert.mockReturnValue({
      values: () => ({
        returning: () => Promise.resolve([createdHistory]),
      }),
    });

    const response = await POST(
      makePostRequest(validHistory),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("history-123");
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when database operation fails", async () => {
    mocks.select.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(500);
  });
});
