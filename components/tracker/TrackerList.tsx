"use client";

import { useMemo, useState, useEffect } from "react";
import { TimeBlock } from "@/lib/constants"; 
import HabitItem from "./HabitItem";
import { Sunrise, Sun, Sunset, Moon, CloudMoon, CalendarDays, Plus, Droplets } from "lucide-react";
import { getGlobalHijriOffset } from "@/actions/system";
import { generateDailyHabits, DynamicHabit } from "@/lib/habit-engine"; 
import { getSmartHijriDate } from "@/lib/utils";

interface TrackerListProps {
  userData?: any; 
  dailyLog?: any; 
  date?: string;  
  apiTimings?: any;
  onHabitToggle: (id: string) => void; 
  onCounterUpdate: (id: string, val: number) => void;
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

export default function TrackerList({ 
  userData, 
  dailyLog, 
  date = new Date().toISOString().split('T')[0],
  apiTimings,
  onHabitToggle, 
  onCounterUpdate 
}: TrackerListProps) {
  
  const [systemOffset, setSystemOffset] = useState(0);

  useEffect(() => {
    getGlobalHijriOffset().then((val) => setSystemOffset(val));
  }, []);

  const safeUserData = userData || {};
  const safeLocation = safeUserData.location || { lat: -6.2088, lng: 106.8456 };
  const safePrefs = safeUserData.preferences || {};
  const safeGender = safeUserData.gender || "male";
  const safeUid = safeUserData.uid || "guest";
  const safeLog = dailyLog || {};
  
  const finalHijriOffset = (safeUserData.hijriOffset || 0) + systemOffset;

  const { filteredHabits, hijriDateDisplay } = useMemo(() => {
     const dateObj = new Date(date); 
     
     const habits = generateDailyHabits({
        date: dateObj,
        userPreferences: safePrefs,
        location: safeLocation,
        hijriOffset: finalHijriOffset,
        apiTimings 
     });

     const hijriInfo = getSmartHijriDate(dateObj, finalHijriOffset);

     return { filteredHabits: habits, hijriDateDisplay: hijriInfo };

  }, [date, safePrefs, safeLocation, finalHijriOffset, apiTimings]);

  const groupedHabits = filteredHabits.reduce((acc, habit) => {
    if (!acc[habit.timeBlock]) acc[habit.timeBlock] = [];
    acc[habit.timeBlock].push(habit);
    return acc;
  }, {} as Record<TimeBlock, DynamicHabit[]>); 

  Object.keys(groupedHabits).forEach((key) => {
      const k = key as TimeBlock;
      groupedHabits[k].sort((a: DynamicHabit, b: DynamicHabit) => b.weight - a.weight);
  });

  const sectionOrder: TimeBlock[] = [
    "sepertiga_malam", "subuh", "pagi_siang", "sore", "maghrib_isya", "malam_tidur", "weekly", "monthly"
  ];
  
  const isMenstruating = safePrefs.isMenstruating === true;

  return (
    <div className="relative space-y-8 pb-32 pl-4">
      
      {isMenstruating && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-pink-500/20 bg-pink-950/10 p-4 backdrop-blur-sm animate-scale-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/20 text-pink-400">
                <Droplets className="h-4 w-4" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-pink-400">Mode Haid Aktif</h4>
                <p className="text-[10px] text-pink-300/70">Fokus dzikir & shalawat ya!</p>
            </div>
        </div>
      )}

      <div className="absolute right-0 top-[-20px] text-[10px] text-slate-600 font-mono">
         {hijriDateDisplay.day}-{hijriDateDisplay.month}-{hijriDateDisplay.year} H 
         {finalHijriOffset !== 0 && <span className={finalHijriOffset > 0 ? "text-emerald-500" : "text-amber-500"}> ({finalHijriOffset > 0 ? "+" : ""}{finalHijriOffset})</span>}
      </div>

      <div className="absolute left-[27px] top-4 bottom-0 w-px border-l border-dashed border-slate-800/50 z-0 hidden md:block"></div>

      {sectionOrder.map((block) => {
        const habits = groupedHabits[block];
        if (!habits || habits.length === 0) return null;

        const config = TIME_BLOCK_CONFIG[block] || { label: block, icon: Sun, color: "text-slate-400" };
        const Icon = config.icon;

        return (
          <section key={block} className="relative z-10 animate-scale-in">
            <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 bg-slate-950/80 px-4 py-3 backdrop-blur-xl border-b border-white/5 shadow-sm transition-all">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/50 border border-white/10 ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold tracking-wide text-slate-200 uppercase">
                {config.label}
              </h3>
            </div>
            
            <div className="grid gap-3">
              {habits.map((habit: DynamicHabit) => {
                const isCompleted = safeLog.checklists?.includes(habit.id) || false;
                const currentCount = safeLog.counters?.[habit.id] || 0;
                
                let displayHabit = habit;
                const dayOfWeek = new Date(date).getDay();
                if (habit.id === "sholat_zuhur" && dayOfWeek === 5 && safeGender === "male") {
                    displayHabit = { ...habit, title: "Sholat Jumat" };
                }

                return (
                  <HabitItem
                    key={`${date}-${habit.id}`}
                    habit={displayHabit}
                    userId={safeUid} 
                    date={date}
                    isCompleted={isCompleted}
                    currentCount={currentCount}
                    onToggle={() => onHabitToggle(habit.id)} 
                    onCountChange={(val) => onCounterUpdate(habit.id, val)} 
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center hover:bg-slate-900/50 transition-colors">
        <a href="/settings/habits" className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-6 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
          <Plus className="h-4 w-4" />
          Atur Menu Ibadah
        </a>
      </div>
    </div>
  );
}