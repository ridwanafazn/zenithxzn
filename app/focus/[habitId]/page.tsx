"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";

import { MASTER_HABITS } from "@/lib/constants";
import { getDailyLog } from "@/actions/log";
import { auth } from "@/lib/firebase";
import FocusCounter from "@/components/focus/FocusCounter";

// Tipe props untuk Next.js 15/16 (params adalah Promise)
interface PageProps {
  params: Promise<{ habitId: string }>;
}

export default function FocusPage({ params }: PageProps) {
  // Unwrap params menggunakan 'use' karena di Next.js 16 params adalah Promise
  const { habitId } = use(params);

  const [loading, setLoading] = useState(true);
  const [habit, setHabit] = useState<any>(null);
  const [initialCount, setInitialCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // 1. Validasi Habit ID
  useEffect(() => {
    const habitDef = MASTER_HABITS.find((h) => h.id === habitId);

    // Jika habit tidak ditemukan atau bukan tipe counter, tendang balik
    if (!habitDef || habitDef.type !== "counter") {
       router.push("/dashboard");
       return;
    }
    setHabit(habitDef);

    // Load Data User & Log Hari Ini
    const loadData = async () => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                router.push("/auth/login");
                return;
            }
            setUserId(user.uid);

            // Ambil Log Hari Ini
            const date = new Date().toISOString().split("T")[0];
            const log = await getDailyLog(user.uid, date);
            
            // Set hitungan awal (resume progress jika sudah pernah isi hari ini)
            if (log && log.counters && log.counters[habitId]) {
                setInitialCount(log.counters[habitId]);
            }
            
            setLoading(false);
        });
        return () => unsubscribe();
    };

    loadData();
  }, [habitId, router]);

  if (loading || !habit) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
            <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Header Minimalis */}
        <div className="p-6 flex items-center justify-between">
            <Link 
                href="/dashboard" 
                className="p-2 rounded-full bg-slate-900/50 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronLeft className="h-6 w-6" />
            </Link>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                Mode Fokus
            </span>
            <div className="w-10" /> {/* Spacer biar tengah */}
        </div>

        {/* Counter Component */}
        <div className="flex-1 flex items-center justify-center p-4">
            <FocusCounter 
                habit={habit} 
                initialCount={initialCount} 
                userId={userId!} 
            />
        </div>
    </div>
  );
}