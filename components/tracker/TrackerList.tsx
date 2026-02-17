"use client";

import { useMemo, useState, useEffect } from "react";
import { MASTER_HABITS, TimeBlock } from "@/lib/constants";
import HabitItem from "./HabitItem";
import { Sunrise, Sun, Sunset, Moon, CloudMoon, CalendarDays, Plus, Droplets } from "lucide-react";
import { getSmartHijriDate } from "@/lib/utils";
import { getGlobalHijriOffset } from "@/actions/system";

interface TrackerListProps {
  userData: {
    uid: string;
    gender?: "male" | "female";
    preferences?: {
        isMenstruating?: boolean;
        activeHabits: Record<string, boolean>;
    };
  };
  dailyLog: any;
  date: string;
}

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
  // State untuk Offset Global
  const [hijriOffset, setHijriOffset] = useState(0);

  // Fetch Global Offset saat mount
  useEffect(() => {
    getGlobalHijriOffset().then((val) => setHijriOffset(val));
  }, []);

  // Parsing tanggal hari ini
  const currentDateObj = new Date(date);
  const dayOfWeek = currentDateObj.getDay(); // 0 (Ahad) - 6 (Sabtu)
  
  // Kalkulasi Hijriyah Cerdas (Include Maghrib Logic + Offset)
  const hijriDate = useMemo(() => 
    getSmartHijriDate(currentDateObj, hijriOffset), 
  [date, hijriOffset]);

  const isMenstruating = userData.preferences?.isMenstruating === true;
  const isFriday = dayOfWeek === 5;
  const isMale = userData.gender === "male";

  // 1. Logic Filtering Utama (The Brain)
  const activeHabitsList = MASTER_HABITS.filter((habit) => {
    
    // --- A. LOGIC HAID ---
    if (isMenstruating && habit.isPhysical) return false;

    // --- B. LOGIC WAKTU SPESIFIK (TIME ENGINE) ---
    
    // Filter by Days (Senin, Kamis, Jumat, dll)
    if (habit.availableDays && !habit.availableDays.includes(dayOfWeek)) {
        return false;
    }

    // Filter by Hijri Date (Ayyamul Bidh)
    if (habit.hijriDates && !habit.hijriDates.includes(hijriDate.day)) {
        return false;
    }

    // Filter by Hijri Month (Ramadhan)
    if (habit.hijriMonth && habit.hijriMonth !== hijriDate.month) {
        return false;
    }

    // --- C. LOGIC WAJIB ---
    if (habit.category === "wajib") return true;

    // --- D. LOGIC SUNNAH (User Preference) ---
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

  // 3. Sorting (Wajib di atas)
  Object.keys(groupedHabits).forEach((key) => {
      const k = key as TimeBlock;
      groupedHabits[k].sort((a, b) => b.weight - a.weight);
  });

  const sectionOrder: TimeBlock[] = [
    "sepertiga_malam", "subuh", "pagi_siang", "sore", "maghrib_isya", "malam_tidur", "weekly", "monthly"
  ];

  return (
    <div className="relative space-y-8 pb-32 pl-4">
      
      {/* Visual Indicator Jika Mode Haid Aktif */}
      {isMenstruating && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-pink-500/20 bg-pink-950/10 p-4 backdrop-blur-sm animate-scale-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/20 text-pink-400">
                <Droplets className="h-4 w-4" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-pink-400">Mode Haid Aktif</h4>
                <p className="text-[10px] text-pink-300/70">Sholat & Puasa disembunyikan. Fokus dzikir & shalawat ya!</p>
            </div>
        </div>
      )}

      {/* Info Tanggal Hijriyah Kecil (Debug/Info) */}
      <div className="absolute right-0 top-[-20px] text-[10px] text-slate-600 font-mono">
         {hijriDate.day}-{hijriDate.month}-{hijriDate.year} H 
         {hijriOffset !== 0 && <span className={hijriOffset > 0 ? "text-emerald-500" : "text-amber-500"}> ({hijriOffset > 0 ? "+" : ""}{hijriOffset})</span>}
      </div>

      {/* Garis Timeline Vertikal */}
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
            </div>
            
            <div className="grid gap-3">
              {habits.map((habit) => {
                const isCompleted = dailyLog?.checklists?.includes(habit.id) || false;
                const currentCount = dailyLog?.counters?.[habit.id] || 0;

                // --- ADAPTASI NAMA (Dynamic Label) ---
                let displayHabit = habit;
                if (habit.id === "sholat_zuhur" && isFriday && isMale) {
                    displayHabit = { ...habit, title: "Sholat Jumat" };
                }

                return (
                  <HabitItem
                    key={habit.id}
                    habit={displayHabit}
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