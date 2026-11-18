"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowUpRight, CalendarDays, Check, ChevronDown, Database, FileSpreadsheet,
  Filter, FolderOpen, Layers3, LoaderCircle, MoreHorizontal, Pencil, Plus,
  RefreshCw, Search, ShieldCheck, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceProfileMenu from "@/components/layout/WorkspaceProfileMenu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth, setAuthInitialized, setAuthLoading, setAuthUser } from "@/store/slices/authSlice";
import {
  setDatasets,
  setDatasetsError,
  setDatasetsLoading,
  setActiveDataset,
} from "@/store/slices/datasetSlice";

type Dataset = {
  id: string; name: string; slug: string; description: string | null;
  category: string | null; dataSource: string | null; totalRecords: number;
  createdAt: string; updatedAt: string;
};
type DatasetForm = { name: string; description: string; category: string; dataSource: string };
const emptyForm: DatasetForm = { name: "", description: "", category: "Transactions", dataSource: "Generated Dataset" };
const categories = ["all", "Transactions", "Customers", "Finance", "Operations", "Marketing", "General"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value));
}
function initials(value: string) {
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function PremiumSelect({
  value,
  options,
  onChange,
  icon: Icon,
  width = "w-full",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: React.ComponentType<{ size?: number }>;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];
  return (
    <div className={`relative ${width}`}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-[#E4E8E0] bg-white px-3 text-left text-xs font-semibold text-[#40594A] shadow-[0_2px_8px_rgba(20,47,40,0.035)] transition hover:border-[#B8CBB9] focus:outline-none focus:ring-4 focus:ring-[#26745A]/10">
        <span className="flex min-w-0 items-center gap-2.5">
          {Icon && <Icon size={14} />}
          <span className="truncate">{selected?.label ?? "Select option"}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-[#829087] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <>
        <button type="button" aria-label="Close options" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
        <div role="listbox" className="absolute right-0 top-[calc(100%+7px)] z-40 max-h-64 w-full min-w-[190px] overflow-y-auto rounded-2xl border border-[#E4E8E0] bg-white p-1.5 shadow-[0_18px_45px_rgba(20,47,40,0.16)]">
          {options.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={option.value === value}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] transition ${option.value === value ? "bg-[#EDF4EC] font-bold text-[#24583E]" : "text-[#5F7064] hover:bg-[#F6F8F4]"}`}>
              <span>{option.label}</span>
              {option.value === value && <Check size={13} className="text-[#26745A]" />}
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}

export default function DatasetLibraryClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const datasets = useAppSelector((state) => state.datasets.items) as Dataset[];
  const loading = useAppSelector((state) => state.datasets.isLoading);
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);
  const role = user?.role ?? null;
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dataset | null>(null);
  const [form, setForm] = useState<DatasetForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Dataset | null>(null);

  const loadDatasets = useCallback(async (quiet = false) => {
    if (!isInitialized || !isAuthenticated) return;
    if (quiet) setRefreshing(true);
    else dispatch(setDatasetsLoading(true));
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category !== "all") params.set("category", category);
      const response = await fetch(`/api/datasets?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(result.message ?? "Unable to load datasets.");
      dispatch(setDatasets((result.data ?? []) as Dataset[]));
      dispatch(setDatasetsError(null));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      dispatch(setDatasetsError(message));
      toast.error("Dataset library unavailable", { description: message });
    } finally {
      dispatch(setDatasetsLoading(false));
      setRefreshing(false);
    }
  }, [dispatch, search, category, isInitialized, isAuthenticated, router]);

  useEffect(() => {
    let active = true;
    dispatch(setAuthLoading(true));
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message ?? "Authentication required");
        return result;
      })
      .then((result) => {
        if (!active) return;
        dispatch(setAuthUser(result.user ?? result));
      })
      .catch(() => {
        if (!active) return;
        dispatch(clearAuth());
        router.replace("/login");
      })
      .finally(() => {
        if (active) {
          dispatch(setAuthLoading(false));
          dispatch(setAuthInitialized(true));
        }
      });
    return () => { active = false; };
  }, [dispatch, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    const timer = window.setTimeout(() => void loadDatasets(), 250);
    return () => window.clearTimeout(timer);
  }, [loadDatasets, isInitialized, isAuthenticated]);

  const totalRecords = useMemo(() => datasets.reduce((sum, item) => sum + Number(item.totalRecords || 0), 0), [datasets]);
  const categoriesCount = useMemo(() => new Set(datasets.map((item) => item.category).filter(Boolean)).size, [datasets]);

  function openCreate() { setEditing(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(item: Dataset) {
    setEditing(item);
    setForm({ name: item.name, description: item.description ?? "", category: item.category ?? "General", dataSource: item.dataSource ?? "Manual" });
    setMenuId(null);
    setModalOpen(true);
  }

  async function saveDataset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/datasets/${editing.id}` : "/api/datasets", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (response.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(result.message ?? "Unable to save dataset.");
      toast.success(editing ? "Changes saved successfully" : "Dataset created successfully", { description: result.message || (editing ? `${form.name} has been updated.` : `${form.name} is now in your dataset library.`), duration: 3200 });
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
      await loadDatasets(true);
    } catch (error) {
      toast.error("Save failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally { setSaving(false); }
  }

  async function deleteDataset(item: Dataset) {
    setDeletingId(item.id);
    setMenuId(null);
    try {
      const response = await fetch(`/api/datasets/${item.id}`, { method: "DELETE" });
      const result = await response.json();
      if (response.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(result.message ?? "Unable to delete dataset.");
      toast.success("Dataset deleted successfully", { description: `${item.name} and its associated data have been removed.`, duration: 3200 });
      setDeleteTarget(null);
      await loadDatasets(true);
    } catch (error) {
      toast.error("Delete failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally { setDeletingId(null); }
  }

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F4EF] text-xs font-semibold text-[#718176]">
        <LoaderCircle size={18} className="mr-2 animate-spin text-[#26745A]" />
        Restoring your DataScope session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#263B32]">
      <WorkspaceSidebar />
      <main className="min-h-screen bg-[#F5F4EF] text-[#263B32] lg:ml-[270px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E7E6DE] bg-[#F9F8F4]/95 pl-16 pr-4 backdrop-blur-xl sm:pl-16 sm:pr-7 lg:px-10">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[#87948B]">WORKSPACE / DATA MANAGEMENT</p>
            <p className="mt-1 text-sm font-bold text-[#263B32]">Dataset Library</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => loadDatasets(true)} disabled={refreshing} aria-label="Refresh datasets" title="Refresh datasets" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E6048] text-white shadow-sm transition hover:bg-[#174B38] disabled:opacity-60">
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/>
            </button>
            <WorkspaceProfileMenu />
          </div>
        </header>
        <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-7 sm:px-7 lg:px-10 lg:pt-9">

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E7E8E1] bg-white p-4 shadow-[0_4px_18px_rgba(20,47,40,0.025)]">
              <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#849087]">Accessible datasets</span><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF2EB] text-[#26745A]"><Database size={16}/></span></div>
              <p className="mt-3 text-[25px] font-bold tracking-tight text-[#18372D]">{loading ? "—" : datasets.length}</p><p className="mt-1 text-[10px] text-[#9AA49B]">Collections available to your role</p>
            </div>
            <div className="rounded-2xl border border-[#E7E8E1] bg-white p-4 shadow-[0_4px_18px_rgba(20,47,40,0.025)]">
              <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#849087]">Total records</span><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F4EFE3] text-[#A17C3D]"><FileSpreadsheet size={16}/></span></div>
              <p className="mt-3 text-[25px] font-bold tracking-tight text-[#18372D]">{loading ? "—" : totalRecords.toLocaleString()}</p><p className="mt-1 text-[10px] text-[#9AA49B]">Across accessible collections</p>
            </div>
            <div className="rounded-2xl border border-[#E7E8E1] bg-white p-4 shadow-[0_4px_18px_rgba(20,47,40,0.025)]">
              <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#849087]">Data categories</span><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0EFF7] text-[#7770A3]"><Layers3 size={16}/></span></div>
              <p className="mt-3 text-[25px] font-bold tracking-tight text-[#18372D]">{loading ? "—" : categoriesCount}</p><p className="mt-1 text-[10px] text-[#9AA49B]">Distinct dataset categories</p>
            </div>
          </section>

          <section className="mt-7 rounded-2xl border border-[#E7E8E1] bg-white p-4 shadow-[0_4px_18px_rgba(20,47,40,0.025)] sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div><h2 className="text-[14px] font-bold text-[#294638]">All datasets</h2><p className="mt-1 text-[11px] text-[#929D94]">Browse collections and open a dataset in the explorer.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 sm:w-[260px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA69C]"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search datasets..." className="h-10 w-full rounded-xl border border-[#E7E9E2] bg-[#FCFCFA] pl-9 pr-3 text-xs text-[#30483B] outline-none focus:border-[#8BAA96] focus:ring-4 focus:ring-[#26745A]/[0.07]"/></label>
                <div className="sm:w-[190px]"><PremiumSelect value={category} icon={Filter} onChange={setCategory} options={categories.map((item) => ({ value: item, label: item === "all" ? "All categories" : item }))} /></div>
                {role === "ADMIN" && <button type="button" onClick={openCreate} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#183B2F] px-4 text-xs font-bold text-[#F5E8CA] shadow-sm transition hover:bg-[#245743]"><Plus size={15}/>New dataset</button>}
              </div>
            </div>

            {loading ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((n) => <div key={n} className="h-[190px] animate-pulse rounded-2xl border border-[#ECEDE7] bg-[#FAFAF7]"/> )}</div>
            ) : datasets.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3ED] text-[#64816F]"><FolderOpen size={25}/></span>
                <h3 className="mt-4 text-sm font-bold text-[#355343]">No datasets found</h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-[#929D94]">{search || category !== "all" ? "Try changing your search or category filter." : "There are no datasets available for your account yet."}</p>
                {role === "ADMIN" && !search && category === "all" && <button type="button" onClick={openCreate} className="mt-4 rounded-xl bg-[#183B2F] px-4 py-2.5 text-xs font-semibold text-[#F5E8CA]">Create your first dataset</button>}
              </div>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {datasets.map((item) => (
                  <article key={item.id} className="group relative rounded-2xl border border-[#E8EAE3] bg-[#FFFEFC] p-4 transition hover:-translate-y-0.5 hover:border-[#C9D6C9] hover:shadow-[0_12px_28px_rgba(20,47,40,0.07)] sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7E4D9] bg-[#F6F2E8] text-[#8A744B]"><Database size={18}/></div>
                      {role === "ADMIN" && <div className="relative"><button type="button" aria-label={`Actions for ${item.name}`} onClick={() => setMenuId(menuId === item.id ? null : item.id)} className="rounded-lg p-2 text-[#89968B] hover:bg-[#F1F3EE]"><MoreHorizontal size={17}/></button>{menuId === item.id && <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-[#E5E8E0] bg-white p-1.5 shadow-xl"><button type="button" onClick={() => openEdit(item)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-[#53685A] hover:bg-[#F4F6F1]"><Pencil size={13}/>Edit details</button><button type="button" disabled={deletingId === item.id} onClick={() => { setDeleteTarget(item); setMenuId(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-[#A64F43] hover:bg-[#FBF0ED]"><Trash2 size={13}/>{deletingId === item.id ? "Deleting..." : "Delete dataset"}</button></div>}</div>}
                    </div>
                    <div className="mt-4 flex items-center gap-2"><span className="rounded-full bg-[#EAF2EB] px-2.5 py-1 text-[9px] font-bold text-[#397052]">{item.category || "Uncategorized"}</span><span className="text-[9px] text-[#A0AAA1]">•</span><span className="truncate text-[9px] text-[#929D94]">{item.dataSource || "Unknown source"}</span></div>
                    <h3 className="mt-3 line-clamp-1 text-[14px] font-bold text-[#294638]">{item.name}</h3>
                    <p className="mt-1.5 line-clamp-2 min-h-[34px] text-[11px] leading-[1.6] text-[#89968C]">{item.description || "No description has been added for this dataset."}</p>
                    <div className="mt-4 flex items-end justify-between border-t border-[#EEF0EA] pt-3">
                      <div><p className="text-[18px] font-bold tracking-tight text-[#244B38]">{Number(item.totalRecords).toLocaleString()}</p><p className="text-[9px] text-[#9AA49B]">Records</p></div>
                      <div className="text-right"><p className="flex items-center justify-end gap-1 text-[9px] text-[#89968C]"><CalendarDays size={11}/>{formatDate(item.updatedAt)}</p><button type="button" onClick={() => { dispatch(setActiveDataset(item.id)); router.push(`/?datasetId=${encodeURIComponent(item.id)}`); }} disabled={Number(item.totalRecords) === 0} className="mt-2 flex items-center gap-1 rounded-lg border border-[#DDE6DC] bg-[#F6F9F4] px-2.5 py-1.5 text-[10px] font-bold text-[#397052] hover:bg-[#EAF2EB] disabled:cursor-not-allowed disabled:opacity-40">Open Explorer <ArrowUpRight size={12}/></button></div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <p className="mt-5 flex items-center gap-2 text-[10px] text-[#9AA49B]"><ShieldCheck size={13}/> Dataset visibility is controlled by server-side access permissions.</p>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10271F]/45 p-4 backdrop-blur-[3px]" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <form onSubmit={saveDataset} className="w-full max-w-[520px] rounded-[22px] border border-[#E5E8E0] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between"><div><span className="text-[9px] font-bold uppercase tracking-[1.7px] text-[#9A8966]">{editing ? "Dataset settings" : "New collection"}</span><h2 className="mt-1 text-[20px] font-bold text-[#1D3C30]">{editing ? "Edit dataset" : "Create dataset"}</h2><p className="mt-1 text-[11px] text-[#8C988F]">Define the collection metadata and source.</p></div><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-[#829087] hover:bg-[#F2F4EF]"><X size={17}/></button></div>
            <div className="mt-6 space-y-4">
              <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[#5A6D60]">Dataset name <span className="text-[#B56A54]">*</span></span><input required minLength={2} maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Customer Transactions" className="h-11 w-full rounded-xl border border-[#E4E8E0] px-3 text-xs outline-none focus:border-[#86A58E] focus:ring-4 focus:ring-[#26745A]/10"/></label>
              <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[#5A6D60]">Description</span><textarea rows={3} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this dataset contain?" className="w-full resize-none rounded-xl border border-[#E4E8E0] px-3 py-2.5 text-xs outline-none focus:border-[#86A58E] focus:ring-4 focus:ring-[#26745A]/10"/></label>
              <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[#5A6D60]">Category</span><PremiumSelect value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={categories.slice(1).map((item) => ({ value: item, label: item }))}/></label><label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[#5A6D60]">Data source</span><input maxLength={150} value={form.dataSource} onChange={(e) => setForm({ ...form, dataSource: e.target.value })} placeholder="Generated Dataset" className="h-11 w-full rounded-xl border border-[#E4E8E0] px-3 text-xs outline-none focus:border-[#86A58E]"/></label></div>
            </div>
            <div className="mt-7 flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="h-10 rounded-xl border border-[#E4E8E0] px-4 text-xs font-semibold text-[#718075]">Cancel</button><button type="submit" disabled={saving} className="flex h-10 items-center gap-2 rounded-xl bg-[#183B2F] px-5 text-xs font-bold text-[#F5E8CA] disabled:opacity-60">{saving && <LoaderCircle size={14} className="animate-spin"/>}{editing ? "Save changes" : "Create dataset"}</button></div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#10271F]/55 p-4 backdrop-blur-[4px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingId) setDeleteTarget(null); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-dataset-title" aria-describedby="delete-dataset-description" className="w-full max-w-[430px] rounded-[22px] border border-[#E8E5DC] bg-white p-6 shadow-[0_28px_80px_rgba(10,30,22,0.28)] sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF0ED] text-[#B65B4C]"><AlertTriangle size={22}/></div>
            <h2 id="delete-dataset-title" className="mt-5 text-[18px] font-bold tracking-tight text-[#263B32]">Delete this dataset?</h2>
            <p id="delete-dataset-description" className="mt-2 text-[12px] leading-6 text-[#78867D]">
              You are about to permanently delete <strong className="font-bold text-[#40594A]">{deleteTarget.name}</strong>. Its records, saved views and access permissions will also be removed. This action cannot be undone.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={Boolean(deletingId)} onClick={() => setDeleteTarget(null)} className="h-10 rounded-xl border border-[#E3E7DF] px-4 text-xs font-semibold text-[#68796D] transition hover:bg-[#F7F8F5] disabled:opacity-50">Cancel</button>
              <button type="button" disabled={Boolean(deletingId)} onClick={() => void deleteDataset(deleteTarget)} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#A9473D] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#913B33] disabled:cursor-not-allowed disabled:opacity-60">
                {deletingId ? <LoaderCircle size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                {deletingId ? "Deleting dataset..." : "Yes, delete dataset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
