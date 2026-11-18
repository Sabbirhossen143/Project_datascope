"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Database, Filter, LoaderCircle, Plus, RefreshCw, Search, SlidersHorizontal, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceProfileMenu from "@/components/layout/WorkspaceProfileMenu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuth,
  setAuthInitialized,
  setAuthLoading,
  setAuthUser,
} from "@/store/slices/authSlice";

type Dataset = { id: string; name: string; category: string | null; totalRecords: number };
type Kind = "text" | "number" | "date";
type Operator = "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte" | "between";
type Condition = { id: string; field: string; operator: Operator; value: string; secondValue: string };
type Row = { id: string; externalId: string; data: Record<string, unknown>; createdAt: string; updatedAt: string };
type Pagination = { page: number; pageSize: number; totalRecords: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
const fields: { value: string; label: string; kind: Kind }[] = [
  { value: "transactionId", label: "Transaction ID", kind: "text" }, { value: "customerName", label: "Customer name", kind: "text" },
  { value: "email", label: "Email", kind: "text" }, { value: "product", label: "Product", kind: "text" }, { value: "category", label: "Category", kind: "text" },
  { value: "amount", label: "Amount", kind: "number" }, { value: "quantity", label: "Quantity", kind: "number" }, { value: "status", label: "Status", kind: "text" },
  { value: "region", label: "Region", kind: "text" }, { value: "paymentMethod", label: "Payment method", kind: "text" }, { value: "orderDate", label: "Order date", kind: "date" },
];
const ops: { value: Operator; label: string }[] = [
  { value: "eq", label: "Is exactly" }, { value: "neq", label: "Is not" }, { value: "contains", label: "Contains" },
  { value: "gt", label: "Greater than" }, { value: "gte", label: "At least" }, { value: "lt", label: "Less than" }, { value: "lte", label: "At most" }, { value: "between", label: "Between / range" },
];
const makeCondition = (id = "condition-initial"): Condition => ({ id, field: "status", operator: "eq", value: "Completed", secondValue: "" });
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = React.Children.toArray(children).filter((child): child is React.ReactElement<{ value?: string; children?: React.ReactNode; disabled?: boolean }> =>
    React.isValidElement(child) && child.type === "option"
  );
  const selected = options.find(option => String(option.props.value ?? "") === value);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(v => !v)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-[11px] font-semibold text-[#40594A] shadow-[0_1px_2px_rgba(20,47,40,0.035)] outline-none transition hover:border-[#B9CDBB] hover:bg-[#FCFDFB] focus:border-[#7DA18A] focus:ring-4 focus:ring-[#26745A]/[0.08] ${open ? "border-[#7DA18A] ring-4 ring-[#26745A]/[0.08]" : "border-[#E1E7DE]"}`}>
        <span className="min-w-0 truncate">{selected?.props.children ?? "Select an option"}</span>
        <ChevronDown size={14} className={`shrink-0 text-[#809187] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div role="listbox" className="absolute left-0 top-[calc(100%+7px)] z-[80] max-h-64 w-full min-w-[190px] overflow-y-auto rounded-xl border border-[#E3E9E1] bg-white p-1.5 shadow-[0_14px_36px_rgba(20,47,40,0.16)] ring-1 ring-black/[0.025]">
        {options.map((option, index) => {
          const optionValue = String(option.props.value ?? "");
          const active = optionValue === value;
          return <button key={`${optionValue}-${index}`} type="button" role="option" aria-selected={active} disabled={option.props.disabled}
            onClick={() => { onChange(optionValue); setOpen(false); }}
            className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[11px] transition ${active ? "bg-[#EDF4EC] font-bold text-[#20563D]" : "text-[#5C6E62] hover:bg-[#F6F8F4] hover:text-[#244B36]"} disabled:cursor-not-allowed disabled:opacity-40`}>
            <span className="min-w-0">{option.props.children}</span>
            {active && <Check size={13} className="shrink-0 text-[#26745A]" />}
          </button>;
        })}
      </div>}
    </div>
  );
}
const display = (v: unknown) => v === null || v === undefined || v === "" ? "—" : typeof v === "number" ? v.toLocaleString() : String(v);

