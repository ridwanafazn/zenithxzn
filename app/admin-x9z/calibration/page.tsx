"use client";

import { useState, useEffect } from "react";
import { getGlobalHijriOffset, updateGlobalHijriOffset } from "@/actions/system";
import { Loader2, Save, AlertTriangle, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CalibrationPage() {
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Load current offset
    getGlobalHijriOffset().then((val) => {
      setOffset(val);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      const res = await updateGlobalHijriOffset(offset);
      if (res.success) {
        setMessage("Berhasil disimpan! Semua user akan melihat tanggal baru.");
      } else {
        setMessage("Gagal: " + res.message);
      }
    } catch (err) {
      setMessage("Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-emerald-500">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-4">
            <Moon className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Calibration</h1>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
          
          <div className="mb-8 text-center">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Current Offset</span>
            <div className={cn(
              "text-6xl font-mono font-bold mt-2",
              offset > 0 ? "text-emerald-400" : offset < 0 ? "text-amber-400" : "text-slate-200"
            )}>
              {offset > 0 ? "+" : ""}{offset}
            </div>
            <p className="text-xs text-slate-500 mt-2">Hari</p>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-5 gap-2 mb-8">
            {[-2, -1, 0, 1, 2].map((val) => (
              <button
                key={val}
                onClick={() => setOffset(val)}
                className={cn(
                  "aspect-square rounded-xl text-sm font-bold transition-all border",
                  offset === val 
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20 scale-110" 
                    : "bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-white"
                )}
              >
                {val > 0 ? "+" : ""}{val}
              </button>
            ))}
          </div>

          {/* Warning */}
          <div className="flex gap-3 bg-amber-950/30 border border-amber-500/20 p-4 rounded-xl mb-8">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Perubahan ini bersifat <strong>GLOBAL</strong>. Seluruh pengguna aplikasi akan mengalami pergeseran tanggal Hijriyah sesuai angka ini.
            </p>
          </div>

          {/* Action */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 font-bold py-4 rounded-xl hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Terapkan
          </button>

          {message && (
            <p className={cn(
              "mt-4 text-center text-sm font-medium animate-in fade-in slide-in-from-bottom-2",
              message.includes("Gagal") ? "text-red-400" : "text-emerald-400"
            )}>
              {message}
            </p>
          )}

        </div>
        
        <p className="text-center text-[10px] text-slate-700 uppercase tracking-widest">
          Zenith Internal Control • Restricted Access
        </p>

      </div>
    </div>
  );
}