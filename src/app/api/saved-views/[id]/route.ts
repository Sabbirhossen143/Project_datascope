
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { savedViews } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

const configurationSchema = z.object({
  search: z.string().optional(),
  filters: z.array(z.record(z.string(), z.unknown())).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  visibleColumns: z.array(z.string()).optional(),
});

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    configuration: configurationSchema.optional(),
    isShared: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

type RouteContext = {
  params: Promise<{ id: string }>;
};

// UPDATE SAVED VIEW
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const auth = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { message: "Invalid saved view ID." },
        { status: 400 }
      );
    }

    const validation = updateSchema.safeParse(
      await request.json()
    );

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid request data.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    if (
      auth.session.role === "VIEWER" &&
      data.isShared === true
    ) {
      return NextResponse.json(
        { message: "Viewers cannot create shared views." },
        { status: 403 }
      );
    }

    const [updatedView] = await db
      .update(savedViews)
      .set(data)
      .where(
        and(
          eq(savedViews.id, id),
          eq(savedViews.userId, auth.session.userId)
        )
      )
      .returning();

    if (!updatedView) {
      return NextResponse.json(
        { message: "Saved view not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Saved view updated successfully.",
      data: updatedView,
    });
  } catch (error) {
    console.error("UPDATE SAVED VIEW ERROR:", error);

    return NextResponse.json(
      { message: "Failed to update saved view." },
      { status: 500 }
    );
  }
}

// DELETE SAVED VIEW
export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const auth = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { message: "Invalid saved view ID." },
        { status: 400 }
      );
    }

    const [deletedView] = await db
      .delete(savedViews)
      .where(
        and(
          eq(savedViews.id, id),
          eq(savedViews.userId, auth.session.userId)
        )
      )
      .returning({
        id: savedViews.id,
        name: savedViews.name,
      });

    if (!deletedView) {
      return NextResponse.json(
        { message: "Saved view not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Saved view deleted successfully.",
      data: deletedView,
    });
  } catch (error) {
    console.error("DELETE SAVED VIEW ERROR:", error);

    return NextResponse.json(
      { message: "Failed to delete saved view." },
      { status: 500 }
    );
  }
}
