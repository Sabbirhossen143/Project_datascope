
import { describe, expect, it } from "vitest";

import explorerReducer, {
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
} from "../store/slices/explorerSlice";

import type { RecordFilter } from "../store/api/recordsApi";

const initialState = {
  page: 1,
  pageSize: 25,
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc" as const,
  sorting: [{ field: "createdAt", direction: "desc" as const }],
  filters: [],
};

describe("Explorer Slice", () => {
  it("should return the initial state", () => {
    expect(
      explorerReducer(undefined, { type: "unknown" })
    ).toEqual(initialState);
  });

  it("should update the current page", () => {
    const state = explorerReducer(initialState, setPage(3));
    expect(state.page).toBe(3);
  });

  it("should prevent page numbers below 1", () => {
    const state = explorerReducer(initialState, setPage(0));
    expect(state.page).toBe(1);
  });

  it("should update page size and reset page", () => {
    const state = explorerReducer(
      { ...initialState, page: 4 },
      setPageSize(50)
    );

    expect(state.pageSize).toBe(50);
    expect(state.page).toBe(1);
  });

  it("should restrict page size to 100", () => {
    const state = explorerReducer(initialState, setPageSize(500));
    expect(state.pageSize).toBe(100);
  });

  it("should update search and reset page", () => {
    const state = explorerReducer(
      { ...initialState, page: 5 },
      setSearch("Laptop")
    );

    expect(state.search).toBe("Laptop");
    expect(state.page).toBe(1);
  });

  it("should update single-column sorting and reset page", () => {
    const state = explorerReducer(
      { ...initialState, page: 3 },
      setSorting({ sortBy: "amount", sortOrder: "asc" })
    );

    expect(state.sortBy).toBe("amount");
    expect(state.sortOrder).toBe("asc");
    expect(state.sorting).toEqual([
      { field: "amount", direction: "asc" },
    ]);
    expect(state.page).toBe(1);
  });

  it("should set multiple sorting rules", () => {
    const state = explorerReducer(
      { ...initialState, page: 4 },
      setMultiSorting([
        { field: "amount", direction: "desc" },
        { field: "customerName", direction: "asc" },
      ])
    );

    expect(state.sorting).toEqual([
      { field: "amount", direction: "desc" },
      { field: "customerName", direction: "asc" },
    ]);
    expect(state.sortBy).toBe("amount");
    expect(state.sortOrder).toBe("desc");
    expect(state.page).toBe(1);
  });

  it("should remove duplicate fields from multi sorting", () => {
    const state = explorerReducer(
      initialState,
      setMultiSorting([
        { field: "amount", direction: "asc" },
        { field: "amount", direction: "desc" },
        { field: "region", direction: "asc" },
      ])
    );

    expect(state.sorting).toEqual([
      { field: "amount", direction: "asc" },
      { field: "region", direction: "asc" },
    ]);
  });

  it("should limit multi sorting to five rules", () => {
    const state = explorerReducer(
      initialState,
      setMultiSorting([
        { field: "amount", direction: "asc" },
        { field: "customerName", direction: "asc" },
        { field: "region", direction: "asc" },
        { field: "status", direction: "asc" },
        { field: "product", direction: "asc" },
        { field: "quantity", direction: "asc" },
      ])
    );

    expect(state.sorting).toHaveLength(5);
  });

  it("should replace sorting on normal click", () => {
    const state = explorerReducer(
      initialState,
      toggleSort({ field: "amount" })
    );

    expect(state.sorting).toEqual([
      { field: "amount", direction: "asc" },
    ]);
    expect(state.sortBy).toBe("amount");
    expect(state.page).toBe(1);
  });

  it("should toggle direction on repeated normal click", () => {
    const firstState = explorerReducer(
      initialState,
      toggleSort({ field: "amount" })
    );

    const secondState = explorerReducer(
      firstState,
      toggleSort({ field: "amount" })
    );

    expect(secondState.sorting).toEqual([
      { field: "amount", direction: "desc" },
    ]);
  });

  it("should add another sort rule on Shift + Click", () => {
    const state = explorerReducer(
      initialState,
      toggleSort({ field: "amount", shiftKey: true })
    );

    expect(state.sorting).toEqual([
      { field: "createdAt", direction: "desc" },
      { field: "amount", direction: "asc" },
    ]);
  });

  it("should toggle an existing rule on Shift + Click", () => {
    const firstState = explorerReducer(
      initialState,
      toggleSort({ field: "amount", shiftKey: true })
    );

    const secondState = explorerReducer(
      firstState,
      toggleSort({ field: "amount", shiftKey: true })
    );

    expect(secondState.sorting[1]).toEqual({
      field: "amount",
      direction: "desc",
    });
  });

  it("should not add more than five sorting rules", () => {
    const state = explorerReducer(
      {
        ...initialState,
        sorting: [
          { field: "createdAt", direction: "desc" as const },
          { field: "amount", direction: "asc" as const },
          { field: "quantity", direction: "asc" as const },
          { field: "region", direction: "asc" as const },
          { field: "status", direction: "asc" as const },
        ],
      },
      toggleSort({ field: "product", shiftKey: true })
    );

    expect(state.sorting).toHaveLength(5);
  });

  it("should clear sorting and restore default sorting", () => {
    const state = explorerReducer(
      {
        ...initialState,
        sortBy: "amount",
        sortOrder: "asc" as const,
        sorting: [{ field: "amount", direction: "asc" as const }],
      },
      clearSorting()
    );

    expect(state.sorting).toEqual([
      { field: "createdAt", direction: "desc" },
    ]);
    expect(state.sortBy).toBe("createdAt");
    expect(state.sortOrder).toBe("desc");
  });

  it("should update filters and reset page", () => {
    const filters = [
      {
        field: "status",
        operator: "eq",
        value: "active",
      },
    ] as unknown as RecordFilter[];

    const state = explorerReducer(
      { ...initialState, page: 4 },
      setFilters(filters)
    );

    expect(state.filters).toEqual(filters);
    expect(state.page).toBe(1);
  });

  it("should clear filters and reset page", () => {
    const state = explorerReducer(
      { ...initialState, page: 3 },
      clearFilters()
    );

    expect(state.filters).toEqual([]);
    expect(state.page).toBe(1);
  });

  it("should reset the explorer configuration", () => {
    const modifiedState = {
      ...initialState,
      page: 5,
      search: "Laptop",
      sortBy: "amount",
      sortOrder: "asc" as const,
      sorting: [{ field: "amount", direction: "asc" as const }],
    };

    expect(
      explorerReducer(modifiedState, resetExplorer())
    ).toEqual(initialState);
  });
});
