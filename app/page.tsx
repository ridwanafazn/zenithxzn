"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowRight, Sparkles, ShieldCheck, Heart, BarChart3, ChevronRight } from "lucide-react";
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

      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      {/* --- Hero Section --- */}
      <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-center px-6 pt-32 pb-20 text-center sm:pt-48 sm:pb-32">
        <div className="mb-8 animate-scale-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-md">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Digital Spirit Companion</span>
          </div>
        </div>

        <h1 className="max-w-4xl animate-scale-in text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-[1.1]" style={{ animationDelay: '0.1s' }}>
          Upgrade Amalanmu <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent italic">
            Mulai dari Sini.
          </span>
        </h1>

        <p className="mt-8 max-w-2xl animate-scale-in text-lg text-slate-400 leading-relaxed sm:text-xl" style={{ animationDelay: '0.2s' }}>
          Zenith hadir untuk membantumu mencatat progres ibadah harian dengan antarmuka yang modern, menenangkan, dan fokus pada keistiqomahan.
        </p>

        <div className="mt-12 flex animate-scale-in flex-col gap-4 sm:flex-row sm:justify-center" style={{ animationDelay: '0.3s' }}>
          <Link
            href={user ? "/dashboard" : "/auth/login"}
            className="group relative flex h-14 items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-10 text-base font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:translate-y-0"
          >
            {loading ? "Menyiapkan..." : user ? "Masuk ke Dashboard" : "Mulai Perjalanan Gratis"}
            <ChevronRight className="h-8 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          
        </div>

        {/* --- Feature Grid --- */}
        <div id="features" className="mt-32 grid grid-cols-1 gap-6 text-left sm:grid-cols-3 max-w-6xl w-full">
          <LandingFeatureCard 
            icon={<ShieldCheck className="h-6 w-6 text-emerald-400" />}
            title="Sangat Privat"
            desc="Ibadahmu adalah urusanmu. Kami menjaga data tetap aman dan hanya untuk matamu saja."
          />
          <LandingFeatureCard 
            icon={<BarChart3 className="h-6 w-6 text-blue-400" />}
            title="Visualisasi Data"
            desc="Nikmati kepuasan melihat grafik 'Kotak Hijau' di Heatmap yang terus berkembang setiap hari."
          />
          <LandingFeatureCard 
            icon={<Heart className="h-6 w-6 text-pink-400" />}
            title="Inklusif"
            desc="Skenario khusus untuk Pria dan Wanita (Mode Haid) untuk menjaga progres tetap relevan."
          />
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 mt-20 border-t border-white/5 py-12 text-center text-sm text-slate-500">
        <div className="flex justify-center gap-6 mb-4">
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Syarat & Ketentuan</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Kebijakan Privasi</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Zenith Tracker. Melangkah lebih dekat setiap hari.</p>
      </footer>
    </div>
  );
}

function LandingFeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="group rounded-3xl border border-white/5 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:bg-slate-900/50 hover:border-white/10">
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 p-4 border border-white/5 shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-slate-100">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors">{desc}</p>
    </div>
  );
}