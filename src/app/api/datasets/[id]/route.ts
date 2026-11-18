import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { datasets } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).default(""),
  category: z.string().trim().max(100).default("General"),
  dataSource: z.string().trim().max(150).default("Manual"),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ success: false, message: "Invalid dataset ID." }, { status: 400 });
    }
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Please check the dataset information.", errors: parsed.error.issues }, { status: 400 });
    }

    const [updated] = await db.update(datasets).set({
      ...parsed.data,
      description: parsed.data.description || null,
      updatedAt: new Date(),
    }).where(eq(datasets.id, id)).returning();

    if (!updated) return NextResponse.json({ success: false, message: "Dataset not found." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Dataset updated successfully.", data: updated });
  } catch (error) {
    console.error("Dataset PATCH error:", error);
    return NextResponse.json({ success: false, message: "Unable to update dataset." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ success: false, message: "Invalid dataset ID." }, { status: 400 });
    }

    const [deleted] = await db.delete(datasets).where(eq(datasets.id, id)).returning({ id: datasets.id });
    if (!deleted) return NextResponse.json({ success: false, message: "Dataset not found." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Dataset deleted successfully." });
  } catch (error) {
    console.error("Dataset DELETE error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete dataset." }, { status: 500 });
  }
}
