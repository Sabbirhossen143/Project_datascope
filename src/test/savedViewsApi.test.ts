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
} from "@/app/api/saved-views/route";

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

function makeRequest(url: string) {
  return new Request(url);
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/saved-views", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validView = {
  datasetId,
  name: "My Test View",
  configuration: {
    search: "customer",
    filters: [],
    sortBy: "createdAt",
    sortOrder: "desc",
    pageSize: 25,
    visibleColumns: ["customerName", "amount"],
  },
  isShared: false,
};

describe("Saved Views API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue(adminAuth);
  });

  it("returns 401 when user is not authenticated", async () => {
    mocks.requireRole.mockResolvedValue({
      authorized: false,
      session: null,
      response: Response.json(
        { message: "Authentication required." },
        { status: 401 },
      ),
    });

    const response = await GET(
      makeRequest("http://localhost/api/saved-views"),
    );

    expect(response.status).toBe(401);
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid dataset ID", async () => {
    const response = await GET(
      makeRequest("http://localhost/api/saved-views?datasetId=invalid"),
    );

    expect(response.status).toBe(400);
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("returns an empty list when admin has no datasets", async () => {
    mocks.select.mockReturnValue({
      from: () => Promise.resolve([]),
    });

    const response = await GET(
      makeRequest("http://localhost/api/saved-views"),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 400 when saved view data is invalid", async () => {
    const response = await POST(
      makePostRequest({
        datasetId: "invalid",
        name: "",
        configuration: {},
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("prevents Viewer from sharing saved views", async () => {
    mocks.requireRole.mockResolvedValue(viewerAuth);

    const response = await POST(
      makePostRequest({
        ...validView,
        isShared: true,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.message).toBe("Viewers cannot share saved views.");
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("creates a saved view for an admin", async () => {
    const createdView = {
      id: "view-123",
      userId: "admin-123",
      datasetId,
      name: "My Test View",
      configuration: validView.configuration,
      isShared: false,
    };

    mocks.select.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ id: datasetId }]),
        }),
      }),
    });

    mocks.insert.mockReturnValue({
      values: () => ({
        returning: () => Promise.resolve([createdView]),
      }),
    });

    const response = await POST(makePostRequest(validView));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("My Test View");
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when admin selects a nonexistent dataset", async () => {
    mocks.select.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    });

    const response = await POST(makePostRequest(validView));

    expect(response.status).toBe(404);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns 500 when database operation fails", async () => {
    mocks.select.mockImplementation(() => {
      throw new Error("Database failure");
    });

    const response = await GET(
      makeRequest("http://localhost/api/saved-views"),
    );

    expect(response.status).toBe(500);
  });
});