export default function AdvancedSearchClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [conditions, setConditions] = useState<Condition[]>([makeCondition()]);
  const [rows, setRows] = useState<Row[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("25");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState("");

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      dispatch(setAuthLoading(true));
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          dispatch(clearAuth());
          if (active) router.replace("/login");
          return;
        }
        const account = result?.user ?? result;
        dispatch(setAuthUser(account));
      } catch {
        dispatch(clearAuth());
        if (active) router.replace("/login");
      } finally {
        dispatch(setAuthLoading(false));
        dispatch(setAuthInitialized(true));
      }
    };
    void restoreSession();
    return () => { active = false; };
  }, [dispatch, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    let active = true;
    fetch("/api/datasets", { cache: "no-store" }).then(async r => {
      const j = await r.json();
      if (r.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        throw new Error("Your session has expired. Please sign in again.");
      }
      if (!r.ok) throw new Error(j.message ?? "Could not load datasets.");
      return j.data as Dataset[];
    })
      .then(items => { if (active && items) { setDatasets(items); setDatasetId(v => v || items[0]?.id || ""); } })
      .catch(e => { if (active) toast.error("Datasets unavailable", { description: e instanceof Error ? e.message : "Please try again." }); })
      .finally(() => { if (active) setLoadingDatasets(false); });
    return () => { active = false; };
  }, [dispatch, isAuthenticated, isInitialized, router]);

  const activeConditions = useMemo(() => conditions.filter(c => c.value.trim() && (c.operator !== "between" || c.secondValue.trim())), [conditions]);
  const runSearch = useCallback(async (targetPage = 1) => {
    if (!isInitialized || !isAuthenticated || authLoading) return;
    if (!datasetId) { toast.error("Select a dataset", { description: "Choose a dataset before running a search." }); return; }
    const invalid = activeConditions.some(c => { const kind = fields.find(f => f.value === c.field)?.kind; return (c.operator === "between" && !c.secondValue.trim()) || (kind === "number" && (!Number.isFinite(Number(c.value)) || (c.operator === "between" && !Number.isFinite(Number(c.secondValue))))); });
    if (invalid) { toast.error("Check your conditions", { description: "Enter valid numeric values and complete range conditions." }); return; }
    setLoading(true); setError(null); setHasSearched(true);
    try {
      const filters = activeConditions.map(c => ({ field: c.field, operator: c.operator, value: c.operator === "between" ? [c.value, c.secondValue] : fields.find(f => f.value === c.field)?.kind === "number" ? Number(c.value) : c.value }));
      const params = new URLSearchParams({ datasetId, page: String(targetPage), pageSize, search: globalSearch.trim(), sortBy, sortOrder });
      if (filters.length) params.set("filters", JSON.stringify(filters));
      const response = await fetch(`/api/records?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        throw new Error("Your session has expired. Please sign in again.");
      }
      if (!response.ok) throw new Error(result.message ?? "Search request failed.");
      setRows(result.data ?? []); setPagination(result.pagination ?? null); setPage(targetPage); setLastRun(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      const urlParams = new URLSearchParams(params); urlParams.delete("pageSize");
      router.replace(`/advanced-search?${urlParams.toString()}`, { scroll: false });
    } catch (e) { const message = e instanceof Error ? e.message : "Please try again."; setError(message); setRows([]); setPagination(null); toast.error("Search failed", { description: message }); }
    finally { setLoading(false); }
  }, [activeConditions, authLoading, datasetId, dispatch, globalSearch, isAuthenticated, isInitialized, pageSize, router, sortBy, sortOrder]);

  function updateCondition(id: string, patch: Partial<Condition>) {
    setConditions(current => current.map(c => {
      if (c.id !== id) return c;
      const next = { ...c, ...patch };
      if (patch.field) { const kind = fields.find(f => f.value === patch.field)?.kind; next.operator = kind === "text" ? "eq" : "between"; next.value = ""; next.secondValue = ""; }
      if (patch.operator && patch.operator !== "between") next.secondValue = "";
      return next;
    }));
  }
  function clearBuilder() { setGlobalSearch(""); setConditions([]); setRows([]); setPagination(null); setHasSearched(false); setError(null); setPage(1); router.replace("/advanced-search", { scroll: false }); }
  const selectedDataset = datasets.find(d => d.id === datasetId);
  const start = pagination?.totalRecords ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const end = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.totalRecords) : 0;

  return <><WorkspaceSidebar /><main className="min-h-screen bg-[#F5F4EF] text-[#263B32] lg:ml-[270px]">
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E7E6DE] bg-[#F9F8F4]/95 pl-16 pr-4 backdrop-blur-xl sm:pl-16 sm:pr-7 lg:px-10"><div><p className="text-[10px] font-medium text-[#87948B]">WORKSPACE / DISCOVERY</p><p className="mt-1 text-sm font-bold">Advanced Search</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => void runSearch(page)} disabled={loading || !hasSearched} aria-label="Refresh search" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E6048] text-white shadow-sm hover:bg-[#174B38] disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/></button><WorkspaceProfileMenu /></div></header>
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-7 lg:p-10">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E4E8DF] bg-white px-3 py-1.5"><Sparkles size={12} className="text-[#A17C3D]"/><span className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#62796B]">Precision discovery</span></div><h1 className="text-[28px] font-bold tracking-[-1px] text-[#1D352A] sm:text-[36px]">Build an advanced query<span className="text-[#B99455]">.</span></h1><p className="mt-2 max-w-2xl text-xs leading-6 text-[#78867D]">Combine global search with field-level conditions. All conditions are evaluated together on the database.</p></div><div className="flex items-center gap-2 rounded-xl border border-[#DDE9DE] bg-[#EDF4EC] px-3 py-2"><Activity size={14} className="text-[#39845A]"/><span className="text-[10px] font-semibold text-[#39704E]">Server-side search</span></div></section>
      <section className="overflow-hidden rounded-[22px] border border-[#E8E7DF] bg-white shadow-[0_4px_20px_rgba(35,55,43,0.035)]">
        <div className="flex flex-col gap-3 border-b border-[#EFEFE9] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF3EC] text-[#286347]"><SlidersHorizontal size={15}/></span><h2 className="text-sm font-bold">Search configuration</h2></div><p className="mt-1.5 text-[10px] text-[#929B94]">Choose a dataset, then add conditions to narrow your results.</p></div><span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F6F2E8] px-3 py-1.5 text-[9px] font-bold text-[#8A744B]"><Filter size={11}/>{activeConditions.length} active conditions</span></div>
        <div className="space-y-6 p-5 sm:p-7">
          <div className="grid gap-4 lg:grid-cols-2"><label><span className="mb-2 block text-[10px] font-bold uppercase tracking-[1px] text-[#718176]">Dataset</span><Select value={datasetId} onChange={v => { setDatasetId(v); setRows([]); setPagination(null); setHasSearched(false); }}><option value="">{loadingDatasets ? "Loading datasets..." : "Select a dataset"}</option>{datasets.map(d => <option key={d.id} value={d.id}>{d.name} · {Number(d.totalRecords).toLocaleString()} records</option>)}</Select></label><label><span className="mb-2 block text-[10px] font-bold uppercase tracking-[1px] text-[#718176]">Global search</span><div className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA69C]"/><input value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void runSearch(1); }} placeholder="Search across all searchable fields..." className="h-10 w-full rounded-xl border border-[#E4E8E0] bg-[#FCFCFA] pl-10 pr-3 text-[11px] outline-none focus:border-[#7DA18A] focus:ring-4 focus:ring-[#26745A]/[0.07]"/></div></label></div>
          <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-xs font-bold text-[#344A3B]">Field conditions</h3><p className="mt-1 text-[10px] text-[#929B94]">Every condition must match (AND logic).</p></div><button type="button" onClick={() => { if (conditions.length >= 10) { toast.error("Condition limit reached", { description: "You can combine up to 10 conditions." }); return; } setConditions(v => [...v, makeCondition(crypto.randomUUID())]); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#DCE6DB] bg-[#F5F8F3] px-3 text-[10px] font-bold text-[#286347] hover:bg-[#EAF1E9]"><Plus size={13}/>Add condition</button></div>
            {!conditions.length ? <div className="rounded-2xl border border-dashed border-[#DDE4D9] bg-[#FBFCF9] px-4 py-7 text-center"><Filter size={19} className="mx-auto text-[#A3B0A5]"/><p className="mt-2 text-[11px] font-semibold text-[#53685A]">No field conditions yet</p><p className="mt-1 text-[10px] text-[#9AA49B]">Add a condition to target a specific field.</p></div> : <div className="space-y-3">{conditions.map((c, i) => { const kind = fields.find(f => f.value === c.field)?.kind ?? "text"; const allowed = ops.filter(o => kind === "text" ? ["eq", "neq", "contains"].includes(o.value) : o.value !== "contains"); return <div key={c.id} className="rounded-2xl border border-[#E9ECE5] bg-[#FCFCFA] p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[1.2px] text-[#9A8966]">Condition {i + 1}</span><button type="button" onClick={() => setConditions(v => v.filter(x => x.id !== c.id))} aria-label={`Remove condition ${i + 1}`} className="rounded-lg p-1.5 text-[#A0AAA1] hover:bg-[#FBF0ED] hover:text-[#A64F43]"><Trash2 size={14}/></button></div><div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.3fr]"><label><span className="mb-1.5 block text-[9px] font-semibold text-[#829087]">Field</span><Select value={c.field} onChange={v => updateCondition(c.id, { field: v })}>{fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></label><label><span className="mb-1.5 block text-[9px] font-semibold text-[#829087]">Operator</span><Select value={c.operator} onChange={v => updateCondition(c.id, { operator: v as Operator })}>{allowed.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></label><div><span className="mb-1.5 block text-[9px] font-semibold text-[#829087]">{c.operator === "between" ? "Range" : "Value"}</span><div className={c.operator === "between" ? "grid grid-cols-2 gap-2" : ""}><input type={kind === "number" ? "number" : kind === "date" ? "date" : "text"} step={kind === "number" ? "any" : undefined} value={c.value} onChange={e => updateCondition(c.id, { value: e.target.value })} placeholder={c.operator === "between" ? "From" : kind === "number" ? "Enter number" : "Enter value"} className="h-10 w-full rounded-xl border border-[#E1E7DE] bg-white px-3 text-[11px] font-medium text-[#40594A] shadow-[0_1px_2px_rgba(20,47,40,0.035)] outline-none transition placeholder:font-normal placeholder:text-[#A0AAA2] hover:border-[#B9CDBB] focus:border-[#7DA18A] focus:ring-4 focus:ring-[#26745A]/[0.08]"/>{c.operator === "between" && <input type={kind === "number" ? "number" : kind === "date" ? "date" : "text"} step={kind === "number" ? "any" : undefined} value={c.secondValue} onChange={e => updateCondition(c.id, { secondValue: e.target.value })} placeholder="To" className="h-10 w-full rounded-xl border border-[#E1E7DE] bg-white px-3 text-[11px] font-medium text-[#40594A] shadow-[0_1px_2px_rgba(20,47,40,0.035)] outline-none transition placeholder:font-normal placeholder:text-[#A0AAA2] hover:border-[#B9CDBB] focus:border-[#7DA18A] focus:ring-4 focus:ring-[#26745A]/[0.08]"/>}</div></div></div></div>; })}</div>}
          </div>
          <div className="grid gap-3 border-t border-[#EEF0EA] pt-5 sm:grid-cols-3"><label><span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[1px] text-[#829087]">Sort by</span><Select value={sortBy} onChange={setSortBy}>{fields.filter(f => ["transactionId", "customerName", "product", "amount", "quantity", "status", "region", "orderDate"].includes(f.value)).map(f => <option key={f.value} value={f.value}>{f.label}</option>)}<option value="createdAt">Created date</option></Select></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[1px] text-[#829087]">Direction</span><Select value={sortOrder} onChange={v => setSortOrder(v as "asc" | "desc")}><option value="desc">Descending</option><option value="asc">Ascending</option></Select></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[1px] text-[#829087]">Rows per page</span><Select value={pageSize} onChange={setPageSize}><option value="10">10 rows</option><option value="25">25 rows</option><option value="50">50 rows</option><option value="100">100 rows</option></Select></label></div>
          <div className="flex flex-col-reverse gap-2 border-t border-[#EEF0EA] pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={clearBuilder} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E4E8E0] px-4 text-[10px] font-semibold text-[#718176] hover:bg-[#F7F8F4]"><X size={13}/>Clear all</button><button type="button" onClick={() => void runSearch(1)} disabled={loading || loadingDatasets || !datasetId} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#183B2F] px-6 text-[11px] font-bold text-[#F5E8CA] shadow-sm hover:bg-[#245743] disabled:opacity-60">{loading ? <LoaderCircle size={15} className="animate-spin"/> : <Search size={15}/>}Run search</button></div>
        </div>
      </section>
      <section className="overflow-hidden rounded-[22px] border border-[#E8E7DF] bg-white shadow-[0_4px_20px_rgba(35,55,43,0.035)]"><div className="flex flex-col gap-3 border-b border-[#EFEFE9] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><h2 className="text-sm font-bold">Search results</h2><p className="mt-1 text-[10px] text-[#929B94]">{selectedDataset?.name ?? "Choose a dataset"}{lastRun ? ` · Last run ${lastRun}` : " · Results appear after running a query"}</p></div>{pagination && <span className="rounded-full bg-[#EAF2EB] px-3 py-1.5 text-[9px] font-bold text-[#397052]">{pagination.totalRecords.toLocaleString()} matching records</span>}</div>
        {!hasSearched ? <div className="flex min-h-[240px] flex-col items-center justify-center px-5 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3ED] text-[#64816F]"><Search size={24}/></span><h3 className="mt-4 text-sm font-bold text-[#355343]">Ready when you are</h3><p className="mt-1 max-w-md text-[11px] leading-5 text-[#929D94]">Configure your search conditions and run the query. Results are fetched page-by-page from PostgreSQL.</p></div> : loading ? <div className="flex min-h-[220px] items-center justify-center gap-3 text-xs text-[#718176]"><LoaderCircle size={18} className="animate-spin text-[#26745A]"/>Searching database records...</div> : error ? <div className="flex min-h-[220px] flex-col items-center justify-center text-center"><CircleHelp size={24} className="text-[#B56A54]"/><p className="mt-3 text-xs font-bold text-[#8F4B40]">Search could not be completed</p><p className="mt-1 max-w-lg text-[10px] text-[#929B94]">{error}</p><button type="button" onClick={() => void runSearch(page)} className="mt-4 rounded-xl bg-[#1E6048] px-4 py-2 text-[10px] font-semibold text-white">Try again</button></div> : !rows.length ? <div className="flex min-h-[220px] flex-col items-center justify-center text-center"><Database size={24} className="text-[#A5B0A6]"/><p className="mt-3 text-xs font-bold text-[#53685A]">No matching records</p><p className="mt-1 text-[10px] text-[#9AA49B]">Try broadening your search or adjusting the conditions.</p></div> : <><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-[#F8F8F4]"><tr>{["Record ID", "Customer", "Product", "Category", "Amount", "Status", "Region", "Order date"].map(h => <th key={h} className="whitespace-nowrap px-4 py-3 text-[9px] font-bold uppercase tracking-[1px] text-[#849087]">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#F0F0EA]">{rows.map(row => <tr key={row.id} className="hover:bg-[#FAFBF8]"><td className="px-4 py-3 text-[10px] font-semibold text-[#52685A]">{display(row.data.transactionId ?? row.externalId)}</td><td className="px-4 py-3"><p className="text-[10px] font-semibold text-[#344A3B]">{display(row.data.customerName)}</p><p className="mt-0.5 text-[9px] text-[#9AA49B]">{display(row.data.email)}</p></td><td className="px-4 py-3 text-[10px] text-[#65766A]">{display(row.data.product)}</td><td className="px-4 py-3 text-[10px] text-[#65766A]">{display(row.data.category)}</td><td className="px-4 py-3 text-[10px] font-bold text-[#286347]">৳{display(row.data.amount)}</td><td className="px-4 py-3"><span className="rounded-full bg-[#EAF2EB] px-2 py-1 text-[8px] font-bold text-[#397052]">{display(row.data.status)}</span></td><td className="px-4 py-3 text-[10px] text-[#65766A]">{display(row.data.region)}</td><td className="whitespace-nowrap px-4 py-3 text-[10px] text-[#87948B]">{display(row.data.orderDate)}</td></tr>)}</tbody></table></div><div className="flex flex-col gap-3 border-t border-[#EFEFE9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><p className="text-[10px] text-[#89958B]">Showing <b className="text-[#52685A]">{start.toLocaleString()}–{end.toLocaleString()}</b> of <b className="text-[#52685A]">{(pagination?.totalRecords ?? 0).toLocaleString()}</b> records</p><div className="flex items-center gap-2"><span className="mr-1 text-[9px] text-[#9AA49B]">Page {page} of {pagination?.totalPages ?? 1}</span><button type="button" disabled={!pagination?.hasPreviousPage || loading} onClick={() => void runSearch(page - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E8E0] text-[#607568] hover:bg-[#F5F8F3] disabled:opacity-40"><ChevronLeft size={15}/></button><button type="button" disabled={!pagination?.hasNextPage || loading} onClick={() => void runSearch(page + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E8E0] text-[#607568] hover:bg-[#F5F8F3] disabled:opacity-40"><ChevronRight size={15}/></button></div></div></>}
      </section>
      <footer className="flex flex-col justify-between gap-2 pb-3 text-[10px] text-[#98A198] sm:flex-row"><p>© 2026 DataScope. Data Intelligence Platform.</p><div className="flex items-center gap-2"><Clock3 size={12}/><span>PostgreSQL · Server-side filtering · Offset pagination</span></div></footer>
    </div>
  </main></>;
}
