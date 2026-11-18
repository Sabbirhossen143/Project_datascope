import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  sql,
  type SQLWrapper,
} from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { datasetRecords, accessPermissions } from "@/db/schema";

const filterSchema = z.array(
  z.object({
    field: z.enum([
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
    ]),
    operator: z.enum([
      "eq",
      "neq",
      "contains",
      "gt",
      "gte",
      "lt",
      "lte",
      "between",
    ]),
    value: z.unknown(),
  })
).max(10);

const sortableFields: Record<string, SQLWrapper> = {
  externalId: datasetRecords.externalId,
  createdAt: datasetRecords.createdAt,
  amount: sql`(${datasetRecords.data} ->> 'amount')::numeric`,
  quantity: sql`(${datasetRecords.data} ->> 'quantity')::numeric`,
  customerName: sql`${datasetRecords.data} ->> 'customerName'`,
  product: sql`${datasetRecords.data} ->> 'product'`,
  status: sql`${datasetRecords.data} ->> 'status'`,
  region: sql`${datasetRecords.data} ->> 'region'`,
  orderDate: sql`${datasetRecords.data} ->> 'orderDate'`,
};

export async function GET(request: NextRequest) {

  const auth = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

if (!auth.authorized) {
  return auth.response;
}

  try {
    const params = request.nextUrl.searchParams;

    const datasetId = params.get("datasetId");
    const page = Number(params.get("page") || 1);
    const pageSize = Number(params.get("pageSize") || 25);
    const search = (params.get("search") || "").trim();
    const sortBy = params.get("sortBy") || "createdAt";
    const sortOrder = params.get("sortOrder") || "desc";

    // Validate query parameters.
    if (!z.string().uuid().safeParse(datasetId).success) {
      return NextResponse.json(
        { success: false, message: "A valid datasetId is required." },
        { status: 400 }
      );
    }

    // Check dataset access permission.
if (auth.session.role !== "ADMIN") {
  const permission = await db
    .select({ canRead: accessPermissions.canRead })
    .from(accessPermissions)
    .where(
      and(
        eq(accessPermissions.userId, auth.session.userId),
        eq(accessPermissions.datasetId, datasetId!),
        eq(accessPermissions.canRead, true)
      )
    )
    .limit(1);

  if (permission.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have access to this dataset.",
      },
      { status: 403 }
    );
  }
}

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid pagination parameters." },
        { status: 400 }
      );
    }

    if (!sortableFields[sortBy]) {
      return NextResponse.json(
        { success: false, message: "Invalid sort field." },
        { status: 400 }
      );
    }

    if (!["asc", "desc"].includes(sortOrder)) {
      return NextResponse.json(
        { success: false, message: "Invalid sort order." },
        { status: 400 }
      );
    }

    // Parse optional filters.
    let filters: z.infer<typeof filterSchema> = [];

    const rawFilters = params.get("filters");

    if (rawFilters) {
      let parsedFilters: unknown;

      try {
        parsedFilters = JSON.parse(rawFilters);
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid filters JSON." },
          { status: 400 }
        );
      }

      const validation = filterSchema.safeParse(parsedFilters);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid filter configuration.",
            errors: validation.error.issues,
          },
          { status: 400 }
        );
      }

      filters = validation.data;
    }

    const conditions: SQLWrapper[] = [
      eq(datasetRecords.datasetId, datasetId!),
    ];

    // Global text search.
    if (search) {
      conditions.push(
        ilike(datasetRecords.searchableText, `%${search}%`)
      );
    }

    // Dynamic field filters.
    for (const filter of filters) {
      const { field, operator, value } = filter;

      if (operator === "between") {
        if (
          !Array.isArray(value) ||
          value.length !== 2 ||
          value.some((item) =>
            !["string", "number"].includes(typeof item)
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid between values for ${field}.`,
            },
            { status: 400 }
          );
        }
      } else if (
        typeof value !== "string" &&
        typeof value !== "number"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid filter value for ${field}.`,
          },
          { status: 400 }
        );
      }

      const isNumeric = ["amount", "quantity"].includes(field);

      const fieldExpression = isNumeric
        ? sql`(${datasetRecords.data} ->> ${field})::numeric`
        : sql`${datasetRecords.data} ->> ${field}`;

      const filterValue = String(value);

      switch (operator) {
        case "eq":
          conditions.push(
            sql`${fieldExpression} = ${filterValue}`
          );
          break;

        case "neq":
          conditions.push(
            sql`${fieldExpression} != ${filterValue}`
          );
          break;

        case "contains":
          conditions.push(
            sql`${fieldExpression} ILIKE ${`%${filterValue}%`}`
          );
          break;

        case "gt":
          conditions.push(
            sql`${fieldExpression} > ${filterValue}`
          );
          break;

        case "gte":
          conditions.push(
            sql`${fieldExpression} >= ${filterValue}`
          );
          break;

        case "lt":
          conditions.push(
            sql`${fieldExpression} < ${filterValue}`
          );
          break;

        case "lte":
          conditions.push(
            sql`${fieldExpression} <= ${filterValue}`
          );
          break;

        case "between":
          conditions.push(
            sql`${fieldExpression} >= ${String((value as [string | number, string | number])[0])}
                AND ${fieldExpression} <= ${String((value as [string | number, string | number])[1])}`
          );
          break;
      }
    }

    const whereClause = and(...conditions);

    const offset = (page - 1) * pageSize;

    // Get total matching records.
    const [countResult] = await db
      .select({ total: count() })
      .from(datasetRecords)
      .where(whereClause);

    const totalRecords = Number(countResult.total);

    // Get only the requested page.
    const records = await db
      .select({
        id: datasetRecords.id,
        externalId: datasetRecords.externalId,
        data: datasetRecords.data,
        createdAt: datasetRecords.createdAt,
        updatedAt: datasetRecords.updatedAt,
      })
      .from(datasetRecords)
      .where(whereClause)
      .orderBy(
        sortOrder === "asc"
          ? asc(sortableFields[sortBy])
          : desc(sortableFields[sortBy])
      )
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
        hasNextPage: page * pageSize < totalRecords,
        hasPreviousPage: page > 1,
      },
      appliedFilters: filters,
      search,
      sorting: {
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Records API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch records.",
      },
      { status: 500 }
    );
  }
}


