"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { InsightScope } from "@/lib/constants";

interface HeatmapProps {
  data: Record<string, number>; 
  year: number;
  category?: InsightScope; 
  menstruatingDates?: string[]; // Prop baru untuk data haid
}

export default function Heatmap({ data, year, category = "global", menstruatingDates = [] }: HeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  // Helper: Warna Berbasis Skor & Kategori
  const getColor = (score: number, isMenstruating: boolean) => {
    // 1. Kondisi Bolong (Skor 0)
    if (score === 0) {
        // Jika bolong karena haid, warnanya lebih redup/pudar
        if (isMenstruating) return "bg-slate-900/50 text-slate-700"; 
        return "bg-slate-800/50 text-slate-600"; 
    }
    
    // 2. LOGIKA WARNA ADAPTIF (Untuk Kategori Spesifik)
    if (category !== "global") {
        if (score > 0) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] text-white font-bold";
    }

    // 3. Logika Gradasi (Global View)
    if (score < 50) return "bg-slate-700 border border-slate-600/30 text-slate-400"; 
    if (score <= 70) return "bg-emerald-900/60 border border-emerald-500/20 text-emerald-200";
    if (score <= 100) return "bg-emerald-600 text-white font-bold";
    return "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] text-black font-bold";
  };

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 

    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null); 
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        // Fix zona waktu agar YYYY-MM-DD selalu akurat secara lokal
        const offset = dateObj.getTimezoneOffset();
        const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
        const dateKey = localDate.toISOString().split('T')[0];
        
        days.push({
            day: d,
            dateKey: dateKey,
            score: data[dateKey] || 0,
            isMenstruating: menstruatingDates.includes(dateKey) // Tandai jika haid
        });
    }

    return days;
  }, [currentDate, data, menstruatingDates]);

  const monthLabel = currentDate.toLocaleDateString("id-ID", { month: 'long', year: 'numeric' });

  return (
    <div className="w-full max-w-md mx-auto">
      
      <div className="flex items-center justify-between mb-4 px-2">
        <button 
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
            <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h3 className="font-bold text-lg text-white capitalize">
            {monthLabel}
        </h3>

        <button 
            onClick={() => changeMonth(1)}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
            <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
         {['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
             <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                 {d}
             </div>
         ))}

         {calendarGrid.map((item, index) => {
             if (!item) return <div key={`empty-${index}`} />; 

             return (
                 <div
                    key={item.dateKey}
                    title={`Tgl ${item.day}: Skor ${item.score} ${item.isMenstruating ? '(Haid)' : ''}`}
                    className={cn(
                        "aspect-square flex items-center justify-center rounded-xl text-xs transition-all cursor-pointer relative group",
                        // Warna dasar berdasarkan skor
                        getColor(item.score, item.isMenstruating),
                        // Logika Overlay Haid: Berikan border pink
                        item.isMenstruating 
                            ? "ring-1 ring-inset ring-pink-500/50 shadow-[inset_0_0_10px_rgba(236,72,153,0.1)]" 
                            : "border border-transparent"
                    )}
                 >
                    {item.day}
                    
                    {/* Opsional: Titik indikator kecil di pojok untuk haid */}
                    {item.isMenstruating && (
                        <div className="absolute top-1 right-1 h-1 w-1 rounded-full bg-pink-500"></div>
                    )}
                 </div>
             );
         })}
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-6 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-700"></div> Bolong</div>
          {category === 'global' ? (
              <>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-900/60"></div> Standar</div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-400"></div> Sempurna</div>
              </>
          ) : (
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500"></div> Dilakukan</div>
          )}
          {/* Legenda Haid */}
          <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
              <div className="h-2 w-2 rounded-full bg-transparent ring-1 ring-pink-500"></div> 
              Masa Haid
          </div>
      </div>

    </div>
  );
}