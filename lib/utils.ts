import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MASTER_HABITS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateStreak(dates: string[]): { current: number; longest: number } {
  if (!dates.length) return { current: 0, longest: 0 };
  const uniqueDates = Array.from(new Set(dates)).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffDays = Math.ceil(Math.abs(currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) { tempStreak++; } 
    else { if (tempStreak > longestStreak) longestStreak = tempStreak; tempStreak = 1; }
  }
  if (tempStreak > longestStreak) longestStreak = tempStreak;
  const lastLoggedDate = new Date(uniqueDates[uniqueDates.length - 1]);
  const today = new Date();
  lastLoggedDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  const diffWithToday = Math.floor((today.getTime() - lastLoggedDate.getTime()) / (1000 * 60 * 60 * 24));
  currentStreak = diffWithToday <= 1 ? tempStreak : 0;
  return { current: currentStreak, longest: longestStreak };
}

/**
 * DEEP ANALYSIS: Zenith Trend Engine
 * Menganalisa perilaku user dari log data
 */
export function analyzeZenithTrends(logs: any[], userData: { gender: string, isMenstruating: boolean }) {
  if (!logs || logs.length === 0) return null;

  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Filter Logs: Minggu ini vs Minggu lalu
  const thisWeekLogs = logs.filter(l => new Date(l.date) >= sevenDaysAgo);
  const lastWeekLogs = logs.filter(l => new Date(l.date) >= fourteenDaysAgo && new Date(l.date) < sevenDaysAgo);

  // 2. Kalkulasi Rata-rata Amalan per Hari
  const getAvg = (logsArr: any[]) => {
    if (logsArr.length === 0) return 0;
    const total = logsArr.reduce((acc, curr) => acc + (curr.checklists?.length || 0), 0);
    return total / logsArr.length;
  };

  const avgThisWeek = getAvg(thisWeekLogs);
  const avgLastWeek = getAvg(lastWeekLogs);
  const delta = avgLastWeek === 0 ? 0 : Math.round(((avgThisWeek - avgLastWeek) / avgLastWeek) * 100);

  // 3. Cari Hari Terberat (Weakest Day)
  const dayFailureMap: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  logs.forEach(log => {
    const day = new Date(log.date).getDay();
    // Jika checklist kurang dari 3, kita anggap hari itu 'lemah'
    if ((log.checklists?.length || 0) < 3) dayFailureMap[day]++;
  });
  
  const weakestDayIndex = Object.keys(dayFailureMap).reduce((a, b) => dayFailureMap[parseInt(a)] > dayFailureMap[parseInt(b)] ? a : b);
  const dayNames = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const weakestDay = dayNames[parseInt(weakestDayIndex)];

  // 4. Analisa Habit Khusus (Amalan yang terlupakan)
  const habitCounts: Record<string, number> = {};
  logs.forEach(log => log.checklists?.forEach((id: string) => habitCounts[id] = (habitCounts[id] || 0) + 1));
  
  // Ambil amalan yang ada di master tapi skornya paling rendah di log (tapi pernah dilakukan)
  const sortedHabitStats = Object.entries(habitCounts).sort((a, b) => a[1] - b[1]);
  const habitInDangerId = sortedHabitStats.length > 0 ? sortedHabitStats[0][0] : null;
  const habitInDanger = MASTER_HABITS.find(h => h.id === habitInDangerId)?.title || "Belum ada";

  return {
    weeklyGrowth: delta, // Persentase kenaikan/penurunan
    weakestDay: weakestDay,
    habitInDanger: habitInDanger,
    avgAmalan: Math.round(avgThisWeek),
    isConsistent: delta >= 0 && avgThisWeek > 3
  };
}

/**
 * NARRATIVE ENGINE: Menghasilkan kalimat cerdas sesuai konteks
 */
export function generateZenithInsight(analysis: any, userData: { gender: string, isMenstruating: boolean }) {
  if (!analysis) return { text: "Mulai isi jurnalmu untuk melihat analisa.", color: "neutral" };

  const { weeklyGrowth, weakestDay, habitInDanger, isConsistent } = analysis;

  // SCENARIO 1: MODE HAID (Empati & Pengalihan)
  if (userData.isMenstruating) {
    return {
      text: "Istirahat sholat adalah ketaatan. Saatnya fokus memperkuat hati dengan dzikir dan shalawat. Jangan khawatir dengan heatmap yang kosong.",
      title: "Masa Rehat Berkah",
      color: "pink",
      tip: `Fokus pada amalan lisan seperti ${MASTER_HABITS.find(h => h.isVerbal)?.title || 'Dzikir'} hari ini.`
    };
  }

  // SCENARIO 2: IKHWAN (Tegas & Disiplin)
  if (userData.gender === "male") {
    if (weeklyGrowth < 0) {
      return {
        text: `Pekannya sedang berat? Performa turun ${Math.abs(weeklyGrowth)}%. Waspadai hari ${weakestDay}, biasanya antum lengah di sana. Bangkit!`,
        title: "Evaluasi Disiplin",
        color: "warning",
        tip: "Coba paksa bangun 15 menit lebih awal besok."
      };
    }
    return {
      text: `Masya Allah, kenaikan ${weeklyGrowth}%! Pertahankan konsistensi ini. Amalan ${habitInDanger} mulai jarang terlihat, jangan sampai lepas.`,
      title: "Mental Pejuang",
      color: "positive",
      tip: "Tambahkan satu amalan sunnah baru untuk pekan depan?"
    };
  }

  // SCENARIO 3: AKHWAT (Nurturing & Appreciation)
  if (userData.gender === "female") {
    if (weeklyGrowth < 0) {
      return {
        text: `Jangan patah semangat ya. Walau turun sedikit, istiqomah itu perjalanan. Yuk, perbaiki pelan-pelan mulai dari hari ${weakestDay} nanti.`,
        title: "Pelan tapi Pasti",
        color: "warning",
        tip: "Mulai dari satu amalan yang paling ringan dulu."
      };
    }
    return {
      text: `Keren sekali! Kamu ${weeklyGrowth}% lebih rajin dari minggu lalu. Hati jadi lebih tenang kan? Amalan ${habitInDanger} butuh sedikit perhatian lagi ya.`,
      title: "Progress Cantik",
      color: "positive",
      tip: "Luangkan waktu 5 menit untuk muhasabah sebelum tidur."
    };
  }

  return { text: "Terus melangkah, Allah melihat setiap usahamu.", color: "neutral" };
}