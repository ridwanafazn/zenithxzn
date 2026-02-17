import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MASTER_HABITS, HabitDefinition, HIJRI_MONTH_NAMES } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TIME ENGINE UTILS (MATHEMATICAL CORE) ---

/**
 * Konversi Masehi ke Hijriyah menggunakan Algoritma Aritmatika Tabular
 * (Menggantikan Intl API yang tidak konsisten di beberapa environment)
 */
function toHijri(date: Date) {
    let day = date.getDate();
    let month = date.getMonth(); // 0-11
    let year = date.getFullYear();

    let m = month + 1;
    let y = year;

    // Adjust for Julian calendar calculation
    if (m < 3) {
        y -= 1;
        m += 12;
    }

    let a = Math.floor(y / 100);
    let b = 2 - a + Math.floor(a / 4);

    if (y < 1583) b = 0;
    if (y === 1582) {
        if (m > 10)  b = -10;
        if (m === 10) {
            b = 0;
            if (day > 4) b = -10;
        }
    }

    let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

    b = 0;
    if (jd > 2299160) {
        a = Math.floor((jd - 1867216.25) / 36524.25);
        b = 1 + a - Math.floor(a / 4);
    }
    
    let bb = jd + b + 1524;
    let cc = Math.floor((bb - 122.1) / 365.25);
    let dd = Math.floor(365.25 * cc);
    let ee = Math.floor((bb - dd) / 30.6001);
    day = (bb - dd) - Math.floor(30.6001 * ee);
    month = ee - 1;
    if (ee > 13) {
        cc += 1;
        month = ee - 13;
    }
    year = cc - 4716;

    let iyear = 10631.0 / 30.0;
    let epochastro = 1948084;
    
    let shift1 = 8.01 / 60.0;

    let z = jd - epochastro;
    let cyc = Math.floor(z / 10631.0);
    z = z - 10631 * cyc;
    let j = Math.floor((z - shift1) / iyear);
    let iy = 30 * cyc + j;
    z = z - Math.floor(j * iyear + shift1);
    let im = Math.floor((z + 28.5001) / 29.5);
    
    if (im === 13) im = 12;
    
    let id = z - Math.floor(29.5001 * im - 29);

    return {
        day: id,
        month: im, // 1-12
        year: iy
    };
}

/**
 * Menghitung Tanggal Hijriyah Cerdas
 * Menggunakan Algoritma Aritmatika + Logika Maghrib + Global Offset
 * @param dateObj Tanggal Masehi saat ini
 * @param offset Koreksi hari (misal +1 atau -1) dari setting global
 */
export function getSmartHijriDate(dateObj: Date, offset: number = 0) {
    // 1. Clone date agar tidak memutasi original
    let adjustedDate = new Date(dateObj.getTime());

    // 2. Logika Maghrib: Jika jam > 18:00, anggap sudah masuk hari esok
    // (Dalam Islam, hari berganti saat matahari terbenam)
    if (adjustedDate.getHours() >= 18) {
        adjustedDate.setDate(adjustedDate.getDate() + 1);
    }

    // 3. Terapkan Global Offset pada tanggal Masehi sebelum konversi
    // (Ini lebih aman daripada menggeser hasil Hijriyah karena jumlah hari per bulan berbeda)
    if (offset !== 0) {
        adjustedDate.setDate(adjustedDate.getDate() + offset);
    }

    // 4. Konversi menggunakan Algoritma Aritmatika (Bukan Intl)
    return toHijri(adjustedDate);
}

/**
 * Helper Visual: Format Tanggal Hijriyah (1 Ramadhan 1445 H)
 */
export function formatHijriDate(hijri: { day: number; month: number; year: number }) {
    if (hijri.month < 1 || hijri.month > 12) return "";
    const monthName = HIJRI_MONTH_NAMES[hijri.month - 1]; // Array is 0-indexed
    return `${hijri.day} ${monthName} ${hijri.year} H`;
}

/**
 * Helper Visual: Ikon Fase Bulan berdasarkan Tanggal
 */
