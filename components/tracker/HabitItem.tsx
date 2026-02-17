"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { Check, Plus, Minus, Lock, Clock, ShieldCheck, Maximize2 } from "lucide-react";
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
  const router = useRouter();
  const [done, setDone] = useState(isCompleted);
  const [count, setCount] = useState(currentCount);
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [animatePop, setAnimatePop] = useState(false);

  // Helper Identifikasi Tipe
  const isWajib = habit.category === "wajib";
  const isRawatib = habit.tags?.includes("rawatib");

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
      // STYLING WAJIB vs SUNNAH
      isWajib 
        ? "border-amber-500/20 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]" 
        : isLocked 
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

      {/* Indikator Wajib (Pojok Kanan Atas) */}
      {isWajib && (
          <div className="absolute top-0 right-0 p-1.5 bg-amber-500/10 rounded-bl-xl border-l border-b border-amber-500/20 z-10">
              <ShieldCheck className="h-3 w-3 text-amber-500" />
          </div>
      )}

      {/* --- FLEX CONTAINER UTAMA (RESPONSIVE) --- */}
      {/* Di HP: flex-wrap agar tombol kontrol bisa turun ke bawah jika sempit */}
      {/* Di Laptop: flex-nowrap agar sejajar */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
        
        {/* AREA KIRI: Checkbox & Judul */}
        <div className="flex items-center gap-4 flex-1 min-w-[60%]">
          
          {/* Custom Checkbox Button */}
          <button
            onClick={handleToggle}
            disabled={loading || isLocked}
            className={cn(
              "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-300",
              isLocked
                ? "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed"
                : done
                  ? isWajib 
                      ? "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/30 rotate-0" 
                      : "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-0"
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

          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className={cn(
              "text-base font-semibold transition-colors duration-300 flex items-center gap-2 truncate",
              done 
                ? isWajib ? "text-amber-400 decoration-amber-500/30" : "text-emerald-400 line-through decoration-emerald-500/30" 
                : isWajib ? "text-white" : "text-slate-100",
              isLocked && "text-slate-500"
            )}>
              {habit.title}
              {/* Badge Rawatib */}
              {isRawatib && !isLocked && !done && (
                  <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono tracking-tight">
                      Rawatib
                  </span>
              )}
            </span>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
               {isLocked && habit.startHour !== undefined ? (
                 <span className="flex items-center gap-1 text-amber-500/80 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-500/20">
                   <Clock className="h-3 w-3" /> {habit.startHour}:00
                 </span>
               ) : habit.target ? (
                 <span className="flex items-center gap-1">
                   Target: <span className="text-slate-200 font-mono">{habit.target}</span> {habit.unit}
                 </span>
               ) : (
                 <span className="text-slate-500 truncate">
                    {isWajib ? "Wajib Dikerjakan" : "Sunnah Muakkad"}
                 </span>
               )}
            </div>
          </div>
        </div>

        {/* AREA KANAN: Counter Controls & Navigasi Fokus */}
        {/* ml-auto di HP memastikan dia nempel kanan */}
        {habit.type === "counter" && !isLocked && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            
            {/* Tombol Manual +/- */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-950/50 p-1 border border-white/5 backdrop-blur-sm shadow-inner">
              <button 
                onClick={() => handleIncrement(-1)} 
                className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors active:scale-90 touch-manipulation"
              >
                <Minus className="h-4 w-4" />
              </button>
              
              <div className="min-w-[32px] text-center font-mono font-bold text-slate-200 text-sm">
                {count}
              </div>
              
              <button 
                onClick={() => handleIncrement(1)} 
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-90 touch-manipulation"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Tombol Masuk Mode Fokus (Sekarang SELALU Terlihat) */}
            <button 
                onClick={() => router.push(`/focus/${habit.id}`)}
                className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-800/50 text-slate-400 border border-white/5 hover:bg-slate-700 hover:text-white transition-all active:scale-95 touch-manipulation shadow-sm"
                title="Buka Mode Fokus Layar Penuh"
            >
                <Maximize2 className="h-5 w-5" />
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