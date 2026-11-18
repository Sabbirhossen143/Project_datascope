import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface DatasetSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  dataSource?: string | null;
  totalRecords: number;
  createdAt?: string;
  updatedAt?: string;
}

interface DatasetState {
  items: DatasetSummary[];
  activeDatasetId: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
}

const initialState: DatasetState = {
  items: [],
  activeDatasetId: null,
  isLoading: false,
  error: null,
  lastFetchedAt: null,
};

const datasetSlice = createSlice({
  name: "datasets",
  initialState,
  reducers: {
    setDatasets(state, action: PayloadAction<DatasetSummary[]>) {
      state.items = action.payload;
      state.error = null;
      state.lastFetchedAt = new Date().toISOString();
      if (
        state.activeDatasetId &&
        !action.payload.some((dataset) => dataset.id === state.activeDatasetId)
      ) {
        state.activeDatasetId = null;
      }
    },
    setActiveDataset(state, action: PayloadAction<string | null>) {
      state.activeDatasetId = action.payload;
    },
    setDatasetsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setDatasetsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearDatasets(state) {
      state.items = [];
      state.activeDatasetId = null;
      state.isLoading = false;
      state.error = null;
      state.lastFetchedAt = null;
    },
  },
});

export const {
  setDatasets,
  setActiveDataset,
  setDatasetsLoading,
  setDatasetsError,
  clearDatasets,
} = datasetSlice.actions;

export default datasetSlice.reducer;
