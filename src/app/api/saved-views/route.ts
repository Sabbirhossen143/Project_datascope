import { NextResponse } from "next/server";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  savedViews,
  accessPermissions,
  datasets,
} from "@/db/schema";
import { requireRole } from "@/lib/permissions";

const filterSchema = z.object({
  field: z.enum([
    "transactionId", "customerName", "email", "product",
    "category", "amount", "quantity", "status", "region",
    "paymentMethod", "orderDate",
  ]),
  operator: z.enum([
    "eq", "neq", "contains", "gt", "gte",
    "lt", "lte", "between",
  ]),
  value: z.unknown(),
});

const configurationSchema = z.object({
  search: z.string().max(500).default(""),
  filters: z.array(filterSchema).max(10).default([]),
  sortBy: z.string().max(50).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  pageSize: z.number().int().min(1).max(100).default(10),
  visibleColumns: z.array(z.string().max(50)).max(30).default([]),
});

const createSchema = z.object({
  datasetId: z.string().uuid(),
  name: z.string().trim().min(1).max(150),
  configuration: configurationSchema,
  isShared: z.boolean().default(false),
});

export async function GET(request: Request) {
  const auth = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

  if (!auth.authorized) return auth.response;

  try {
    const datasetId = new URL(request.url).searchParams.get("datasetId");

    if (datasetId && !z.string().uuid().safeParse(datasetId).success) {
      return NextResponse.json(
        { message: "Invalid dataset ID." },
        { status: 400 }
      );
    }

    let accessibleDatasetIds: string[];

    if (auth.session.role === "ADMIN") {
      const allDatasets = await db
        .select({ id: datasets.id })
        .from(datasets);

      accessibleDatasetIds = allDatasets.map((item) => item.id);
    } else {
      const permissions = await db
        .select({ datasetId: accessPermissions.datasetId })
        .from(accessPermissions)
        .where(
          and(
            eq(accessPermissions.userId, auth.session.userId),
            eq(accessPermissions.canRead, true)
          )
        );

      accessibleDatasetIds = permissions.map((item) => item.datasetId);
    }

    if (accessibleDatasetIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const conditions = [
      inArray(savedViews.datasetId, accessibleDatasetIds),
      or(
        eq(savedViews.userId, auth.session.userId),
        eq(savedViews.isShared, true)
      )!,
    ];

    if (datasetId) {
      conditions.push(eq(savedViews.datasetId, datasetId));
    }

    const views = await db
      .select()
      .from(savedViews)
      .where(and(...conditions))
      .orderBy(desc(savedViews.createdAt))
      .limit(100);

    return NextResponse.json({
      success: true,
      data: views,
    });
  } catch (error) {
    console.error("Saved views GET error:", error);

    return NextResponse.json(
      { message: "Failed to load saved views." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid saved view information.",
          errors: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { datasetId, name, configuration, isShared } = validation.data;

    if (isShared && auth.session.role === "VIEWER") {
      return NextResponse.json(
        { message: "Viewers cannot share saved views." },
        { status: 403 }
      );
    }

    if (auth.session.role !== "ADMIN") {
      const permission = await db
        .select({ canRead: accessPermissions.canRead })
        .from(accessPermissions)
        .where(
          and(
            eq(accessPermissions.userId, auth.session.userId),
            eq(accessPermissions.datasetId, datasetId),
            eq(accessPermissions.canRead, true)
          )
        )
        .limit(1);

      if (permission.length === 0) {
        return NextResponse.json(
          { message: "You do not have access to this dataset." },
          { status: 403 }
        );
      }
    } else {
      const [dataset] = await db
        .select({ id: datasets.id })
        .from(datasets)
        .where(eq(datasets.id, datasetId))
        .limit(1);

      if (!dataset) {
        return NextResponse.json(
          { message: "Dataset not found." },
          { status: 404 }
        );
      }
    }

    const [created] = await db
      .insert(savedViews)
      .values({
        userId: auth.session.userId,
        datasetId,
        name,
        configuration,
        isShared,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Saved view created successfully.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Saved views POST error:", error);

    return NextResponse.json(
      { message: "Failed to create saved view." },
      { status: 500 }
    );
  }
}
