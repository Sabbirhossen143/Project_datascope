import { Suspense } from "react";
import DashboardClient from "../dashboard-client";

export default function ExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F4EF]">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#26745A] border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-[#718176]">Loading DataScope Explorer...</p>
          </div>
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
