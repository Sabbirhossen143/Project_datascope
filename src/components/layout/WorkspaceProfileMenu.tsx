"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings2, ShieldCheck, UserRound, Users } from "lucide-react";
import { toast } from "sonner";

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
};

export default function WorkspaceProfileMenu() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [open, setOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Authentication required");
        return response.json();
      })
      .then((result) => {
        const current = result.user ?? result;
        if (active && current?.id && current?.role) setUser(current);
      })
      .catch(() => {
        if (active) router.replace("/login");
      });
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      toast.success("Signed out", {
        description: "Your DataScope session has ended.",
        duration: 2200,
      });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error("Logout failed", {
        description: error instanceof Error ? error.message : "Please try again.",
        duration: 3500,
      });
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-[#E7E6DE] bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm transition hover:border-[#C7B27F]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D7B77A]/50 bg-[#E9D9B8] text-xs font-bold text-[#604A25]">
          {user?.name?.charAt(0).toUpperCase() ?? "U"}
        </span>
        <span className="hidden max-w-[110px] truncate text-[11px] font-semibold text-[#40584A] sm:block">
          {user?.name ?? "Account"}
        </span>
        <ChevronDown size={14} className={`text-[#7C8B80] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[290px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E7E6DE] bg-white p-2 shadow-2xl shadow-[#142F28]/15">
            <div className="rounded-xl bg-[#F6F6F0] px-3.5 py-3.5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D7B77A]/50 bg-[#E9D9B8] text-sm font-bold text-[#604A25]">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[#263B32]">{user?.name ?? "Loading user..."}</p>
                  <p className="mt-1 truncate text-[10px] text-[#829087]">{user?.email ?? ""}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#E7F0E7] px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#286347]">
                    <ShieldCheck size={11} /> {user?.role ?? "USER"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setOpen(false); router.push("/profile"); }}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[#53685A] transition hover:bg-[#F4F6F1]"
            >
              <UserRound size={15} className="text-[#718579]" />
              My Profile
            </button>

            <div className="px-3 pb-1 pt-3">
              <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#9AA59B]">Account &amp; Role</p>
            </div>
            {user?.role === "ADMIN" && (
              <button
                type="button"
                onClick={() => { setOpen(false); router.push("/admin/users"); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[#53685A] transition hover:bg-[#F4F6F1]"
              >
                <Users size={15} className="text-[#718579]" />
                User Management
                <span className="ml-auto rounded-md bg-[#EAF1E9] px-2 py-1 text-[8px] font-bold text-[#39704E]">ADMIN</span>
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
              type="button"
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
  );
}
