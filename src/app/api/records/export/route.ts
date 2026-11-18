
import { NextResponse } from "next/server";
import { and, eq, asc } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  datasets,
  datasetRecords,
  accessPermissions,
} from "@/db/schema";
import { requireRole } from "@/lib/permissions";

const DATA_FIELDS = [
  "transactionId",
  "customerName",
  "email",
  "product",
  "category",
  "amount",
  "quantity",
  "status",
  "region",
  "paymentMethod",
  "orderDate",
] as const;

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";

  const text =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    // Only Admin and Analyst can export.
    const auth = await requireRole(["ADMIN", "ANALYST"]);

    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get("datasetId");

    // Validate dataset ID.
    if (!z.string().uuid().safeParse(datasetId).success) {
      return NextResponse.json(
        { success: false, message: "A valid datasetId is required." },
        { status: 400 }
      );
    }

    // Check whether the dataset exists.
    const [dataset] = await db
      .select({
        id: datasets.id,
        slug: datasets.slug,
      })
      .from(datasets)
      .where(eq(datasets.id, datasetId!))
      .limit(1);

    if (!dataset) {
      return NextResponse.json(
        { success: false, message: "Dataset not found." },
        { status: 404 }
      );
    }

    // Admin has full export access.
    // Analyst must have explicit canExport permission.
    if (auth.session.role !== "ADMIN") {
      const permission = await db
        .select({ canExport: accessPermissions.canExport })
        .from(accessPermissions)
        .where(
          and(
            eq(accessPermissions.userId, auth.session.userId),
            eq(accessPermissions.datasetId, datasetId!),
            eq(accessPermissions.canExport, true)
          )
        )
        .limit(1);

      if (permission.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "You do not have permission to export this dataset.",
          },
          { status: 403 }
        );
      }
    }

    // Fetch dataset records.
    const records = await db
      .select({
        externalId: datasetRecords.externalId,
        data: datasetRecords.data,
      })
      .from(datasetRecords)
      .where(eq(datasetRecords.datasetId, datasetId!))
      .orderBy(asc(datasetRecords.externalId))
      .limit(100000);

    // Generate CSV content.
    const headers = ["externalId", ...DATA_FIELDS];

    const csvRows = [
      headers.map(escapeCsv).join(","),
      ...records.map((record) => {
        const data = (record.data ?? {}) as Record<string, unknown>;

        return [
          record.externalId,
          ...DATA_FIELDS.map((field) => data[field]),
        ]
          .map(escapeCsv)
          .join(",");
      }),
    ];

    const csv = "\uFEFF" + csvRows.join("\r\n");
    const filename = `${dataset.slug}-export.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Exported-Records": String(records.length),
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to export dataset. Please try again.",
      },
      { status: 500 }
    );
  }
}
