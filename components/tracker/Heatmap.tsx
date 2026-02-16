"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface HeatmapProps {
  data: Record<string, number>; // Format: "2025-10-20": 5
  year: number;
}

export default function Heatmap({ data, year }: HeatmapProps) {
  // Generate Array Hari dalam setahun
  const days = useMemo(() => {
    const daysArray = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Loop hari
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      daysArray.push(new Date(d));
    }
    return daysArray;
  }, [year]);

  // Helper Warna
  const getColor = (count: number) => {
    if (count === 0) return "bg-slate-800/50";
    if (count <= 2) return "bg-emerald-900/60";
    if (count <= 5) return "bg-emerald-700/80";
    if (count <= 8) return "bg-emerald-500";
    return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Grid 7 Baris (Senin-Minggu) */}
      <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
        {days.map((date) => {
          // Konversi date ke YYYY-MM-DD lokal (mengatasi timezone offset)
          const offset = date.getTimezoneOffset();
          const localDate = new Date(date.getTime() - (offset * 60 * 1000));
          const dateString = localDate.toISOString().split('T')[0];
          
          const count = data[dateString] || 0;
          
          return (
            <div
              key={dateString}
              title={`${formatDate(date)}: ${count} Amalan`}
              className={cn(
                "h-3 w-3 rounded-sm transition-all hover:scale-125 hover:z-10 cursor-pointer relative group",
                getColor(count)
              )}
            ></div>
          );
        })}
      </div>
      
      {/* Label Bulan */}
      <div className="flex justify-between w-full px-2 mt-2">
          {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agust", "Sep", "Okt", "Nov", "Des"].map(m => (
              <span key={m} className="text-[10px] text-slate-600 font-mono">{m}</span>
          ))}
      </div>
    </div>
  );
}