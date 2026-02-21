"use client";

import { useMemo, useState, useEffect } from "react";
import { TimeBlock } from "@/lib/constants"; 
import HabitItem from "./HabitItem";
import { Sunrise, Sun, Sunset, Moon, CloudMoon, CalendarDays, Plus, Droplets, Infinity as InfinityIcon, ChevronDown } from "lucide-react";
import { getGlobalHijriOffset } from "@/actions/system";
import { generateDailyHabits, DynamicHabit } from "@/lib/habit-engine"; 
import { getSmartHijriDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  monthly: { label: "Bulanan", icon: CalendarDays, color: "text-teal-400" },
  kapan_saja: { label: "Kapan Saja (Fleksibel)", icon: InfinityIcon, color: "text-blue-400" } // Tambahan config
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
  
  // --- STATE ACCORDION ---
  const [isFlexibleOpen, setIsFlexibleOpen] = useState(false);

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

  // Kapan_saja dihilangkan dari order utama agar tidak dirender berurutan dengan yang lain
  const sectionOrder: TimeBlock[] = [
    "sepertiga_malam", "subuh", "pagi_siang", "sore", "maghrib_isya", "malam_tidur", "weekly", "monthly"
  ];
  
  const isMenstruating = safeGender === "female" && safePrefs.isMenstruating === true;

  // --- HELPER UNTUK ACCORDION FLEKSIBEL ---
  const flexibleHabits = groupedHabits["kapan_saja"] || [];
  const completedFlexibleCount = flexibleHabits.filter(h => safeLog.checklists?.includes(h.id)).length;
  const isAllFlexibleDone = flexibleHabits.length > 0 && completedFlexibleCount === flexibleHabits.length;

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

      {/* --- RENDER BLOK WAKTU UTAMA --- */}
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

      {/* --- NEW: RENDER ACCORDION AMALAN FLEKSIBEL --- */}
      {flexibleHabits.length > 0 && (
          <section className="relative z-10 pt-4 border-t border-dashed border-white/10 animate-scale-in">
             <button 
                onClick={() => setIsFlexibleOpen(!isFlexibleOpen)}
                className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
                    isAllFlexibleDone 
                        ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                        : "bg-slate-900/50 border-white/5 hover:bg-slate-800/80 text-slate-300"
                )}
             >
                 <div className="flex items-center gap-3">
                     <div className={cn("p-2 rounded-lg", isAllFlexibleDone ? "bg-emerald-500/10" : "bg-blue-500/10 text-blue-400")}>
                         <InfinityIcon className="h-5 w-5" />
                     </div>
                     <div className="text-left">
                         <h3 className="text-sm font-bold tracking-wide uppercase">Amalan Fleksibel</h3>
                         <p className="text-[10px] opacity-70">
                            {completedFlexibleCount} dari {flexibleHabits.length} selesai
                         </p>
                     </div>
                 </div>
                 <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isFlexibleOpen ? "rotate-180" : "rotate-0")} />
             </button>

             {/* Konten Accordion */}
             <div className={cn(
                 "grid gap-3 transition-all duration-300 overflow-hidden",
                 isFlexibleOpen ? "mt-4 opacity-100 max-h-[1000px]" : "mt-0 opacity-0 max-h-0"
             )}>
                 {flexibleHabits.map((habit: DynamicHabit) => {
                    const isCompleted = safeLog.checklists?.includes(habit.id) || false;
                    const currentCount = safeLog.counters?.[habit.id] || 0;

                    return (
                        <HabitItem
                            key={`${date}-${habit.id}-flex`}
                            habit={habit}
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
      )}

      {/* --- TOMBOL ATUR MENU IBADAH --- */}
      <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center hover:bg-slate-900/50 transition-colors">
        <a href="/settings/habits" className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-6 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
          <Plus className="h-4 w-4" />
          Atur Menu Ibadah
        </a>
      </div>
    </div>
  );
}