"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeatmapProps {
  data: Record<string, number>; // Format: "2025-10-20": Score
  year: number;
}

export default function Heatmap({ data, year }: HeatmapProps) {
  // State untuk navigasi bulan (Default: Bulan saat ini)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper: Pindah Bulan
  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  // Helper: Warna Berbasis Skor Kualitas
  const getColor = (score: number) => {
    if (score === 0) return "bg-slate-800/50 text-slate-600"; 
    if (score < 50) return "bg-slate-700 border border-slate-600/30 text-slate-400"; 
    if (score <= 70) return "bg-emerald-900/60 border border-emerald-500/20 text-emerald-200";
    if (score <= 100) return "bg-emerald-600 text-white font-bold";
    return "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] text-black font-bold";
  };

  // Generate Kalender Grid
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Minggu
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 28-31

    const days = [];
    
    // Padding hari kosong di awal bulan (jika tgl 1 bukan Ahad)
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null); 
    }

    // Isi tanggal
    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        // Fix Timezone Offset untuk Key Data
        const offset = dateObj.getTimezoneOffset();
        const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
        const dateKey = localDate.toISOString().split('T')[0];
        
        days.push({
            day: d,
            dateKey: dateKey,
            score: data[dateKey] || 0
        });
    }

    return days;
  }, [currentDate, data]);

  const monthLabel = currentDate.toLocaleDateString("id-ID", { month: 'long', year: 'numeric' });

  return (
    <div className="w-full max-w-md mx-auto">
      
      {/* Header Navigasi */}
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

      {/* Grid Kalender */}
      <div className="grid grid-cols-7 gap-2 mb-2">
         {/* Nama Hari */}
         {['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
             <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                 {d}
             </div>
         ))}

         {/* Tanggal */}
         {calendarGrid.map((item, index) => {
             if (!item) return <div key={`empty-${index}`} />; // Slot kosong

             return (
                 <div
                    key={item.dateKey}
                    title={`Tgl ${item.day}: Skor ${item.score}`}
                    className={cn(
                        "aspect-square flex items-center justify-center rounded-xl text-xs transition-all cursor-pointer relative group border border-transparent",
                        getColor(item.score)
                    )}
                 >
                    {item.day}
                    
                    {/* Tooltip Hover (Optional) */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        Skor: {item.score}
                    </div>
                 </div>
             );
         })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-6 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-700"></div> Bolong</div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-900/60"></div> Wajib</div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-400"></div> Sempurna</div>
      </div>

    </div>
  );
}