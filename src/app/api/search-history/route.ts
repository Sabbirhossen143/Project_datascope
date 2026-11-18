import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  searchHistory,
  accessPermissions,
  datasets,
} from "@/db/schema";
import { requireRole } from "@/lib/permissions";

const historySchema = z.object({
  datasetId: z.string().uuid(),
  query: z.string().max(500).default(""),
  filters: z.object({
    filters: z.array(z.object({
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
    })).max(10).default([]),
    sortBy: z.string().max(50).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    pageSize: z.number().int().min(1).max(100).default(10),
  }).default({
  filters: [],
  sortBy: "createdAt",
  sortOrder: "desc",
  pageSize: 10,
}),
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
      eq(searchHistory.userId, auth.session.userId),
      inArray(searchHistory.datasetId, accessibleDatasetIds),
    ];

    if (datasetId) {
      conditions.push(eq(searchHistory.datasetId, datasetId));
    }

    const history = await db
      .select()
      .from(searchHistory)
      .where(and(...conditions))
      .orderBy(desc(searchHistory.createdAt))
      .limit(30);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Search history GET error:", error);

    return NextResponse.json(
      { message: "Failed to load search history." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const validation = historySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid search history information.",
          errors: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { datasetId, query, filters } = validation.data;

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
      .insert(searchHistory)
      .values({
        userId: auth.session.userId,
        datasetId,
        query,
        filters,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Search history saved.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Search history POST error:", error);

    return NextResponse.json(
      { message: "Failed to save search history." },
      { status: 500 }
    );
  }
}
