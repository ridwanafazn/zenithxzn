"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, AlertCircle, Lightbulb, BarChart2 } from "lucide-react";

interface InsightProps {
    insight: {
        text: string;
        title: string;
        color: string;
        tip: string;
    };
    trends?: any;
}

export default function HistoryInsights({ insight, trends }: InsightProps) {
    if (!insight) return null;

    // Mapping warna ke style CSS
    const colorStyles: Record<string, any> = {
        positive: {
            bg: "bg-emerald-950/20",
            border: "border-emerald-500/20",
            shadow: "shadow-emerald-500/5",
            bar: "bg-emerald-500",
            iconBg: "bg-emerald-500/10",
            iconText: "text-emerald-400",
            title: "text-emerald-100",
            icon: TrendingUp
        },
        warning: {
            bg: "bg-amber-950/20",
            border: "border-amber-500/20",
            shadow: "shadow-amber-500/5",
            bar: "bg-amber-500",
            iconBg: "bg-amber-500/10",
            iconText: "text-amber-400",
            title: "text-amber-100",
            icon: AlertCircle
        },
        pink: {
            bg: "bg-pink-950/20",
            border: "border-pink-500/20",
            shadow: "shadow-pink-500/5",
            bar: "bg-pink-500",
            iconBg: "bg-pink-500/10",
            iconText: "text-pink-400",
            title: "text-pink-100",
            icon: Lightbulb
        },
        neutral: {
            bg: "bg-slate-900/40",
            border: "border-white/10",
            shadow: "shadow-none",
            bar: "bg-slate-500",
            iconBg: "bg-slate-500/10",
            iconText: "text-slate-400",
            title: "text-slate-100",
            icon: BarChart2
        }
    };

    const style = colorStyles[insight.color] || colorStyles.neutral;
    const Icon = style.icon;

    return (
        <div className={cn(
            "relative overflow-hidden rounded-3xl border p-6 backdrop-blur-md transition-all shadow-xl",
            style.bg, style.border, style.shadow
        )}>
            {/* Glow Line Indicator */}
            <div className={cn("absolute top-0 left-0 h-full w-1.5", style.bar)} />

            <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* Icon Box */}
                <div className={cn("shrink-0 rounded-2xl p-4 border w-fit", style.iconBg, style.iconText, style.border)}>
                    <Icon className="h-8 w-8" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                    <div>
                        <h3 className={cn("text-lg font-bold mb-1", style.title)}>
                            {insight.title}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            {insight.text}
                        </p>
                    </div>

                    {/* Tip Box */}
                    <div className="inline-flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400 border border-white/5">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        <span><span className="font-bold text-slate-300">Saran:</span> {insight.tip}</span>
                    </div>
                </div>

                {/* Mini Stats (Weekly Delta) - Optional */}
                {trends && trends.wajibCompliance !== undefined && (
                    <div className="hidden md:flex flex-col items-end justify-center pl-4 border-l border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                            Kepatuhan Wajib
                        </span>
                        <div className={cn("text-2xl font-bold font-mono", 
                            trends.wajibCompliance >= 90 ? "text-emerald-400" : "text-amber-400"
                        )}>
                            {trends.wajibCompliance}%
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}