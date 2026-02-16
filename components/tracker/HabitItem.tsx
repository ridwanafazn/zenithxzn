"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Minus, Lock, Clock, Flame } from "lucide-react";
import { HabitDefinition } from "@/lib/constants";
import { toggleHabit, updateCounter } from "@/actions/log";
import { cn } from "@/lib/utils";

interface HabitItemProps {
  habit: HabitDefinition;
  userId: string;
  date: string;
  isCompleted: boolean;
  currentCount?: number;
}

export default function HabitItem({ habit, userId, date, isCompleted, currentCount = 0 }: HabitItemProps) {
  const [done, setDone] = useState(isCompleted);
  const [count, setCount] = useState(currentCount);
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [animatePop, setAnimatePop] = useState(false);

  useEffect(() => {
    const checkLockStatus = () => {
      if (habit.startHour === undefined) return;
      const currentHour = new Date().getHours();
      
      // Lock logic: Hanya lock jika BELUM selesai dan waktu belum sampai
      const isTooEarly = currentHour < habit.startHour;
      if (isTooEarly && !isCompleted) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    };

    checkLockStatus();
    // Cek setiap menit
    const interval = setInterval(checkLockStatus, 60000); 
    return () => clearInterval(interval);
  }, [habit.startHour, isCompleted]);

  const handleToggle = async () => {
    if (isLocked || loading) return;

    // 1. Optimistic UI Update
    const newState = !done;
    setDone(newState);
    if (newState) setAnimatePop(true);
    
    // Reset animasi setelah selesai
    setTimeout(() => setAnimatePop(false), 300);

    setLoading(true);
    
    // 2. Server Action
    const res = await toggleHabit(userId, date, habit.id);
    
    // 3. Rollback jika gagal
    if (!res.success) {
        setDone(!newState); 
        // Tambahkan toast error disini jika ada library toast
    }
    setLoading(false);
  };

  const handleIncrement = async (val: number) => {
    if (isLocked) return;
    const newCount = count + val;
    if (newCount < 0) return;
    
    setCount(newCount);
    // Debounce bisa ditambahkan disini untuk performa lebih baik
    await updateCounter(userId, date, habit.id, newCount);
  };

  // Kalkulasi persentase untuk progress bar counter
  const progressPercent = habit.target ? Math.min(100, (count / habit.target) * 100) : 0;

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
      // Styles berdasarkan state
      isLocked 
        ? "border-white/5 bg-slate-900/20 opacity-60 grayscale" 
        : done 
          ? "border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
          : "glass-card hover:bg-slate-800/60"
    )}>
      
      {/* Background Progress Bar (Subtle) untuk Counter */}
      {habit.type === "counter" && habit.target && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      )}

      <div className="flex items-center justify-between gap-4">
        
        {/* Kiri: Icon & Teks */}
        <div className="flex items-center gap-4 flex-1">
          {/* Custom Checkbox Button */}
          <button
            onClick={handleToggle}
            disabled={loading || isLocked}
            className={cn(
              "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-300",
              isLocked
                ? "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed"
                : done
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-0"
                  : "border-slate-700/50 bg-slate-800/30 text-transparent hover:border-emerald-500/50 hover:bg-slate-800",
              animatePop && "animate-pop"
            )}
          >
            {isLocked ? (
              <Lock className="h-5 w-5" />
            ) : (
              <Check className={cn(
                "h-6 w-6 stroke-[3] transition-all duration-300",
                done ? "scale-100 opacity-100" : "scale-50 opacity-0"
              )} />
            )}
          </button>

          <div className="flex flex-col gap-0.5">
            <span className={cn(
              "text-base font-semibold transition-colors duration-300",
              done ? "text-emerald-400 line-through decoration-emerald-500/30" : "text-slate-100",
              isLocked && "text-slate-500"
            )}>
              {habit.title}
            </span>
            
            <div className="flex items-center gap-2 text-xs text-slate-400">
               {isLocked && habit.startHour !== undefined ? (
                 <span className="flex items-center gap-1 text-amber-500/80 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-500/20">
                   <Clock className="h-3 w-3" /> {habit.startHour}:00
                 </span>
               ) : habit.target ? (
                 <span className="flex items-center gap-1">
                   Target: <span className="text-slate-200 font-mono">{habit.target}</span> {habit.unit}
                 </span>
               ) : (
                 <span className="text-slate-500">Istiqomah</span>
               )}
            </div>
          </div>
        </div>

        {/* Kanan: Counter Controls (Jika tipe counter) */}
        {habit.type === "counter" && !isLocked && (
          <div className="flex items-center gap-1 rounded-xl bg-slate-950/50 p-1 border border-white/5 backdrop-blur-sm shadow-inner">
            <button 
              onClick={() => handleIncrement(-1)} 
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors active:scale-90"
            >
              <Minus className="h-4 w-4" />
            </button>
            
            <div className="min-w-[40px] text-center font-mono font-bold text-slate-200">
              {count}
            </div>
            
            <button 
              onClick={() => handleIncrement(1)} 
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Efek Garis Bersinar (Shimmer) saat Done */}
      {done && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      )}
    </div>
  );
}