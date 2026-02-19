import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MASTER_HABITS, HabitDefinition, HIJRI_MONTH_NAMES, InsightScope, INSIGHT_GROUPS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TIME ENGINE UTILS ---

function toHijri(date: Date) {
    let day = date.getDate();
    let month = date.getMonth(); 
    let year = date.getFullYear();

    let m = month + 1;
    let y = year;

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
        month: im, 
        year: iy
    };
}

export function getSmartHijriDate(dateObj: Date, offset: number = 0) {
    let adjustedDate = new Date(dateObj.getTime());

    if (adjustedDate.getHours() >= 18) {
        adjustedDate.setDate(adjustedDate.getDate() + 1);
    }

    if (offset !== 0) {
        adjustedDate.setDate(adjustedDate.getDate() + offset);
    }

    return toHijri(adjustedDate);
}

export function formatHijriDate(hijri: { day: number; month: number; year: number }) {
    if (hijri.month < 1 || hijri.month > 12) return "";
    const monthName = HIJRI_MONTH_NAMES[hijri.month - 1]; 
    return `${hijri.day} ${monthName} ${hijri.year} H`;
}

export function getMoonPhaseIcon(day: number) {
    if (day <= 3 || day >= 28) return "🌒"; 
    if (day <= 7 || day >= 23) return "🌓"; 
    if (day <= 12 || day >= 18) return "🌔"; 
    if (day >= 13 && day <= 17) return "🌕"; 
    return "🌖";
}

// --- LOCATION UTILS ---

export async function getCityFromCoords(lat: number, lng: number) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
            { headers: { "User-Agent": "ZenithApp/1.0" } } 
        );
        const data = await response.json();
        
        return data.address?.city || 
               data.address?.town || 
               data.address?.regency || 
               data.address?.county || 
               "Lokasi Terpilih";
    } catch (err) {
        console.error("Gagal reverse geocode:", err);
        return "Lokasi Tidak Dikenal";
    }
}

// --- CONTEXT-AWARE ANALYSIS UTILS (V2) ---

/**
 * Menghitung skor harian berdasarkan kategori yang dipilih.
 * Jika Global: Hitung semua (weighted).
 * Jika Kategori Spesifik: Hanya hitung habit dalam kategori tersebut.
 */
export function calculateDailyScore(log: any, category: InsightScope = "global") {
  if (!log || !log.checklists) return 0;
  
  let score = 0;
  const targetHabitIds = category === "global" ? null : INSIGHT_GROUPS[category];

  log.checklists.forEach((id: string) => {
    // Filter Logic
    if (targetHabitIds && !targetHabitIds.includes(id)) return;

    const habit = MASTER_HABITS.find(h => h.id === id);
    if (habit) score += habit.weight;
  });
  
  return score;
}

