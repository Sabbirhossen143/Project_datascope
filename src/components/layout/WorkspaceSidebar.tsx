
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
  Activity,
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
          setUser({
            name: account.name,
            role: account.role,
          });
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
      ? [
          ...navigation,
          {
            label: "Activity Logs",
            href: "/admin/activity-logs",
            icon: Activity,
          },
          {
            label: "User Management",
            href: "/admin/users",
            icon: Users,
          },
        ]
      : navigation;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[60] bg-[#10271F]/55 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Mobile Menu Button */}
      <button
        type="button"
        aria-label="Open workspace navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[55] flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E8DF] bg-white text-[#365347] shadow-md lg:hidden"
      >
        <Menu size={19} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex h-dvh w-[260px] flex-col overflow-hidden bg-[#142F28] text-white shadow-2xl shadow-black/10 transition-transform duration-300 lg:w-[250px] ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D7B77A] text-[#142F28]">
              <Database size={20} strokeWidth={2.2} />
            </span>

            <span>
              <span className="block text-[18px] font-bold tracking-tight">
                DataScope
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[2px] text-[#A8C1B2]">
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
            <X size={19} />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-5 pb-3">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[2px] text-[#89A698]">
            Workspace
          </p>

          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    router.push(item.href);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-[#D7B77A] text-[#142F28] shadow-md shadow-black/10"
                      : "text-[#B7C9BF] hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon size={17} strokeWidth={1.9} />

                  <span className="flex-1 truncate">{item.label}</span>

                  {active && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#142F28]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Workspace Insight */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.055] p-3.5">
            <div className="flex items-center gap-2 text-[#D7B77A]">
              <Sparkles size={15} />
              <span className="text-xs font-semibold">
                Workspace Insight
              </span>
            </div>

            <p className="mt-2 text-[11px] leading-4 text-[#B7C9BF]">
              Your transaction dataset is connected and ready to explore.
            </p>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full rounded-full bg-[#D7B77A]" />
            </div>

            <p className="mt-2 text-[9px] text-[#89A698]">
              Database connection established
            </p>
          </div>
        </div>

        {/* Fixed Bottom Section */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#B7C9BF] transition hover:bg-white/8 hover:text-white"
          >
            <Settings2 size={17} />
            Profile &amp; settings
          </button>

          <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/[0.07] p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D7B77A]/40 bg-[#D7B77A]/15 text-sm font-bold text-[#E7CE9D]">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name ?? "Loading user..."}
              </p>

              <p className="mt-1 truncate text-[10px] text-[#9BB2A5]">
                {user?.role ?? "—"} workspace
              </p>
            </div>

            <span className="h-2 w-2 shrink-0 rounded-full bg-[#85BC8E]" />
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
