"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { setAuthUser } from "@/store/slices/authSlice";
import {
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(
            isRegister
              ? { name, email, password }
              : { email, password }
          ),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
      }

      // Read the authenticated user from the server session; do not trust a client-supplied role.
      const sessionResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const sessionResult = await sessionResponse.json();
      if (!sessionResponse.ok) {
        throw new Error(sessionResult.message || "Unable to load your account session.");
      }

      const user = sessionResult.user ?? sessionResult;
      if (
        !user?.id ||
        !user?.name ||
        !user?.email ||
        !["ADMIN", "ANALYST", "VIEWER"].includes(user?.role)
      ) {
        throw new Error("The server returned an invalid user session.");
      }

      dispatch(
        setAuthUser({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive !== false,
        })
      );

      toast.success(
        isRegister ? "Account created successfully!" : "Welcome back! Login successful."
      );
      router.replace("/overview");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to authenticate. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F4EF] px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#E8E6DC] bg-white shadow-[0_24px_80px_rgba(20,47,40,0.09)]">

        {/* Left branding panel */}
        <section className="relative hidden min-h-[700px] w-[46%] flex-col justify-between overflow-hidden bg-[#142F28] p-12 text-white lg:flex">

          <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute right-10 top-40 h-48 w-48 rounded-full bg-[#26745A]/30 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D7B77A] text-[#142F28]">
              <Database size={23} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">DataScope</h1>
              <p className="text-xs text-white/50">DATA INTELLIGENCE PLATFORM</p>
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-[#D7B77A]">
              <ShieldCheck size={15} />
              Secure data workspace
            </div>

            <h2 className="text-4xl font-semibold leading-[1.2] tracking-tight xl:text-5xl">
              Turn your data into
              <span className="block text-[#D7B77A]">
                meaningful insights.
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/60">
              Explore, search, analyze and understand large datasets
              through one powerful and secure workspace.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-semibold text-[#D7B77A]">100K+</p>
                <p className="mt-1 text-xs text-white/50">Records ready to explore</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-semibold text-[#D7B77A]">Secure</p>
                <p className="mt-1 text-xs text-white/50">Role-based access control</p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/35">
            © 2026 DataScope. All rights reserved.
          </p>
        </section>

        {/* Right form panel */}
        <section className="flex min-h-[650px] w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[54%] lg:px-16">

          <div className="mx-auto w-full max-w-md">

            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#142F28] text-[#D7B77A]">
                <Database size={21} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#142F28]">DataScope</h1>
                <p className="text-[10px] tracking-wider text-[#78847D]">
                  DATA INTELLIGENCE PLATFORM
                </p>
              </div>
            </div>

            <div className="mb-9">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#26745A]">
                {isRegister ? "Get started" : "Welcome back"}
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-[#142F28] sm:text-4xl">
                {isRegister ? "Create account" : "Sign in to DataScope"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#78847D]">
                {isRegister
                  ? "Create your account and start exploring your data."
                  : "Enter your credentials to access your workspace."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {isRegister && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#263D34]">
                    Full name
                  </label>
                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#89958E]"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={150}
                      className="h-13 w-full rounded-xl border border-[#E5E8E2] bg-[#FAFBF8] pl-11 pr-4 text-sm text-[#142F28] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#26745A] focus:bg-white focus:ring-4 focus:ring-[#26745A]/10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#263D34]">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#89958E]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    className="h-13 w-full rounded-xl border border-[#E5E8E2] bg-[#FAFBF8] pl-11 pr-4 text-sm text-[#142F28] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#26745A] focus:bg-white focus:ring-4 focus:ring-[#26745A]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#263D34]">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#89958E]"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    required
                    minLength={isRegister ? 8 : 1}
                    maxLength={72}
                    className="h-13 w-full rounded-xl border border-[#E5E8E2] bg-[#FAFBF8] pl-11 pr-12 text-sm text-[#142F28] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#26745A] focus:bg-white focus:ring-4 focus:ring-[#26745A]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#89958E] transition hover:text-[#26745A]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isRegister && (
                  <p className="mt-2 text-xs text-[#89958E]">
                    Use at least 8 characters.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#142F28] px-5 text-sm font-semibold text-white shadow-lg shadow-[#142F28]/10 transition hover:bg-[#26745A] focus:outline-none focus:ring-4 focus:ring-[#26745A]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : isRegister
                    ? "Create account"
                    : "Sign in"}

                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#E9EBE5]" />
              <span className="text-xs text-[#A0AAA3]">SECURE ACCESS</span>
              <div className="h-px flex-1 bg-[#E9EBE5]" />
            </div>

            <p className="text-center text-sm text-[#78847D]">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <Link
                href={isRegister ? "/login" : "/register"}
                className="font-semibold text-[#26745A] transition hover:text-[#142F28] hover:underline"
              >
                {isRegister ? "Sign in" : "Create account"}
              </Link>
            </p>

            <div className="mt-10 flex items-center justify-center gap-2 text-xs text-[#A0AAA3]">
              <ShieldCheck size={15} />
              Your workspace is protected with secure authentication.
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
