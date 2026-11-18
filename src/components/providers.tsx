"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "@/store/store";
import { useAppDispatch } from "@/store/hooks";
import {
  clearAuth,
  setAuthInitialized,
  setAuthUser,
} from "@/store/slices/authSlice";

function AuthSessionInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) dispatch(clearAuth());
          return;
        }

        const result = await response.json();
        const user = result.user ?? result;
        const validRole = ["ADMIN", "ANALYST", "VIEWER"].includes(user?.role);

        if (active && user?.id && user?.name && user?.email && validRole) {
          dispatch(
            setAuthUser({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive !== false,
            })
          );
        } else if (active) {
          dispatch(clearAuth());
        }
      } catch {
        if (active) dispatch(clearAuth());
      } finally {
        if (active) dispatch(setAuthInitialized(true));
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, [dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthSessionInitializer />
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3000}
        visibleToasts={4}
        expand={false}
        theme="light"
        toastOptions={{
          classNames: {
            toast: "rounded-2xl border shadow-xl",
            title: "text-sm font-semibold",
            description: "text-xs",
          },
        }}
      />
    </Provider>
  );
}
