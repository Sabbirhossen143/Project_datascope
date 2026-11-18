import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  compare: vi.fn(),
  createSessionToken: vi.fn(),
  setSessionCookie: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: { select: mocks.select },
}));

vi.mock("bcryptjs", () => ({
  compare: mocks.compare,
}));

vi.mock("@/lib/auth", () => ({
  createSessionToken: mocks.createSessionToken,
  setSessionCookie: mocks.setSessionCookie,
}));

import { POST } from "@/app/api/auth/login/route";

const activeUser = {
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
  password: "hashed-password",
  role: "VIEWER",
  isActive: true,
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockUserQuery(user: typeof activeUser | null) {
  mocks.select.mockReturnValue({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(user ? [user] : []),
      }),
    }),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.createSessionToken.mockResolvedValue("test-session-token");

    mocks.setSessionCookie.mockImplementation((response, token) => {
      response.headers.set("set-cookie", `datascope_session=${token}`);
      return response;
    });
  });

  it("returns 200 and sets session cookie for valid credentials", async () => {
    mockUserQuery(activeUser);
    mocks.compare.mockResolvedValue(true);

    const response = await POST(
      makeRequest({
        email: "test@example.com",
        password: "correct-password",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.email).toBe("test@example.com");
    expect(mocks.createSessionToken).toHaveBeenCalled();
    expect(mocks.setSessionCookie).toHaveBeenCalledWith(
      response,
      "test-session-token",
    );
  });

  it("returns 400 for invalid email", async () => {
    const response = await POST(
      makeRequest({
        email: "invalid-email",
        password: "password123",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("returns 401 when user does not exist", async () => {
    mockUserQuery(null);

    const response = await POST(
      makeRequest({
        email: "unknown@example.com",
        password: "password123",
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.compare).not.toHaveBeenCalled();
  });

  it("returns 401 when password is incorrect", async () => {
    mockUserQuery(activeUser);
    mocks.compare.mockResolvedValue(false);

    const response = await POST(
      makeRequest({
        email: "test@example.com",
        password: "wrong-password",
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.createSessionToken).not.toHaveBeenCalled();
  });

  it("returns 401 when account is inactive", async () => {
    mockUserQuery({ ...activeUser, isActive: false });

    const response = await POST(
      makeRequest({
        email: "test@example.com",
        password: "password123",
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.compare).not.toHaveBeenCalled();
  });
});
