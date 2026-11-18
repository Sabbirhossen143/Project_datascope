
import { NextResponse } from "next/server";
import {
  and,
  count,
  desc,
  eq,
  sql,
} from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  datasets,
  datasetRecords,
  accessPermissions,
} from "@/db/schema";
import { requireRole } from "@/lib/permissions";

const DEFAULT_DATASET_ID =
  "81f7f864-4784-4117-80c3-2401f923e78e";

export async function GET(request: Request) {
  try {
    // Authentication
    const auth = await requireRole([
      "ADMIN",
      "ANALYST",
      "VIEWER",
    ]);

    if (!auth.authorized) {
      return auth.response;
    }

    // Dataset validation
    const { searchParams } = new URL(request.url);

    const datasetId =
      searchParams.get("datasetId") || DEFAULT_DATASET_ID;

    if (!z.string().uuid().safeParse(datasetId).success) {
      return NextResponse.json(
        { message: "Invalid dataset ID." },
        { status: 400 }
      );
    }

    // Check dataset existence
    const [dataset] = await db
      .select({
        id: datasets.id,
        name: datasets.name,
        slug: datasets.slug,
      })
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (!dataset) {
      return NextResponse.json(
        { message: "Dataset not found." },
        { status: 404 }
      );
    }

    // Check dataset read permission
    if (auth.session.role !== "ADMIN") {
      const [permission] = await db
        .select({
          canRead: accessPermissions.canRead,
        })
        .from(accessPermissions)
        .where(
          and(
            eq(accessPermissions.userId, auth.session.userId),
            eq(accessPermissions.datasetId, datasetId),
            eq(accessPermissions.canRead, true)
          )
        )
        .limit(1);

      if (!permission) {
        return NextResponse.json(
          { message: "You do not have access to this dataset." },
          { status: 403 }
        );
      }
    }

    // Reusable SQL expressions
    const amountExpr = sql<number>`
      COALESCE(
        NULLIF(${datasetRecords.data}->>'amount', '')::numeric,
        0
      )
    `;

    const quantityExpr = sql<number>`
      COALESCE(
        NULLIF(${datasetRecords.data}->>'quantity', '')::numeric,
        0
      )
    `;

    const monthExpr = sql<string>`
      to_char(
        date_trunc(
          'month',
          (${datasetRecords.data}->>'orderDate')::date
        ),
        'YYYY-MM'
      )
    `;

    const monthDateExpr = sql`
      date_trunc(
        'month',
        (${datasetRecords.data}->>'orderDate')::date
      )
    `;

    const categoryExpr = sql<string>`
      COALESCE(
        NULLIF(${datasetRecords.data}->>'category', ''),
        'Uncategorized'
      )
    `;

    const statusExpr = sql<string>`
      COALESCE(
        NULLIF(${datasetRecords.data}->>'status', ''),
        'Unknown'
      )
    `;

    const regionExpr = sql<string>`
      COALESCE(
        NULLIF(${datasetRecords.data}->>'region', ''),
        'Unknown'
      )
    `;

    const productExpr = sql<string>`
      COALESCE(
        NULLIF(${datasetRecords.data}->>'product', ''),
        'Unknown'
      )
    `;

    // Run database aggregations in parallel
    const [
      overviewResult,
      monthlyResult,
      statusResult,
      categoryResult,
      regionResult,
      productResult,
    ] = await Promise.all([

      // 1. Overview KPIs
      db
        .select({
          totalTransactions: count(),
          totalRevenue: sql<string>`
            COALESCE(SUM(${amountExpr}), 0)::text
          `,
          averageOrderValue: sql<string>`
            COALESCE(AVG(${amountExpr}), 0)::text
          `,
          totalQuantity: sql<string>`
            COALESCE(SUM(${quantityExpr}), 0)::text
          `,
        })
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, datasetId)),

      // 2. Monthly revenue
      db
        .select({
          month: monthExpr,
          revenue: sql<string>`
            COALESCE(SUM(${amountExpr}), 0)::text
          `,
          transactions: count(),
        })
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, datasetId))
        .groupBy(monthExpr, monthDateExpr)
        .orderBy(desc(monthDateExpr))
        .limit(12),

      // 3. Transaction status distribution
      db
        .select({
          status: statusExpr,
          transactions: count(),
          revenue: sql<string>`
            COALESCE(SUM(${amountExpr}), 0)::text
          `,
        })
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, datasetId))
        .groupBy(statusExpr)
        .orderBy(desc(count())),

      // 4. Category-wise sales
      db
        .select({
          category: categoryExpr,
          revenue: sql<string>`
            COALESCE(SUM(${amountExpr}), 0)::text
          `,
          transactions: count(),
          quantity: sql<string>`
            COALESCE(SUM(${quantityExpr}), 0)::text
          `,
        })
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, datasetId))
        .groupBy(categoryExpr)
        .orderBy(desc(sql`SUM(${amountExpr})`)),

      // 5. Regional performance
      db
        .select({
          region: regionExpr,
          revenue: sql<string>`
            COALESCE(SUM(${amountExpr}), 0)::text
          `,
          transactions: count(),
        })
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, datasetId))
        .groupBy(regionExpr)
        .orderBy(desc(sql`SUM(${amountExpr})`)),

      // 6. Top selling products
      db
        .select({
          product: productExpr,
          revenue: sql<string>`
            COALESCE(SUM(${amountExpr}), 0)::text
          `,
          quantity: sql<string>`
            COALESCE(SUM(${quantityExpr}), 0)::text
          `,
          transactions: count(),
        })
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, datasetId))
        .groupBy(productExpr)
        .orderBy(desc(sql`SUM(${amountExpr})`))
        .limit(5),
    ]);

    const overview = overviewResult[0];

    // Reverse monthly data for chronological chart display
    const monthlyRevenue = [...monthlyResult].reverse();

    return NextResponse.json(
      {
        success: true,

        dataset: {
          id: dataset.id,
          name: dataset.name,
          slug: dataset.slug,
        },

        overview: {
          totalTransactions: overview.totalTransactions,
          totalRevenue: Number(overview.totalRevenue),
          averageOrderValue: Number(overview.averageOrderValue),
          totalQuantity: Number(overview.totalQuantity),
        },

        monthlyRevenue: monthlyRevenue.map((item) => ({
          month: item.month,
          revenue: Number(item.revenue),
          transactions: item.transactions,
        })),

        statusDistribution: statusResult.map((item) => ({
          status: item.status,
          transactions: item.transactions,
          revenue: Number(item.revenue),
        })),

        categorySales: categoryResult.map((item) => ({
          category: item.category,
          revenue: Number(item.revenue),
          transactions: item.transactions,
          quantity: Number(item.quantity),
        })),

        regionalPerformance: regionResult.map((item) => ({
          region: item.region,
          revenue: Number(item.revenue),
          transactions: item.transactions,
        })),

        topProducts: productResult.map((item) => ({
          product: item.product,
          revenue: Number(item.revenue),
          quantity: Number(item.quantity),
          transactions: item.transactions,
        })),
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("ANALYTICS API ERROR:", error);

    return NextResponse.json(
      { message: "Failed to generate analytics." },
      { status: 500 }
    );
  }
}
