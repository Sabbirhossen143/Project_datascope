import { configureStore } from "@reduxjs/toolkit";
import explorerReducer from "./slices/explorerSlice";
import authReducer from "./slices/authSlice";
import datasetReducer from "./slices/datasetSlice";
import savedViewsReducer from "./slices/savedViewsSlice";
import uiPreferencesReducer from "./slices/uiPreferencesSlice";
import { recordsApi } from "./api/recordsApi";

export const store = configureStore({
  reducer: {
    // Keep "explorer" so existing pages/selectors continue to work.
    // This reducer is the Search Configuration slice.
    explorer: explorerReducer,
    auth: authReducer,
    datasets: datasetReducer,
    savedViews: savedViewsReducer,
    uiPreferences: uiPreferencesReducer,
    [recordsApi.reducerPath]: recordsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(recordsApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
