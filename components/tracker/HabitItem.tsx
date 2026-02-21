"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { Check, Plus, Minus, Lock, Clock, ShieldCheck, Maximize2, BookOpen } from "lucide-react";
import { DynamicHabit } from "@/lib/habit-engine"; 
import { toggleHabit, updateCounter } from "@/actions/log";
import { cn } from "@/lib/utils";

interface HabitItemProps {
  habit: DynamicHabit; 
  userId: string;
  date: string;
  isCompleted: boolean;
  currentCount?: number;
  onToggle: () => void;       // <--- TAMBAHKAN INI
  onCountChange: (val: number) => void; // <--- TAMBAHKAN INI
}

// HELPER: Format Date ke YYYY-MM-DD lokal
const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function HabitItem({ 
  habit, 
  userId, 
  date, 
  isCompleted, 
  currentCount = 0,
  onToggle,    
  onCountChange
}: HabitItemProps) {
  const router = useRouter();
  const [done, setDone] = useState(isCompleted);
  const [count, setCount] = useState(currentCount);
  const [loading, setLoading] = useState(false);
  
  const [isLocked, setIsLocked] = useState(false);
  const [timeUntilUnlock, setTimeUntilUnlock] = useState("");
  const [animatePop, setAnimatePop] = useState(false);

  const isWajib = habit.category === "wajib";
  const isRawatib = habit.tags?.includes("rawatib");

  const isPastLog = date < formatDateLocal(new Date());

  // --- 🔴 THE WATCHERS (SINKRONISASI PAKSA) 🔴 ---
  // Memaksa UI untuk langsung update jika data dari database terlambat datang
  useEffect(() => {
      setDone(isCompleted);
  }, [isCompleted]);

  useEffect(() => {
      setCount(currentCount);
  }, [currentCount]);
  // -----------------------------------------------

  useEffect(() => {
    const formatTimeRemaining = (diffMs: number) => {
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      if (totalMinutes <= 0) return "";
      if (totalMinutes < 60) return `${totalMinutes}m`;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}j ${minutes}m`;
    };

    const checkLockStatus = () => {
      if (isPastLog) {
          setIsLocked(false);
          setTimeUntilUnlock("");
          return;
      }

      if (habit.unlockTime) {
          const now = new Date().getTime();
          const unlockTimeMs = habit.unlockTime.getTime();
          
          if (now < unlockTimeMs && !isCompleted) {
              setIsLocked(true);
              setTimeUntilUnlock(formatTimeRemaining(unlockTimeMs - now));
          } else {
              setIsLocked(false);
              setTimeUntilUnlock("");
          }
          return;
      }
      
      if (habit.startHour !== undefined) {
          const currentHour = new Date().getHours();
          const isTooEarly = currentHour < habit.startHour;
          
          if (isTooEarly && !isCompleted) {
              setIsLocked(true);
              setTimeUntilUnlock(`Tunggu jam ${habit.startHour}:00`);
          } else {
              setIsLocked(false);
              setTimeUntilUnlock("");
          }
      }
    };

    checkLockStatus();
    
    if (!isPastLog) {
        const interval = setInterval(checkLockStatus, 60000); 
        return () => clearInterval(interval);
    }
  }, [habit.startHour, habit.unlockTime, isCompleted, isPastLog]);

  const handleToggle = async () => {
    if (isLocked || loading) return;
    onToggle(); 
  
    const newState = !done;
    setDone(newState);
    if (newState) setAnimatePop(true);
    
    setTimeout(() => setAnimatePop(false), 300);
    setLoading(true);
    
    const res = await toggleHabit(userId, date, habit.id);
    if (!res.success) setDone(!newState); 
    setLoading(false);
  };

  const handleIncrement = async (val: number) => {
    if (isLocked) return;
    const newCount = count + val;
    if (newCount < 0) return;

    onCountChange(newCount);
    
    setCount(newCount);
    await updateCounter(userId, date, habit.id, newCount);
  };

  const progressPercent = habit.target ? Math.min(100, (count / habit.target) * 100) : 0;
  
  const formattedUnlockTime = habit.unlockTime 
      ? habit.unlockTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : null;

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
      isWajib ? "border-amber-500/20 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]" 
        : isLocked ? "border-white/5 bg-slate-900/20 opacity-60 grayscale" 
        : done ? "border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
        : "glass-card hover:bg-slate-800/60"
    )}>
      
      {habit.type === "counter" && habit.target && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      )}

      {isWajib && (
          <div className="absolute top-0 right-0 p-1.5 bg-amber-500/10 rounded-bl-xl border-l border-b border-amber-500/20 z-10">
              <ShieldCheck className="h-3 w-3 text-amber-500" />
          </div>
      )}

      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-[60%]">
          <button
            onClick={handleToggle}
            disabled={loading || isLocked}
            className={cn(
              "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-300",
              isLocked ? "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed"
                : done ? isWajib ? "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/30 rotate-0" 
                      : "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-0"
                  : "border-slate-700/50 bg-slate-800/30 text-transparent hover:border-emerald-500/50 hover:bg-slate-800",
              animatePop && "animate-pop"
            )}
          >
            {isLocked ? <Lock className="h-5 w-5" /> : <Check className={cn("h-6 w-6 stroke-[3] transition-all duration-300", done ? "scale-100 opacity-100" : "scale-50 opacity-0")} />}
          </button>

          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className={cn(
              "text-base font-semibold transition-colors duration-300 flex items-center gap-2 truncate",
              done ? isWajib ? "text-amber-400 decoration-amber-500/30" : "text-emerald-400 line-through decoration-emerald-500/30" : isWajib ? "text-white" : "text-slate-100",
              isLocked && "text-slate-500"
            )}>
              <span className="truncate">{habit.title}</span>
              
              {/* Badge Rawatib */}
              {isRawatib && !isLocked && !done && (
                  <span className="shrink-0 hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono tracking-tight">
                      Rawatib
                  </span>
              )}

              {/* NEW: Tombol Guide URL (Buku Panduan) */}
              {habit.guideUrl && (
                  <a 
                      href={habit.guideUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={cn(
                          "shrink-0 inline-flex items-center justify-center p-1.5 rounded-lg transition-all active:scale-95",
                          done ? "text-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400" : "text-slate-400 hover:bg-blue-500/10 hover:text-blue-400"
                      )}
                      title="Buka Panduan / Bacaan"
                  >
                      <BookOpen className="h-4 w-4" />
                  </a>
              )}
            </span>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
               {isLocked ? (
                 <span className="flex items-center gap-1.5 text-amber-500/80 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-500/20">
                   <Clock className="h-3 w-3" /> 
                   {formattedUnlockTime ? `Adzan ${formattedUnlockTime}` : timeUntilUnlock}
                 </span>
               ) : habit.target ? (
                 <span className="flex items-center gap-1">
                   Target: <span className="text-slate-200 font-mono">{habit.target}</span> {habit.unit}
                 </span>
               ) : (
                 <span className="text-slate-500 truncate flex items-center gap-1">
                    {isPastLog && formattedUnlockTime ? (
                        <><Clock className="h-3 w-3" /> Adzan {formattedUnlockTime}</>
                    ) : (
                        isWajib ? "Wajib Dikerjakan" : "Sunnah Muakkad"
                    )}
                 </span>
               )}
            </div>
          </div>
        </div>

        {habit.type === "counter" && !isLocked && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <div className="flex items-center gap-1 rounded-xl bg-slate-950/50 p-1 border border-white/5 backdrop-blur-sm shadow-inner">
              <button onClick={() => handleIncrement(-1)} className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors active:scale-90 touch-manipulation">
                <Minus className="h-4 w-4" />
              </button>
              <div className="min-w-[32px] text-center font-mono font-bold text-slate-200 text-sm">{count}</div>
              <button onClick={() => handleIncrement(1)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-90 touch-manipulation">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => router.push(`/focus/${habit.id}`)} className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-800/50 text-slate-400 border border-white/5 hover:bg-slate-700 hover:text-white transition-all active:scale-95 touch-manipulation shadow-sm" title="Buka Mode Fokus Layar Penuh">
                <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {done && <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />}
    </div>
  );
}