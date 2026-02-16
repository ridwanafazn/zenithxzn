"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { LayoutDashboard, LogIn, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingNavbar() {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
      scrolled ? "bg-slate-950/70 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
    )}>
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 p-2 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Sparkles className="h-full w-full text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Zenith</span>
        </Link>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-400 backdrop-blur-md transition-all hover:bg-emerald-500 hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="group flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-slate-950 transition-all hover:bg-slate-200 hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
            >
              <LogIn className="h-4 w-4" />
              <span>Mulai</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}