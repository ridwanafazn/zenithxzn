"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowRight, Sparkles, ShieldCheck, Heart, BarChart3, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import LandingNavbar from "@/components/layout/LandingNavbar";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-50 selection:bg-emerald-500/30">
      <LandingNavbar />

      {/* --- Background Ambience --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" style={{ opacity: 0.05 }}></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      {/* --- Hero Section --- */}
      <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-center px-6 pt-32 pb-20 text-center sm:pt-40 sm:pb-32">
        
        {/* Badge "New" */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-4 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            {/* <Sparkles className="h-3 w-3 animate-pulse" /> */}
            <span>Habit Tracker for The Soul</span>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="max-w-5xl animate-in fade-in zoom-in-95 duration-1000 delay-100 text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-[1.1]">
          Upgrade Ibadahmu <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-200 to-blue-400 bg-clip-text text-transparent italic">
            Mulai Hari Ini.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 text-lg text-slate-400 leading-relaxed sm:text-xl font-medium">
          Platform modern untuk mencatat, menganalisis, dan menjaga konsistensi amalan harianmu. Simpel, privat, dan menenangkan.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href={user ? "/dashboard" : "/auth/login"}
            className="group relative flex h-14 items-center justify-center gap-3 rounded-2xl bg-white px-8 text-base font-bold text-slate-950 transition-all hover:bg-slate-200 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {loading ? "Memuat..." : user ? "Dashboard" : "Mulai Gratis"}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <a
            href="#features"
            className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/50 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-slate-800 hover:border-white/20"
          >
            Fitur
          </a>
        </div>

        {/* --- Bento Grid Features (Modern Layout) --- */}
        <div id="features" className="mt-32 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Card 1: Privacy (Span 2) */}
                <div className="group md:col-span-2 relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/50 to-slate-900/10 p-8 text-left hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                        <ShieldCheck className="h-32 w-32 text-emerald-500 -rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">100% Privat & Aman</h3>
                        <p className="text-slate-400 max-w-md">Ibadah adalah urusanmu dengan Sang Pencipta. Data tersimpan aman dan hanya bisa diakses olehmu.</p>
                    </div>
                </div>

                {/* Card 2: Visualisasi */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/30 p-8 text-left hover:bg-slate-800/50 transition-all">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 border border-blue-500/20">
                        <BarChart3 className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Visualisasi Heatmap</h3>
                    <p className="text-sm text-slate-400">Lihat progres "Kotak Hijau" yang memuaskan setiap hari.</p>
                </div>

                {/* Card 3: Inklusif */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/30 p-8 text-left hover:bg-slate-800/50 transition-all">
                    <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 text-pink-400 border border-pink-500/20">
                        <Heart className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Mode Inklusif</h3>
                    <p className="text-sm text-slate-400">Dukungan penuh untuk mode Haid (Wanita) agar statistik tetap adil.</p>
                </div>

                {/* Card 4: Fokus (Span 2) */}
                <div className="group md:col-span-2 relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-900/20 to-slate-900/10 p-8 text-left hover:border-indigo-500/30 transition-all">
                     <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Zap className="h-48 w-48 text-indigo-500 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-400 border border-indigo-500/20">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Mode Fokus Layar Penuh</h3>
                        <p className="text-slate-400 max-w-lg">
                            Hindari distraksi saat berdzikir. Masuk ke mode fokus dengan tampilan minimalis dan counter interaktif yang nyaman digunakan.
                        </p>
                    </div>
                </div>

            </div>
        </div>

      </section>
      
      {/* Footer */}
      <footer className="relative z-10 mt-20 border-t border-white/5 bg-slate-950 py-12 text-center text-sm text-slate-500">
        <div className="flex justify-center gap-8 mb-6 font-medium">
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Tentang Kami</span>
        </div>
        <p className="opacity-60">&copy; {new Date().getFullYear()} Zenith. Dibuat dengan niat baik.</p>
      </footer>
    </div>
  );
}