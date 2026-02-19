"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { submitFeedback } from "@/actions/feedback";
import { Loader2, Send, Star, Bug, Lightbulb, Palette, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FeedbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form States
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/auth/login");
      else setUser(u);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Mohon berikan rating bintang dulu ya ⭐");
      return;
    }
    setLoading(true);

    const res = await submitFeedback({
      userId: user.uid,
      userEmail: user.email,
      category,
      rating,
      message,
    });

    if (res.success) {
      setSubmitted(true);
    } else {
      alert("Gagal mengirim. Coba lagi nanti.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-center p-6">
        <div className="mb-6 rounded-full bg-emerald-500/20 p-6 text-emerald-400 animate-scale-in">
          <Send className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Terima Kasih!</h1>
        <p className="text-slate-400 mb-8 max-w-md">
          Masukanmu sangat berharga buat pengembangan Zenith. Kami akan membacanya dengan teliti.
        </p>
        <Link 
          href="/dashboard"
          className="rounded-full bg-slate-800 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const categories = [
    { id: "bug", label: "Lapor Bug", icon: Bug, color: "text-red-400", bg: "peer-checked:bg-red-500/20 peer-checked:border-red-500" },
    { id: "feature", label: "Saran Fitur", icon: Lightbulb, color: "text-yellow-400", bg: "peer-checked:bg-yellow-500/20 peer-checked:border-yellow-500" },
    { id: "ui", label: "Tampilan", icon: Palette, color: "text-pink-400", bg: "peer-checked:bg-pink-500/20 peer-checked:border-pink-500" },
    { id: "other", label: "Lainnya", icon: MessageSquare, color: "text-blue-400", bg: "peer-checked:bg-blue-500/20 peer-checked:border-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 flex justify-center items-start pt-10 md:pt-20">
      <div className="w-full max-w-lg space-y-6">
        
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition mb-4">
          <ArrowLeft className="h-4 w-4" /> Batal
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white">Kirim Masukan</h1>
          <p className="text-slate-400 text-sm">Temukan error atau punya ide liar? Ceritakan di sini.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/40 p-6 rounded-3xl border border-white/5">
          
          {/* 1. KATEGORI */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Tentang apa ini?</label>
            <p className="text-slate-500 text-sm"></p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <label key={cat.id} className="cursor-pointer">
                  <input 
                    type="radio" 
                    name="category" 
                    value={cat.id} 
                    checked={category === cat.id}
                    onChange={(e) => setCategory(e.target.value)}
                    className="peer sr-only" 
                  />
                  <div className={cn(
                    "flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950 p-3 transition-all hover:bg-slate-900",
                    cat.bg
                  )}>
                    <cat.icon className={cn("h-5 w-5", cat.color)} />
                    <span className="text-sm font-medium text-slate-300">{cat.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. RATING */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Seberapa puas kamu?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={cn(
                      "h-8 w-8 transition-colors", 
                      star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-700"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 3. PESAN */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Ceritakan detailnya</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contoh: Tombol simpan tidak berfungsi saat internet mati..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-4 text-white focus:border-emerald-500 focus:outline-none placeholder:text-slate-600 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
            Kirim Masukan
          </button>

        </form>
      </div>
    </div>
  );
}