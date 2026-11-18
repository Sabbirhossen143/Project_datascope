
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface RecordFilter {
  field: string;
  operator:
    | "eq"
    | "neq"
    | "contains"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "between";
  value: string | number | [string | number, string | number];
}

export interface SortRule {
  field: string;
  direction: "asc" | "desc";
}

export interface DatasetRecord {
  id: string;
  externalId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RecordsResponse {
  success: boolean;
  data: DatasetRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  appliedFilters: RecordFilter[];
  search: string;
  sorting: {
    sortBy: string;
    sortOrder: "asc" | "desc";
    rules?: SortRule[];
  };
}

export interface GetRecordsArgs {
  datasetId: string;
  page?: number;
  pageSize?: number;
  search?: string;

  // Legacy single-column sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";

  // New multi-column sorting
  sorting?: SortRule[];

  filters?: RecordFilter[];
}

export const recordsApi = createApi({
  reducerPath: "recordsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
  }),

  tagTypes: ["Records"],
  keepUnusedDataFor: 60,

  endpoints: (builder) => ({
    getRecords: builder.query<RecordsResponse, GetRecordsArgs>({
      query: ({
        datasetId,
        page = 1,
        pageSize = 25,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        sorting,
        filters = [],
      }) => {
        const params = new URLSearchParams({
          datasetId,
          page: String(page),
          pageSize: String(pageSize),
          search,
        });

        // Prefer multi-column sorting when provided
        if (sorting && sorting.length > 0) {
          params.set("sorting", JSON.stringify(sorting));
        } else {
          // Backward compatibility
          params.set("sortBy", sortBy);
          params.set("sortOrder", sortOrder);
        }

        if (filters.length > 0) {
          params.set("filters", JSON.stringify(filters));
        }

        return `/records?${params.toString()}`;
      },

      providesTags: ["Records"],
    }),
  }),
});

export const { useGetRecordsQuery } = recordsApi;
