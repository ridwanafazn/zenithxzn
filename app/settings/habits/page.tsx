"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { checkUserStatus, saveAllHabits } from "@/actions/user";
import { MASTER_HABITS, TimeBlock } from "@/lib/constants";
import { 
  Loader2, 
  ArrowLeft, 
  Lock, 
  Save, 
  Check, 
  Moon, 
  Sun, 
  Sunrise, 
  Sunset, 
  CloudMoon, 
  CalendarDays,
  Droplets // Icon untuk Haid
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BLOCK_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  sepertiga_malam: { label: "Sepertiga Malam", icon: CloudMoon, color: "text-indigo-400" },
  subuh: { label: "Waktu Subuh", icon: Sunrise, color: "text-blue-400" },
  pagi_siang: { label: "Dhuha & Zuhur", icon: Sun, color: "text-amber-400" },
  sore: { label: "Waktu Asar", icon: Sun, color: "text-orange-400" },
  maghrib_isya: { label: "Maghrib & Isya", icon: Sunset, color: "text-purple-400" },
  malam_tidur: { label: "Sebelum Tidur", icon: Moon, color: "text-slate-400" },
  weekly: { label: "Mingguan", icon: CalendarDays, color: "text-emerald-400" },
  monthly: { label: "Bulanan", icon: CalendarDays, color: "text-teal-400" }
};

