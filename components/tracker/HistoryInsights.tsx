"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Lightbulb, BarChart2, Tag } from "lucide-react"; 

interface InsightProps {
    insight: {
        text: string;
        title: string;
        color: string;
        tip: string;
    };
    trends?: any;
    categoryLabel?: string; 
}

export default function HistoryInsights({ insight, trends, categoryLabel = "Global" }: InsightProps) {
    if (!insight) return null;

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

    // Menentukan UI Velocity Badge
    const renderVelocityBadge = () => {
        if (!trends || trends.scoreVelocity === undefined) return null;
        
        const velocity = trends.scoreVelocity;
        if (velocity === 0) {
             return (
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700">
                     <Minus className="h-3 w-3" /> Stabil
                 </div>
             );
        }
        if (velocity > 0) {
             return (
                 <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                     <TrendingUp className="h-3 w-3" /> +{velocity}%
                 </div>
             );
        }
        return (
             <div className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-0.5 rounded-full border border-red-500/20">
                 <TrendingDown className="h-3 w-3" /> {velocity}%
             </div>
        );
    };

    return (
        <div className={cn(
            "relative overflow-hidden rounded-3xl border p-6 backdrop-blur-md transition-all shadow-xl",
            style.bg, style.border, style.shadow
        )}>
            <div className={cn("absolute top-0 left-0 h-full w-1.5", style.bar)} />

            <div className="flex flex-col md:flex-row md:items-start gap-5">
                <div className={cn("shrink-0 rounded-2xl p-4 border w-fit mt-1", style.iconBg, style.iconText, style.border)}>
                    <Icon className="h-8 w-8" />
                </div>

                <div className="flex-1 space-y-3">
                    <div>
                        {/* Area Badge: Kategori & Velocity */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                             <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-white/5 uppercase tracking-wide">
                                <Tag className="h-3 w-3" />
                                {categoryLabel.replace('_', ' ')}
                             </div>
                             {renderVelocityBadge()}
                        </div>

                        <h3 className={cn("text-lg font-bold mb-1", style.title)}>
                            {insight.title}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            {insight.text}
                        </p>
                    </div>

                    <div className="inline-flex items-start gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400 border border-white/5">
                        <Lightbulb className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                        <span><span className="font-bold text-slate-300">Saran:</span> {insight.tip}</span>
                    </div>
                </div>

                {trends && trends.wajibCompliance !== undefined && (
                    <div className="hidden md:flex flex-col items-end justify-center pl-4 border-l border-white/5 self-stretch">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 whitespace-nowrap">
                            Kepatuhan Wajib
                        </span>
                        <div className={cn("text-3xl font-bold font-mono tracking-tighter", 
                            trends.wajibCompliance >= 90 ? "text-emerald-400" : 
                            trends.wajibCompliance >= 60 ? "text-amber-400" : "text-red-400"
                        )}>
                            {trends.wajibCompliance}%
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}