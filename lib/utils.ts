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

    return { day: id, month: im, year: iy };
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
        return data.address?.city || data.address?.town || data.address?.regency || data.address?.county || "Lokasi Terpilih";
    } catch (err) {
        return "Lokasi Tidak Dikenal";
    }
}

// --- CONTEXT-AWARE ANALYSIS UTILS (V3 - COMPARATIVE) ---

export function calculateDailyScore(log: any, category: InsightScope = "global") {
  if (!log || !log.checklists) return 0;
  
  let score = 0;
  const targetHabitIds = category === "global" ? null : INSIGHT_GROUPS[category];

  log.checklists.forEach((id: string) => {
    if (targetHabitIds && !targetHabitIds.includes(id)) return;
    const habit = MASTER_HABITS.find(h => h.id === id);
    if (habit) score += habit.weight;
  });
  
  return score;
}

export function checkWajibCompliance(log: any, gender: string = "male") {
  if (!log || !log.checklists) return 0; 
  const wajibHabits = INSIGHT_GROUPS.wajib;
  
  const isHaidValid = gender === "female" && log.isMenstruating;
  if (isHaidValid) return 100;

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
 * ENGINE ANALISIS V3: Comparative & Deep Context
 */
export function analyzeZenithTrends(
    logs: any[], 
    userData: { gender: string, isMenstruating: boolean },
    category: InsightScope = "global"
) {
  if (!logs || logs.length === 0) return null;

  const today = new Date();
  today.setHours(0,0,0,0);
  
  // Waktu Komparasi: 7 Hari Terakhir VS 7 Hari Sebelumnya
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Pisahkan Log berdasarkan timeframe
  const currentPeriodLogs = logs.filter(l => new Date(l.date) >= sevenDaysAgo);
  const previousPeriodLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
  });

  // Ekstrak data hari haid (Untuk visualisasi Heatmap)
  const menstruatingDates = userData.gender === "female" ? logs.filter(l => l.isMenstruating).map(l => l.date) : [];

  // Helper Score Kalkulator
  const getAvgScore = (logsArr: any[]) => {
    if (logsArr.length === 0) return 0;
    const total = logsArr.reduce((acc, curr) => acc + calculateDailyScore(curr, category), 0);
    return Math.round(total / logsArr.length);
  };

  const avgScore = getAvgScore(currentPeriodLogs);
  const prevAvgScore = getAvgScore(previousPeriodLogs);
  
  // Hitung Velocity (Perubahan performa)
  const scoreVelocity = avgScore - prevAvgScore; 
  // Nilai positif = Membaik, Negatif = Memburuk

  // Wajib Compliance (Current Period)
  let totalWajibCompliance = 0;
  currentPeriodLogs.forEach(log => totalWajibCompliance += checkWajibCompliance(log, userData.gender));
  const avgWajibCompliance = currentPeriodLogs.length > 0 ? Math.round(totalWajibCompliance / currentPeriodLogs.length) : 0;

  // Weakest Day (Menghitung dari semua data agar lebih akurat polanya)
  const dayScoreMap: Record<number, {total: number, count: number}> = { 
    0: {total:0, count:0}, 1: {total:0, count:0}, 2: {total:0, count:0}, 
    3: {total:0, count:0}, 4: {total:0, count:0}, 5: {total:0, count:0}, 6: {total:0, count:0} 
  };
  
  logs.forEach(log => {
    const isHaidValid = userData.gender === "female" && log.isMenstruating;
    if (isHaidValid && category === 'wajib') return; // Jangan hitung hari haid sebagai weakest day sholat

    const day = new Date(log.date).getDay();
    const dailyScore = calculateDailyScore(log, category);
    if (dailyScore > 0 || !isHaidValid) { 
        dayScoreMap[day].total += dailyScore;
        dayScoreMap[day].count += 1;
    }
  });

  let minAvg = Infinity;
  let weakestDayIndex = -1;
  Object.keys(dayScoreMap).forEach((key: any) => {
    const k = parseInt(key);
    if (dayScoreMap[k].count > 2) { // Butuh minimal 3 data untuk menyimpulkan pola
        const avg = dayScoreMap[k].total / dayScoreMap[k].count;
        if (avg < minAvg) { minAvg = avg; weakestDayIndex = k; }
    }
  });
  const dayNames = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const weakestDay = weakestDayIndex !== -1 ? dayNames[weakestDayIndex] : "-";

  // Habit In Danger (Mencari amalan terlemah yang BUKAN hari haid)
  const habitCounts: Record<string, { done: number, totalApplicable: number }> = {};
  const targetIds = category === "global" ? null : INSIGHT_GROUPS[category];

  logs.forEach(log => {
      // Ambil daftar target id hari itu
      let habitsToCheck = targetIds ? targetIds : MASTER_HABITS.map(h => h.id);
      
      habitsToCheck.forEach(id => {
          if (!habitCounts[id]) habitCounts[id] = { done: 0, totalApplicable: 0 };
          
          const habitDef = MASTER_HABITS.find(h => h.id === id);
          if (!habitDef) return;

          // Cek apakah habit ini wajib di hari itu? (Abaikan jika haid dan habit itu amalan fisik)
          const isHaidValid = userData.gender === "female" && log.isMenstruating;
          if (isHaidValid && habitDef.isPhysical) return;

          habitCounts[id].totalApplicable += 1;
          if (log.checklists?.includes(id)) {
              habitCounts[id].done += 1;
          }
      });
  });

  let habitInDanger = "-";
  let minPercentage = Infinity;
  
  Object.keys(habitCounts).forEach(id => {
      const data = habitCounts[id];
      if (data.totalApplicable > 5) { // Minimal sudah melewati 5 hari pengujian
          const percentage = data.done / data.totalApplicable;
          if (percentage < minPercentage && percentage < 0.5) { // Kurang dari 50% = Danger
              minPercentage = percentage;
              habitInDanger = MASTER_HABITS.find(h => h.id === id)?.title || id;
          }
      }
  });

  return {
    avgScore,
    prevAvgScore,
    scoreVelocity, // NEW: Untuk indikator perbandingan
    wajibCompliance: avgWajibCompliance, 
    weakestDay,
    habitInDanger,
    category,
    menstruatingDates // NEW: Dikirim untuk Heatmap
  };
}