export default function HabitMarketplacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [draftHabits, setDraftHabits] = useState<Record<string, boolean>>({});
  
  // STATE BARU: Mode Haid
  const [isMenstruating, setIsMenstruating] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const dbUser = await checkUserStatus(user.uid);
      if (!dbUser) {
        router.push("/onboarding");
        return;
      }
      setUserData(dbUser);
      setDraftHabits(dbUser.preferences?.activeHabits || {});
      // Load status haid
      setIsMenstruating(dbUser.preferences?.isMenstruating || false);
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleToggleLocal = (habitId: string) => {
    setDraftHabits((prev) => ({
      ...prev,
      [habitId]: !prev[habitId]
    }));
  };

  const handleSave = async () => {
    if (!userData) return;
    setIsSaving(true);
    
    // Kita simpan activeHabits DAN status isMenstruating
    // Note: Kita perlu update actions/user.ts sedikit nanti untuk mengakomodir ini, 
    // tapi karena activeHabits di User.ts pakai 'Mixed', kita bisa selipkan di preferences object jika mau cara cepat,
    // atau panggil update terpisah. 
    // AGAR AMAN: Kita masukkan isMenstruating ke dalam payload preferences yang dikirim
    
    // Modifikasi sementara: Kita kirim object preferences lengkap
    const preferencesPayload = {
        activeHabits: draftHabits,
        isMenstruating: isMenstruating
    };

    // Panggil fungsi save yang sudah kita modifikasi (lihat instruksi di bawah)
    // Untuk sekarang kita pakai saveAllHabits yang ada, tapi logic backend perlu dicek.
    // Kita asumsikan saveAllHabits menerima preferences object atau kita kirim mixed.
    
    // FIX: Mari kita kirim data khusus. 
    // Karena action saveAllHabits di backend hanya update "preferences.activeHabits", 
    // kita perlu pastikan backend bisa update isMenstruating juga.
    // Tapi untuk UI ini berjalan, kita kirimkan habit dulu.
    
    // PERBAIKAN LOGIC SERVER ACTION (Client Side Trick):
    // Kita akan passing 'isMenstruating' sebagai properti khusus di dalam activeHabits sementara 
    // (JIKA backend belum support update terpisah), TAPI idealnya kita update backend.
    
    // Mari kita asumsikan backend akan kita update setelah ini.
    await saveAllHabits(userData.uid, { ...draftHabits, _isMenstruating: isMenstruating });
    
    setTimeout(() => {
        router.refresh();
        router.push("/dashboard");
    }, 800); 
  };

  const groupedHabits = MASTER_HABITS.reduce((acc, habit) => {
    if (!acc[habit.timeBlock]) acc[habit.timeBlock] = [];
    acc[habit.timeBlock].push(habit);
    return acc;
  }, {} as Record<TimeBlock, typeof MASTER_HABITS>);

  const sectionOrder: TimeBlock[] = [
    "sepertiga_malam", "subuh", "pagi_siang", "sore", "maghrib_isya", "malam_tidur", "weekly", "monthly"
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-40 selection:bg-emerald-500/30">
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />

      <div className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4">
          <Link href="/dashboard" className="rounded-full bg-slate-900/50 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-white/5">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Atur Menu Ibadah</h1>
            <p className="text-[10px] text-slate-400">Sesuaikan target harianmu</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-6 space-y-8">
        
        {/* --- FITUR WANITA: TOGGLE HAID --- */}
        {userData?.gender === "female" && (
            <div className="animate-scale-in">
                <div className={cn(
                    "flex items-center justify-between rounded-2xl border p-5 transition-all",
                    isMenstruating 
                        ? "bg-pink-950/20 border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.1)]" 
                        : "bg-slate-900/40 border-white/5"
                )}>
                    <div className="flex gap-4">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", isMenstruating ? "bg-pink-500/20 text-pink-400" : "bg-slate-800 text-slate-500")}>
                            <Droplets className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className={cn("font-bold", isMenstruating ? "text-pink-400" : "text-slate-300")}>
                                Mode Haid (Period)
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                {isMenstruating 
                                    ? "Sholat wajib akan disembunyikan. Fokus pada dzikir & shalawat." 
                                    : "Saya sedang dalam masa suci."}
                            </p>
                        </div>
                    </div>
                    
                    {/* Toggle Pink */}
                    <button
                        onClick={() => setIsMenstruating(!isMenstruating)}
                        className={cn(
                            "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300",
                            isMenstruating ? "bg-pink-500" : "bg-slate-700"
                        )}
                    >
                        <span className={cn(
                            "absolute top-1 block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300",
                            isMenstruating ? "translate-x-6" : "translate-x-1"
                        )} />
                    </button>
                </div>
            </div>
        )}

        {/* Loop per Section */}
        {sectionOrder.map((block) => {
            const habits = groupedHabits[block];
            if (!habits || habits.length === 0) return null;

            const config = BLOCK_CONFIG[block] || { label: block, icon: Sun, color: "text-slate-400" };
            const Icon = config.icon;

            return (
                <section key={block} className={cn("space-y-3 animate-scale-in transition-opacity", 
                    // Redupkan section sholat jika sedang haid
                    isMenstruating && (block === 'subuh' || block === 'pagi_siang' || block === 'sore' || block === 'maghrib_isya') 
                        ? "opacity-50 grayscale pointer-events-none" 
                        : "opacity-100"
                )}>
                    {/* ... (KODE SAMA SEPERTI SEBELUMNYA) ... */}
                    <div className="flex items-center gap-2 px-2">
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            {config.label}
                        </h3>
                    </div>

                    <div className="glass-panel overflow-hidden rounded-2xl">
                        {habits.map((habit, index) => {
                            const isWajib = habit.category === "wajib";
                            const isActive = isWajib ? true : draftHabits[habit.id] === true;
                            const isLast = index === habits.length - 1;

                            return (
                                <div 
                                    key={habit.id} 
                                    onClick={() => !isWajib && handleToggleLocal(habit.id)}
                                    className={cn(
                                        "relative flex items-center justify-between p-4 transition-all duration-200",
                                        !isLast && "border-b border-white/5",
                                        isWajib ? "cursor-default bg-slate-900/40" : "cursor-pointer hover:bg-white/5",
                                        isActive && !isWajib ? "bg-emerald-900/10" : ""
                                    )}
                                >
                                    <div className="flex flex-col gap-1 pr-4">
                                        <span className={cn(
                                            "font-medium transition-colors",
                                            isActive ? "text-slate-200" : "text-slate-500",
                                            isWajib && "text-amber-400/80"
                                        )}>
                                            {habit.title}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                isWajib 
                                                    ? "bg-amber-950/30 text-amber-500 border border-amber-900/30" 
                                                    : "bg-slate-800 text-slate-500"
                                            )}>
                                                {isWajib ? "Wajib" : "Sunnah"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {isWajib ? (
                                        <div className="p-2 text-slate-600"><Lock className="h-4 w-4" /></div>
                                    ) : (
                                        <div className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", isActive ? "bg-emerald-500" : "bg-slate-700")}>
                                            <span className={cn("absolute top-1 block h-4 w-4 transform rounded-full bg-white transition", isActive ? "translate-x-6" : "translate-x-1")} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            );
        })}
      </div>

      <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "pointer-events-auto group relative flex items-center gap-3 rounded-full px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 border border-white/10",
            "bg-gradient-to-r from-emerald-600 to-emerald-500",
            "hover:scale-105 hover:shadow-emerald-500/40 active:scale-95"
          )}
        >
          {/* ... (Tombol Save Sama) ... */}
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          <span>Simpan</span>
        </button>
      </div>
    </div>
  );
}