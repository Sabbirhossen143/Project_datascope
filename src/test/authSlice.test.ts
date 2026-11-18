import { describe, expect, it } from "vitest";
import authReducer, {
  setAuthUser,
  setAuthLoading,
  setAuthInitialized,
  clearAuth,
} from "../store/slices/authSlice";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
};

const mockUser = {
  id: "user-001",
  name: "Test User",
  email: "test@example.com",
  role: "ADMIN" as const,
  isActive: true,
};

describe("Auth Slice", () => {
  it("should return the initial state", () => {
    expect(authReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("should set authenticated user", () => {
    const state = authReducer(initialState, setAuthUser(mockUser));

    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(true);
  });

  it("should update loading state", () => {
    const state = authReducer(initialState, setAuthLoading(false));

    expect(state.isLoading).toBe(false);
  });

  it("should mark authentication as initialized", () => {
    const state = authReducer(initialState, setAuthInitialized(true));

    expect(state.isInitialized).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("should clear authentication on logout", () => {
    const loggedInState = authReducer(initialState, setAuthUser(mockUser));
    const state = authReducer(loggedInState, clearAuth());

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(true);
  });
});
