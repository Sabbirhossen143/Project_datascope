"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceProfileMenu from "@/components/layout/WorkspaceProfileMenu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth, setAuthInitialized, setAuthLoading, setAuthUser } from "@/store/slices/authSlice";
import {
  ArrowLeft,
  ChevronDown,
  LoaderCircle,
  Search,
  ShieldCheck,
  Users,
  UserRound,
  Eye,
  ChartNoAxesCombined,
  Check,
} from "lucide-react";
import { toast } from "sonner";

type UserRole = "ADMIN" | "ANALYST" | "VIEWER";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

const roleStyles: Record<UserRole, string> = {
  ADMIN: "bg-[#F5EEDC] text-[#87672D] border-[#E9D9B8]",
  ANALYST: "bg-[#EAF1E9] text-[#286347] border-[#D6E5D5]",
  VIEWER: "bg-[#F0F1ED] text-[#68766D] border-[#E3E5DE]",
};


const roleOptions: {
  value: UserRole;
  label: string;
  description: string;
  icon: typeof ShieldCheck;
  iconClass: string;
}[] = [
  { value: "ADMIN", label: "Administrator", description: "Full workspace control", icon: ShieldCheck, iconClass: "bg-[#F5EEDC] text-[#87672D]" },
  { value: "ANALYST", label: "Data Analyst", description: "Analyze and export data", icon: ChartNoAxesCombined, iconClass: "bg-[#EAF1E9] text-[#286347]" },
  { value: "VIEWER", label: "Viewer", description: "Read-only workspace access", icon: Eye, iconClass: "bg-[#F0F1ED] text-[#68766D]" },
];

function RoleSelect({
  value,
  disabled,
  onChange,
  userName,
}: {
  value: UserRole;
  disabled: boolean;
  onChange: (role: UserRole) => void;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = roleOptions.find((option) => option.value === value)!;
  const SelectedIcon = selected.icon;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        aria-label={`Change role for ${userName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`group flex h-11 w-full items-center gap-2.5 rounded-xl border bg-white px-3 text-left shadow-sm outline-none transition-all duration-200 hover:-translate-y-px hover:shadow-md focus:ring-4 focus:ring-[#26745A]/10 disabled:cursor-wait disabled:opacity-60 ${
          open ? "border-[#6D9B7E] ring-4 ring-[#26745A]/10" : "border-[#E7E8E2] hover:border-[#B8C9BA]"
        }`}
      >
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selected.iconClass}`}>
          <SelectedIcon size={14} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold tracking-wide text-[#344A3B]">{value}</span>
          <span className="block truncate text-[9px] text-[#929B94]">{selected.label}</span>
        </span>
        {disabled ? <LoaderCircle size={14} className="animate-spin text-[#718579]" /> : (
          <ChevronDown size={15} className={`shrink-0 text-[#829087] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={`Available roles for ${userName}`}
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(260px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-[#E6E8DF] bg-white p-1.5 shadow-[0_18px_50px_rgba(20,47,40,0.18)] ring-1 ring-black/[0.03] animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 pb-2 pt-2">
            <p className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#9AA59B]">Assign workspace role</p>
          </div>
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { setOpen(false); if (!active) onChange(option.value); }}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${active ? "bg-[#F4F7F1]" : "hover:bg-[#F8F9F5]"}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${option.iconClass}`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold text-[#344A3B]">{option.label}</span>
                  <span className="mt-0.5 block text-[9px] text-[#929B94]">{option.description}</span>
                </span>
                {active && <Check size={16} className="shrink-0 text-[#26745A]" />}
              </button>
            );
          })}
          <div className="mx-2 my-1 border-t border-[#F0F0EA]" />
          <p className="px-3 py-1.5 text-[8px] leading-4 text-[#A0AAA1]">Changes are saved to the workspace immediately.</p>
        </div>
      )}
    </div>
  );
}

