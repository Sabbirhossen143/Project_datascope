"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceProfileMenu from "@/components/layout/WorkspaceProfileMenu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth, setAuthInitialized, setAuthLoading, setAuthUser } from "@/store/slices/authSlice";
import {
  ArrowLeft,
  Activity,
  LoaderCircle,
  Search,
  RefreshCw,
  Database,
  UserRound,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "BULK_DELETE";

type ActivityLog = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  datasetId: string | null;
  datasetName: string | null;
  recordId: string | null;
  externalId: string | null;
  action: AuditAction;
  details: Record<string, unknown> | null;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const actionStyles: Record<AuditAction, string> = {
  CREATE: "bg-[#EAF3E9] text-[#39704E] border-[#D6E5D5]",
  UPDATE: "bg-[#EAF1F8] text-[#426D98] border-[#D8E5F0]",
  DELETE: "bg-[#F8E9E6] text-[#AC5144] border-[#EFD8D2]",
  BULK_DELETE: "bg-[#F5EEDC] text-[#87672D] border-[#E9D9B8]",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { isAuthenticated, isInitialized, isLoading: authLoading, user: currentUser } =
    useAppSelector((state) => state.auth);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/activity-logs?page=${page}&limit=20`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (response.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        setError("You do not have permission to access Activity Logs.");
        toast.error("Access denied");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to load activity logs.");
      }

      setLogs(result.logs ?? []);
      setPagination(result.pagination);
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Something went wrong.";

      setError(description);
      toast.error("Could not load activity logs", { description });
    } finally {
      setLoading(false);
    }
  }, [dispatch, router]);

  useEffect(() => {
    let active = true;

    dispatch(setAuthLoading(true));

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || "Authentication required.");
        }

        return result.user ?? result;
      })
      .then((user) => {
        if (!active) return;
        dispatch(setAuthUser(user));
      })
      .catch(() => {
        if (!active) return;
        dispatch(clearAuth());
        router.replace("/login");
      })
      .finally(() => {
        if (!active) return;
        dispatch(setAuthLoading(false));
        dispatch(setAuthInitialized(true));
      });

    return () => {
      active = false;
    };
  }, [dispatch, router]);

  useEffect(() => {
    if (!isInitialized || authLoading) return;

    if (!isAuthenticated || !currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "ADMIN") {
      setError("You do not have permission to access Activity Logs.");
      setLoading(false);
      return;
    }

    void loadLogs(1);
  }, [isInitialized, authLoading, isAuthenticated, currentUser, loadLogs, router]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return logs;

    return logs.filter((log) =>
      [
        log.userName ?? "",
        log.userEmail ?? "",
        log.datasetName ?? "",
        log.externalId ?? "",
        log.recordId ?? "",
        log.action,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [logs, search]);

  const actionCounts = useMemo(
    () => ({
      total: pagination.total,
      bulkDeletes: logs.filter((log) => log.action === "BULK_DELETE").length,
      deletes: logs.filter((log) => log.action === "DELETE").length,
      creates: logs.filter((log) => log.action === "CREATE").length,
    }),
    [logs, pagination.total]
  );

  return (
    <>
      <WorkspaceSidebar />

      <main className="min-h-screen bg-[#F5F4EF] text-[#263B32] lg:ml-[270px]">
        <header className="sticky top-0 z-20 border-b border-[#E7E6DE] bg-[#F9F8F4]/95 backdrop-blur-xl">
          <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between pl-16 pr-4 sm:pl-16 sm:pr-7 lg:px-10">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-[#87948B]">
                WORKSPACE / ADMINISTRATION
              </p>
              <p className="mt-1 text-sm font-bold text-[#263B32]">
                Activity Logs
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/overview")}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E4E6DE] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#53685A] transition hover:border-[#B8C9BA] hover:bg-[#F8FAF6]"
              >
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Back</span>
              </button>

              <WorkspaceProfileMenu />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-7 px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E4E8DF] bg-white px-3 py-1.5">
                <ShieldCheck size={12} className="text-[#39704E]" />
                <span className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#62796B]">
                  Admin audit center
                </span>
              </div>

              <h1 className="text-[28px] font-bold tracking-[-1px] text-[#1D352A] sm:text-[36px]">
                Activity Logs<span className="text-[#B99455]">.</span>
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-6 text-[#78867D]">
                Monitor workspace record activity and review historical actions.
              </p>
            </div>

            <button
              onClick={() => void loadLogs(pagination.page)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6E5DC] bg-white px-4 py-3 text-xs font-semibold text-[#53685A] shadow-sm transition hover:bg-[#F8FAF6] disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh logs
            </button>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Total activities",
                value: actionCounts.total,
                hint: "All recorded events",
                icon: Activity,
              },
              {
                label: "Create actions",
                value: actionCounts.creates,
                hint: "On current page",
                icon: Database,
              },
              {
                label: "Delete actions",
                value: actionCounts.deletes,
                hint: "On current page",
                icon: UserRound,
              },
              {
                label: "Bulk deletions",
                value: actionCounts.bulkDeletes,
                hint: "On current page",
                icon: Clock,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#E8E7DF] bg-white p-4 shadow-[0_3px_16px_rgba(35,55,43,0.025)] sm:p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-[#7D8980]">
                      {item.label}
                    </p>
                    <Icon size={16} className="text-[#84978A]" />
                  </div>

                  <p className="mt-3 text-2xl font-bold tracking-tight text-[#243A2E]">
                    {item.value}
                  </p>

                  <p className="mt-1 text-[9px] text-[#929B94]">{item.hint}</p>
                </div>
              );
            })}
          </section>

          <section className="overflow-hidden rounded-[22px] border border-[#E8E7DF] bg-white shadow-[0_4px_20px_rgba(35,55,43,0.035)]">
            <div className="flex flex-col gap-4 border-b border-[#EFEFE9] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <h2 className="text-sm font-bold text-[#243A2E]">
                  Workspace activity
                </h2>
                <p className="mt-1 text-[10px] text-[#8B968E]">
                  Review recorded actions and their associated records.
                </p>
              </div>

              <div className="relative w-full sm:max-w-[300px]">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89978D]"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search this page..."
                  className="h-10 w-full rounded-xl border border-[#E7E8E2] bg-[#FAFAF7] pl-10 pr-3 text-xs outline-none transition placeholder:text-[#A1AAA2] focus:border-[#6D9B7E] focus:bg-white focus:ring-4 focus:ring-[#26745A]/[0.07]"
                />
              </div>
            </div>

            {loading || authLoading || !isInitialized ? (
              <div className="flex min-h-64 items-center justify-center gap-3 text-xs font-medium text-[#718176]">
                <LoaderCircle size={19} className="animate-spin text-[#26745A]" />
                Loading activity logs...
              </div>
            ) : error ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-4 px-5 text-center">
                <p className="text-xs text-[#AC5144]">{error}</p>

                <button
                  onClick={() => void loadLogs(pagination.page)}
                  className="rounded-xl border border-[#DCE6DB] bg-[#F5F8F3] px-4 py-2.5 text-[11px] font-semibold text-[#286347] transition hover:bg-[#EAF1E9]"
                >
                  Retry loading logs
                </button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <Activity size={26} className="mx-auto text-[#A5B0A6]" />
                <p className="mt-3 text-sm font-semibold text-[#53685A]">
                  No activity found
                </p>
                <p className="mt-1 text-[10px] text-[#9AA49B]">
                  {search
                    ? "Try a different search term."
                    : "Activity will appear here when recorded."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[1000px] text-left">
                    <thead className="bg-[#F8F8F4]">
                      <tr>
                        {[
                          "Action",
                          "User",
                          "Dataset",
                          "Record",
                          "Date & time",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-6 py-4 text-[9px] font-bold uppercase tracking-[1.1px] text-[#849087]"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#F0F0EA]">
                      {filteredLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="transition-colors hover:bg-[#F8FAF6]"
                        >
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1.5 text-[9px] font-bold ${actionStyles[log.action]}`}
                            >
                              {log.action}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D7B77A]/40 bg-[#F3EBD9] text-xs font-bold text-[#725A2D]">
                                {log.userName?.charAt(0).toUpperCase() ?? "?"}
                              </span>

                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-[#344A3B]">
                                  {log.userName ?? "Deleted user"}
                                </p>
                                <p className="mt-1 truncate text-[10px] text-[#9AA49B]">
                                  {log.userEmail ?? "Unavailable"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-xs font-semibold text-[#344A3B]">
                              {log.datasetName ?? "Deleted dataset"}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-xs font-medium text-[#53685A]">
                              {log.externalId ?? "—"}
                            </p>
                            <p className="mt-1 max-w-[180px] truncate text-[9px] text-[#9AA49B]">
                              {log.recordId ?? ""}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-[10px] text-[#87948B]">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                  {filteredLogs.map((log) => (
                    <article
                      key={log.id}
                      className="rounded-2xl border border-[#ECEDE6] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EBD9] text-sm font-bold text-[#725A2D]">
                            {log.userName?.charAt(0).toUpperCase() ?? "?"}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[#344A3B]">
                              {log.userName ?? "Deleted user"}
                            </p>
                            <p className="mt-1 break-all text-[10px] text-[#9AA49B]">
                              {log.userEmail ?? "Unavailable"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-bold ${actionStyles[log.action]}`}
                        >
                          {log.action}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-[#F0F0EA] pt-3">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#929B94]">
                            Dataset
                          </p>
                          <p className="mt-1 text-xs font-semibold text-[#344A3B]">
                            {log.datasetName ?? "Deleted dataset"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#929B94]">
                            Record ID
                          </p>
                          <p className="mt-1 break-all text-[10px] text-[#53685A]">
                            {log.externalId ?? log.recordId ?? "—"}
                          </p>
                        </div>

                        <p className="text-[10px] text-[#87948B]">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            <div className="flex flex-col justify-between gap-3 border-t border-[#EFEFE9] bg-[#FCFCF9] px-5 py-4 text-[9px] text-[#98A198] sm:flex-row sm:items-center sm:px-7">
              <span>
                {pagination.total} total activities
                {search ? ` · ${filteredLogs.length} matches on this page` : ""}
              </span>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span>
                  Page {pagination.page} of {Math.max(1, pagination.totalPages)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    disabled={loading || pagination.page <= 1}
                    onClick={() => void loadLogs(pagination.page - 1)}
                    aria-label="Previous page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7DF] bg-white text-[#53685A] transition hover:bg-[#F5F8F3] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <button
                    disabled={
                      loading ||
                      pagination.page >= pagination.totalPages ||
                      pagination.totalPages === 0
                    }
                    onClick={() => void loadLogs(pagination.page + 1)}
                    aria-label="Next page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7DF] bg-white text-[#53685A] transition hover:bg-[#F5F8F3] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}