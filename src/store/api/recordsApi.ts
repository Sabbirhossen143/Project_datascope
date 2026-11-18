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
  };
}

export interface GetRecordsArgs {
  datasetId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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
        filters = [],
      }) => {
        const params = new URLSearchParams({
          datasetId,
          page: String(page),
          pageSize: String(pageSize),
          search,
          sortBy,
          sortOrder,
        });

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
