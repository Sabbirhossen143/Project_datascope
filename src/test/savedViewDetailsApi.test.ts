import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/permissions", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/db", () => ({
  db: {
    update: mocks.update,
    delete: mocks.delete,
  },
}));

import {
  PATCH,
  DELETE,
} from "@/app/api/saved-views/[id]/route";

const viewId = "81f7f864-4784-4117-80c3-2401f923e78e";

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

function makeRequest(method: string, body?: unknown) {
  return new Request(`http://localhost/api/saved-views/${viewId}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function makeContext(id = viewId) {
  return { params: Promise.resolve({ id }) };
}

describe("Saved View Details API", () => {
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

    const response = await PATCH(
      makeRequest("PATCH", { name: "Updated View" }),
      makeContext(),
    );

    expect(response.status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid saved view ID", async () => {
    const response = await PATCH(
      makeRequest("PATCH", { name: "Updated View" }),
      makeContext("invalid-id"),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 when PATCH body is empty", async () => {
    const response = await PATCH(
      makeRequest("PATCH", {}),
      makeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("prevents Viewer from making a view shared", async () => {
    mocks.requireRole.mockResolvedValue(viewerAuth);

    const response = await PATCH(
      makeRequest("PATCH", { isShared: true }),
      makeContext(),
    );

    expect(response.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates a saved view successfully", async () => {
    const updatedView = {
      id: viewId,
      name: "Updated View",
      userId: "admin-123",
    };

    mocks.update.mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([updatedView]),
        }),
      }),
    });

    const response = await PATCH(
      makeRequest("PATCH", { name: "Updated View" }),
      makeContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Updated View");
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when user does not own the saved view", async () => {
    mocks.update.mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    });

    const response = await PATCH(
      makeRequest("PATCH", { name: "Updated View" }),
      makeContext(),
    );

    expect(response.status).toBe(404);
  });

  it("deletes an owned saved view successfully", async () => {
    const deletedView = {
      id: viewId,
      name: "My Saved View",
    };

    mocks.delete.mockReturnValue({
      where: () => ({
        returning: () => Promise.resolve([deletedView]),
      }),
    });

    const response = await DELETE(
      makeRequest("DELETE"),
      makeContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(viewId);
    expect(body.message).toBe("Saved view deleted successfully.");
  });

  it("returns 404 when user cannot delete the saved view", async () => {
    mocks.delete.mockReturnValue({
      where: () => ({
        returning: () => Promise.resolve([]),
      }),
    });

    const response = await DELETE(
      makeRequest("DELETE"),
      makeContext(),
    );

    expect(response.status).toBe(404);
  });
});
