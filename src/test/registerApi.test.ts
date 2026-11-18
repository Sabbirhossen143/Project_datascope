import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
  },
}));

vi.mock("bcryptjs", () => ({
  hash: mocks.hash,
}));

import { POST } from "@/app/api/auth/register/route";

const registeredUser = {
  id: "new-user-123",
  name: "Test User",
  email: "test@example.com",
  role: "VIEWER",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockSelect(results: unknown[][]) {
  let index = 0;

  mocks.select.mockImplementation(() => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(results[index++] ?? []),
      }),
    }),
  }));
}

function mockInsert() {
  mocks.insert
    .mockReturnValueOnce({
      values: () => ({
        returning: () => Promise.resolve([registeredUser]),
      }),
    })
    .mockReturnValueOnce({
      values: () => Promise.resolve(),
    });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hash.mockResolvedValue("hashed-password");
  });

  it("creates a new Viewer account and returns 201", async () => {
    mockSelect([[], [{ id: "dataset-123" }]]);
    mockInsert();

    const response = await POST(
      makeRequest({
        name: "Test User",
        email: "TEST@example.com",
        password: "password123",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.user.role).toBe("VIEWER");
    expect(mocks.hash).toHaveBeenCalledWith("password123", 12);
    expect(mocks.insert).toHaveBeenCalledTimes(2);
  });

  it("returns 400 for invalid registration data", async () => {
    const response = await POST(
      makeRequest({
        name: "A",
        email: "invalid-email",
        password: "123",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns 409 when email is already registered", async () => {
    mockSelect([[{ id: "existing-user" }]]);

    const response = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      }),
    );

    expect(response.status).toBe(409);
    expect(mocks.hash).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("creates the account even when default dataset is unavailable", async () => {
    mockSelect([[], []]);
    mocks.insert.mockReturnValueOnce({
      values: () => ({
        returning: () => Promise.resolve([registeredUser]),
      }),
    });

    const response = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when database operation fails", async () => {
    mocks.select.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const response = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      }),
    );

    expect(response.status).toBe(500);
  });
});
