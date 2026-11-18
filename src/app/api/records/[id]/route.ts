import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { accessPermissions, datasetRecords, datasets } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await context.params;
    const datasetId = request.nextUrl.searchParams.get("datasetId");

    if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(datasetId).success) {
      return NextResponse.json({ success: false, message: "A valid record ID and dataset ID are required." }, { status: 400 });
    }

    if (auth.session.role !== "ADMIN") {
      const permission = await db
        .select({ canRead: accessPermissions.canRead })
        .from(accessPermissions)
        .where(and(
          eq(accessPermissions.userId, auth.session.userId),
          eq(accessPermissions.datasetId, datasetId!),
          eq(accessPermissions.canRead, true)
        ))
        .limit(1);

      if (!permission.length) {
        return NextResponse.json({ success: false, message: "You do not have access to this dataset." }, { status: 403 });
      }
    }

    const rows = await db
      .select({
        id: datasetRecords.id,
        datasetId: datasetRecords.datasetId,
        externalId: datasetRecords.externalId,
        data: datasetRecords.data,
        createdAt: datasetRecords.createdAt,
        updatedAt: datasetRecords.updatedAt,
        datasetName: datasets.name,
      })
      .from(datasetRecords)
      .innerJoin(datasets, eq(datasetRecords.datasetId, datasets.id))
      .where(and(eq(datasetRecords.id, id), eq(datasetRecords.datasetId, datasetId!)))
      .limit(1);

    const record = rows[0];
    if (!record) {
      return NextResponse.json({ success: false, message: "Record not found." }, { status: 404 });
    }

    const customerName = typeof record.data.customerName === "string" ? record.data.customerName : "";
    const email = typeof record.data.email === "string" ? record.data.email : "";
    const relatedMatch = customerName
      ? sql`${datasetRecords.data} ->> 'customerName' = ${customerName}`
      : email
        ? sql`${datasetRecords.data} ->> 'email' = ${email}`
        : undefined;

    const related = relatedMatch
      ? await db
          .select({
            id: datasetRecords.id,
            externalId: datasetRecords.externalId,
            data: datasetRecords.data,
            createdAt: datasetRecords.createdAt,
          })
          .from(datasetRecords)
          .where(and(
            eq(datasetRecords.datasetId, record.datasetId),
            ne(datasetRecords.id, record.id),
            relatedMatch
          ))
          .orderBy(sql`${datasetRecords.createdAt} DESC`)
          .limit(6)
      : [];

    return NextResponse.json({
      success: true,
      data: {
        ...record,
        relatedRecords: related,
        history: [],
        historyAvailable: false,
      },
    });
  } catch (error) {
    console.error("Record details GET error:", error);
    return NextResponse.json({ success: false, message: "Unable to load this record." }, { status: 500 });
  }
}
