"use client";

import { useEffect, useState, useMemo } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getHistoryLogs } from "@/actions/log";
import { checkUserStatus } from "@/actions/user"; // Import untuk cek gender/haid
import { calculateStreak, analyzeZenithTrends, generateZenithInsight } from "@/lib/utils"; 
import Heatmap from "@/components/tracker/Heatmap"; 
import { 
  ArrowLeft, 
  Flame, 
  Trophy, 
  CalendarDays, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Target,
  BarChart2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null); // State untuk data user lengkap
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      
      // Load Logs & User Data Paralel
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
    const heatmapData: Record<string, number> = {};
    const loggedDates: string[] = [];
    const habitFrequency: Record<string, number> = {};

    logs.forEach((log) => {
      const count = log.checklists ? log.checklists.length : 0;
      heatmapData[log.date] = count; 
      if (count > 0) loggedDates.push(log.date);
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

        {/* --- SMART INSIGHT CARD (Dynamic Context) --- */}
        <div className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <div className={cn(
                "relative overflow-hidden rounded-3xl border p-6 backdrop-blur-md transition-all shadow-xl",
                analytics.insight.color === 'positive' ? "bg-emerald-950/20 border-emerald-500/20 shadow-emerald-500/5" : 
                analytics.insight.color === 'warning' ? "bg-amber-950/20 border-amber-500/20 shadow-amber-500/5" : 
                analytics.insight.color === 'pink' ? "bg-pink-950/20 border-pink-500/20 shadow-pink-500/5" :
                "bg-slate-900/40 border-white/10"
            )}>
            
                {/* Glow Line Indicator */}
                <div className={cn("absolute top-0 left-0 h-full w-1.5", 
                    analytics.insight.color === 'positive' ? 'bg-emerald-500' : 
                    analytics.insight.color === 'warning' ? 'bg-amber-500' : 
                    analytics.insight.color === 'pink' ? 'bg-pink-500' : 'bg-slate-500'
                )} />
                
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                    {/* Icon Box */}
                    <div className={cn("shrink-0 rounded-2xl p-4 border", 
                        analytics.insight.color === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 
                        analytics.insight.color === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/10' : 
                        analytics.insight.color === 'pink' ? 'bg-pink-500/10 text-pink-400 border-pink-500/10' : 'bg-slate-500/10 text-slate-400 border-slate-500/10'
                    )}>
                        {analytics.insight.color === 'positive' ? <TrendingUp className="h-8 w-8" /> :
                        analytics.insight.color === 'warning' ? <AlertCircle className="h-8 w-8" /> :
                        analytics.insight.color === 'pink' ? <Lightbulb className="h-8 w-8" /> :
                        <BarChart2 className="h-8 w-8" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                        <div>
                            <h3 className={cn("text-lg font-bold mb-1", 
                                analytics.insight.color === 'positive' ? 'text-emerald-100' : 
                                analytics.insight.color === 'warning' ? 'text-amber-100' : 
                                analytics.insight.color === 'pink' ? 'text-pink-100' : 'text-slate-100'
                            )}>
                                {analytics.insight.title}
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                {analytics.insight.text}
                            </p>
                        </div>
                        
                        {/* Tip Box */}
                        <div className="inline-flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400 border border-white/5">
                            <Lightbulb className="h-3 w-3 text-yellow-500" />
                            <span><span className="font-bold text-slate-300">Saran:</span> {analytics.insight.tip}</span>
                        </div>
                    </div>

                    {/* Mini Stats (Weekly Delta) */}
                    {analytics.trends && (
                        <div className="hidden md:flex flex-col items-end justify-center pl-4 border-l border-white/5">
                             <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Mingguan</span>
                             <div className={cn("text-2xl font-bold font-mono", 
                                analytics.trends.weeklyGrowth >= 0 ? "text-emerald-400" : "text-amber-400"
                             )}>
                                {analytics.trends.weeklyGrowth > 0 ? "+" : ""}{analytics.trends.weeklyGrowth}%
                             </div>
                             <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                {analytics.trends.weeklyGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                vs pekan lalu
                             </div>
                        </div>
                    )}
                </div>
            </div>
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
            span={2} // Card ini lebih lebar di mobile
          />
          {/* Card untuk Weakest Day (Baru) */}
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
                <h3 className="font-semibold text-slate-200">Frekuensi Ibadah</h3>
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

// Komponen Card Statistik Kecil
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