export default function UserManagementPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized, isLoading: authLoading, user: currentUser } =
    useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json();

      if (response.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        return;
      }
      if (response.status === 403) {
        setError("You do not have permission to access User Management.");
        toast.error("Access denied", { description: "You do not have permission to access User Management." });
        return;
      }
      if (!response.ok) {
        throw new Error(result.message || "Unable to load users.");
      }
      setUsers(result.users ?? []);
    } catch (err) {
      const description = err instanceof Error ? err.message : "Something went wrong.";
      setError(description);
      toast.error("Could not load users", { description });
    } finally {
      setLoading(false);
    }
  }, [dispatch, router]);

  // Restore the current session into the shared Redux auth state.
  useEffect(() => {
    let active = true;
    dispatch(setAuthLoading(true));

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Authentication required.");
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

  // Only administrators may load and manage workspace users.
  useEffect(() => {
    if (!isInitialized || authLoading) return;
    if (!isAuthenticated || !currentUser) {
      router.replace("/login");
      return;
    }
    if (currentUser.role !== "ADMIN") {
      setError("You do not have permission to access User Management.");
      setLoading(false);
      return;
    }
    void loadUsers();
  }, [isInitialized, authLoading, isAuthenticated, currentUser, loadUsers, router]);

  async function updateRole(userId: string, role: UserRole) {
    const previousUsers = users;
    setUpdatingId(userId);

    // Optimistic UI update; restore the previous list if the API rejects it.
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, role } : user))
    );

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not update role.");
      }

      setUsers((current) =>
        current.map((user) => (user.id === userId ? result.user : user))
      );
      toast.success("Role updated", {
        description: `${result.user.name} now has the ${result.user.role} role.`,
        duration: 3000,
      });
    } catch (err) {
      setUsers(previousUsers);
      const description = err instanceof Error ? err.message : "Could not update role.";
      toast.error("Role update failed", { description, duration: 4000 });
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleStatus(user: ManagedUser) {
    setUpdatingId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not update account status.");

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? result.user : item))
      );
      toast.success("Account status updated", {
        description: `${user.name}'s account is now ${result.user.isActive ? "active" : "inactive"}.`,
        duration: 2800,
      });
    } catch (err) {
      const description = err instanceof Error ? err.message : "Could not update account status.";
      toast.error("Status update failed", { description, duration: 4000 });
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.email, user.role].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [users, search]);

  const counts = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === "ADMIN").length,
      analysts: users.filter((user) => user.role === "ANALYST").length,
      viewers: users.filter((user) => user.role === "VIEWER").length,
    }),
    [users]
  );

  return (
    <>
      <WorkspaceSidebar />
      <main className="min-h-screen bg-[#F5F4EF] text-[#263B32] lg:ml-[270px]">
      <header className="sticky top-0 z-20 border-b border-[#E7E6DE] bg-[#F9F8F4]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between pl-16 pr-4 sm:pl-16 sm:pr-7 lg:px-10">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[#87948B]">WORKSPACE / ADMINISTRATION</p>
            <p className="mt-1 text-sm font-bold text-[#263B32]">User Management</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/overview")}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E4E6DE] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#53685A] transition hover:border-[#B8C9BA] hover:bg-[#F8FAF6]"
            >
              <ArrowLeft size={15} /> <span className="hidden sm:inline">Overview</span><span className="sm:hidden">Back</span>
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
              <span className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#62796B]">Admin control center</span>
            </div>
            <h1 className="text-[28px] font-bold tracking-[-1px] text-[#1D352A] sm:text-[36px]">
              User Management<span className="text-[#B99455]">.</span>
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-6 text-[#78867D]">
              Manage workspace access, account status and user roles from one place.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E6E5DC] bg-white px-4 py-3 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#89958B]">Workspace access</p>
            <p className="mt-1 text-sm font-bold text-[#286347]">Administrator only</p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total users", value: counts.total, hint: "Registered accounts" },
            { label: "Administrators", value: counts.admins, hint: "Full access" },
            { label: "Analysts", value: counts.analysts, hint: "Analysis access" },
            { label: "Viewers", value: counts.viewers, hint: "Read-only access" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#E8E7DF] bg-white p-4 shadow-[0_3px_16px_rgba(35,55,43,0.025)] sm:p-5">
              <p className="text-[10px] font-semibold text-[#7D8980]">{item.label}</p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-[#243A2E]">{item.value}</p>
              <p className="mt-1 text-[9px] text-[#929B94]">{item.hint}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-[22px] border border-[#E8E7DF] bg-white shadow-[0_4px_20px_rgba(35,55,43,0.035)]">
          <div className="flex flex-col gap-4 border-b border-[#EFEFE9] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <h2 className="text-sm font-bold text-[#243A2E]">Workspace members</h2>
              <p className="mt-1 text-[10px] text-[#8B968E]">Assign a role and control account access.</p>
            </div>
            <div className="relative w-full sm:max-w-[300px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89978D]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email or role..."
                className="h-10 w-full rounded-xl border border-[#E7E8E2] bg-[#FAFAF7] pl-10 pr-3 text-xs outline-none transition placeholder:text-[#A1AAA2] focus:border-[#6D9B7E] focus:bg-white focus:ring-4 focus:ring-[#26745A]/[0.07]"
              />
            </div>
          </div>

          {loading || authLoading || !isInitialized ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-xs font-medium text-[#718176]">
              <LoaderCircle size={19} className="animate-spin text-[#26745A]" /> Loading workspace users...
            </div>
          ) : error ? (
            <div className="flex min-h-52 items-center justify-center">
              <button
                onClick={() => void loadUsers()}
                className="rounded-xl border border-[#DCE6DB] bg-[#F5F8F3] px-4 py-2.5 text-[11px] font-semibold text-[#286347] transition hover:bg-[#EAF1E9]"
              >
                Retry loading users
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <UserRound size={26} className="mx-auto text-[#A5B0A6]" />
              <p className="mt-3 text-sm font-semibold text-[#53685A]">No users found</p>
              <p className="mt-1 text-[10px] text-[#9AA49B]">Try a different search term.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-[#F8F8F4]">
                    <tr>
                      {["User", "Role", "Account status", "Joined"].map((heading) => (
                        <th key={heading} className="px-6 py-4 text-[9px] font-bold uppercase tracking-[1.1px] text-[#849087]">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0EA]">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-[#F8FAF6]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D7B77A]/40 bg-[#F3EBD9] text-xs font-bold text-[#725A2D]">{user.name.charAt(0).toUpperCase()}</span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-[#344A3B]">{user.name}</p>
                              <p className="mt-1 truncate text-[10px] text-[#9AA49B]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-[190px]">
                            <RoleSelect value={user.role} disabled={updatingId === user.id} userName={user.name} onChange={(role) => updateRole(user.id, role)} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            disabled={updatingId === user.id}
                            onClick={() => toggleStatus(user)}
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[9px] font-bold transition disabled:opacity-50 ${user.isActive ? "bg-[#EAF3E9] text-[#39704E] hover:bg-[#F8E9E6] hover:text-[#AC5144]" : "bg-[#F8E9E6] text-[#AC5144] hover:bg-[#EAF3E9] hover:text-[#39704E]"}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-[#39845A]" : "bg-[#AC5144]"}`} />
                            {user.isActive ? "ACTIVE" : "INACTIVE"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-[#87948B]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {filteredUsers.map((user) => (
                  <article key={user.id} className="rounded-2xl border border-[#ECEDE6] p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EBD9] text-sm font-bold text-[#725A2D]">{user.name.charAt(0).toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#344A3B]">{user.name}</p>
                        <p className="mt-1 break-all text-[10px] text-[#9AA49B]">{user.email}</p>
                        <p className="mt-2 text-[9px] text-[#87948B]">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[8px] font-bold ${roleStyles[user.role]}`}>{user.role}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <RoleSelect value={user.role} disabled={updatingId === user.id} userName={user.name} onChange={(role) => updateRole(user.id, role)} />
                      <button
                        disabled={updatingId === user.id}
                        onClick={() => toggleStatus(user)}
                        className={`h-10 rounded-lg px-2 text-[9px] font-bold disabled:opacity-50 ${user.isActive ? "bg-[#EAF3E9] text-[#39704E]" : "bg-[#F8E9E6] text-[#AC5144]"}`}
                      >
                        {user.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
            )}

          <div className="flex flex-col justify-between gap-2 border-t border-[#EFEFE9] bg-[#FCFCF9] px-5 py-4 text-[9px] text-[#98A198] sm:flex-row sm:items-center sm:px-7">
            <span>Showing {filteredUsers.length} of {users.length} users</span>
            <span>Role changes are saved immediately.</span>
          </div>
        </section>
      </div>
      </main>
    </>
  );
}
