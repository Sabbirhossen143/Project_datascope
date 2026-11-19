import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { activityLogs, datasetRecords } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

const bulkDeleteSchema = z.object({
  datasetId: z.string().uuid(),
  recordIds: z.array(z.string().uuid()).min(1).max(500),
});

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const parsed = bulkDeleteSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid dataset ID or record IDs.",
        },
        { status: 400 }
      );
    }

    const { datasetId, recordIds } = parsed.data;
    const uniqueRecordIds = Array.from(new Set(recordIds));

    const deletedRecords = await db.transaction(async (tx) => {
      const records = await tx
        .delete(datasetRecords)
        .where(
          and(
            eq(datasetRecords.datasetId, datasetId),
            inArray(datasetRecords.id, uniqueRecordIds)
          )
        )
        .returning({
          id: datasetRecords.id,
          externalId: datasetRecords.externalId,
        });

      if (records.length > 0) {
        await tx.insert(activityLogs).values(
          records.map((record) => ({
            userId: auth.session.userId,
            datasetId,
            recordId: record.id,
            externalId: record.externalId,
            action: "BULK_DELETE" as const,
            details: {
              operation: "bulk_delete",
              deletedCount: records.length,
            },
          }))
        );
      }

      return records;
    });

    return NextResponse.json({
      success: true,
      message: `${deletedRecords.length} records deleted successfully.`,
      deletedCount: deletedRecords.length,
      deletedIds: deletedRecords.map((record) => record.id),
    });
  } catch (error) {
    console.error("Bulk record DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete selected records.",
      },
      { status: 500 }
    );
  }
}