/**
 * NARRATIVE ENGINE V4: Velocity & Deep Context
 */
export function generateZenithInsight(
    analysis: any, 
    userData: { gender: string, isMenstruating: boolean }
) {
  if (!analysis) return { text: "Data belum cukup.", title: "Mulai", color: "neutral", tip: "Isi jurnal setidaknya seminggu." };

  const { avgScore, scoreVelocity, weakestDay, habitInDanger, category } = analysis;
  
  // PENJAGA LAPIS 4B: Narasi tidak akan pernah mengeluarkan teks pink untuk ikhwan
  const isHaid = userData.gender === "female" && userData.isMenstruating;
  
  // Tentukan arah tren
  const trendText = scoreVelocity > 0 ? `naik ${scoreVelocity}%` : scoreVelocity < 0 ? `turun ${Math.abs(scoreVelocity)}%` : "stabil";

  switch (category) {
    case "wajib":
        if (isHaid) return {
            title: "Rehat yang Berkah",
            text: "Tidak sholat saat haid adalah ketaatan. Allah mencatat kerinduanmu.",
            color: "pink",
            tip: "Ganti dengan Dzikir Pagi Petang."
        };
        if (scoreVelocity < -10) return {
            title: "Awas Futuh (Penurunan)",
            text: `Performa sholatmu ${trendText} minggu ini. Hari ${weakestDay !== "-" ? weakestDay : "kerja"} jadi titik rawanmu.`,
            color: "warning",
            tip: "Jangan tunda sholat saat sibuk."
        };
        if (habitInDanger !== "-" && habitInDanger.includes("Subuh")) return {
            title: "Pejuang Subuh",
            text: "Mayoritas sholatmu aman, tapi Subuh jadi kelemahan terbesarmu saat ini.",
            color: "warning",
            tip: "Tidur lebih awal, jangan bergadang."
        };
        return {
            title: "Alhamdulillah Terjaga",
            text: scoreVelocity > 0 
                ? `Luar biasa, kualitas sholatmu ${trendText} minggu ini! Pertahankan.`
                : "Konsistensimu sangat baik. Tantangan berikutnya: Sholat di awal waktu.",
            color: "positive",
            tip: "Lengkapi dengan Rawatib."
        };

    case "rawatib":
        if (habitInDanger !== "-") return {
            title: "Tambal yang Bocor",
            text: `Performa ${trendText}. Kamu konsisten, tapi '${habitInDanger}' sering terlewat.`,
            color: "warning",
            tip: "Qobliyah Subuh pahalanya lebih baik dari dunia & isinya."
        };
        if (avgScore > 60) return {
            title: "Pagar Baja",
            text: `Luar biasa! Rawatibmu ${trendText} minggu ini. Sholat wajibmu kini dipagari dengan kuat.`,
            color: "positive",
            tip: "Jaga terus, ini amalan ahli surga."
        };
        return {
            title: "Mulai Bangun Pagar",
            text: "Rawatib itu penyempurna. Jika sholat wajib ada yang kurang khusyuk, rawatib yang menambalnya.",
            color: "neutral",
            tip: "Mulai rutinkan dari Qobliyah Subuh."
        };

    case "qiyam":
        if (scoreVelocity > 0) return {
            title: "Ahli Malam",
            text: `MasyaAllah, qiyamul lailmu ${trendText}. Allah turun ke langit dunia menunggumu.`,
            color: "positive",
            tip: "Pertahankan walau hanya 2 rakaat ringan."
        };
        if (habitInDanger.includes("Witir")) return {
            title: "Jangan Lupa Ganjil",
            text: "Tahajud kadang berat, tapi usahakan minimal jangan tinggalkan Witir sebelum tidur.",
            color: "warning",
            tip: "1 rakaat witir sudah cukup jika lelah."
        };
        return {
            title: "Keheningan Malam",
            text: "Sepertiga malammu masih sering terlewat. Mulailah dari langkah kecil.",
            color: "neutral",
            tip: "Pasang alarm 15 menit sebelum Subuh."
        };

    case "global":
    default:
        if (isHaid) return {
            title: "Masa Rehat",
            text: "Fisik sedang libur, fokus pada amalan hati dan lisan (Dzikir & Shalawat).",
            color: "pink",
            tip: "Dengarkan murottal saat beraktivitas."
        };
        if (scoreVelocity < -15) return {
            title: "Lampu Kuning",
            text: `Kualitas ibadahmu secara umum ${trendText} minggu ini. Jika ${habitInDanger !== "-" ? habitInDanger : "ibadah"} terasa berat, paksa pelan-pelan.`,
            color: "warning",
            tip: "Istighfar dan perbarui niat."
        };
        if (scoreVelocity > 10) return {
            title: "Grafik Menanjak",
            text: `Kualitas ibadahmu ${trendText}! Kamu sedang dalam fase semangat yang luar biasa.`,
            color: "positive",
            tip: "Bantu bagikan semangat ini ke sekitarmu."
        };
        return {
            title: "Tetap Istiqomah",
            text: `Perjalananmu relatif stabil (${trendText}). Jaga niat hanya karena Allah.`,
            color: "positive",
            tip: "Coba tingkatkan kualitas khusyuknya."
        };
  }
}