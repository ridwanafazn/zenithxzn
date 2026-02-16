"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { syncUser } from "@/actions/auth"; 
import { useRouter } from "next/navigation";
import { Chrome, Loader2, Sparkles, ArrowRight, Home, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true); 
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setIsCheckingSession(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError("Gagal masuk. Coba lagi ya.");
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 text-slate-50">
      
      {/* Tombol Back to Landing (New UX) */}
      <Link 
        href="/" 
        className="absolute left-6 top-8 z-20 flex items-center gap-2 rounded-full border border-white/5 bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-400 backdrop-blur-md transition-all hover:bg-slate-800 hover:text-white"
      >
        <Home className="h-3.5 w-3.5" />
        Kembali ke Beranda
      </Link>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="glass-panel overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-400 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white text-glow">Masuk ke Zenith</h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed px-4">
              Lanjutkan perjalanan istiqomahmu sekarang.
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 font-bold text-slate-950 transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Chrome className="h-5 w-5" />}
            <span>Masuk dengan Google</span>
            <ArrowRight className="absolute right-6 h-5 w-5 opacity-0 transition-all -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 text-slate-400" />
          </button>

          {error && <p className="mt-4 text-center text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">{error}</p>}
          
          <div className="mt-10 border-t border-white/5 pt-6 text-center text-[10px] text-slate-500 uppercase tracking-widest font-medium">
            Privat • Aman • Istiqomah
          </div>
        </div>
      </div>
    </main>
  );
}