export function checkWajibCompliance(log: any) {
  if (!log || !log.checklists) return 0; 
  const wajibHabits = INSIGHT_GROUPS.wajib;
  
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
 * ENGINE ANALISIS V2: Context Aware
 * Menerima parameter 'category' untuk memfilter data sebelum dianalisa.
 */
export function analyzeZenithTrends(
    logs: any[], 
    userData: { gender: string, isMenstruating: boolean },
    category: InsightScope = "global"
) {
  if (!logs || logs.length === 0) return null;

  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekLogs = logs.filter(l => new Date(l.date) >= sevenDaysAgo);
  
  // 1. Calculate Average Score (Contextual)
  const getAvgScore = (logsArr: any[]) => {
    if (logsArr.length === 0) return 0;
    const total = logsArr.reduce((acc, curr) => acc + calculateDailyScore(curr, category), 0);
    return Math.round(total / logsArr.length);
  };
  const avgScore = getAvgScore(thisWeekLogs);
  
  // 2. Wajib Compliance (Always calculated for foundation check)
  let totalWajibCompliance = 0;
  thisWeekLogs.forEach(log => totalWajibCompliance += checkWajibCompliance(log));
  const avgWajibCompliance = thisWeekLogs.length > 0 ? Math.round(totalWajibCompliance / thisWeekLogs.length) : 0;

  // 3. Weakest Day (Contextual)
  const dayScoreMap: Record<number, {total: number, count: number}> = { 
    0: {total:0, count:0}, 1: {total:0, count:0}, 2: {total:0, count:0}, 
    3: {total:0, count:0}, 4: {total:0, count:0}, 5: {total:0, count:0}, 6: {total:0, count:0} 
  };
  
  logs.forEach(log => {
    const day = new Date(log.date).getDay();
    // Gunakan skor kategori, bukan skor global
    const dailyScore = calculateDailyScore(log, category);
    if (dailyScore > 0) { // Hanya hitung hari yang ada isian kategori tsb
        dayScoreMap[day].total += dailyScore;
        dayScoreMap[day].count += 1;
    }
  });

  let minAvg = Infinity;
  let weakestDayIndex = -1;
  Object.keys(dayScoreMap).forEach((key: any) => {
    const k = parseInt(key);
    if (dayScoreMap[k].count > 0) {
        const avg = dayScoreMap[k].total / dayScoreMap[k].count;
        if (avg < minAvg) { minAvg = avg; weakestDayIndex = k; }
    }
  });
  const dayNames = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const weakestDay = weakestDayIndex !== -1 ? dayNames[weakestDayIndex] : "Belum terlihat";

  // 4. Habit In Danger (Contextual Filter)
  const habitCounts: Record<string, number> = {};
  const targetIds = category === "global" ? null : INSIGHT_GROUPS[category];

  logs.forEach(log => {
      log.checklists?.forEach((id: string) => {
          if (targetIds && !targetIds.includes(id)) return;
          habitCounts[id] = (habitCounts[id] || 0) + 1;
      });
  });

  // Cari habit yang paling jarang dilakukan dalam kategori ini
  let habitInDanger = "-";
  let minCount = Infinity;
  const habitsToCheck = targetIds 
    ? targetIds 
    : MASTER_HABITS.filter(h => h.category === 'wajib' || h.tags?.includes('rawatib')).map(h => h.id);

  habitsToCheck.forEach(id => {
      const count = habitCounts[id] || 0;
      // Ambang batas bahaya: dilakukan kurang dari 40% total log
      if (count < (logs.length * 0.4) && count < minCount) {
          minCount = count;
          habitInDanger = MASTER_HABITS.find(h => h.id === id)?.title || "-";
      }
  });

  return {
    avgScore,
    wajibCompliance: avgWajibCompliance, // Tetap disertakan sebagai referensi
    weakestDay,
    habitInDanger,
    category // Pass category untuk dipakai di narrative engine
  };
}

/**
 * NARRATIVE ENGINE V3: Context-Aware & Persona Based
 */
export function generateZenithInsight(
    analysis: any, 
    userData: { gender: string, isMenstruating: boolean }
) {
  if (!analysis) return { text: "Data belum cukup.", title: "Mulai", color: "neutral", tip: "Isi jurnal." };

  const { avgScore, wajibCompliance, weakestDay, habitInDanger, category } = analysis;
  const isMale = userData.gender === "male";
  const isHaid = userData.isMenstruating;

  // --- LOGIKA UTAMA: PERCABANGAN KATEGORI ---

  switch (category) {
    case "wajib":
        if (isHaid) return {
            title: "Rehat yang Berkah",
            text: "Tidak sholat saat haid adalah bentuk ketaatan. Allah mencatat kerinduanmu.",
            color: "pink",
            tip: "Ganti dengan Dzikir Pagi Petang."
        };
        if (avgScore < 40) return {
            title: "Perbaiki Tiang Agama",
            text: `Masih banyak bolong, terutama di hari ${weakestDay}. Jangan menyerah, paksakan sholat tepat waktu.`,
            color: "warning",
            tip: "Pasang alarm adzan di HP."
        };
        if (avgScore >= 50) return {
            title: "Alhamdulillah Terjaga",
            text: isMale 
                ? "Sholat fardhu aman. Tantangan berikutnya: Kejar sholat berjamaah di masjid!" 
                : "Sholat fardhu aman. Tantangan berikutnya: Sholat di awal waktu.",
            color: "positive",
            tip: "Rawatib adalah penyempurna."
        };
        break;

    case "rawatib":
        if (avgScore === 0) return {
            title: "Pagar Pelindung",
            text: "Rawatib itu seperti pagar rumah. Jika pagar kuat, rumah (sholat wajib) aman dari pencuri.",
            color: "neutral",
            tip: "Mulai dari Qobliyah Subuh (2 rakaat ringan)."
        };
        if (habitInDanger !== "-") return {
            title: "Tambal yang Bocor",
            text: `Rawatib sudah jalan, tapi '${habitInDanger}' sering terlewat. Yuk lengkapi.`,
            color: "neutral",
            tip: "Rawatib Zuhur & Maghrib pahalanya besar."
        };
        break;

    case "qiyam":
        if (avgScore > 0) return {
            title: "Ahli Malam",
            text: "Ciri orang sholeh adalah bangun di malam hari. Konsistensi lebih baik daripada jumlah rakaat.",
            color: "positive",
            tip: "Jangan lupa Witir sebagai penutup."
        };
        return {
            title: "Keheningan Malam",
            text: "Malammu masih sepi. Allah turun ke langit dunia di sepertiga malam terakhir.",
            color: "neutral",
            tip: "Coba bangun 10 menit sebelum Subuh."
        };

    case "duha":
        if (avgScore > 0) return {
            title: "Sedekah Sendi",
            text: "Dhuha adalah sedekah bagi 360 persendianmu. Rezeki berkah insyaAllah mengikuti.",
            color: "positive",
            tip: "Minimal 2 rakaat sudah cukup."
        };
        break;
    
    case "quran":
        if (isHaid && avgScore > 0) return {
            title: "Hati yang Hidup",
            text: "Fisik libur, tapi hati tetap hidup dengan Al-Quran (via hafalan/terjemahan/digital).",
            color: "pink",
            tip: "Murojaah hafalan pendek."
        };
        if (habitInDanger !== "-") return {
            title: "Surat Pelindung",
            text: `Jangan lupakan ${habitInDanger}. Ia bisa jadi syafaat di alam kubur.`,
            color: "neutral",
            tip: "Baca Al-Mulk sebelum tidur."
        };
        break;

    case "global":
    default:
        // Fallback ke logika lama (General Overview)
        if (isHaid) return {
            title: "Masa Rehat",
            text: "Fokus pada amalan hati dan lisan (Dzikir & Shalawat).",
            color: "pink",
            tip: "Dengarkan murottal."
        };
        if (wajibCompliance < 85) return {
            title: "Perkuat Fondasi",
            text: `Fokus perbaiki Sholat Wajib dulu sebelum mengejar Sunnah. Hari ${weakestDay} perlu perhatian.`,
            color: "warning",
            tip: "Jangan tinggalkan sholat."
        };
        return {
            title: "Tetap Istiqomah",
            text: "Perjalananmu sudah baik. Jaga niat karena Allah.",
            color: "positive",
            tip: "Ajak teman beribadah."
        };
  }

  return { text: "Data belum cukup.", title: "Mulai", color: "neutral", tip: "Isi jurnal." };
}