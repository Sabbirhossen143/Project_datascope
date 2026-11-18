import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, type AuthSession, type UserRole } from "@/lib/auth";

type AuthorizationResult =
  | { authorized: true; session: AuthSession; response: null }
  | { authorized: false; session: null; response: NextResponse };

/**
 * Always reads the current role and account status from PostgreSQL.
 * Role changes made in User Management therefore take effect immediately,
 * even if the user still has an older signed session cookie.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AuthorizationResult> {
  const tokenSession = await getSession();

  if (!tokenSession) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const [currentUser] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, tokenSession.userId))
    .limit(1);

  if (!currentUser || !currentUser.isActive) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        { success: false, message: "Your account is inactive or unavailable." },
        { status: 401 }
      ),
    };
  }

  const session: AuthSession = {
    userId: currentUser.id,
    email: currentUser.email,
    role: currentUser.role,
  };

  if (!allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        { success: false, message: "You do not have permission to perform this action." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session, response: null };
}
