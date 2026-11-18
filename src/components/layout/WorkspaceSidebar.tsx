"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  ChartNoAxesCombined,
  Database,
  LayoutDashboard,
  Menu,
  Settings2,
  Sparkles,
  Users,
  X,
  Search,
  FolderKanban,
} from "lucide-react";

type WorkspaceUser = { name: string; role: "ADMIN" | "ANALYST" | "VIEWER" };

const navigation = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Data Explorer", href: "/explorer", icon: Database },
  { label: "Dataset Library", href: "/datasets", icon: FolderKanban },
  { label: "Advanced Search", href: "/advanced-search", icon: Search },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { label: "Saved Views", href: "/saved-views", icon: Bookmark },
];

function WorkspaceSidebarContent() {
  // usePathname is intentionally inside this component, which is rendered under Suspense below.
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<WorkspaceUser | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result) => {
        const account = result?.user ?? result;
        if (active && account?.name && account?.role) {
          setUser({ name: account.name, role: account.role });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const items =
    user?.role === "ADMIN"
      ? [...navigation, { label: "User Management", href: "/admin/users", icon: Users }]
      : navigation;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[60] bg-[#10271F]/55 backdrop-blur-sm lg:hidden"
        />
      )}

      <button
        type="button"
        aria-label="Open workspace navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[55] flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E8DF] bg-white text-[#365347] shadow-md lg:hidden"
      >
        <Menu size={19} />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-[270px] flex-col bg-[#142F28] text-white shadow-2xl shadow-black/10 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-[82px] items-center justify-between border-b border-white/10 px-6">
          <button type="button" onClick={() => router.push("/")} className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D7B77A] text-[#142F28]">
              <Database size={21} strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-[19px] font-bold tracking-tight">DataScope</span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[2.3px] text-[#A8C1B2]">
                Intelligence Platform
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-8">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[2px] text-[#89A698]">Workspace</p>
          <nav className="space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    router.push(item.href);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-[13px] font-medium transition ${
                    active
                      ? "bg-[#D7B77A] text-[#142F28] shadow-lg shadow-black/10"
                      : "text-[#B7C9BF] hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.9} />
                  <span>{item.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#142F28]" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mx-5 mt-9 rounded-2xl border border-white/10 bg-white/[0.055] p-4">
          <div className="flex items-center gap-2 text-[#D7B77A]">
            <Sparkles size={16} />
            <span className="text-xs font-semibold">Workspace Insight</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#B7C9BF]">
            Your transaction dataset is connected and ready to explore.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full rounded-full bg-[#D7B77A]" />
          </div>
          <p className="mt-2 text-[10px] text-[#89A698]">Database connection established</p>
        </div>

        <div className="mt-auto border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#B7C9BF] transition hover:bg-white/8"
          >
            <Settings2 size={18} /> Profile &amp; settings
          </button>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.07] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D7B77A]/40 bg-[#D7B77A]/15 text-sm font-bold text-[#E7CE9D]">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user?.name ?? "Loading user..."}</p>
              <p className="mt-1 text-[10px] text-[#9BB2A5]">{user?.role ?? "—"} workspace</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#85BC8E]" />
          </div>
        </div>
      </aside>
    </>
  );
}

export default function WorkspaceSidebar() {
  return (
    <Suspense fallback={null}>
      <WorkspaceSidebarContent />
    </Suspense>
  );
}
