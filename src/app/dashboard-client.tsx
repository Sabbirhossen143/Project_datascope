"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import { toast } from "sonner";
import {
  Activity,
  ArrowDownUp,
  Bookmark,
  BookmarkPlus,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Database,
  Download,
  Save,
  Trash2,
  FolderOpen,
  History,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth, setAuthLoading, setAuthUser } from "@/store/slices/authSlice";
import {
  setPage,
  setPageSize,
  setSearch,
  setSorting,
  toggleSort,
  setFilters,
  clearFilters,
  resetExplorer,
} from "@/store/slices/explorerSlice";
import {
  setDatasets,
  setActiveDataset,
  setDatasetsLoading,
  setDatasetsError,
  type DatasetSummary,
} from "@/store/slices/datasetSlice";
import {
  useGetRecordsQuery,
  type RecordFilter,
} from "@/store/api/recordsApi";

const DEFAULT_DATASET_ID = "81f7f864-4784-4117-80c3-2401f923e78e";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, soon: true },
  { label: "Data Explorer", icon: Database, active: true },
  { label: "Analytics", icon: ChartNoAxesCombined },
  { label: "Saved Views", icon: Bookmark, soon: true },
];

type DropdownOption = { value: string; label: string };

function PremiumDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  icon: LeadingIcon,
  compact = false,
  dropUp = false,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  compact?: boolean;
  dropUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative w-full ${open ? "z-[80]" : "z-0"}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-2 rounded-xl border bg-white text-left text-[#344A3B] shadow-sm outline-none transition-all duration-200 hover:border-[#B8C9BA] hover:shadow-md focus:border-[#6D9B7E] focus:ring-4 focus:ring-[#26745A]/10 ${
          compact ? "h-9 rounded-lg px-3 text-[10px]" : "h-11 px-3.5 text-xs"
        } ${open ? "border-[#6D9B7E] ring-4 ring-[#26745A]/10" : "border-[#E7E8E2]"}`}
      >
        {LeadingIcon && <LeadingIcon size={compact ? 13 : 15} className="shrink-0 text-[#718579]" />}
        <span className="min-w-0 flex-1 truncate font-semibold">{selected?.label ?? value}</span>
        <ChevronDown size={compact ? 13 : 15} className={`shrink-0 text-[#829087] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute right-0 ${
  dropUp ? "bottom-[calc(100%+7px)]" : "top-[calc(100%+7px)]"
} z-[90] max-h-64 w-full min-w-[180px] overflow-y-auto rounded-xl border border-[#E5E8DF] bg-white p-1.5 shadow-[0_14px_36px_rgba(20,47,40,0.16)] ring-1 ring-black/[0.025] animate-in fade-in zoom-in-95 duration-150`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setOpen(false);
                  if (!active) onChange(option.value);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[11px] transition ${
                  active
                    ? "bg-[#EEF4EC] font-bold text-[#24563D]"
                    : "font-medium text-[#5D7063] hover:bg-[#F7F8F4] hover:text-[#263B32]"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check size={14} className="shrink-0 text-[#26745A]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const sortOptions: DropdownOption[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "amount:desc", label: "Amount: high to low" },
  { value: "amount:asc", label: "Amount: low to high" },
  { value: "customerName:asc", label: "Customer: A to Z" },
  { value: "customerName:desc", label: "Customer: Z to A" },
  { value: "product:asc", label: "Product: A to Z" },
  { value: "status:asc", label: "Status: A to Z" },
];

const fieldOptions: DropdownOption[] = [
  { value: "status", label: "Status" },
  { value: "region", label: "Region" },
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "customerName", label: "Customer" },
  { value: "amount", label: "Amount" },
  { value: "quantity", label: "Quantity" },
  { value: "paymentMethod", label: "Payment method" },
];

const operatorOptions: DropdownOption[] = [
  { value: "eq", label: "Equals" },
  { value: "neq", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "gte", label: "Greater than or equal" },
  { value: "lte", label: "Less than or equal" },
];

const pageSizeOptions: DropdownOption[] = [
  { value: "10", label: "10 rows" },
  { value: "25", label: "25 rows" },
  { value: "50", label: "50 rows" },
  { value: "100", label: "100 rows" },
];


type SavedViewItem = {
  id: string;
  name: string;
  isShared: boolean;
  configuration: {
    search?: string;
    filters?: RecordFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    pageSize?: number;
  };
  createdAt?: string;
};

type SearchHistoryItem = {
  id: string;
  query: string;
  filters?: {
    filters?: RecordFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    pageSize?: number;
  } | null;
  createdAt?: string;
};

