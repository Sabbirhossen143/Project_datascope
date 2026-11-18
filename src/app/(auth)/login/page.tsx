import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <>
      <Link
        href="/"
        aria-label="Back to DataScope landing page"
        className="fixed left-4 top-4 z-[200] inline-flex h-10 items-center gap-2 rounded-xl border border-[#E5E8E2] bg-white/95 px-4 text-xs font-semibold text-[#315543] shadow-md shadow-[#142F28]/5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D7B77A] hover:bg-[#F5F4EF] hover:text-[#142F28] focus:outline-none focus:ring-4 focus:ring-[#26745A]/15 sm:left-6 sm:top-6"
      >
        <ArrowLeft size={15} />
        Back to home
      </Link>
      <AuthForm mode="login" />
    </>
  );
}
