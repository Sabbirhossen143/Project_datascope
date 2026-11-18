import { Suspense } from "react";
import DashboardClient from "./dashboard-client";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading DataScope...
            </p>
          </div>
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
