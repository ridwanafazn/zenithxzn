"use client";

import { useEffect, useState, useMemo } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getHistoryLogs } from "@/actions/log";
import { checkUserStatus } from "@/actions/user";
import { 
    calculateStreak, 
    analyzeZenithTrends, 
    generateZenithInsight,
    calculateDailyScore // IMPORT BARU
} from "@/lib/utils"; 
import Heatmap from "@/components/tracker/Heatmap"; 
import HistoryInsights from "@/components/tracker/HistoryInsights"; // IMPORT BARU
import { 
  ArrowLeft, 
  Flame, 
  Trophy, 
  CalendarDays, 
  Loader2, 
  Target,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      
      const [historyData, dbUser] = await Promise.all([
        getHistoryLogs(currentUser.uid, year),
        checkUserStatus(currentUser.uid)
      ]);

      setLogs(historyData);
      setUserData(dbUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, year]);

  // --- MESIN ANALISIS DATA ---
  const analytics = useMemo(() => {
    if (!logs || logs.length === 0 || !userData) {
        return {
            heatmapData: {},
            streak: { current: 0, longest: 0 },
            topHabit: "-",
            insight: { text: "Belum ada data cukup.", title: "Mulai Perjalanan", color: "neutral", tip: "Isi jurnal hari ini." },
            trends: null
        };
    }

    // 1. Siapkan Data Dasar untuk Heatmap & Streak
    const heatmapData: Record<string, number> = {}; // Isinya sekarang SKOR, bukan Count
    const loggedDates: string[] = [];
    const habitFrequency: Record<string, number> = {};

    logs.forEach((log) => {
      // HITUNG SKOR KUALITAS
      const score = calculateDailyScore(log);
      heatmapData[log.date] = score;
      
      if (log.checklists && log.checklists.length > 0) loggedDates.push(log.date);
      
      log.checklists?.forEach((habitId: string) => {
        habitFrequency[habitId] = (habitFrequency[habitId] || 0) + 1;
      });
    });

    const streak = calculateStreak(loggedDates);

    // 2. Cari Top Habit
    const sortedHabits = Object.entries(habitFrequency).sort((a, b) => b[1] - a[1]);
    const topHabitRaw = sortedHabits.length > 0 ? sortedHabits[0][0] : "-";
    const topHabit = topHabitRaw.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    // 3. JALANKAN ANALISIS MENDALAM (Deep Analysis)
    const trends = analyzeZenithTrends(logs, {
        gender: userData.gender || 'male',
        isMenstruating: userData.preferences?.isMenstruating || false
    });

    // 4. GENERATE NARASI (Storytelling)
    const insight = generateZenithInsight(trends, {
        gender: userData.gender || 'male',
        isMenstruating: userData.preferences?.isMenstruating || false
    });

    return { heatmapData, streak, topHabit, insight, trends };
  }, [logs, userData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans pb-10 selection:bg-emerald-500/30">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 h-full w-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-900/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-900/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl p-4 md:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 animate-scale-in">
          <Link href="/dashboard" className="group rounded-full bg-slate-900/50 p-3 hover:bg-slate-800 transition border border-white/5">
            <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Jejak Istiqomah
            </h1>
            <p className="text-slate-400 text-xs tracking-wide uppercase">Muhasabah perjalanan {year}</p>
          </div>
        </div>

        {/* --- SMART INSIGHT CARD (COMPONENT BARU) --- */}
        <div className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <HistoryInsights insight={analytics.insight} trends={analytics.trends} />
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <StatCard 
            icon={<Flame className="h-4 w-4 text-orange-500" />} 
            label="Streak" 
            value={analytics.streak.current} 
            unit="Hari" 
          />
          <StatCard 
            icon={<Trophy className="h-4 w-4 text-yellow-500" />} 
            label="Rekor" 
            value={analytics.streak.longest} 
            unit="Hari" 
          />
           <StatCard 
            icon={<Target className="h-4 w-4 text-blue-500" />} 
            label="Favorit" 
            value={analytics.topHabit} 
            unit="" 
            isText={true}
            span={2}
          />
          {/* Card untuk Weakest Day */}
          {analytics.trends && (
             <StatCard 
                icon={<AlertCircle className="h-4 w-4 text-red-400" />} 
                label="Hari Kritis" 
                value={analytics.trends.weakestDay} 
                unit=""
                isText={true}
                span={2}
                customColor="text-red-300"
             />
          )}
        </div>

        {/* Heatmap Section */}
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-sm shadow-xl animate-scale-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-slate-400" />
                <h3 className="font-semibold text-slate-200">Kualitas Ibadah</h3>
            </div>
            {userData?.preferences?.isMenstruating && (
                <span className="text-[10px] px-2 py-1 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    Mode Haid Aktif
                </span>
            )}
          </div>
          
          <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
             <Heatmap data={analytics.heatmapData} year={year} />
          </div>
        </div>

      </div>
    </div>
  );
}

// Komponen Card Statistik Kecil (Sama seperti sebelumnya)
function StatCard({ icon, label, value, unit, isText = false, span = 1, customColor }: any) {
  return (
    <div className={cn(
        "relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-4 backdrop-blur-sm transition-all hover:bg-slate-800/60 hover:border-white/10",
        span === 2 ? "col-span-2" : "col-span-1"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-md bg-slate-950 p-1.5 border border-white/5 shadow-inner">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={cn(
            "font-bold tracking-tight truncate", 
            isText ? "text-sm md:text-base" : "text-2xl md:text-3xl",
            customColor || "text-white"
        )}>
          {value}
        </span>
        {unit && <span className="text-xs text-slate-500 font-medium ml-1">{unit}</span>}
      </div>
    </div>
  );
}