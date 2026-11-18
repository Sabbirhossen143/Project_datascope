"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Check, Loader2, Pencil, ShieldCheck, UserRound, X,
  Mail, LockKeyhole,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuth,
  setAuthInitialized,
  setAuthLoading,
  setAuthUser,
} from "@/store/slices/authSlice";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const loading = useAppSelector((state) => state.auth.isLoading);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      dispatch(setAuthLoading(true));
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message ?? "Not authenticated");
        }

        if (!active) return;
        const account = result?.user ?? result;
        dispatch(setAuthUser(account));
      } catch {
        if (!active) return;
        dispatch(clearAuth());
        router.replace("/login");
      } finally {
        if (active) {
          dispatch(setAuthLoading(false));
          dispatch(setAuthInitialized(true));
        }
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [dispatch, router]);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  function openEditModal() {
    if (!user) return;
    setName(user.name);
    setIsEditOpen(true);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      toast.error("Name must be between 2 and 80 characters.");
      return;
    }

    if (cleanName === user?.name) {
      setIsEditOpen(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: cleanName }),
      });
      const result = await response.json();

      if (response.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success || !result.user) {
        throw new Error(result.message || "Profile update failed.");
      }

      dispatch(setAuthUser(result.user));
      setName(result.user.name);
      setIsEditOpen(false);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !isInitialized || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F4EF]">
        <p className="text-xs font-semibold text-[#718176]">Loading profile...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F4EF] px-4 py-8 text-[#263B32] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => router.push("/")} className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[#53685A] hover:text-[#26745A]">
          <ArrowLeft size={15} /> Back to dashboard
        </button>

        <section className="overflow-hidden rounded-[24px] border border-[#E8E7DF] bg-white shadow-[0_4px_20px_rgba(35,55,43,0.035)]">
          <div className="flex flex-col gap-5 bg-[#183C30] px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D7B77A] text-[#142F28]">
                <UserRound size={23} />
              </div>
              <h1 className="mt-5 text-2xl font-bold">My Profile</h1>
              <p className="mt-2 text-xs text-[#C2D1C7]">Your DataScope account information.</p>
            </div>
            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#D7B77A] px-5 text-xs font-bold text-[#142F28] shadow-sm transition hover:bg-[#E4C991] sm:self-auto"
            >
              <Pencil size={14} /> Update Profile
            </button>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#89958B]">Full name</p>
              <p className="mt-2 text-sm font-semibold text-[#263B32]">{user.name}</p>
            </div>
            <div className="border-t border-[#EFEFE9] pt-5">
              <p className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#89958B]">Email address</p>
              <p className="mt-2 text-sm font-semibold text-[#263B32]">{user.email}</p>
            </div>
            <div className="border-t border-[#EFEFE9] pt-5">
              <p className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#89958B]">Account role</p>
              <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#E7F0E7] px-3 py-1.5 text-[10px] font-bold text-[#286347]">
                <ShieldCheck size={13} /> {user.role}
              </span>
            </div>
          </div>
        </section>
      </div>

      {isEditOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#10251E]/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setIsEditOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-[24px] border border-[#E7E8DF] bg-[#FFFEFC] shadow-[0_24px_90px_rgba(10,30,22,0.25)]"
          >
            <div className="flex items-start justify-between border-b border-[#ECEDE6] bg-[#F8F8F3] px-6 py-5 sm:px-7">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[1.7px] text-[#9A835B]">Account settings</p>
                <h2 id="edit-profile-title" className="mt-1 text-xl font-bold text-[#183C30]">Update Profile</h2>
                <p className="mt-1 text-xs text-[#829087]">Edit your personal account information.</p>
              </div>
              <button
                type="button"
                aria-label="Close update profile"
                disabled={saving}
                onClick={() => setIsEditOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E8E0] bg-white text-[#718176] transition hover:bg-[#F0F3ED] disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5 px-6 py-6 sm:px-7">
              <div>
                <label htmlFor="profile-name" className="mb-2 block text-xs font-semibold text-[#344C40]">Full name</label>
                <div className="relative">
                  <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89978D]" />
                  <input
                    id="profile-name"
                    autoFocus
                    required
                    minLength={2}
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    className="h-12 w-full rounded-xl border border-[#DDE5DB] bg-white pl-10 pr-4 text-sm text-[#203B30] outline-none transition placeholder:text-[#A1ACA4] focus:border-[#26745A] focus:ring-4 focus:ring-[#26745A]/10"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-[#98A39B]">Your name must contain 2–80 characters.</p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#344C40]">Email address</label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-[#E7EAE4] bg-[#F6F7F3] px-3.5">
                  <Mail size={16} className="text-[#89978D]" />
                  <span className="min-w-0 flex-1 truncate text-sm text-[#78877D]">{user.email}</span>
                  <LockKeyhole size={14} className="text-[#A2ACA4]" />
                </div>
                <p className="mt-1.5 text-[10px] text-[#98A39B]">Email address cannot be changed here.</p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#344C40]">Account role</label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-[#E7EAE4] bg-[#F6F7F3] px-3.5">
                  <ShieldCheck size={16} className="text-[#548064]" />
                  <span className="text-sm font-semibold text-[#607467]">{user.role}</span>
                  <LockKeyhole size={14} className="ml-auto text-[#A2ACA4]" />
                </div>
                <p className="mt-1.5 text-[10px] text-[#98A39B]">Role is managed by an administrator.</p>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#ECEDE6] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsEditOpen(false)}
                  className="h-11 rounded-xl border border-[#DDE5DB] bg-white px-5 text-xs font-semibold text-[#617367] transition hover:bg-[#F5F7F2] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || name.trim().length < 2}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#183C30] px-6 text-xs font-bold text-white shadow-sm transition hover:bg-[#26745A] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> Save Changes</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
