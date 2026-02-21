"use client";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import FloatingFeedbackButton from "@/components/FloatingFeedbackButton";
import { 
  LogOut, 
  User as UserIcon, 
  Loader2, 
  History, 
  Settings, 
  Sparkles,
  X,
  Mail,
  Edit3,
  Check,
  Dices,
  AtSign,
  ShieldCheck, 
  Star,
  ChevronLeft,
  ChevronRight,
  Calendar
} from "lucide-react"; 
import TrackerList from "@/components/tracker/TrackerList";
import { checkUserStatus, updateUserProfile } from "@/actions/user";
import { getDailyLog } from "@/actions/log";
import { cn } from "@/lib/utils";
import { MASTER_HABITS } from "@/lib/constants";

import { getGlobalHijriOffset, fetchKemenagPrayerTimes } from "@/actions/system";
import { getSmartHijriDate, formatHijriDate, getMoonPhaseIcon } from "@/lib/utils";

// HELPER: Format Date ke YYYY-MM-DD lokal (tanpa kena offset UTC)
const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [dailyLog, setDailyLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  
  const [hijriOffset, setHijriOffset] = useState(0); 
  const [apiTimings, setApiTimings] = useState<any>(null); 

  // --- STATE MESIN WAKTU ---
  const todayStr = useMemo(() => formatDateLocal(new Date()), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [isChangingDate, setIsChangingDate] = useState(false);

  // STATE MODAL & EDIT
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      displayName: "",
      username: "",
      gender: "",
      photoURL: ""
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 4) setGreeting("Qiyamul Lail ..");
    else if (hour < 10) setGreeting("Selamat Pagi ..");
    else if (hour < 15) setGreeting("Selamat Siang ..");
    else if (hour < 18) setGreeting("Selamat Sore ..");
    else setGreeting("Selamat Malam ..");

    getGlobalHijriOffset().then(setHijriOffset);
  }, []);

  const dateInfo = useMemo(() => {
      const targetDate = new Date(selectedDateStr);
      const isToday = selectedDateStr === todayStr;
      
      const masehi = targetDate.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const hijriObj = getSmartHijriDate(targetDate, hijriOffset);
      const hijriText = formatHijriDate(hijriObj);
      const moonIcon = getMoonPhaseIcon(hijriObj.day);

      return { masehi, hijriText, moonIcon, isToday };
  }, [selectedDateStr, hijriOffset, todayStr]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      setUser(currentUser);
      
      try {
        const userData = await checkUserStatus(currentUser.uid);
        if (!userData || !userData.onboardingCompleted) {
          router.push("/onboarding");
          return;
        }

        setDbUser(userData);
        setEditForm({
            displayName: userData.displayName || "",
            username: userData.username || "",
            gender: userData.gender || "male",
            photoURL: userData.photoURL || "" 
        });

      } catch (error) {
        console.error("Failed to load user data", error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // EFEK MESIN WAKTU: Fetch Log & Adzan setiap selectedDate berubah
  useEffect(() => {
    if (!user || !dbUser) return;
    
    let isMounted = true;
    setIsChangingDate(true);

    console.log(`[MESIN WAKTU] Memulai penarikan data untuk tanggal: ${selectedDateStr}`); // 🔴 LOG 1

    const fetchDailyData = async () => {
        try {
            const [logData, timings] = await Promise.all([
                getDailyLog(user.uid, selectedDateStr),
                dbUser.location ? fetchKemenagPrayerTimes(dbUser.location.lat, dbUser.location.lng, selectedDateStr) : Promise.resolve(null)
            ]);

            console.log(`[MESIN WAKTU] Data diterima dari Server:`, { logData, timings }); // 🔴 LOG 2

            if (isMounted) {
                setDailyLog(logData || { checklists: [], counters: {} });
                setApiTimings(timings);
            }
        } catch (error) {
            console.error("Gagal mengambil data harian:", error);
        } finally {
            if (isMounted) {
                setIsChangingDate(false);
                setLoading(false); 
            }
        }
    };

    fetchDailyData();

    return () => { isMounted = false; };
  }, [selectedDateStr, user, dbUser]);

  const handlePrevDay = () => {
      const d = new Date(selectedDateStr);
      d.setDate(d.getDate() - 1);
      const newDate = formatDateLocal(d);
      console.log(`[TOMBOL] Geser Mundur ke: ${newDate}`); // 🔴 LOG 3
      setSelectedDateStr(newDate);
  };

  const handleNextDay = () => {
      if (dateInfo.isToday) return; 
      const d = new Date(selectedDateStr);
      d.setDate(d.getDate() + 1);
      const newDate = formatDateLocal(d);
      console.log(`[TOMBOL] Geser Maju ke: ${newDate}`); // 🔴 LOG 4
      setSelectedDateStr(newDate);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  const handleGenerateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const style = editForm.gender === 'female' ? 'adventurer-neutral' : 'adventurer'; 
    const newAvatar = `https://api.dicebear.com/9.x/${style}/svg?seed=${randomSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    setEditForm(prev => ({ ...prev, photoURL: newAvatar }));
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    setSaveError("");

    const res = await updateUserProfile(user.uid, editForm);

    if (res.success) {
        setIsEditing(false);
        setDbUser((prev: any) => ({ 
            ...prev, 
            displayName: editForm.displayName,
            username: editForm.username,
            gender: editForm.gender,
            photoURL: editForm.photoURL
        }));
    } else {
        setSaveError(res.error || "Gagal menyimpan.");
    }
    setSaveLoading(false);
  };

  const stats = useMemo(() => {
    if (!dailyLog || !dbUser) return { wajibPercent: 0, sunnahPercent: 0, totalScore: 0 };
    
    const activeHabitIds = Object.keys(dbUser.preferences?.activeHabits || {}).filter(k => dbUser.preferences.activeHabits[k]);
    const allWajibIds = MASTER_HABITS.filter(h => h.category === 'wajib').map(h => h.id);
    const targetIds = Array.from(new Set([...activeHabitIds, ...allWajibIds]));

    const wajibTargets = targetIds.filter(id => MASTER_HABITS.find(h => h.id === id)?.category === 'wajib');
    const sunnahTargets = targetIds.filter(id => MASTER_HABITS.find(h => h.id === id)?.category !== 'wajib');

    const checked = dailyLog.checklists || [];
    const completedWajib = wajibTargets.filter(id => checked.includes(id)).length;
    const completedSunnah = sunnahTargets.filter(id => checked.includes(id)).length;

    let wajibPercent = 0;
    if (dbUser.preferences?.isMenstruating) {
        wajibPercent = 100; 
    } else {
        wajibPercent = wajibTargets.length > 0 ? Math.round((completedWajib / wajibTargets.length) * 100) : 0;
    }

    const sunnahPercent = sunnahTargets.length > 0 ? Math.round((completedSunnah / sunnahTargets.length) * 100) : 0;

    console.log(`[STATS KALKULASI] Wajib: ${wajibPercent}%, Sunnah: ${sunnahPercent}%`, { dailyLogChecklists: dailyLog.checklists }); // 🔴 LOG 5

    return { wajibPercent, sunnahPercent, completedWajib, totalWajib: wajibTargets.length };
  }, [dailyLog, dbUser]);

// --- HANDLER REAL-TIME UPDATE (Optimistic) ---
  
  // Fungsi untuk menangani perubahan ceklis secara instan
  const onHabitToggle = (habitId: string) => {
    setDailyLog((prev: any) => {
      const currentChecklists = prev?.checklists || [];
      const isExist = currentChecklists.includes(habitId);
      
      const newChecklists = isExist 
        ? currentChecklists.filter((id: string) => id !== habitId)
        : [...currentChecklists, habitId];

      return { ...prev, checklists: newChecklists };
    });
  };

  // Fungsi untuk menangani perubahan angka (counter) secara instan
  const onCounterUpdate = (habitId: string, newValue: number) => {
    setDailyLog((prev: any) => ({
      ...prev,
      counters: {
        ...(prev?.counters || {}),
        [habitId]: newValue
      }
    }));
  };

  if (loading || !user || !dbUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-emerald-500 gap-4">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-10 selection:bg-emerald-500/30">
      
      <div className="fixed top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed top-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-lg px-6 pt-8">
        
        <header className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-1 block">
              {greeting}
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight text-glow mb-1">
              {dbUser.displayName?.split(" ")[0]}
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center md:gap-2 text-xs font-medium mt-1">
                <span className="hidden md:inline h-1 w-1 rounded-full bg-slate-600"></span>
                <span className="text-indigo-300 flex items-center gap-1.5 mt-0.5 md:mt-0">
                    <span className="text-sm filter drop-shadow-md">{dateInfo.moonIcon}</span> 
                    {dateInfo.hijriText}
                </span>
            </div>
          </div>
          
          <button 
            onClick={() => { setIsProfileOpen(true); setIsEditing(false); }} 
            className="relative group transition-transform active:scale-95"
          >
            {dbUser.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={dbUser.photoURL} 
                alt="Profile" 
                className="h-10 w-10 rounded-full border-2 border-slate-800 object-cover ring-2 ring-transparent group-hover:ring-emerald-500/50 transition-all shadow-lg bg-slate-800"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/50">
                <UserIcon className="h-5 w-5 text-slate-400" />
              </div>
            )}
          </button>
        </header>

        {/* --- NAVIGASI TANGGAL (MESIN WAKTU) --- */}
        <div className="flex items-center justify-between bg-slate-900/50 border border-white/5 rounded-2xl p-2 mb-6 backdrop-blur-sm">
            <button 
                onClick={handlePrevDay}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors active:scale-95"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center">
                <button 
                    onClick={() => setSelectedDateStr(todayStr)}
                    className={cn(
                        "text-sm font-bold tracking-wide transition-colors flex items-center gap-2",
                        dateInfo.isToday ? "text-emerald-400 cursor-default" : "text-white hover:text-emerald-300 active:scale-95"
                    )}
                >
                    <Calendar className="h-4 w-4" />
                    {dateInfo.isToday ? "HARI INI" : dateInfo.masehi}
                </button>
                {!dateInfo.isToday && (
                    <span className="text-[10px] text-amber-500/80 font-medium">Log Sebelumnya</span>
                )}
            </div>

            <button 
                onClick={handleNextDay}
                disabled={dateInfo.isToday}
                className={cn(
                    "p-2 rounded-xl transition-all",
                    dateInfo.isToday 
                        ? "text-slate-700 cursor-not-allowed" 
                        : "hover:bg-white/5 text-slate-400 hover:text-white active:scale-95"
                )}
            >
                <ChevronRight className="h-5 w-5" />
            </button>
        </div>

        {/* --- HERO CARD --- */}
        <div className={cn(
            "relative mb-10 overflow-hidden rounded-3xl border p-6 shadow-2xl transition-all duration-500",
            dateInfo.isToday 
                ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-white/10" 
                : "bg-slate-900/80 border-amber-500/20 grayscale-[20%]" 
        )}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
            
            <div className="relative z-10 flex flex-col gap-6">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-xs font-bold tracking-widest uppercase">Fondasi (Wajib)</span>
                        </div>
                        <span className="text-xl font-bold font-mono text-white">{stats.wajibPercent}%</span>
                    </div>
                    <div className="relative h-3 w-full rounded-full bg-slate-800/80 shadow-inner overflow-hidden">
                        <div 
                            className="absolute left-0 top-0 h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `${stats.wajibPercent}%` }}
                        ></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Star className="h-4 w-4" />
                            <span className="text-xs font-bold tracking-widest uppercase">Bonus (Sunnah)</span>
                        </div>
                        <span className="text-xl font-bold font-mono text-white">{stats.sunnahPercent}%</span>
                    </div>
                    <div className="relative h-3 w-full rounded-full bg-slate-800/80 shadow-inner overflow-hidden">
                        <div 
                            className="absolute left-0 top-0 h-full rounded-full bg-amber-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            style={{ width: `${stats.sunnahPercent}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
             <button 
                onClick={() => router.push('/history')}
                className="group flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 transition-all"
             >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <History className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">Riwayat</span>
                </div>
            </button>

            <button 
                onClick={() => router.push('/settings/habits')}
                className="group flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 transition-all"
             >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Settings className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">Atur Menu</span>
                </div>
            </button>
        </div>

        {/* --- TRACKER LIST --- */}
        <div className="relative z-10 min-h-[400px]">
            <div className="flex items-center gap-3 mb-6 px-1">
                <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                    Jadwal Ibadah {dateInfo.isToday ? "" : "(Lampau)"}
                </h3>
            </div>
            
            <div className={cn("transition-opacity duration-300", isChangingDate ? "opacity-30 pointer-events-none" : "opacity-100")}>
                {isChangingDate && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                    </div>
                )}
                <TrackerList 
                    userData={{ 
                        uid: user.uid, 
                        gender: dbUser.gender, 
                        preferences: dbUser.preferences,
                        location: dbUser.location,     
                        hijriOffset: dbUser.hijriOffset 
                    }} 
                    dailyLog={dailyLog} 
                    date={selectedDateStr} 
                    apiTimings={apiTimings} 
                    onHabitToggle={onHabitToggle}     // <--- TAMBAHKAN INI
                    onCounterUpdate={onCounterUpdate}
                />
            </div>
        </div>
      </div>

      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setIsProfileOpen(false)}
            />
            
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-scale-in">
                
                <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center pt-2">
                    
                    <div className="relative mb-6 group">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 opacity-50 blur-md group-hover:opacity-75 transition-opacity"></div>
                        
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={isEditing ? editForm.photoURL : (dbUser.photoURL || "")} 
                            alt="Profile" 
                            className="relative h-28 w-28 rounded-full border-4 border-slate-900 object-cover shadow-xl bg-slate-800"
                        />

                        {isEditing && (
                            <button 
                                onClick={handleGenerateAvatar}
                                className="absolute bottom-0 right-0 rounded-full bg-emerald-500 p-2 text-white shadow-lg hover:bg-emerald-400 hover:scale-110 transition-all border-4 border-slate-900"
                                title="Acak Avatar"
                            >
                                <Dices className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
                        <div className="w-full text-center space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-0.5">
                                    {dbUser.displayName}
                                </h2>
                                <p className="text-emerald-400 font-medium text-sm">@{dbUser.username || "username"}</p>
                            </div>

                            <div className="flex justify-center gap-2">
                                <div className="flex items-center gap-1.5 rounded-full bg-slate-800/50 px-3 py-1 text-xs text-slate-400 border border-white/5">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-slate-800/50 px-3 py-1 text-xs text-slate-400 border border-white/5 capitalize">
                                    <UserIcon className="h-3 w-3" />
                                    {dbUser.gender === "male" ? "Ikhwan" : "Akhwat"}
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 font-semibold text-white transition-all hover:bg-white/10 border border-white/5"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit Profil
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 py-3 font-semibold text-red-400 transition-all hover:bg-red-500 hover:text-white border border-red-500/10"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Keluar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full space-y-4 animate-scale-in">
                            <div className="space-y-1 text-left">
                                <label className="text-xs font-medium text-slate-400 ml-1">Nama Panggilan</label>
                                <input 
                                    type="text"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm(prev => ({...prev, displayName: e.target.value}))}
                                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Nama antum"
                                />
                            </div>

                            <div className="space-y-1 text-left">
                                <label className="text-xs font-medium text-slate-400 ml-1">Username </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
                                        <AtSign className="h-4 w-4" />
                                    </div>
                                    <input 
                                        type="text"
                                        value={editForm.username}
                                        onChange={(e) => {
                                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "");
                                            setEditForm(prev => ({...prev, username: val}))
                                        }}
                                        className="w-full rounded-xl bg-slate-950 border border-white/10 pl-10 pr-4 py-3 text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => {
                                        setEditForm(prev => ({...prev, gender: "male"}));
                                        if (editForm.gender !== "male") {
                                            const seed = Math.random().toString(36).substring(7);
                                            setEditForm(prev => ({...prev, gender: "male", photoURL: `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9` }));
                                        }
                                    }}
                                    className={cn(
                                        "rounded-xl border py-3 text-sm font-medium transition-all",
                                        editForm.gender === "male" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-slate-950 border-white/10 text-slate-400 hover:bg-slate-800"
                                    )}
                                >
                                    Ikhwan
                                </button>
                                <button 
                                    onClick={() => {
                                        setEditForm(prev => ({...prev, gender: "female"}));
                                        if (editForm.gender !== "female") {
                                            const seed = Math.random().toString(36).substring(7);
                                            setEditForm(prev => ({...prev, gender: "female", photoURL: `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}&backgroundColor=ffdfbf,ffd5dc,d1d4f9` }));
                                        }
                                    }}
                                    className={cn(
                                        "rounded-xl border py-3 text-sm font-medium transition-all",
                                        editForm.gender === "female" ? "bg-pink-500/20 border-pink-500 text-pink-400" : "bg-slate-950 border-white/10 text-slate-400 hover:bg-slate-800"
                                    )}
                                >
                                    Akhwat
                                </button>
                            </div>

                            {saveError && (
                                <p className="text-xs text-red-400 text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                    {saveError}
                                </p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditForm({
                                            displayName: dbUser.displayName || "",
                                            username: dbUser.username || "",
                                            gender: dbUser.gender || "",
                                            photoURL: dbUser.photoURL || ""
                                        });
                                    }}
                                    className="flex-1 rounded-xl bg-slate-800 py-3 font-semibold text-slate-300 hover:bg-slate-700 transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={saveLoading}
                                    className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-400 transition-all disabled:opacity-70"
                                >
                                    {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Simpan
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
        <FloatingFeedbackButton />
    </main>
  );
}