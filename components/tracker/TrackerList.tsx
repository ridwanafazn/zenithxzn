import { MASTER_HABITS, TimeBlock } from "@/lib/constants";
import HabitItem from "./HabitItem";
import { Sunrise, Sun, Sunset, Moon, CloudMoon, CalendarDays, Plus, Droplets } from "lucide-react";

interface TrackerListProps {
  userData: {
    uid: string;
    preferences?: {
        isMenstruating?: boolean;
        activeHabits: Record<string, boolean>;
    };
  };
  dailyLog: any;
  date: string;
}

// Map Icon ke TimeBlock untuk visualisasi lebih kaya
const TIME_BLOCK_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  sepertiga_malam: { label: "Sepertiga Malam", icon: CloudMoon, color: "text-indigo-400" },
  subuh: { label: "Waktu Subuh", icon: Sunrise, color: "text-blue-400" },
  pagi_siang: { label: "Dhuha & Zuhur", icon: Sun, color: "text-amber-400" },
  sore: { label: "Waktu Asar", icon: Sun, color: "text-orange-400" },
  maghrib_isya: { label: "Maghrib & Isya", icon: Sunset, color: "text-purple-400" },
  malam_tidur: { label: "Sebelum Tidur", icon: Moon, color: "text-slate-400" },
  weekly: { label: "Mingguan", icon: CalendarDays, color: "text-emerald-400" },
  monthly: { label: "Bulanan", icon: CalendarDays, color: "text-teal-400" }
};

export default function TrackerList({ userData, dailyLog, date }: TrackerListProps) {
  // Ambil status haid dari preferences (default false jika tidak ada)
  const isMenstruating = userData.preferences?.isMenstruating === true;

  // 1. Logic Filtering Utama
  const activeHabitsList = MASTER_HABITS.filter((habit) => {
    
    // --- A. LOGIC HAID (FILTER KERAS) ---
    // Jika sedang haid, sembunyikan semua Sholat (Wajib/Sunnah) dan Puasa.
    if (isMenstruating) {
        const id = habit.id.toLowerCase();
        
        // Daftar kata kunci amalan yang HARAM dilakukan saat haid
        const forbiddenKeywords = [
            "subuh", "zuhur", "ashar", "maghrib", "isya", // Sholat Wajib
            "tahajjud", "witir", "dhuha", "rawatib",      // Sholat Sunnah
            "sholat",                                     // General sholat
            "puasa"                                       // Puasa
        ];

        // Cek apakah ID habit mengandung kata terlarang
        const isForbidden = forbiddenKeywords.some(keyword => id.includes(keyword));
        
        if (isForbidden) return false; // Skip/Sembunyikan
    }

    // --- B. LOGIC WAJIB ---
    // Jika habit wajib (dan lolos filter haid di atas), selalu tampilkan
    if (habit.category === "wajib") return true;

    // --- C. LOGIC SUNNAH ---
    // Jika sunnah, cek apakah user mengaktifkannya di Settings
    if (habit.category === "sunnah") {
        return userData.preferences?.activeHabits?.[habit.id] === true;
    }

    return false;
  });

  // 2. Grouping berdasarkan Waktu
  const groupedHabits = activeHabitsList.reduce((acc, habit) => {
    if (!acc[habit.timeBlock]) acc[habit.timeBlock] = [];
    acc[habit.timeBlock].push(habit);
    return acc;
  }, {} as Record<TimeBlock, typeof MASTER_HABITS>);

  const sectionOrder: TimeBlock[] = [
    "sepertiga_malam", "subuh", "pagi_siang", "sore", "maghrib_isya", "malam_tidur", "weekly", "monthly"
  ];

  return (
    <div className="relative space-y-8 pb-32 pl-4">
      
      {/* Visual Indicator Jika Mode Haid Aktif */}
      {isMenstruating && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-pink-500/20 bg-pink-950/10 p-4 backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/20 text-pink-400">
                <Droplets className="h-4 w-4" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-pink-400">Mode Haid Aktif</h4>
                <p className="text-[10px] text-pink-300/70">Sholat & Puasa disembunyikan. Fokus dzikir & shalawat ya!</p>
            </div>
        </div>
      )}

      {/* Garis Timeline Vertikal (Visual Connector) */}
      <div className="absolute left-[27px] top-4 bottom-0 w-px border-l border-dashed border-slate-800/50 z-0 hidden md:block"></div>

      {sectionOrder.map((block) => {
        const habits = groupedHabits[block];
        if (!habits || habits.length === 0) return null;

        const config = TIME_BLOCK_CONFIG[block] || { label: block, icon: Sun, color: "text-slate-400" };
        const Icon = config.icon;

        return (
          <section key={block} className="relative z-10 animate-scale-in">
            {/* Sticky Header Glass */}
            <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 bg-slate-950/80 px-4 py-3 backdrop-blur-xl border-b border-white/5 shadow-sm transition-all">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/50 border border-white/10 ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold tracking-wide text-slate-200 uppercase">
                {config.label}
              </h3>
              <div className="ml-auto text-[10px] font-mono text-slate-600 bg-slate-900 px-2 py-1 rounded">
                {habits.length}
              </div>
            </div>
            
            <div className="grid gap-3">
              {habits.map((habit) => {
                const isCompleted = dailyLog?.checklists?.includes(habit.id) || false;
                const currentCount = dailyLog?.counters?.[habit.id] || 0;

                return (
                  <HabitItem
                    key={habit.id}
                    habit={habit}
                    userId={userData.uid}
                    date={date}
                    isCompleted={isCompleted}
                    currentCount={currentCount}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Empty State / Add More */}
      <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center hover:bg-slate-900/50 transition-colors">
        <p className="mb-4 text-sm text-slate-500">
            {isMenstruating 
                ? "Ingin menambah amalan ringan lainnya?" 
                : "Ingin menambah amalan sunnah lainnya?"}
        </p>
        <a 
          href="/settings/habits" 
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-6 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
        >
          <Plus className="h-4 w-4" />
          Atur Menu Ibadah
        </a>
      </div>
    </div>
  );
}