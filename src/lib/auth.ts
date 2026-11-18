import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type UserRole = "ADMIN" | "ANALYST" | "VIEWER";

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
}

const COOKIE_NAME = "datascope_session";
const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is missing from .env.local");
}

const secretKey = new TextEncoder().encode(secret);

export async function createSessionToken(user: AuthSession) {
  return new SignJWT({
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, secretKey);

    const role = payload.role;

    if (
      role !== "ADMIN" &&
      role !== "ANALYST" &&
      role !== "VIEWER"
    ) {
      return null;
    }

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: Response, token: string) {
  const secure = process.env.NODE_ENV === "production";

  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure ? "; Secure" : ""}`
  );

  return response;
}

export function clearSessionCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  );

  return response;
}
