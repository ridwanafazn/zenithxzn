"use client";

import { useEffect, useState } from "react";
import { getAllFeedbacks } from "@/actions/feedback";
import { Loader2, Bug, Lightbulb, Palette, MessageSquare, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminFeedbackList() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data saat halaman dibuka
    getAllFeedbacks().then((data) => {
      setFeedbacks(data);
      setLoading(false);
    });
  }, []);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "bug": return <Bug className="h-4 w-4 text-red-400" />;
      case "feature": return <Lightbulb className="h-4 w-4 text-yellow-400" />;
      case "ui": return <Palette className="h-4 w-4 text-pink-400" />;
      default: return <MessageSquare className="h-4 w-4 text-blue-400" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = { bug: "Bug", feature: "Ide", ui: "Tampilan", other: "Umum" };
    return labels[cat] || cat;
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-emerald-500"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard" className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 transition">
                <ArrowLeft className="h-5 w-5 text-slate-400" />
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-white">Kotak Masuk</h1>
                <p className="text-slate-400">Total {feedbacks.length} masukan dari pengguna.</p>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {feedbacks.map((fb) => (
            <div key={fb._id} className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-slate-900/50 p-6 hover:bg-slate-900 transition-all">
              
              {/* Header Card */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium border border-white/5">
                    {getCategoryIcon(fb.category)}
                    <span className="capitalize text-slate-300">{getCategoryLabel(fb.category)}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3 w-3", i < fb.rating ? "fill-amber-400 text-amber-400" : "text-slate-800")} />
                    ))}
                  </div>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  "{fb.message}"
                </p>
              </div>

              {/* Footer Card */}
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>ID: {fb.userId.substring(0, 6)}...</span>
                <span>{new Date(fb.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
          
          {feedbacks.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl">
              Belum ada masukan. Sepi banget nih...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}