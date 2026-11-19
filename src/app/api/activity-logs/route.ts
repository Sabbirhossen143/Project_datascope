import { NextRequest, NextResponse } from "next/server";
import { desc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, datasets, users } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const auth = await requireRole(["ADMIN"]);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(
      1,
      Number(searchParams.get("page")) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 20)
    );

    const offset = (page - 1) * limit;

    const [logs, totalResult] = await Promise.all([
      db
        .select({
          id: activityLogs.id,
          userId: activityLogs.userId,
          userName: users.name,
          userEmail: users.email,
          datasetId: activityLogs.datasetId,
          datasetName: datasets.name,
          recordId: activityLogs.recordId,
          externalId: activityLogs.externalId,
          action: activityLogs.action,
          details: activityLogs.details,
          createdAt: activityLogs.createdAt,
        })
        .from(activityLogs)
        .leftJoin(users, eq(users.id, activityLogs.userId))
        .leftJoin(datasets, eq(datasets.id, activityLogs.datasetId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ total: count() }).from(activityLogs),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Activity logs GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch activity logs.",
      },
      { status: 500 }
    );
  }
}