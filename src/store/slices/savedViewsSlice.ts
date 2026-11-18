import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SavedViewSummary {
  id: string;
  name: string;
  datasetId: string;
  configuration: {
    search?: string;
    filters?: unknown[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    pageSize?: number;
    visibleColumns?: string[];
  };
  isShared: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SavedViewsState {
  items: SavedViewSummary[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
}

const initialState: SavedViewsState = {
  items: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
};

const savedViewsSlice = createSlice({
  name: "savedViews",
  initialState,
  reducers: {
    setSavedViews(state, action: PayloadAction<SavedViewSummary[]>) {
      state.items = action.payload;
      state.error = null;
      state.lastFetchedAt = new Date().toISOString();
    },
    addSavedView(state, action: PayloadAction<SavedViewSummary>) {
      state.items.unshift(action.payload);
    },
    updateSavedView(state, action: PayloadAction<SavedViewSummary>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    removeSavedView(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setSavedViewsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setSavedViewsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearSavedViews(state) {
      return initialState;
    },
  },
});

export const {
  setSavedViews,
  addSavedView,
  updateSavedView,
  removeSavedView,
  setSavedViewsLoading,
  setSavedViewsError,
  clearSavedViews,
} = savedViewsSlice.actions;

export default savedViewsSlice.reducer;