export default function DashboardClient() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items: datasets, activeDatasetId } = useAppSelector((state) => state.datasets);
  const { user: currentUser, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const activeDataset = datasets.find((dataset) => dataset.id === activeDatasetId) ?? null;
  const [datasetReady, setDatasetReady] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedViewItem[]>([]);
  const [savedViewsLoading, setSavedViewsLoading] = useState(false);
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [savedViewName, setSavedViewName] = useState("");
  const [shareSavedView, setShareSavedView] = useState(false);
  const [savingView, setSavingView] = useState(false);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    let active = true;
    dispatch(setAuthLoading(true));

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) throw new Error("Authentication required");

        const result = await response.json();
        const user = result.user ?? result;
        const validRoles = ["ADMIN", "ANALYST", "VIEWER"];

        if (
          !user?.id ||
          !user?.name ||
          !user?.email ||
          !validRoles.includes(user?.role)
        ) {
          throw new Error("Invalid session response");
        }

        if (active) {
          dispatch(setAuthUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive !== false,
          }));
        }
      } catch {
        if (active) {
          dispatch(clearAuth());
          router.replace("/login");
        }
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [dispatch, router]);

  // Load datasets from the permission-filtered API and resolve the active dataset.
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    async function loadAvailableDatasets() {
      dispatch(setDatasetsLoading(true));
      setDatasetReady(false);
      try {
        const response = await fetch("/api/datasets", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ?? "Unable to load datasets.");

        const available = (Array.isArray(result.data) ? result.data : []) as DatasetSummary[];
        if (cancelled) return;
        dispatch(setDatasets(available));

        const requestedId =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("datasetId")
            : null;
        const preferredId = requestedId || activeDatasetId;
        const selected =
          available.find((dataset) => dataset.id === preferredId) ??
          available.find((dataset) => dataset.id === DEFAULT_DATASET_ID) ??
          available[0] ??
          null;

        dispatch(setActiveDataset(selected?.id ?? null));
        if (!selected) {
          toast.error("No accessible dataset", {
            description: "Your account does not currently have access to a dataset.",
          });
        }
      } catch (error) {
        if (!cancelled) {
          dispatch(setDatasetsError(error instanceof Error ? error.message : "Unable to load datasets."));
          toast.error("Dataset loading failed", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        }
      } finally {
        if (!cancelled) setDatasetReady(true);
      }
    }

    void loadAvailableDatasets();
    return () => { cancelled = true; };
  }, [currentUser, dispatch]);

  useEffect(() => {
    if (!currentUser || !activeDatasetId) {
      setSavedViews([]);
      return;
    }
    let cancelled = false;

    async function loadSavedViews() {
      if (!activeDatasetId) return;
      setSavedViewsLoading(true);
      try {
        const response = await fetch(
          `/api/saved-views?datasetId=${encodeURIComponent(activeDatasetId)}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Unable to load saved views.");
        const result = await response.json();
        if (!cancelled) setSavedViews(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        if (!cancelled) {
          toast.error("Saved views unavailable", {
            description: error instanceof Error ? error.message : "Please try again.",
            duration: 3000,
          });
        }
      } finally {
        if (!cancelled) setSavedViewsLoading(false);
      }
    }

    loadSavedViews();
    return () => { cancelled = true; };
  }, [currentUser, activeDatasetId]);

  useEffect(() => {
    if (!currentUser || !activeDatasetId) {
      setSearchHistory([]);
      return;
    }
    let cancelled = false;

    async function loadSearchHistory() {
      if (!activeDatasetId) return;
      setHistoryLoading(true);
      try {
        const response = await fetch(
          `/api/search-history?datasetId=${encodeURIComponent(activeDatasetId)}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Unable to load search history.");
        const result = await response.json();
        if (!cancelled) {
          setSearchHistory(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error("Search history unavailable", {
            description: error instanceof Error ? error.message : "Please try again.",
            duration: 3000,
          });
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    loadSearchHistory();
    return () => { cancelled = true; };
  }, [currentUser, activeDatasetId]);

  async function handleLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      toast.success("Signed out", { description: "Your DataScope session has ended.", duration: 2200 });
    } catch (error) {
      toast.error("Logout failed", {
        description: error instanceof Error ? error.message : "Please try again.",
        duration: 3500,
      });
    } finally {
      dispatch(clearAuth());
      router.replace("/login");
      router.refresh();
    }
  }

  async function handleExportCsv() {
    if (exportLoading) return;
    if (!activeDatasetId) {
      toast.error("No dataset selected", { description: "Select an accessible dataset before exporting." });
      return;
    }

    if (currentUser?.role === "VIEWER") {
      toast.error("Export unavailable", {
        description: "Your Viewer role does not include dataset export access.",
      });
      return;
    }

    setExportLoading(true);
    const toastId = toast.loading("Preparing CSV export...", {
      description: "Fetching dataset records securely.",
    });

    try {
      const response = await fetch(
        `/api/records/export?datasetId=${encodeURIComponent(activeDatasetId)}`,
        { method: "GET", cache: "no-store" }
      );

      if (!response.ok) {
        let message = "Unable to export this dataset.";
        try {
          const result = await response.json();
          if (typeof result.message === "string") message = result.message;
        } catch {
          // Keep the fallback message when the response is not JSON.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      if (!blob.size) throw new Error("The export returned an empty file.");

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] ?? "datascope-export.csv";

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      toast.success("CSV exported successfully", {
        id: toastId,
        description: `${Number(response.headers.get("X-Exported-Records") ?? 0).toLocaleString()} records downloaded.`,
        duration: 3000,
      });
    } catch (error) {
      toast.error("Export failed", {
        id: toastId,
        description: error instanceof Error ? error.message : "Please try again.",
        duration: 4500,
      });
    } finally {
      setExportLoading(false);
    }
  }

  function getCurrentViewConfiguration() {
    return {
      search,
      filters,
      sortBy,
      sortOrder,
      pageSize,
    };
  }

  async function handleSaveView() {
    if (!activeDatasetId) {
      toast.error("No dataset selected", { description: "Select a dataset before saving a view." });
      return;
    }
    const name = savedViewName.trim();
    if (name.length < 2) {
      toast.error("Name your saved view", {
        description: "Use at least 2 characters.",
      });
      return;
    }

    setSavingView(true);
    try {
      const response = await fetch("/api/saved-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: activeDatasetId,
          name,
          configuration: getCurrentViewConfiguration(),
          isShared: currentUser?.role === "VIEWER" ? false : shareSavedView,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not save this view.");

      const created = result.data as SavedViewItem;
      setSavedViews((current) => [created, ...current]);
      setActiveSavedViewId(created.id);
      setSavedViewName("");
      setShareSavedView(false);
      setSaveViewOpen(false);
      toast.success("View saved", {
        description: `"${created.name}" is ready in your Saved Views.`,
        duration: 2600,
      });
    } catch (error) {
      toast.error("Unable to save view", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSavingView(false);
    }
  }

  function handleLoadSavedView(view: SavedViewItem) {
    const config = view.configuration ?? {};
    dispatch(setSearch(config.search ?? ""));
    setSearchInput(config.search ?? "");
    dispatch(setFilters(config.filters ?? []));
    dispatch(setSorting({
      sortBy: config.sortBy ?? "createdAt",
      sortOrder: config.sortOrder ?? "desc",
    }));
    if (config.pageSize) dispatch(setPageSize(config.pageSize));
    dispatch(setPage(1));
    setActiveSavedViewId(view.id);
    setSavedViewsOpen(false);
    toast.success("Saved view loaded", {
      description: `Applied "${view.name}" to the data explorer.`,
      duration: 2400,
    });
  }

  async function handleUpdateSavedView(view: SavedViewItem) {
    try {
      const response = await fetch(`/api/saved-views/${encodeURIComponent(view.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configuration: getCurrentViewConfiguration(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not update this view.");

      setSavedViews((current) =>
        current.map((item) => item.id === view.id ? { ...item, configuration: getCurrentViewConfiguration() } : item)
      );
      setActiveSavedViewId(view.id);
      toast.success("Saved view updated", {
        description: `"${view.name}" now matches your current filters and sorting.`,
        duration: 2600,
      });
    } catch (error) {
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  async function handleDeleteSavedView(view: SavedViewItem) {
    const confirmed = window.confirm(`Delete the saved view "${view.name}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/saved-views/${encodeURIComponent(view.id)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not delete this view.");

      setSavedViews((current) => current.filter((item) => item.id !== view.id));
      if (activeSavedViewId === view.id) setActiveSavedViewId(null);
      toast.success("Saved view deleted", {
        description: `"${view.name}" has been removed.`,
        duration: 2300,
      });
    } catch (error) {
      toast.error("Delete failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  const {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    sorting,
    filters,
  } = useAppSelector((state) => state.explorer);

  const [searchInput, setSearchInput] = useState(search);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;

    function handleOutsideClick(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (filterTriggerRef.current?.contains(target)) return;
      if (filterPanelRef.current?.contains(target)) return;
      setFilterOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFilterOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [filterOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [profileOpen]);

  const [filterField, setFilterField] = useState("status");
  const [filterOperator, setFilterOperator] =
    useState<RecordFilter["operator"]>("eq");
  const [filterValue, setFilterValue] = useState("");

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetRecordsQuery({
    datasetId: activeDatasetId ?? "",
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    sorting,
    filters,
  }, { skip: authLoading || !currentUser || !datasetReady || !activeDatasetId });

  const records = data?.data ?? [];
  const pagination = data?.pagination;

  async function recordSearchHistory(
    queryValue: string = search,
    filterValues: RecordFilter[] = filters
  ) {
    if (!activeDatasetId) return;
    try {
      const response = await fetch("/api/search-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: activeDatasetId,
          query: queryValue,
          filters: {
            filters: filterValues,
            sortBy,
            sortOrder,
            pageSize,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not save search history.");
      if (result.data) {
        setSearchHistory((current) => [result.data as SearchHistoryItem, ...current].slice(0, 30));
      }
    } catch (error) {
      toast.error("Search history not saved", {
        description: error instanceof Error ? error.message : "Please try again.",
        duration: 2800,
      });
    }
  }

  function handleLoadHistory(item: SearchHistoryItem) {
    const config = item.filters ?? {};
    const queryValue = item.query ?? "";
    dispatch(setSearch(queryValue));
    setSearchInput(queryValue);
    dispatch(setFilters(config.filters ?? []));
    dispatch(setSorting({
      sortBy: config.sortBy ?? "createdAt",
      sortOrder: config.sortOrder ?? "desc",
    }));
    if (config.pageSize) dispatch(setPageSize(config.pageSize));
    dispatch(setPage(1));
    setHistoryOpen(false);
    toast.success("Search restored", {
      description: "Your previous search and filters have been restored.",
      duration: 2300,
    });
  }

  function formatHistoryDate(value?: string) {
    if (!value) return "Recent";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recent";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    if (isError) {
      toast.error("Unable to load records", {
        id: "records-fetch-error",
        description: "Check your connection and try again.",
        duration: 4000,
      });
    }
  }, [isError]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const queryValue = searchInput.trim();
    dispatch(setSearch(queryValue));
    dispatch(setPage(1));
    void recordSearchHistory(queryValue, filters);
  }

  function clearSearch() {
    setSearchInput("");
    dispatch(setSearch(""));
  }

  function applyFilter() {
    if (!filterValue.trim()) return;

    const numeric = ["amount", "quantity"].includes(filterField);
    const value = numeric ? Number(filterValue) : filterValue;

    if (numeric && !Number.isFinite(value)) return;

    const nextFilters = [
      ...filters,
      {
        field: filterField,
        operator: filterOperator,
        value,
      },
    ];
    dispatch(setFilters(nextFilters));
    dispatch(setPage(1));
    void recordSearchHistory(search, nextFilters);

    setFilterValue("");
    setFilterOpen(false);
    toast.success("Filter applied", { description: "Your records are being refined.", duration: 2200 });
  }

  function removeFilter(index: number) {
    dispatch(setFilters(filters.filter((_, i) => i !== index)));
  }

  function changeSorting(value: string) {
    const [field, direction] = value.split(":");

    dispatch(
      setSorting({
        sortBy: field,
        sortOrder: direction as "asc" | "desc",
      })
    );
  }

  function formatAmount(value: unknown) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "—";

    return `৳ ${amount.toLocaleString("en-BD")}`;
  }

  function getStatusStyle(status: unknown) {
    switch (status) {
      case "Completed":
        return "bg-[#E8F3EB] text-[#286A46]";
      case "Pending":
        return "bg-[#F8F0DC] text-[#97702B]";
      case "Cancelled":
        return "bg-[#F8E9E6] text-[#AC5144]";
      default:
        return "bg-[#F0F1ED] text-[#68766D]";
    }
  }

  function displayValue(value: unknown) {
    return value === null || value === undefined || value === ""
      ? "—"
      : String(value);
  }

  function handleDatasetChange(datasetId: string) {
    if (!datasetId || datasetId === activeDatasetId) return;
    dispatch(setActiveDataset(datasetId));
    dispatch(resetExplorer());
    setSearchInput("");
    setActiveSavedViewId(null);
    setSavedViews([]);
    setSearchHistory([]);
    setSavedViewsOpen(false);
    setHistoryOpen(false);
    router.replace(`/explorer?datasetId=${encodeURIComponent(datasetId)}`, { scroll: false });
  }

  const activeSort = `${sortBy}:${sortOrder}`;

  if (authLoading || !currentUser || !datasetReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F4EF]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#26745A] border-t-transparent" />
          <p className="mt-4 text-xs font-semibold text-[#718176]">Loading your DataScope workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#263B32]">

      <WorkspaceSidebar />

      {/* Main */}
      <main className="min-h-screen lg:ml-[270px]">

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E7E6DE] bg-[#F9F8F4]/95 pl-16 pr-4 backdrop-blur-xl sm:pl-16 sm:pr-7 lg:px-10">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-medium text-[#87948B]">
                WORKSPACE / DATA
              </p>
              <p className="mt-1 text-sm font-bold text-[#263B32]">
                Data Explorer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-[#DDE9DE] bg-[#EDF4EC] px-3 py-2 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39845A]" />
              <span className="text-[10px] font-semibold text-[#39704E]">
                System operational
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((open) => !open)}
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-2 rounded-xl border border-[#E7E6DE] bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm transition hover:border-[#C7B27F]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D7B77A]/50 bg-[#E9D9B8] text-xs font-bold text-[#604A25]">
                  {currentUser?.name?.charAt(0).toUpperCase() ?? "U"}
                </span>
                <span className="hidden max-w-[110px] truncate text-[11px] font-semibold text-[#40584A] sm:block">
                  {currentUser?.name ?? "Account"}
                </span>
                <ChevronDown size={14} className="text-[#7C8B80]" />
              </button>
              {profileOpen && (
                <>
                  <button aria-label="Close profile menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[290px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E7E6DE] bg-white p-2 shadow-2xl shadow-[#142F28]/15">
                    {/* Account identity */}
                    <div className="rounded-xl bg-[#F6F6F0] px-3.5 py-3.5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D7B77A]/50 bg-[#E9D9B8] text-sm font-bold text-[#604A25]">
                          {currentUser?.name?.charAt(0).toUpperCase() ?? "U"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold text-[#263B32]">
                            {currentUser?.name ?? "Loading user..."}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-[#829087]">
                            {currentUser?.email ?? ""}
                          </p>
                          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#E7F0E7] px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#286347]">
                            <ShieldCheck size={11} /> {currentUser?.role ?? "USER"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profile */}
                    <button
                      onClick={() => { setProfileOpen(false); router.push("/profile"); }}
                      className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[#53685A] transition hover:bg-[#F4F6F1]"
                    >
                      <UserRound size={15} className="text-[#718579]" />
                      My Profile
                    </button>

                    {/* Account & role */}
                    <div className="px-3 pb-1 pt-3">
                      <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#9AA59B]">
                        Account &amp; Role
                      </p>
                    </div>
                    {currentUser?.role === "ADMIN" && (
                      <button
                        onClick={() => { setProfileOpen(false); router.push("/admin/users"); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[#53685A] transition hover:bg-[#F4F6F1]"
                      >
                        <Users size={15} className="text-[#718579]" />
                        User Management
                        <span className="ml-auto rounded-md bg-[#EAF1E9] px-2 py-1 text-[8px] font-bold text-[#39704E]">
                          ADMIN
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled
                      title="Settings are coming soon"
                      className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[#A1AAA2]"
                    >
                      <Settings2 size={15} />
                      Settings
                      <span className="ml-auto text-[9px] font-semibold">SOON</span>
                    </button>

                    <div className="my-1.5 border-t border-[#F0F0EA]" />
                    <button
                      onClick={handleLogout}
                      disabled={logoutLoading}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#A64F43] transition hover:bg-[#FBF0ED] disabled:opacity-60"
                    >
                      <LogOut size={15} />
                      {logoutLoading ? "Signing out..." : "Logout"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] space-y-7 p-4 sm:p-7 lg:p-10">

          {/* Heading */}
          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E4E8DF] bg-white px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39845A]" />
                <span className="text-[10px] font-semibold uppercase tracking-[1.3px] text-[#62796B]">
                  Your data workspace
                </span>
              </div>

              <h1 className="text-[27px] font-bold tracking-[-1px] text-[#1D352A] sm:text-[34px]">
                Explore your data<span className="text-[#B99455]">.</span>
              </h1>

              <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#78867D]">
                Discover patterns, search transactions and manage your records
                with complete control.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleExportCsv}
                disabled={exportLoading || currentUser?.role === "VIEWER"}
                title={
                  currentUser?.role === "VIEWER"
                    ? "Export is not available for Viewer accounts"
                    : "Download all dataset records as CSV"
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D9E3D8] bg-white px-4 text-xs font-semibold text-[#286347] shadow-sm transition hover:border-[#AFC5B2] hover:bg-[#F6F8F3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exportLoading ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                {exportLoading ? "Exporting..." : "Export CSV"}
              </button>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1E6048] px-4 text-xs font-semibold text-white shadow-lg shadow-[#1E6048]/15 transition hover:bg-[#174B38] disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={isFetching ? "animate-spin" : ""}
                />
                Refresh dataset
              </button>
            </div>
          </section>

          {/* Dataset banner */}
          <section className="relative overflow-hidden rounded-[22px] bg-[#183C30] p-6 text-white shadow-xl shadow-[#183C30]/10 sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-28 h-80 w-80 rounded-full border border-white/[0.07]" />
            <div className="pointer-events-none absolute -right-1 -top-16 h-64 w-64 rounded-full border border-white/[0.08]" />
            <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-[#D7B77A]/[0.07] blur-3xl" />

            <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2 text-[#D7B77A]">
                  <Database size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-[2px]">
                    Active dataset
                  </span>
                </div>

                <div className="mt-3 max-w-[360px]">
                  <PremiumDropdown
                    value={activeDatasetId ?? ""}
                    ariaLabel="Select active dataset"
                    compact
                    options={datasets.map((dataset) => ({ value: dataset.id, label: dataset.name }))}
                    onChange={handleDatasetChange}
                  />
                </div>

                <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-[25px]">
                  {activeDataset?.name ?? "Select a dataset"}
                </h2>

                <p className="mt-2 max-w-lg text-xs leading-6 text-[#C2D1C7]">
                  {activeDataset?.description ||
                    "Explore, search and analyze records from your selected dataset."}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[10px] font-medium text-[#D4E0D7]">
                    PostgreSQL
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[10px] font-medium text-[#D4E0D7]">
                    {activeDataset?.category ?? "Dataset"}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[10px] font-medium text-[#D4E0D7]">
                    {activeDataset?.dataSource ?? "Live querying"}
                  </span>
                </div>
              </div>

              <div className="min-w-[190px] rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#B9CFC1]">
                    Connection
                  </span>
                  <Activity size={17} className="text-[#D7B77A]" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#9BD09D] shadow-[0_0_12px_#9BD09D]" />
                  <span className="text-sm font-semibold text-white">
                    Connected
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-[#B9CFC1]">
                  Neon PostgreSQL database
                </p>
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total records",
                value: pagination?.totalRecords.toLocaleString() ?? "—",
                description: "In the active dataset",
                icon: Database,
                accent: "#26745A",
                iconBg: "#EAF2EA",
              },
              {
                label: "Matching results",
                value: pagination?.totalRecords.toLocaleString() ?? "—",
                description: "Based on current query",
                icon: Search,
                accent: "#A17B42",
                iconBg: "#F6F0E4",
              },
              {
                label: "Current page",
                value: pagination?.page ?? "—",
                description: `Of ${pagination?.totalPages.toLocaleString() ?? "—"} pages`,
                icon: LayoutDashboard,
                accent: "#657D69",
                iconBg: "#EDF1E9",
              },
              {
                label: "Rows per page",
                value: pagination?.pageSize ?? pageSize,
                description: "Display configuration",
                icon: SlidersHorizontal,
                accent: "#9A7650",
                iconBg: "#F4EEE7",
              },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-[#E8E7DF] bg-white p-5 shadow-[0_3px_16px_rgba(35,55,43,0.025)] transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#183C30]/5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-[#7D8980]">
                      {stat.label}
                    </p>
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        color: stat.accent,
                        backgroundColor: stat.iconBg,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                  </div>

                  <p className="mt-5 text-[27px] font-bold tracking-tight text-[#243A2E]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] text-[#929B94]">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </section>

          {/* Explorer */}
          <section
            id="records"
            className="overflow-hidden rounded-[22px] border border-[#E8E7DF] bg-white shadow-[0_4px_20px_rgba(35,55,43,0.035)]"
          >
            {saveViewOpen && (
              <div className="border-b border-[#E8E7DF] bg-gradient-to-r from-[#F8FAF6] to-white p-5 sm:px-7">
                <div className="mx-auto max-w-2xl rounded-2xl border border-[#E4E9E0] bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#263B32]">Save current view</h4>
                      <p className="mt-1 text-[10px] leading-5 text-[#87948B]">Store your search, filters, sorting and page size for quick access later.</p>
                    </div>
                    <button type="button" onClick={() => setSaveViewOpen(false)} aria-label="Close save view form" className="rounded-lg p-1.5 text-[#87948B] hover:bg-[#F4F6F1]">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={savedViewName}
                      onChange={(event) => setSavedViewName(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") handleSaveView(); }}
                      maxLength={100}
                      placeholder="e.g. High-value completed orders"
                      className="h-11 min-w-0 flex-1 rounded-xl border border-[#E7E8E2] bg-[#FAFAF7] px-3.5 text-xs text-[#263B32] outline-none transition placeholder:text-[#A1AAA2] focus:border-[#6D9B7E] focus:bg-white focus:ring-4 focus:ring-[#26745A]/[0.07]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveView}
                      disabled={savingView || savedViewName.trim().length < 2}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1E6048] px-5 text-xs font-semibold text-white transition hover:bg-[#174B38] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingView ? <RefreshCw size={14} className="animate-spin" /> : <BookmarkPlus size={14} />}
                      {savingView ? "Saving..." : "Save view"}
                    </button>
                  </div>
                  {currentUser?.role !== "VIEWER" && (
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-[10px] font-medium text-[#68776D]">
                      <input
                        type="checkbox"
                        checked={shareSavedView}
                        onChange={(event) => setShareSavedView(event.target.checked)}
                        className="h-3.5 w-3.5 accent-[#26745A]"
                      />
                      Share this view with users who can access this dataset
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Section heading */}
            <div className="flex flex-col justify-between gap-4 border-b border-[#EFEFE9] p-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-[#243A2E]">
                    Transaction records
                  </h3>
                  <span className="rounded-md bg-[#EDF3EC] px-2 py-1 text-[9px] font-bold text-[#39704E]">
                    LIVE DATA
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#8B968E]">
                  Search, sort and refine records from your dataset.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setHistoryOpen((open) => !open); setSavedViewsOpen(false); }}
                    aria-expanded={historyOpen}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[11px] font-semibold transition ${
                      historyOpen
                        ? "border-[#BFCFBE] bg-[#EDF3EC] text-[#286347]"
                        : "border-[#E7E8E2] bg-white text-[#68776D] hover:border-[#B8C9BA] hover:bg-[#F7F8F4]"
                    }`}
                  >
                    <History size={14} />
                    History
                    <span className="rounded-md bg-[#E9EDE5] px-1.5 py-0.5 text-[9px]">{searchHistory.length}</span>
                    <ChevronDown size={13} className={`transition-transform ${historyOpen ? "rotate-180" : ""}`} />
                  </button>

                  {historyOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="Close search history"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setHistoryOpen(false)}
                      />
                      <div className="absolute right-0 top-[calc(100%+9px)] z-50 w-[min(370px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[#E5E8DF] bg-white shadow-[0_18px_48px_rgba(20,47,40,0.17)]">
                        <div className="border-b border-[#EEF0E9] px-4 py-3.5">
                          <p className="text-xs font-bold text-[#263B32]">Recent search history</p>
                          <p className="mt-0.5 text-[10px] text-[#8A968D]">Restore a previous search and filter combination</p>
                        </div>
                        <div className="max-h-[340px] overflow-y-auto p-2">
                          {historyLoading ? (
                            <div className="flex items-center justify-center gap-2 px-3 py-8 text-[11px] text-[#849087]">
                              <RefreshCw size={14} className="animate-spin" /> Loading history...
                            </div>
                          ) : searchHistory.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <History size={22} className="mx-auto text-[#A7B3A7]" />
                              <p className="mt-2 text-xs font-semibold text-[#52685A]">No search history yet</p>
                              <p className="mt-1 text-[10px] text-[#98A198]">Your submitted searches will appear here.</p>
                            </div>
                          ) : (
                            searchHistory.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleLoadHistory(item)}
                                className="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#F4F7F1]"
                              >
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EDF3EC] text-[#39704E]">
                                  <Search size={14} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[11px] font-semibold text-[#344A3B]">
                                    {item.query?.trim() || "All records"}
                                  </span>
                                  <span className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-[#929D93]">
                                    <span>{item.filters?.filters?.length ?? 0} filters</span>
                                    <span>·</span>
                                    <span>{formatHistoryDate(item.createdAt)}</span>
                                  </span>
                                </span>
                                <span className="pt-1 text-[9px] font-bold text-[#6D9478] opacity-0 transition group-hover:opacity-100">RESTORE</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setSavedViewsOpen((open) => !open); setHistoryOpen(false); }}
                    aria-expanded={savedViewsOpen}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[11px] font-semibold transition ${
                      savedViewsOpen || activeSavedViewId
                        ? "border-[#BFCFBE] bg-[#EDF3EC] text-[#286347]"
                        : "border-[#E7E8E2] bg-white text-[#68776D] hover:border-[#B8C9BA] hover:bg-[#F7F8F4]"
                    }`}
                  >
                    <Bookmark size={14} />
                    Saved views
                    <span className="rounded-md bg-[#E9EDE5] px-1.5 py-0.5 text-[9px]">{savedViews.length}</span>
                    <ChevronDown size={13} className={`transition-transform ${savedViewsOpen ? "rotate-180" : ""}`} />
                  </button>

                  {savedViewsOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="Close saved views"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setSavedViewsOpen(false)}
                      />
                      <div className="absolute right-0 top-[calc(100%+9px)] z-50 w-[min(390px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[#E5E8DF] bg-white shadow-[0_18px_48px_rgba(20,47,40,0.17)]">
                        <div className="flex items-center justify-between border-b border-[#EEF0E9] px-4 py-3.5">
                          <div>
                            <p className="text-xs font-bold text-[#263B32]">Your saved views</p>
                            <p className="mt-0.5 text-[10px] text-[#8A968D]">Reuse a search and filter configuration</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setSavedViewsOpen(false); setSaveViewOpen(true); }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E6048] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#174B38]"
                          >
                            <BookmarkPlus size={13} /> Save current
                          </button>
                        </div>

                        <div className="max-h-[340px] overflow-y-auto p-2">
                          {savedViewsLoading ? (
                            <div className="flex items-center justify-center gap-2 px-3 py-8 text-[11px] text-[#849087]">
                              <RefreshCw size={14} className="animate-spin" /> Loading saved views...
                            </div>
                          ) : savedViews.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <FolderOpen size={22} className="mx-auto text-[#A7B3A7]" />
                              <p className="mt-2 text-xs font-semibold text-[#52685A]">No saved views yet</p>
                              <p className="mt-1 text-[10px] text-[#98A198]">Save your current search, filters and sorting.</p>
                            </div>
                          ) : (
                            savedViews.map((view) => (
                              <div key={view.id} className={`rounded-xl p-3 transition ${activeSavedViewId === view.id ? "bg-[#F0F5EE]" : "hover:bg-[#F8F9F5]"}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-[11px] font-bold text-[#344A3B]">{view.name}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                      {view.isShared && <span className="rounded-md bg-[#F5F0E4] px-1.5 py-0.5 text-[8px] font-bold text-[#92713A]">SHARED</span>}
                                      <span className="text-[9px] text-[#929D93]">{view.configuration?.filters?.length ?? 0} filters</span>
                                      {activeSavedViewId === view.id && <span className="text-[9px] font-semibold text-[#39845A]">CURRENT</span>}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSavedView(view)}
                                    title="Delete saved view"
                                    aria-label={`Delete ${view.name}`}
                                    className="rounded-lg p-1.5 text-[#A0AAA0] transition hover:bg-[#FBF0ED] hover:text-[#AC5144]"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleLoadSavedView(view)}
                                    className="rounded-lg bg-[#EAF1E9] px-3 py-1.5 text-[9px] font-bold text-[#286347] transition hover:bg-[#DDEADD]"
                                  >
                                    Load view
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSavedView(view)}
                                    className="rounded-lg border border-[#E5E9E1] px-3 py-1.5 text-[9px] font-semibold text-[#64766A] transition hover:bg-white hover:text-[#286347]"
                                  >
                                    Update with current
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSaveViewOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D9E3D8] bg-white px-3.5 text-[11px] font-semibold text-[#286347] transition hover:border-[#AFC5B2] hover:bg-[#F6F8F3]"
                >
                  <Save size={14} /> Save view
                </button>

                <button
                  onClick={() => {
                    clearSearch();
                    dispatch(clearFilters());
                  }}
                  className="rounded-xl border border-[#E7E8E2] px-3.5 py-2.5 text-[11px] font-semibold text-[#68776D] transition hover:border-[#B8C9BA] hover:bg-[#F5F7F2]"
                >
                  Reset all
                </button>

                <button
                  ref={filterTriggerRef}
                  onClick={() => setFilterOpen(!filterOpen)}
                  aria-expanded={filterOpen}
                  aria-haspopup="dialog"
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[11px] font-semibold transition ${
                    filterOpen
                      ? "bg-[#183C30] text-white"
                      : "bg-[#EAF1E9] text-[#286347] hover:bg-[#DDEADD]"
                  }`}
                >
                  <Filter size={14} />
                  Filters
                  {filters.length > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D7B77A] px-1 text-[9px] text-[#183C30]">
                      {filters.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Search and sorting */}
            <div className="grid grid-cols-1 gap-3 border-b border-[#EFEFE9] p-5 sm:p-6 lg:grid-cols-[1fr_245px]">
              <form onSubmit={submitSearch} className="relative flex">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#89978D]"
                />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search customer, transaction, product..."
                  className="h-12 w-full rounded-xl border border-[#E7E8E2] bg-[#FAFAF7] pl-11 pr-24 text-xs text-[#263B32] outline-none transition placeholder:text-[#A1AAA2] focus:border-[#6D9B7E] focus:bg-white focus:ring-4 focus:ring-[#26745A]/[0.07]"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-[82px] top-1/2 -translate-y-1/2 p-1 text-[#8B968E] hover:text-[#263B32]"
                  >
                    <X size={15} />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 h-9 rounded-lg bg-[#1E6048] px-4 text-[10px] font-bold text-white transition hover:bg-[#174B38]"
                >
                  Search
                </button>
              </form>

              <div className="relative">
                <ArrowDownUp
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D8E82]"
                />
                <PremiumDropdown
                  ariaLabel="Sort records"
                  value={activeSort}
                  options={sortOptions}
                  onChange={changeSorting}
                  icon={ArrowDownUp}
                />
              </div>
            </div>

            {/* Filter panel */}
            {filterOpen && (
              <div ref={filterPanelRef} className="mx-4 my-4 rounded-2xl border border-[#E5E8DF] bg-gradient-to-br from-white to-[#F7F8F3] p-5 shadow-[0_12px_30px_rgba(20,47,40,0.07)] animate-in slide-in-from-top-2 fade-in duration-200 sm:mx-6 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#263B32]">
                      Advanced filters
                    </h4>
                    <p className="mt-1 text-[10px] text-[#89958B]">
                      Add conditions to refine your results.
                    </p>
                  </div>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="rounded-lg p-2 text-[#849187] hover:bg-white"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="relative">
                    <label className="mb-2 block text-[10px] font-semibold text-[#748279]">
                      FIELD
                    </label>
                    <PremiumDropdown
                      ariaLabel="Filter field"
                      value={filterField}
                      options={fieldOptions}
                      onChange={setFilterField}
                    />
                  </div>

                  <div className="relative">
                    <label className="mb-2 block text-[10px] font-semibold text-[#748279]">
                      CONDITION
                    </label>
                    <PremiumDropdown
                      ariaLabel="Filter condition"
                      value={filterOperator}
                      options={operatorOptions}
                      onChange={(nextValue) => setFilterOperator(nextValue as RecordFilter["operator"])}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-semibold text-[#748279]">
                      VALUE
                    </label>
                    <input
                      value={filterValue}
                      onChange={(event) => setFilterValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") applyFilter();
                      }}
                      placeholder="Enter filter value"
                      className="h-11 w-full rounded-xl border border-[#E7E8E2] bg-white px-3 text-xs outline-none transition placeholder:text-[#A1AAA2] focus:border-[#6D9B7E] focus:ring-4 focus:ring-[#26745A]/10"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={applyFilter}
                      disabled={!filterValue.trim()}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E6048] text-xs font-semibold text-white transition hover:bg-[#174B38] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Check size={15} />
                      Apply condition
                    </button>
                  </div>
                </div>

                {filters.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {filters.map((filter, index) => (
                      <span
                        key={`${filter.field}-${index}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#DCE6DA] bg-white px-3 py-2 text-[10px] text-[#486454]"
                      >
                        <span className="font-bold">{filter.field}</span>
                        <span className="text-[#9AA69D]">{filter.operator}</span>
                        <span>{String(filter.value)}</span>
                        <button
                          onClick={() => removeFilter(index)}
                          className="ml-1 text-[#87958A] hover:text-[#AC5144]"
                          aria-label="Remove filter"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active filter tags */}
            {filters.length > 0 && !filterOpen && (
              <div className="flex flex-wrap items-center gap-2 border-b border-[#EFEFE9] px-5 py-3 sm:px-6">
                <span className="text-[10px] font-semibold text-[#829087]">
                  Active:
                </span>
                {filters.map((filter, index) => (
                  <span
                    key={`${filter.field}-${index}`}
                    className="rounded-lg bg-[#EDF3EC] px-2.5 py-1.5 text-[10px] text-[#39704E]"
                  >
                    {filter.field}: {String(filter.value)}
                  </span>
                ))}
                <button
                  onClick={() => dispatch(clearFilters())}
                  className="text-[10px] font-semibold text-[#A16C4B] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Table */}
            <div className="relative overflow-x-auto">
              {isFetching && !isLoading && (
                <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-[#E5EDE4]">
                  <div className="h-full w-1/3 animate-pulse bg-[#39845A]" />
                </div>
              )}

              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead>
                  
<tr className="bg-[#F8F8F4]">
  {[
    { label: "Transaction", field: "externalId" },
    { label: "Customer", field: "customerName" },
    { label: "Product", field: "product" },
    { label: "Region", field: "region" },
    { label: "Amount", field: "amount" },
    { label: "Status", field: "status" },
    { label: "Payment", field: "paymentMethod" },
  ].map(({ label, field }) => {
    const sortIndex = sorting.findIndex(
      (rule) => rule.field === field
    );

    const activeRule =
      sortIndex >= 0 ? sorting[sortIndex] : null;

    return (
      <th
        key={field}
        aria-sort={
          sortIndex === 0
            ? activeRule?.direction === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        className="whitespace-nowrap px-5 py-4 text-[9px] font-bold uppercase tracking-[1.1px] text-[#849087] sm:px-6"
      >
        <button
          type="button"
          onClick={(event) =>
            dispatch(
              toggleSort({
                field,
                shiftKey: event.shiftKey,
              })
            )
          }
          title={
            activeRule
              ? `${label}: ${activeRule.direction.toUpperCase()} — Shift + Click to add or change sorting`
              : `Click to sort by ${label}. Shift + Click to add another sorting rule.`
          }
          className="inline-flex items-center gap-2 rounded-md transition hover:text-[#246448] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39845A]"
        >
          <span>{label}</span>

          {activeRule && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#E6EFE6] px-1.5 py-1 text-[9px] font-bold text-[#286347]">
              <span>
                {activeRule.direction === "asc" ? "↑" : "↓"}
              </span>
              <span>{sortIndex + 1}</span>
            </span>
          )}
        </button>
      </th>
    );
  })}
</tr>

                </thead>

                <tbody className="divide-y divide-[#F0F0EA]">
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <RefreshCw className="mx-auto animate-spin text-[#39845A]" size={22} />
                        <p className="mt-3 text-xs text-[#87958B]">
                          Loading transaction records...
                        </p>
                      </td>
                    </tr>
                  )}

                  {isError && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <button
                          onClick={() => refetch()}
                          className="rounded-lg border border-[#DCE6DB] bg-[#F5F8F3] px-4 py-2.5 text-[11px] font-semibold text-[#286347] transition hover:bg-[#EAF1E9]"
                        >
                          Retry loading records
                        </button>
                      </td>
                    </tr>
                  )}

                  {!isLoading && !isError && records.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <Search className="mx-auto text-[#A5B0A6]" size={25} />
                        <p className="mt-3 text-sm font-semibold text-[#53685A]">
                          No matching records
                        </p>
                        <p className="mt-1 text-xs text-[#9AA49B]">
                          Try another search term or clear your filters.
                        </p>
                      </td>
                    </tr>
                  )}

                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="transition-colors hover:bg-[#F8FAF6]"
                    >
                      <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                        <button
                          type="button"
                          onClick={() => {
  const url = `/records/${encodeURIComponent(record.id)}?datasetId=${encodeURIComponent(activeDatasetId ?? "")}`;
  router.push(url);
}}
                          aria-label={`View details for transaction ${record.externalId}`}
                          className="group text-left"
                        >
                          <span className="block text-[11px] font-bold text-[#347253] transition group-hover:text-[#183C30] group-hover:underline group-hover:underline-offset-4">
                            {record.externalId}
                          </span>
                          <span className="mt-1 block text-[9px] font-medium text-[#9AA49B] opacity-0 transition group-hover:opacity-100">
                            View record details →
                          </span>
                        </button>
                      </td>

                      <td className="px-5 py-4 sm:px-6">
                        <p className="whitespace-nowrap text-xs font-semibold text-[#344A3B]">
                          {displayValue(record.data.customerName)}
                        </p>
                        <p className="mt-1 text-[10px] text-[#9AA49B]">
                          {displayValue(record.data.email)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#65766A] sm:px-6">
                        {displayValue(record.data.product)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#65766A] sm:px-6">
                        {displayValue(record.data.region)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-[#344A3B] sm:px-6">
                        {formatAmount(record.data.amount)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                        <span className={`inline-flex rounded-full px-2.5 py-1.5 text-[9px] font-bold ${getStatusStyle(record.data.status)}`}>
                          {displayValue(record.data.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#65766A] sm:px-6">
                        {displayValue(record.data.paymentMethod)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col justify-between gap-4 border-t border-[#EFEFE9] bg-white p-5 sm:flex-row sm:items-center sm:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[10px] text-[#87948B]">
                  Showing{" "}
                  <strong className="text-[#40584A]">
                    {pagination && pagination.totalRecords > 0
                      ? ((page - 1) * pageSize + 1).toLocaleString()
                      : 0}
                    –
                    {pagination
                      ? Math.min(
                          page * pageSize,
                          pagination.totalRecords
                        ).toLocaleString()
                      : 0}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-[#40584A]">
                    {pagination?.totalRecords.toLocaleString() ?? "—"}
                  </strong>{" "}
                  records
                </p>

                <div className="relative">
                  <div className="w-[112px]">
                    <PremiumDropdown
  ariaLabel="Rows per page"
  value={String(pageSize)}
  options={pageSizeOptions}
  onChange={(nextValue) => dispatch(setPageSize(Number(nextValue)))}
  compact
  dropUp
/>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  disabled={!pagination?.hasPreviousPage || isFetching}
                  onClick={() => dispatch(setPage(page - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7E8E2] text-[#52685A] transition hover:bg-[#EDF3EC] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="min-w-[110px] text-center text-[10px] font-semibold text-[#64766A]">
                  Page {page.toLocaleString()} of{" "}
                  {pagination?.totalPages.toLocaleString() ?? "—"}
                </span>

                <button
                  disabled={!pagination?.hasNextPage || isFetching}
                  onClick={() => dispatch(setPage(page + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7E8E2] text-[#52685A] transition hover:bg-[#EDF3EC] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-col justify-between gap-2 pb-3 text-[10px] text-[#98A198] sm:flex-row">
            <p>© 2026 DataScope. Data Intelligence Platform.</p>
            <div className="flex items-center gap-2">
              <CalendarDays size={13} />
              <span>{activeDataset?.name ?? "Data Workspace"}</span>
              <span className="mx-1 text-[#C7C9C0]">·</span>
              <span className="text-[#548263]">
                {isFetching ? "Updating..." : "Synced"}
              </span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
