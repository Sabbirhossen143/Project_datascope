import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RecordFilter } from "../api/recordsApi";

interface ExplorerState {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  filters: RecordFilter[];
}

const initialState: ExplorerState = {
  page: 1,
  pageSize: 25,
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
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
    setSorting(
      state,
      action: PayloadAction<{ sortBy: string; sortOrder: "asc" | "desc" }>
    ) {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
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
  setFilters,
  clearFilters,
  resetExplorer,
} = explorerSlice.actions;

export default explorerSlice.reducer;
