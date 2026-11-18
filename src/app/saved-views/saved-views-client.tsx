"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceProfileMenu from "@/components/layout/WorkspaceProfileMenu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RecordFilter } from "@/store/api/recordsApi";
import {
  clearAuth,
  setAuthInitialized,
  setAuthLoading,
  setAuthUser,
} from "@/store/slices/authSlice";
import {
  setFilters,
  setPage,
  setPageSize,
  setSearch,
  setSorting,
} from "@/store/slices/explorerSlice";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Clock3,
  Database,
  Filter,
  History,
  LoaderCircle,
  Play,
  RefreshCw,
  Search,
  Share2,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

const DATASET_ID = "81f7f864-4784-4117-80c3-2401f923e78e";

type SavedConfiguration = {
  search?: string;
  filters?: RecordFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  pageSize?: number;
  visibleColumns?: string[];
};

type SavedView = {
  id: string;
  userId: string;
  datasetId: string;
  name: string;
  configuration: SavedConfiguration;
  isShared: boolean;
  createdAt: string;
  updatedAt?: string;
};

type HistoryItem = {
  id: string;
  userId: string;
  datasetId: string;
  query: string;
  filters?: {
    filters?: RecordFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    pageSize?: number;
  } | null;
  createdAt: string;
};

type CurrentUser = {
  id: string;
  name: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
};

function formatDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getErrorMessage(result: unknown, fallback: string) {
  if (result && typeof result === "object" && "message" in result) {
    const message = (result as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function SavedViewsClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const explorer = useAppSelector((state) => state.explorer);
  const { user, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<"saved" | "history">("saved");
  const [views, setViews] = useState<SavedView[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setHistoryLoading(true);
    try {
      const [viewsResponse, historyResponse] = await Promise.all([
        fetch(`/api/saved-views?datasetId=${encodeURIComponent(DATASET_ID)}`, { cache: "no-store" }),
        fetch(`/api/search-history?datasetId=${encodeURIComponent(DATASET_ID)}`, { cache: "no-store" }),
      ]);

      if (viewsResponse.status === 401 || historyResponse.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        return;
      }

      const [viewsResult, historyResult] = await Promise.all([
        viewsResponse.json(),
        historyResponse.json(),
      ]);

      if (!viewsResponse.ok) throw new Error(getErrorMessage(viewsResult, "Unable to load saved views."));
      if (!historyResponse.ok) throw new Error(getErrorMessage(historyResult, "Unable to load search history."));

      setViews(Array.isArray(viewsResult.data) ? viewsResult.data : []);
      setHistory(Array.isArray(historyResult.data) ? historyResult.data : []);
    } catch (error) {
      toast.error("Unable to load workspace data", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  }, [dispatch, router]);

  useEffect(() => {
    let cancelled = false;

    const initializeAuthAndPage = async () => {
      if (!isInitialized) {
        dispatch(setAuthLoading(true));
        try {
          const response = await fetch("/api/auth/me", { cache: "no-store" });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(getErrorMessage(result, "Your session has expired."));
          }

          const account = result?.user ?? result;
          if (!cancelled) {
            dispatch(setAuthUser(account));
            dispatch(setAuthInitialized(true));
          }
        } catch {
          if (!cancelled) {
            dispatch(clearAuth());
            dispatch(setAuthInitialized(true));
            router.replace("/login");
          }
        } finally {
          if (!cancelled) dispatch(setAuthLoading(false));
        }
        return;
      }

      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      if (!cancelled) void loadPageData();
    };

    void initializeAuthAndPage();
    return () => {
      cancelled = true;
    };
  }, [dispatch, isAuthenticated, isInitialized, loadPageData, router]);

  const filteredViews = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return views;
    return views.filter((view) =>
      [view.name, view.isShared ? "shared" : "private"].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [views, searchText]);

  const filteredHistory = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return history;
    return history.filter((item) =>
      [item.query, item.filters?.sortBy ?? ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [history, searchText]);

  function applyConfiguration(configuration: SavedConfiguration) {
    dispatch(setSearch(configuration.search ?? ""));
    dispatch(setFilters(configuration.filters ?? []));
    dispatch(setSorting({
      sortBy: configuration.sortBy ?? "createdAt",
      sortOrder: configuration.sortOrder ?? "desc",
    }));
    if (configuration.pageSize) dispatch(setPageSize(configuration.pageSize));
    dispatch(setPage(1));
    toast.success("View applied", { description: "Your Data Explorer filters have been updated." });
    router.push("/");
  }

  function applyHistory(item: HistoryItem) {
    const config = item.filters ?? {};
    dispatch(setSearch(item.query ?? ""));
    dispatch(setFilters(config.filters ?? []));
    dispatch(setSorting({
      sortBy: config.sortBy ?? "createdAt",
      sortOrder: config.sortOrder ?? "desc",
    }));
    if (config.pageSize) dispatch(setPageSize(config.pageSize));
    dispatch(setPage(1));
    toast.success("Search restored", { description: "Your previous search is ready in Data Explorer." });
    router.push("/");
  }

  async function updateCurrentView(view: SavedView) {
    if (view.userId !== user?.id) return;
    setBusyId(view.id);
    try {
      const response = await fetch(`/api/saved-views/${encodeURIComponent(view.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configuration: {
            search: explorer.search,
            filters: explorer.filters,
            sortBy: explorer.sortBy,
            sortOrder: explorer.sortOrder,
            pageSize: explorer.pageSize,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(result, "Could not update this view."));
      const updated = result.data as SavedView;
      setViews((current) => current.map((item) => item.id === view.id ? updated : item));
      toast.success("Saved view updated", { description: `"${view.name}" now uses your current explorer settings.` });
    } catch (error) {
      toast.error("Update failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  }

  async function toggleShared(view: SavedView) {
    if (view.userId !== user?.id || user?.role === "VIEWER") return;
    setBusyId(view.id);
    try {
      const response = await fetch(`/api/saved-views/${encodeURIComponent(view.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: !view.isShared }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(result, "Could not change sharing settings."));
      setViews((current) => current.map((item) => item.id === view.id ? result.data : item));
      toast.success(view.isShared ? "View made private" : "View shared with workspace");
    } catch (error) {
      toast.error("Sharing update failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteView(view: SavedView) {
    if (view.userId !== user?.id) return;
    if (!window.confirm(`Delete "${view.name}"? This cannot be undone.`)) return;
    setBusyId(view.id);
    try {
      const response = await fetch(`/api/saved-views/${encodeURIComponent(view.id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(result, "Could not delete this view."));
      setViews((current) => current.filter((item) => item.id !== view.id));
      toast.success("Saved view deleted", { description: `"${view.name}" has been removed.` });
    } catch (error) {
      toast.error("Delete failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  }

  const isLoading = activeTab === "saved" ? loading : historyLoading;

  return (
    <>
      <WorkspaceSidebar />
      <main className="min-h-screen bg-[#F5F4EF] text-[#263B32] lg:ml-[270px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E7E6DE] bg-[#F9F8F4]/95 pl-16 pr-4 backdrop-blur-xl sm:pl-16 sm:pr-7 lg:px-10">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[#87948B]">WORKSPACE / LIBRARY</p>
            <p className="mt-1 text-sm font-bold text-[#263B32]">Saved Views</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DDE4D9] bg-white px-3 text-[11px] font-semibold text-[#52685A] shadow-sm transition hover:bg-[#F4F7F1] sm:px-4">
              <ArrowLeft size={14} /><span className="hidden sm:inline">Data Explorer</span><span className="sm:hidden">Back</span>
            </button>
            <button onClick={() => void loadPageData()} aria-label="Refresh saved views" title="Refresh saved views" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E6048] text-white shadow-sm transition hover:bg-[#174B38]">
              <RefreshCw size={15} />
            </button>
            <WorkspaceProfileMenu />
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-7 p-4 sm:p-7 lg:p-10">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E4E8DF] bg-white px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39845A]" />
                <span className="text-[10px] font-semibold uppercase tracking-[1.3px] text-[#62796B]">Workspace library</span>
              </div>
              <h1 className="text-[28px] font-bold tracking-[-1px] text-[#1D352A] sm:text-[36px]">Saved Views & History<span className="text-[#B99455]">.</span></h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#78867D]">Return to your saved data configurations or restore a previous search in one click.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[250px]">
              <div className="rounded-2xl border border-[#E8E7DF] bg-white px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[1.2px] text-[#89958B]">Saved views</p>
                <p className="mt-1 text-xl font-bold text-[#243A2E]">{views.length}</p>
              </div>
              <div className="rounded-2xl border border-[#E8E7DF] bg-white px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[1.2px] text-[#89958B]">Search history</p>
                <p className="mt-1 text-xl font-bold text-[#243A2E]">{history.length}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[22px] border border-[#E8E7DF] bg-white shadow-[0_4px_20px_rgba(35,55,43,0.035)]">
            <div className="flex flex-col gap-4 border-b border-[#EFEFE9] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => { setActiveTab("saved"); setSearchText(""); }} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${activeTab === "saved" ? "bg-[#183C30] text-white shadow-sm" : "bg-[#F5F6F1] text-[#65766A] hover:bg-[#EDF2EA]"}`}>
                  <Bookmark size={15} /> Saved Views <span className={activeTab === "saved" ? "text-[#D7B77A]" : "text-[#89958B]"}>{views.length}</span>
                </button>
                <button onClick={() => { setActiveTab("history"); setSearchText(""); }} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${activeTab === "history" ? "bg-[#183C30] text-white shadow-sm" : "bg-[#F5F6F1] text-[#65766A] hover:bg-[#EDF2EA]"}`}>
                  <History size={15} /> Search History <span className={activeTab === "history" ? "text-[#D7B77A]" : "text-[#89958B]"}>{history.length}</span>
                </button>
              </div>
              <div className="relative w-full sm:max-w-[300px]">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89978D]" />
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder={activeTab === "saved" ? "Search saved views..." : "Search search history..."} className="h-10 w-full rounded-xl border border-[#E7E8E2] bg-[#FAFAF7] pl-10 pr-3 text-xs outline-none transition placeholder:text-[#A1AAA2] focus:border-[#6D9B7E] focus:bg-white focus:ring-4 focus:ring-[#26745A]/[0.07]" />
                {searchText && <button onClick={() => setSearchText("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#89978D]"><X size={14} /></button>}
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center gap-3 text-xs font-medium text-[#718176]"><LoaderCircle size={19} className="animate-spin text-[#26745A]" /> Loading {activeTab === "saved" ? "saved views" : "search history"}...</div>
            ) : activeTab === "saved" ? (
              filteredViews.length ? (
                <div className="divide-y divide-[#F0F0EA]">
                  {filteredViews.map((view) => {
                    const isOwner = view.userId === user?.id;
                    const config = view.configuration ?? {};
                    const filterCount = config.filters?.length ?? 0;
                    return (
                      <article key={view.id} className="flex flex-col gap-4 p-5 transition hover:bg-[#FCFCF9] sm:px-7 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF3EC] text-[#286347]"><Bookmark size={18} /></span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="break-words text-sm font-bold text-[#263B32]">{view.name}</h2>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${view.isShared ? "bg-[#F5EEDC] text-[#87672D]" : "bg-[#F0F1ED] text-[#68766D]"}`}>
                                {view.isShared ? <Share2 size={10} /> : <UserRound size={10} />}{view.isShared ? "Shared" : "Private"}
                              </span>
                              {!isOwner && <span className="rounded-full bg-[#EDF3EC] px-2.5 py-1 text-[9px] font-semibold text-[#39704E]">Shared with you</span>}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#8A968D]">
                              <span className="inline-flex items-center gap-1"><Clock3 size={12} />{formatDate(view.createdAt)}</span>
                              <span className="inline-flex items-center gap-1"><Filter size={12} />{filterCount} filters</span>
                              <span className="inline-flex items-center gap-1"><SlidersHorizontal size={12} />{config.sortBy ?? "createdAt"} · {config.sortOrder ?? "desc"}</span>
                              <span>{config.pageSize ?? 10} rows per page</span>
                            </div>
                            {config.search && <p className="mt-2 truncate text-[10px] text-[#78867D]">Search: “{config.search}”</p>}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                          <button onClick={() => applyConfiguration(config)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1E6048] px-3.5 text-[10px] font-semibold text-white transition hover:bg-[#174B38]"><Play size={13} />Apply view</button>
                          {isOwner && <button disabled={busyId === view.id} onClick={() => void updateCurrentView(view)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DDE4D9] bg-white px-3 text-[10px] font-semibold text-[#52685A] transition hover:bg-[#F4F7F1] disabled:opacity-50"><RefreshCw size={12} className={busyId === view.id ? "animate-spin" : ""} />Update</button>}
                          {isOwner && user?.role !== "VIEWER" && <button disabled={busyId === view.id} onClick={() => void toggleShared(view)} title={view.isShared ? "Make private" : "Share with workspace"} aria-label={view.isShared ? "Make private" : "Share with workspace"} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDE4D9] bg-white text-[#52685A] transition hover:bg-[#F4F7F1] disabled:opacity-50"><Share2 size={13} /></button>}
                          {isOwner && <button disabled={busyId === view.id} onClick={() => void deleteView(view)} aria-label={`Delete ${view.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EADBD6] bg-white text-[#A65D50] transition hover:bg-[#FBF3F0] disabled:opacity-50"><Trash2 size={13} /></button>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <Bookmark size={28} className="mx-auto text-[#A5B0A6]" />
                  <p className="mt-3 text-sm font-semibold text-[#53685A]">{searchText ? "No matching saved views" : "No saved views yet"}</p>
                  <p className="mt-1 text-[11px] text-[#9AA49B]">{searchText ? "Try another search term." : "Save a search configuration from Data Explorer to see it here."}</p>
                  {!searchText && <button onClick={() => router.push("/")} className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#1E6048] px-4 text-[10px] font-semibold text-white hover:bg-[#174B38]"><Database size={13} />Open Data Explorer</button>}
                </div>
              )
            ) : (
              filteredHistory.length ? (
                <div className="divide-y divide-[#F0F0EA]">
                  {filteredHistory.map((item) => {
                    const config = item.filters ?? {};
                    return (
                      <article key={item.id} className="flex flex-col gap-4 p-5 transition hover:bg-[#FCFCF9] sm:px-7 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F0E5] text-[#96743D]"><History size={17} /></span>
                          <div className="min-w-0">
                            <h2 className="break-words text-xs font-bold text-[#344A3B]">{item.query?.trim() || "All records"}</h2>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#8A968D]">
                              <span className="inline-flex items-center gap-1"><Clock3 size={12} />{formatDate(item.createdAt)}</span>
                              <span className="inline-flex items-center gap-1"><Filter size={12} />{config.filters?.length ?? 0} filters</span>
                              <span>{config.sortBy ?? "createdAt"} · {config.sortOrder ?? "desc"}</span>
                              <span>{config.pageSize ?? 10} rows per page</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => applyHistory(item)} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[#1E6048] px-3.5 text-[10px] font-semibold text-white transition hover:bg-[#174B38] sm:self-auto"><Play size={13} />Restore search</button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <History size={28} className="mx-auto text-[#A5B0A6]" />
                  <p className="mt-3 text-sm font-semibold text-[#53685A]">{searchText ? "No matching searches" : "No search history yet"}</p>
                  <p className="mt-1 text-[11px] text-[#9AA49B]">{searchText ? "Try another search term." : "Your previous Data Explorer searches will appear here."}</p>
                </div>
              )
            )}
          </section>

          <footer className="flex flex-col justify-between gap-2 pb-3 text-[10px] text-[#98A198] sm:flex-row">
            <p>© 2026 DataScope. Data Intelligence Platform.</p>
            <div className="flex items-center gap-2"><Database size={12} /><span>Customer Transactions Workspace</span><span className="text-[#548263]">· Connected</span></div>
          </footer>
        </div>
      </main>
    </>
  );
}