export function getMoonPhaseIcon(day: number) {
    if (day <= 3 || day >= 28) return "🌒"; // Sabit
    if (day <= 7 || day >= 23) return "🌓"; // Separuh
    if (day <= 12 || day >= 18) return "🌔"; // Cembung
    if (day >= 13 && day <= 17) return "🌕"; // Purnama (Ayyamul Bidh)
    return "🌖";
}

// --- SCORING & ANALYSIS UTILS ---

// Helper: Hitung Skor Kualitas Harian
export function calculateDailyScore(log: any) {
  if (!log || !log.checklists) return 0;
  
  let score = 0;
  log.checklists.forEach((id: string) => {
    const habit = MASTER_HABITS.find(h => h.id === id);
    if (habit) score += habit.weight;
  });
  
  return score;
}

// Helper: Cek Kelengkapan Wajib
export function checkWajibCompliance(log: any) {
  if (!log || !log.checklists) return 0; // 0%
  const wajibHabits = MASTER_HABITS.filter(h => h.category === 'wajib').map(h => h.id);
  
  // Jika sedang haid, anggap wajib 100% (exempted)
  if (log.isMenstruating) return 100;

  const completedWajib = wajibHabits.filter(id => log.checklists.includes(id));
  return Math.round((completedWajib.length / wajibHabits.length) * 100);
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
 * DEEP ANALYSIS: Zenith Trend Engine V2 (Weighted)
 */
export function analyzeZenithTrends(logs: any[], userData: { gender: string, isMenstruating: boolean }) {
  if (!logs || logs.length === 0) return null;

  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // 1. Filter Logs
  const thisWeekLogs = logs.filter(l => new Date(l.date) >= sevenDaysAgo);
  
  // 2. Kalkulasi Skor Rata-rata (Quality Score)
  const getAvgScore = (logsArr: any[]) => {
    if (logsArr.length === 0) return 0;
    const total = logsArr.reduce((acc, curr) => acc + calculateDailyScore(curr), 0);
    return Math.round(total / logsArr.length);
  };

  const avgScoreThisWeek = getAvgScore(thisWeekLogs);
  
  // 3. Analisa Kepatuhan Wajib (Foundation Check)
  let totalWajibCompliance = 0;
  thisWeekLogs.forEach(log => {
    totalWajibCompliance += checkWajibCompliance(log);
  });
  const avgWajibCompliance = thisWeekLogs.length > 0 ? Math.round(totalWajibCompliance / thisWeekLogs.length) : 0;

  // 4. Cari Hari Terberat (Weakest Day based on Score)
  const dayScoreMap: Record<number, {total: number, count: number}> = { 
    0: { total: 0, count: 0 }, 
    1: { total: 0, count: 0 }, 
    2: { total: 0, count: 0 }, 
    3: { total: 0, count: 0 }, 
    4: { total: 0, count: 0 }, 
    5: { total: 0, count: 0 }, 
    6: { total: 0, count: 0 } 
  };
  
  logs.forEach(log => {
    const day = new Date(log.date).getDay();
    dayScoreMap[day].total += calculateDailyScore(log);
    dayScoreMap[day].count += 1;
  });

  let minAvg = Infinity;
  let weakestDayIndex = 0;
  
  Object.keys(dayScoreMap).forEach((key: any) => {
    const k = parseInt(key);
    if (dayScoreMap[k].count > 0) {
        const avg = dayScoreMap[k].total / dayScoreMap[k].count;
        if (avg < minAvg) {
            minAvg = avg;
            weakestDayIndex = k;
        }
    }
  });

  const dayNames = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const weakestDay = dayNames[weakestDayIndex];

  // 5. Analisa Habit Khusus (Amalan Wajib/Rawatib yang sering skip)
  const habitCounts: Record<string, number> = {};
  logs.forEach(log => log.checklists?.forEach((id: string) => habitCounts[id] = (habitCounts[id] || 0) + 1));
  
  // Prioritaskan mencari Wajib yang hilang, lalu Rawatib
  const dangerFilter = (h: HabitDefinition) => (h.category === 'wajib' || h.tags?.includes('rawatib'));
  const criticalHabits = MASTER_HABITS.filter(dangerFilter).map(h => h.id);
  
  let habitInDanger = "Tidak ada";
  // Cari yang paling jarang dilakukan dari list critical
  let minCount = Infinity;
  
  criticalHabits.forEach(id => {
      const count = habitCounts[id] || 0;
      // Hanya anggap danger jika count < 50% dari total log
      if (count < (logs.length * 0.5) && count < minCount) {
          minCount = count;
          habitInDanger = MASTER_HABITS.find(h => h.id === id)?.title || "";
      }
  });

  // Jika aman di wajib/rawatib, cari sunnah biasa
  if (habitInDanger === "Tidak ada" || habitInDanger === "") {
      const sortedHabitStats = Object.entries(habitCounts).sort((a, b) => a[1] - b[1]);
      habitInDanger = sortedHabitStats.length > 0 ? (MASTER_HABITS.find(h => h.id === sortedHabitStats[0][0])?.title || "-") : "-";
  }

  return {
    avgScore: avgScoreThisWeek,
    wajibCompliance: avgWajibCompliance,
    weakestDay: weakestDay,
    habitInDanger: habitInDanger,
    isConsistent: avgWajibCompliance >= 90
  };
}

/**
 * NARRATIVE ENGINE V2: Context-Aware & Quality Focused
 */
export function generateZenithInsight(analysis: any, userData: { gender: string, isMenstruating: boolean }) {
  if (!analysis) return { 
    text: "Mulai isi jurnalmu untuk melihat analisa.", 
    title: "Mulai Perjalanan", 
    color: "neutral", 
    tip: "Isi jurnal hari ini." 
  };

  const { avgScore, wajibCompliance, weakestDay, habitInDanger } = analysis;

  // SCENARIO 1: MODE HAID
  if (userData.isMenstruating) {
    return {
      text: "Fase istirahat fisik, saatnya panen pahala hati. Perbanyak shalawat dan istighfar ya.",
      title: "Masa Rehat Berkah",
      color: "pink",
      tip: "Dengarkan murottal bisa menenangkan hati."
    };
  }

  // SCENARIO 2: WAJIB BOLONG (CRITICAL)
  if (wajibCompliance < 85) {
      return {
          text: `Fondasi masih goyah (${wajibCompliance}%). Jangan sibuk mengejar sunnah jika yang Wajib masih terlewat, terutama di hari ${weakestDay}.`,
          title: "Perkuat Fondasi",
          color: "warning",
          tip: "Prioritaskan Sholat 5 Waktu tepat waktu."
      };
  }

  // SCENARIO 3: WAJIB AMAN, TAPI SKOR RENDAH (KURANG SUNNAH)
  if (avgScore < 60) {
      return {
          text: `Alhamdulillah yang Wajib terjaga. Sekarang saatnya menghiasinya dengan Rawatib agar bangunan imanmu lebih kokoh.`,
          title: "Level Up",
          color: "neutral", // Blue/Neutral
          tip: "Coba tambah Qobliyah Subuh besok."
      };
  }

  // SCENARIO 4: PERFORMA TINGGI (IKHWAN)
  if (userData.gender === "male") {
    return {
      text: `Masya Allah, performa antum solid! Wajib terjaga, sunnah terawat. Hati-hati dengan '${habitInDanger}' yang mulai jarang terlihat.`,
      title: "Mental Pejuang",
      color: "positive",
      tip: "Ajak teman ke masjid untuk berjamaah."
    };
  }

  // SCENARIO 5: PERFORMA TINGGI (AKHWAT)
  if (userData.gender === "female") {
    return {
      text: `Barakallah! Istiqomahmu inspiratif sekali. Pertahankan ritme ini ya. Jangan lupa selipkan doa saat sujud terakhir.`,
      title: "Progress Cantik",
      color: "positive",
      tip: "Syukuri nikmat sehat hari ini."
    };
  }

  // SCENARIO 6: DEFAULT (FALLBACK)
  // Perbaikan: Menambahkan properti 'title' dan 'tip' agar sesuai tipe data TypeScript
  return { 
    text: "Terus melangkah, Allah melihat setiap usahamu.", 
    title: "Tetap Istiqomah", 
    color: "neutral",
    tip: "Jaga niat karena Allah." 
  };
}