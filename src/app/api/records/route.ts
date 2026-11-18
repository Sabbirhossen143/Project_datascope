
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

// Filter validation
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

// Allowed sortable database fields
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

// Multi-column sorting validation
const multiSortSchema = z
  .array(
    z.object({
      field: z.enum([
        "externalId",
        "createdAt",
        "amount",
        "quantity",
        "customerName",
        "product",
        "status",
        "region",
        "orderDate",
      ]),
      direction: z.enum(["asc", "desc"]),
    })
  )
  .min(1)
  .max(5)
  .refine(
    (items) =>
      new Set(items.map((item) => item.field)).size === items.length,
    "Duplicate sort fields are not allowed."
  );

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

    // Legacy single-column sorting parameters
    const legacySortBy = params.get("sortBy") || "createdAt";
    const legacySortOrder = params.get("sortOrder") || "desc";

    // New multi-column sorting parameter
    const rawSorting = params.get("sorting");

    // Validate dataset ID
    if (!z.string().uuid().safeParse(datasetId).success) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid datasetId is required.",
        },
        { status: 400 }
      );
    }

    // Check dataset access permission
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

    // Validate pagination
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid pagination parameters.",
        },
        { status: 400 }
      );
    }

    // Resolve sorting configuration
    let sorting: z.infer<typeof multiSortSchema>;

    if (rawSorting) {
      let parsedSorting: unknown;

      try {
        parsedSorting = JSON.parse(rawSorting);
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid sorting JSON.",
          },
          { status: 400 }
        );
      }

      const validation = multiSortSchema.safeParse(parsedSorting);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid sorting configuration.",
            errors: validation.error.issues,
          },
          { status: 400 }
        );
      }

      sorting = validation.data;
    } else {
      // Backward compatibility with existing single-column sorting
      if (!sortableFields[legacySortBy]) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid sort field.",
          },
          { status: 400 }
        );
      }

      if (!["asc", "desc"].includes(legacySortOrder)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid sort order.",
          },
          { status: 400 }
        );
      }

      sorting = [
  {
    field: legacySortBy as z.infer<typeof multiSortSchema>[number]["field"],
    direction: legacySortOrder as "asc" | "desc",
  },
];
    }

    // Primary sorting values for backward compatibility
    const sortBy = sorting[0].field;
    const sortOrder = sorting[0].direction;

    // Parse optional filters
    let filters: z.infer<typeof filterSchema> = [];

    const rawFilters = params.get("filters");

    if (rawFilters) {
      let parsedFilters: unknown;

      try {
        parsedFilters = JSON.parse(rawFilters);
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid filters JSON.",
          },
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

    // Build database conditions
    const conditions: SQLWrapper[] = [
      eq(datasetRecords.datasetId, datasetId!),
    ];

    // Global text search
    if (search) {
      conditions.push(
        ilike(datasetRecords.searchableText, `%${search}%`)
      );
    }

    // Dynamic field filters
    for (const filter of filters) {
      const { field, operator, value } = filter;

      if (operator === "between") {
        if (
          !Array.isArray(value) ||
          value.length !== 2 ||
          value.some(
            (item) =>
              typeof item !== "string" &&
              typeof item !== "number"
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

        case "between": {
          const [minValue, maxValue] = value as [
            string | number,
            string | number
          ];

          conditions.push(
            sql`${fieldExpression} >= ${String(minValue)}
                AND ${fieldExpression} <= ${String(maxValue)}`
          );
          break;
        }
      }
    }

    const whereClause = and(...conditions);

    const offset = (page - 1) * pageSize;

    // Get total matching records
    const [countResult] = await db
      .select({ total: count() })
      .from(datasetRecords)
      .where(whereClause);

    const totalRecords = Number(countResult.total);

    // Build multi-column ORDER BY clauses
    const orderByClauses = sorting.map(({ field, direction }) => {
      const column = sortableFields[field];

      return direction === "asc"
        ? asc(column)
        : desc(column);
    });

    // Add stable tie-breaker if ID is not already part of sorting
    if (!sorting.some((item) => item.field === "externalId")) {
      orderByClauses.push(asc(datasetRecords.id));
    }

    // Get requested page
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
      .orderBy(...orderByClauses)
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
        rules: sorting,
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
