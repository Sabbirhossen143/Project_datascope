import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemePreference = "light" | "dark" | "system";

interface UiPreferencesState {
  theme: ThemePreference;
  sidebarCollapsed: boolean;
  compactTable: boolean;
  pageSize: number;
  visibleColumns: string[];
}

const initialState: UiPreferencesState = {
  theme: "light",
  sidebarCollapsed: false,
  compactTable: false,
  pageSize: 25,
  visibleColumns: [
    "transactionId",
    "customerName",
    "product",
    "region",
    "amount",
    "status",
    "paymentMethod",
  ],
};

const uiPreferencesSlice = createSlice({
  name: "uiPreferences",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setCompactTable(state, action: PayloadAction<boolean>) {
      state.compactTable = action.payload;
    },
    setPreferredPageSize(state, action: PayloadAction<number>) {
      state.pageSize = Math.min(100, Math.max(1, action.payload));
    },
    setVisibleColumns(state, action: PayloadAction<string[]>) {
      state.visibleColumns = action.payload;
    },
    resetUiPreferences() {
      return initialState;
    },
  },
});

export const {
  setTheme,
  setSidebarCollapsed,
  setCompactTable,
  setPreferredPageSize,
  setVisibleColumns,
  resetUiPreferences,
} = uiPreferencesSlice.actions;

export default uiPreferencesSlice.reducer;
