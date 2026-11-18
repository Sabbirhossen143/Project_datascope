
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RecordFilter, SortRule } from "../api/recordsApi";

interface ExplorerState {
  page: number;
  pageSize: number;
  search: string;

  // Legacy single-column sorting compatibility
  sortBy: string;
  sortOrder: "asc" | "desc";

  // Multi-column sorting
  sorting: SortRule[];

  filters: RecordFilter[];
}

const initialState: ExplorerState = {
  page: 1,
  pageSize: 25,
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  sorting: [{ field: "createdAt", direction: "desc" }],
  filters: [],
};

const explorerSlice = createSlice({
  name: "searchConfiguration",
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload);
    },

    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = Math.min(100, Math.max(1, action.payload));
      state.page = 1;
    },

    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },

    // Existing single-column sorting action
    setSorting(
      state,
      action: PayloadAction<{
        sortBy: string;
        sortOrder: "asc" | "desc";
      }>
    ) {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;

      state.sorting = [
        {
          field: action.payload.sortBy,
          direction: action.payload.sortOrder,
        },
      ];

      state.page = 1;
    },

    // Set multiple sorting rules
    setMultiSorting(state, action: PayloadAction<SortRule[]>) {
      const uniqueRules = action.payload
        .filter(
          (rule, index, array) =>
            array.findIndex((item) => item.field === rule.field) === index
        )
        .slice(0, 5);

      state.sorting =
        uniqueRules.length > 0
          ? uniqueRules
          : [{ field: "createdAt", direction: "desc" }];

      state.sortBy = state.sorting[0].field;
      state.sortOrder = state.sorting[0].direction;
      state.page = 1;
    },

    // Normal click replaces sorting; Shift + Click adds/toggles a rule
    toggleSort(
      state,
      action: PayloadAction<{
        field: string;
        shiftKey?: boolean;
      }>
    ) {
      const { field, shiftKey = false } = action.payload;

      if (!shiftKey) {
        const existing = state.sorting.find(
          (rule) => rule.field === field
        );

        const direction =
          existing?.direction === "asc" ? "desc" : "asc";

        state.sorting = [{ field, direction }];
      } else {
        const existingIndex = state.sorting.findIndex(
          (rule) => rule.field === field
        );

        if (existingIndex >= 0) {
          state.sorting[existingIndex].direction =
            state.sorting[existingIndex].direction === "asc"
              ? "desc"
              : "asc";
        } else if (state.sorting.length < 5) {
          state.sorting.push({
            field,
            direction: "asc",
          });
        }
      }

      state.sortBy = state.sorting[0].field;
      state.sortOrder = state.sorting[0].direction;
      state.page = 1;
    },

    clearSorting(state) {
      state.sorting = [{ field: "createdAt", direction: "desc" }];
      state.sortBy = "createdAt";
      state.sortOrder = "desc";
      state.page = 1;
    },

    setFilters(state, action: PayloadAction<RecordFilter[]>) {
      state.filters = action.payload;
      state.page = 1;
    },

    clearFilters(state) {
      state.filters = [];
      state.page = 1;
    },

    resetExplorer() {
      return initialState;
    },
  },
});

export const {
  setPage,
  setPageSize,
  setSearch,
  setSorting,
  setMultiSorting,
  toggleSort,
  clearSorting,
  setFilters,
  clearFilters,
  resetExplorer,
} = explorerSlice.actions;

export default explorerSlice.reducer;
