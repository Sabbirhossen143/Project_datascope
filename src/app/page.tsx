"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, BarChart3, Database, Search, ShieldCheck, Zap,
  Layers3, ChartNoAxesCombined, CircleCheck, Sparkles, Menu, X
} from "lucide-react";

const features = [
  { icon: Database, title: "Centralized data workspace", text: "Bring datasets into one organized workspace and explore records with clarity." },
  { icon: Search, title: "Powerful search & filtering", text: "Find the records that matter with flexible search, conditions and sorting." },
  { icon: ChartNoAxesCombined, title: "Insightful analytics", text: "Turn large volumes of records into clear summaries and useful insights." },
  { icon: ShieldCheck, title: "Role-based access", text: "Keep collaboration organized with Admin, Analyst and Viewer permissions." },
];

const capabilities = ["100,000+ generated records", "Server-side search & pagination", "Saved views and search history", "PostgreSQL-powered data storage"];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <main className="min-h-screen scroll-smooth overflow-x-clip bg-[#F5F4EF] text-[#20382D]">
      <header
        className={`sticky top-0 z-[100] w-full border-b transition-[background-color,border-color,box-shadow,padding] duration-500 ease-out ${
          scrolled ? "navbar-scrolled" : "navbar-at-top"
        } ${
          scrolled
            ? "border-[#DDE3D9]/90 bg-[#FBFAF6]/95 py-2 shadow-[0_12px_35px_rgba(20,47,40,0.09)] backdrop-blur-2xl"
            : "border-transparent bg-[#F5F4EF]/80 py-4 backdrop-blur-md"
        }`}
        style={{ animation: "navDrop 650ms cubic-bezier(.2,.8,.2,1) both" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="group flex items-center gap-3 navbar-brand">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#173B2E] text-[#E4C98F] shadow-lg shadow-[#173B2E]/20 transition duration-300 group-hover:-rotate-6 group-hover:scale-105">
              <Layers3 size={21} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#F5F4EF] bg-[#D7B77A]" />
            </span>
            <span>
              <span className="block text-lg font-extrabold tracking-tight text-[#19382C]">DataScope</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[2px] text-[#829087]">Data intelligence platform</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-full border border-[#E5E8DF] bg-white/65 p-1.5 shadow-sm md:flex">
            {[
              ["Features", "#features"],
              ["Platform", "#platform"],
              ["About", "#about"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="nav-link group relative rounded-full px-5 py-2.5 text-[11px] font-bold text-[#64766A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#EDF3EC] hover:text-[#1D6048]">
                {label}
                <span className="absolute bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-[#B18C4D] transition-all duration-300 group-hover:w-1/2" />
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login" className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#315543] transition duration-300 hover:bg-white hover:text-[#1D6048]">Sign in</Link>
            <Link href="/login" className="group inline-flex items-center gap-2 rounded-xl bg-[#1D6048] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#1D6048]/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#174B38] hover:shadow-xl">
              Get started <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <button type="button" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDE4DA] bg-white/80 text-[#315543] shadow-sm transition-all duration-300 hover:border-[#B9C9B8] hover:bg-white sm:hidden">
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-[#E4E8DF] bg-[#FBFAF6]/[.98] px-5 pb-5 pt-3 shadow-[0_18px_35px_rgba(20,47,40,0.12)] backdrop-blur-2xl sm:hidden" style={{ animation: "menuReveal 220ms ease-out both" }}>
            <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col gap-1">
              {[
                ["Features", "#features"],
                ["Platform", "#platform"],
                ["About", "#about"],
              ].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-[#496454] transition hover:bg-[#EDF3EC] hover:text-[#1D6048]">
                  {label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#E8EAE2] pt-4">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#DDE4DA] bg-white text-xs font-bold text-[#315543]">Sign in</Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1D6048] text-xs font-bold text-white shadow-lg shadow-[#1D6048]/15">Get started <ArrowRight size={14} /></Link>
              </div>
            </nav>
          </div>
        )}
      </header>
      <style jsx global>{`
        @keyframes navDrop {
          0% { opacity: 0; transform: translateY(-24px); }
          70% { opacity: 1; transform: translateY(3px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes brandReveal {
          from { opacity: 0; transform: translateX(-12px) scale(.97); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes navItemReveal {
          from { opacity: 0; transform: translateY(-7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes navShine {
          0% { background-position: -180% 0; }
          100% { background-position: 180% 0; }
        }
        .navbar-brand { animation: brandReveal 700ms cubic-bezier(.2,.8,.2,1) 120ms both; }
        .nav-link { animation: navItemReveal 600ms cubic-bezier(.2,.8,.2,1) both; }
        .nav-link:nth-child(1) { animation-delay: 180ms; }
        .nav-link:nth-child(2) { animation-delay: 260ms; }
        .nav-link:nth-child(3) { animation-delay: 340ms; }
        .navbar-scrolled { box-shadow: 0 12px 35px rgba(20,47,40,.12); }
        .navbar-scrolled::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 1px;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(183,145,79,.8), transparent);
          background-size: 200% 100%;
          animation: navShine 2.8s linear infinite;
        }
        @keyframes menuReveal {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes footerRise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .footer-column { animation: footerRise 700ms cubic-bezier(.2,.8,.2,1) both; }
        .footer-column:nth-child(2) { animation-delay: 90ms; }
        .footer-column:nth-child(3) { animation-delay: 180ms; }
        .footer-column:nth-child(4) { animation-delay: 270ms; }
        .footer-link { display: inline-block; transition: color 220ms ease, transform 220ms ease; }
        .footer-link:hover { color: #E4C98F; transform: translateX(4px); }
        @media (prefers-reduced-motion: reduce) {
          header, header * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.02fr_.98fr] lg:px-10 lg:pb-28 lg:pt-20">
        <div className="pointer-events-none absolute -left-48 top-0 h-[480px] w-[480px] rounded-full bg-[#D7B77A]/10 blur-3xl"/>
        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#DCDCCF] bg-white/75 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[1.5px] text-[#557361] shadow-sm"><Sparkles size={13} className="text-[#B18C4D]"/> A smarter way to work with data</div>
          <h1 className="max-w-2xl text-[43px] font-extrabold leading-[1.08] tracking-[-2.3px] text-[#17382B] sm:text-6xl lg:text-[68px]">Make your data <span className="text-[#B28E52]">work</span> for you.</h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[#718176] sm:text-base sm:leading-8">Explore large datasets, uncover meaningful patterns and make confident decisions with one beautifully organized data intelligence workspace.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1D6048] px-6 text-xs font-bold text-white shadow-xl shadow-[#1D6048]/20 transition hover:-translate-y-0.5 hover:bg-[#174B38]">Explore DataScope <ArrowRight size={15}/></Link>
            <a href="#features" className="inline-flex h-12 items-center justify-center rounded-xl border border-[#D9DFD5] bg-white/70 px-6 text-xs font-bold text-[#496454] transition hover:bg-white">Discover features</a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[10px] font-semibold text-[#78877C]">
            <span className="inline-flex items-center gap-2"><CircleCheck size={14} className="text-[#39845A]"/> Built for data teams</span>
            <span className="inline-flex items-center gap-2"><CircleCheck size={14} className="text-[#39845A]"/> Secure role-based access</span>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[590px]">
          <div className="absolute -inset-5 rounded-[34px] bg-[#D7B77A]/15 blur-2xl"/>
          <div className="relative overflow-hidden rounded-[26px] border border-white bg-white p-3 shadow-[0_28px_90px_rgba(20,47,40,0.14)] sm:p-4">
            <div className="flex items-center justify-between border-b border-[#EEF0E9] px-2 pb-4 pt-1">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#D7B77A]"/><span className="text-[11px] font-extrabold text-[#284334]">DataScope <span className="font-medium text-[#9AA49B]">/ Overview</span></span></div>
              <span className="rounded-full bg-[#EAF3EA] px-2.5 py-1 text-[8px] font-bold text-[#39704E]">● SYSTEM LIVE</span>
            </div>
            <div className="p-2 sm:p-4">
              <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#9AA49B]">Workspace overview</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#20382D] sm:text-2xl">Your data, in focus.</h2></div><span className="rounded-lg border border-[#E9EAE3] px-2.5 py-1.5 text-[8px] font-bold text-[#6F8174]">Last 30 days</span></div>
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[["Total records","100K+","Database"],["Datasets","01","Available"],["Access roles","03","Protected"]].map(([label,value,sub])=><div key={label} className="rounded-xl border border-[#ECEDE6] bg-[#FCFCF9] p-3"><p className="text-[8px] font-semibold text-[#87948B]">{label}</p><p className="mt-2 text-xl font-extrabold text-[#234633]">{value}</p><p className="mt-1 text-[8px] text-[#A0AAA1]">{sub}</p></div>)}
              </div>
              <div className="mt-4 rounded-xl border border-[#ECEDE6] p-3.5">
                <div className="flex items-center justify-between"><div><p className="text-[9px] font-bold text-[#435D4C]">Data activity</p><p className="mt-1 text-[8px] text-[#9AA49B]">Illustrative workspace preview</p></div><BarChart3 size={17} className="text-[#B18C4D]"/></div>
                <div className="mt-4 flex h-28 items-end gap-2 border-b border-[#EEF0E9] px-1">
                  {[36,52,43,69,57,82,65,92,73,100,78,88,68,96,82,108,91,118,98,126].map((h,i)=><div key={i} className="flex-1 rounded-t-[3px] bg-gradient-to-t from-[#26745A] to-[#9CB99C]" style={{height:`${h/1.35}%`}}/>)}
                </div>
                <div className="mt-3 flex justify-between text-[8px] text-[#A0AAA1]"><span>Week 01</span><span>Week 02</span><span>Week 03</span><span>Week 04</span></div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F3F5EF] px-3.5 py-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#26745A]"><Zap size={14}/></span><span className="text-[9px] font-bold text-[#496454]">Fast, focused data exploration</span></div><span className="text-[8px] font-bold text-[#A18149]">DATASCOPE</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-28 border-y border-[#E7E6DC] bg-[#FBFAF6] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center"><p className="text-[10px] font-extrabold uppercase tracking-[2px] text-[#A18149]">Everything in one place</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1C3B2E] sm:text-4xl">A complete workspace for better decisions.</h2><p className="mt-4 text-sm leading-7 text-[#7B887E]">From raw records to actionable understanding, DataScope brings essential data workflows together.</p></div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({icon:Icon,title,text})=><article key={title} className="group rounded-2xl border border-[#E8E8DF] bg-white p-6 shadow-[0_4px_20px_rgba(35,55,43,.025)] transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#183C30]/5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2EA] text-[#26745A] transition group-hover:bg-[#1D6048] group-hover:text-white"><Icon size={20}/></span><h3 className="mt-5 text-sm font-extrabold text-[#2B4536]">{title}</h3><p className="mt-2 text-xs leading-6 text-[#839087]">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="platform" className="scroll-mt-28 mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-24">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[2px] text-[#A18149]">Designed for clarity</p><h2 className="mt-3 max-w-lg text-3xl font-extrabold leading-tight tracking-tight text-[#1C3B2E] sm:text-4xl">The tools you need. Without the complexity.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-[#7B887E]">A focused environment for searching, managing and understanding structured data at scale.</p><Link href="/login" className="mt-7 inline-flex items-center gap-2 text-xs font-extrabold text-[#26745A] hover:text-[#173B2E]">Enter your workspace <ArrowRight size={15}/></Link></div>
        <div className="rounded-[24px] bg-[#183C30] p-7 text-white shadow-2xl shadow-[#183C30]/15 sm:p-9"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#D7B77A]"><ShieldCheck size={20}/></span><div><p className="text-sm font-extrabold">Built around your workflow</p><p className="mt-1 text-[10px] text-[#B8CBBE]">Core platform capabilities</p></div></div><div className="mt-7 space-y-4">{capabilities.map(item=><div key={item} className="flex items-center gap-3 border-b border-white/10 pb-4 last:border-0 last:pb-0"><CircleCheck size={16} className="shrink-0 text-[#D7B77A]"/><span className="text-xs font-medium text-[#E0E9E1]">{item}</span></div>)}</div></div>
      </section>

      <section id="about" className="scroll-mt-28 px-5 pb-20 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl overflow-hidden rounded-[26px] bg-[#E9E7DA] px-6 py-12 text-center sm:px-12 sm:py-16"><p className="text-[10px] font-extrabold uppercase tracking-[2px] text-[#9B7841]">Ready when you are</p><h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#1D3B2E] sm:text-4xl">Bring your data into focus.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#718176]">Sign in to explore datasets, search records and discover insights with DataScope.</p><Link href="/login" className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-[#1D6048] px-6 text-xs font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#174B38]">Get started <ArrowRight size={15}/></Link></div></section>

      <footer className="relative overflow-hidden border-t border-[#D7B77A]/25 bg-[#142F28] text-[#F5F4EF]">
        <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-[#26745A]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-[#D7B77A]/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 pb-7 pt-14 sm:px-8 sm:pt-16 lg:px-10">
          <div className="grid gap-10 border-b border-white/10 pb-11 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
            <div className="footer-column">
              <Link href="/" className="group inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D7B77A]/30 bg-white/[.07] text-[#E4C98F] transition duration-300 group-hover:-rotate-6 group-hover:bg-white/10">
                  <Layers3 size={22} />
                </span>
                <span>
                  <span className="block text-lg font-extrabold tracking-tight text-white">DataScope</span>
                  <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[2px] text-[#A8B9AC]">Data intelligence platform</span>
                </span>
              </Link>
              <p className="mt-5 max-w-xs text-xs leading-7 text-[#B4C4B8]">
                Bring your data together, explore it with clarity and turn information into confident decisions.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#D7B77A]/20 bg-white/[.05] px-3 py-2 text-[9px] font-bold uppercase tracking-[1.3px] text-[#E2C990]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8BC49A] shadow-[0_0_10px_rgba(139,196,154,.8)]" />
                Built for better decisions
              </div>
            </div>

            <div className="footer-column">
              <h3 className="text-[10px] font-extrabold uppercase tracking-[1.8px] text-[#D7B77A]">Explore</h3>
              <ul className="mt-5 space-y-3 text-xs text-[#C0CEC3]">
                <li><a href="#features" className="footer-link">Features</a></li>
                <li><a href="#platform" className="footer-link">Platform</a></li>
                <li><a href="#about" className="footer-link">About DataScope</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="text-[10px] font-extrabold uppercase tracking-[1.8px] text-[#D7B77A]">Workspace</h3>
              <ul className="mt-5 space-y-3 text-xs text-[#C0CEC3]">
                <li><Link href="/login" className="footer-link">Sign in</Link></li>
                <li><Link href="/login" className="footer-link">Get started</Link></li>
                <li><Link href="/login" className="footer-link">Data Explorer</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="text-[10px] font-extrabold uppercase tracking-[1.8px] text-[#D7B77A]">Get started</h3>
              <p className="mt-5 text-xs leading-6 text-[#B4C4B8]">Ready to make your data more useful? Enter your workspace and start exploring.</p>
              <Link href="/login" className="group mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-[#D7B77A]/40 bg-[#D7B77A] px-4 text-[11px] font-extrabold text-[#18382D] shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[#E5CA94]">
                Open workspace <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 text-[10px] text-[#9FB1A4] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 DataScope. All rights reserved.</span>
            <span className="font-semibold tracking-[1.8px] text-[#D7B77A]">DATA <span className="px-1 text-white/30">·</span> CLARITY <span className="px-1 text-white/30">·</span> CONFIDENCE</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
