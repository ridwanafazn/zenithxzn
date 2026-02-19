"use client";

import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";

export default function FloatingFeedbackButton() {
  return (
    <Link
      href="/feedback"
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-emerald-600 p-4 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-110 hover:bg-emerald-500 active:scale-95"
      title="Kirim Masukan"
    >
      <MessageSquarePlus className="h-6 w-6" />
      {/* Teks muncul saat di-hover (Desktop) */}
      <span className="hidden max-w-0 overflow-hidden text-sm font-bold opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100 md:block">
        Beri Masukan
      </span>
    </Link>
  );
}