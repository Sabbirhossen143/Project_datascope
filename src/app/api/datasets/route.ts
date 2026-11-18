import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { datasets, datasetRecords, accessPermissions } from "@/db/schema";
import { and, desc, eq, ilike, or, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/permissions";

const createSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).default(""),
  category: z.string().trim().max(100).default("General"),
  dataSource: z.string().trim().max(150).default("Manual"),
});

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 140);
}

export async function GET(request: Request) {
  const auth = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);
  if (!auth.authorized) return auth.response;

  try {
    const searchParams = new URL(request.url).searchParams;
    const search = (searchParams.get("search") ?? "").trim().slice(0, 120);
    const category = (searchParams.get("category") ?? "").trim();

    const permissionRows = auth.session.role === "ADMIN"
      ? null
      : await db.select({ datasetId: accessPermissions.datasetId })
          .from(accessPermissions)
          .where(and(
            eq(accessPermissions.userId, auth.session.userId),
            eq(accessPermissions.canRead, true)
          ));

    const allowedIds = permissionRows?.map((row) => row.datasetId) ?? [];
    if (permissionRows && allowedIds.length === 0) {
      return NextResponse.json({ success: true, data: [], meta: { total: 0, categories: [] } });
    }

    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(datasets.name, `%${search}%`),
        ilike(datasets.slug, `%${search}%`),
        ilike(datasets.description, `%${search}%`),
        ilike(datasets.category, `%${search}%`)
      )!);
    }
    if (category && category !== "all") conditions.push(eq(datasets.category, category));
    if (permissionRows) conditions.push(sql`${datasets.id} = ANY(ARRAY[${sql.join(allowedIds.map((id) => sql`${id}::uuid`), sql`, `)}]::uuid[])`);

    const rows = await db.select({
      id: datasets.id,
      name: datasets.name,
      slug: datasets.slug,
      description: datasets.description,
      category: datasets.category,
      dataSource: datasets.dataSource,
      totalRecords: datasets.totalRecords,
      createdAt: datasets.createdAt,
      updatedAt: datasets.updatedAt,
      actualRecords: sql<number>`count(${datasetRecords.id})::int`,
    })
      .from(datasets)
      .leftJoin(datasetRecords, eq(datasetRecords.datasetId, datasets.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(datasets.id)
      .orderBy(desc(datasets.updatedAt));

    const categories = await db.selectDistinct({ category: datasets.category })
      .from(datasets)
      .where(permissionRows
        ? sql`${datasets.id} = ANY(ARRAY[${sql.join(allowedIds.map((id) => sql`${id}::uuid`), sql`, `)}]::uuid[])`
        : undefined);

    return NextResponse.json({
      success: true,
      data: rows.map((row) => ({ ...row, totalRecords: row.actualRecords ?? row.totalRecords })),
      meta: { total: rows.length, categories: categories.map((item) => item.category).filter(Boolean) },
    });
  } catch (error) {
    console.error("Datasets GET error:", error);
    return NextResponse.json({ success: false, message: "Unable to load datasets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Please check the dataset information.", errors: parsed.error.issues }, { status: 400 });
    }

    const { name, description, category, dataSource } = parsed.data;
    const baseSlug = slugify(name) || "dataset";
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

    const [created] = await db.insert(datasets).values({
      name, slug, description: description || null, category: category || "General",
      dataSource: dataSource || "Manual", totalRecords: 0, createdBy: auth.session.userId,
    }).returning();

    return NextResponse.json({ success: true, message: "Dataset created successfully.", data: created }, { status: 201 });
  } catch (error) {
    console.error("Datasets POST error:", error);
    return NextResponse.json({ success: false, message: "Unable to create dataset." }, { status: 500 });
  }
}
