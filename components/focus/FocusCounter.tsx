"use client";

import { useState, useEffect, useRef } from "react";
import { updateCounter } from "@/actions/log";
import { useRouter } from "next/navigation";
import { Save, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusCounterProps {
  habit: any;
  initialCount: number;
  userId: string;
}

export default function FocusCounter({ habit, initialCount, userId }: FocusCounterProps) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [isSaving, setIsSaving] = useState(false);
  const [ripple, setRipple] = useState<{x:number, y:number, id:number}[]>([]); // Efek sentuh
  
  // Target
  const target = habit.target || 33; // Default 33 jika tidak ada target
  const percentage = Math.min(100, (count / target) * 100);
  
  // Audio Effect (Opsional, uncomment jika punya file mp3)
  // const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fungsi Getar (Haptic)
  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15); // Getar pendek 15ms
    }
  };

  // Handle Tap Utama
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Mencegah double tap zoom di mobile
    // e.preventDefault(); 
    
    // Tambah hitungan
    setCount((prev) => prev + 1);
    triggerHaptic();

    // Efek Ripple Visual
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const newRipple = { x: clientX, y: clientY, id: Date.now() };
    setRipple((prev) => [...prev, newRipple]);
    
    // Hapus ripple setelah animasi selesai (500ms)
    setTimeout(() => {
        setRipple((prev) => prev.filter(r => r.id !== newRipple.id));
    }, 500);
  };

  // Fungsi Simpan ke Database
  const handleSave = async () => {
    setIsSaving(true);
    const date = new Date().toISOString().split("T")[0];
    
    try {
        await updateCounter(userId, date, habit.id, count);
        router.push("/dashboard");
    } catch (error) {
        console.error("Gagal menyimpan", error);
        setIsSaving(false);
    }
  };

  // Fungsi Reset
  const handleReset = () => {
    if (confirm("Ulangi hitungan dari nol?")) {
        setCount(0);
        triggerHaptic();
    }
  };

  // Kalkulasi Lingkaran Progress (SVG)
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-full max-w-md flex flex-col items-center gap-12">
      
      {/* 1. Main Display Area (Tap Zone) */}
      <div 
        className="relative group cursor-pointer select-none touch-manipulation"
        onClick={handleTap}
      >
        {/* Lingkaran Progress Background */}
        <div className="relative flex items-center justify-center h-80 w-80">
            {/* SVG Ring */}
            <svg className="absolute inset-0 h-full w-full -rotate-90 transform drop-shadow-2xl">
                {/* Track */}
                <circle
                    cx="160" cy="160" r={radius}
                    className="stroke-slate-800 fill-slate-900/50"
                    strokeWidth="20"
                />
                {/* Progress Indicator */}
                <circle
                    cx="160" cy="160" r={radius}
                    className={cn(
                        "transition-all duration-300 ease-out",
                        percentage >= 100 ? "stroke-emerald-500" : "stroke-emerald-500"
                    )}
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    fill="transparent"
                />
            </svg>
            
            {/* Angka Utama */}
            <div className="z-10 text-center flex flex-col items-center transition-transform active:scale-95 duration-100">
                <span className="text-7xl font-bold text-white font-mono tracking-tighter">
                    {count}
                </span>
                <span className="text-sm text-slate-400 mt-2 font-medium uppercase tracking-widest">
                    {habit.unit || "Kali"}
                </span>
                {percentage >= 100 && (
                    <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 animate-bounce">
                        <CheckCircle2 className="h-3 w-3" /> Target Tercapai
                    </div>
                )}
            </div>

            {/* Efek Ripple (Visual Feedback) */}
            {ripple.map((r) => (
                <span
                    key={r.id}
                    className="absolute rounded-full bg-white/10 pointer-events-none animate-ripple"
                    style={{
                        left: '50%', // Ripple muncul dari tengah lingkaran agar rapi
                        top: '50%',
                        width: '10px',
                        height: '10px',
                        transform: 'translate(-50%, -50%)' 
                    }}
                />
            ))}
        </div>
        
        {/* Instruksi Kecil */}
        <p className="mt-8 text-center text-slate-500 text-sm animate-pulse">
            Ketuk lingkaran untuk menghitung
        </p>
      </div>

      {/* 2. Judul & Target info */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-white">{habit.title}</h1>
        <p className="text-slate-400">Target Harian: <span className="text-emerald-400 font-mono">{target}</span></p>
      </div>

      {/* 3. Action Buttons */}
      <div className="flex w-full items-center justify-center gap-4 px-8">
        <button
            onClick={handleReset}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all hover:bg-slate-700 hover:text-white active:scale-95 border border-white/5"
            title="Reset Hitungan"
        >
            <RotateCcw className="h-6 w-6" />
        </button>

        <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex flex-1 h-14 items-center justify-center gap-2 rounded-full bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isSaving ? "Menyimpan..." : (
                <>
                    <Save className="h-5 w-5" />
                    Simpan
                </>
            )}
        </button>
      </div>
      
      {/* CSS Animation untuk Ripple (Tambahkan di globals.css nanti idealnya, tapi inline style works too for MVP) */}
      <style jsx>{`
        @keyframes ripple {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0.5; }
            100% { transform: translate(-50%, -50%) scale(20); opacity: 0; }
        }
        .animate-ripple {
            animation: ripple 0.6s linear forwards;
        }
      `}</style>

    </div>
  );
}