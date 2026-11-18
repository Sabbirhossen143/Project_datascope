import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";

const allowedRoles = ["ADMIN", "ANALYST", "VIEWER"] as const;
type UserRole = (typeof allowedRoles)[number];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: { role?: unknown; isActive?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const updates: { role?: UserRole; isActive?: boolean; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (body.role !== undefined) {
    if (
      typeof body.role !== "string" ||
      !allowedRoles.includes(body.role as UserRole)
    ) {
      return NextResponse.json(
        { success: false, message: "Role must be ADMIN, ANALYST or VIEWER." },
        { status: 400 }
      );
    }
    updates.role = body.role as UserRole;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { success: false, message: "isActive must be a boolean." },
        { status: 400 }
      );
    }
    updates.isActive = body.isActive;
  }

  if (updates.role === undefined && updates.isActive === undefined) {
    return NextResponse.json(
      { success: false, message: "No valid changes were provided." },
      { status: 400 }
    );
  }

  // Prevent an administrator from accidentally removing their own admin access.
  if (id === auth.user.id) {
    if (updates.role !== undefined && updates.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "You cannot change your own administrator role." },
        { status: 400 }
      );
    }
    if (updates.isActive === false) {
      return NextResponse.json(
        { success: false, message: "You cannot deactivate your own account." },
        { status: 400 }
      );
    }
  }

  const [updatedUser] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });

  if (!updatedUser) {
    return NextResponse.json(
      { success: false, message: "User not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "User updated successfully.",
    user: updatedUser,
  });
}
