"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { submitOnboarding } from "@/actions/user";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const [uid, setUid] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
        setLoading(false);
      } else {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-emerald-400">Ahlan wa Sahlan!</h1>
          <p className="mt-2 text-slate-400">Mari sesuaikan Zenith dengan kebutuhanmu.</p>
        </div>

        <form action={submitOnboarding} className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <input type="hidden" name="uid" value={uid} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Siapa nama panggilanmu?</label>
            <input
              type="text"
              name="nickname"
              required
              placeholder="Contoh: Zenitsu"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 p-3 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Apa gendermu?</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input type="radio" name="gender" value="male" className="peer sr-only" required />
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-950 p-4 transition-all hover:bg-slate-800 peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-400">
                  <span className="text-2xl">👨</span>
                  <span className="mt-1 text-sm font-medium">Laki-laki</span>
                </div>
              </label>

              <label className="cursor-pointer">
                <input type="radio" name="gender" value="female" className="peer sr-only" />
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-950 p-4 transition-all hover:bg-slate-800 peer-checked:border-pink-500 peer-checked:bg-pink-500/10 peer-checked:text-pink-400">
                  <span className="text-2xl">🧕</span>
                  <span className="mt-1 text-sm font-medium">Perempuan</span>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Simpan & Masuk Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}