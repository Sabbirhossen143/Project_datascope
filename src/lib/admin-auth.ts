import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";

/**
 * Re-checks the current database role on every admin API request.
 * This prevents an old JWT from retaining ADMIN access after a role change.
 */
export async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || !user.isActive) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Your account is inactive or unavailable." },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
