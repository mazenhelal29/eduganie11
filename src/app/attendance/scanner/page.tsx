"use client";

import { useState, useRef, useEffect } from "react";
import { useEduGenie } from "@/providers/edugenie-store";
import { ScanLine, CheckCircle2, XCircle, AlertTriangle, Search, ClipboardList, Users, Clock, Camera } from "lucide-react";
import { CameraScanner } from "@/components/ui/camera-scanner";

type ScanState = "idle" | "success" | "error" | "warning" | "unregistered";

export default function ScannerPage() {
  const { cards, students, markAttendance, attendance, payments, assignCard, settings } = useEduGenie();
  const [inputValue, setInputValue] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const [studentName, setStudentName] = useState("");
  const [scannedCardId, setScannedCardId] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [financialAlert, setFinancialAlert] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter(a => a.attendedOn.startsWith(todayStr));
  const recentScans = [...todayAttendance].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);

  // Auto-focus logic to keep the hidden input focused always (if not using camera)
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && !useCamera && scanState === 'idle') {
        inputRef.current.focus();
      }
    };
    
    focusInput();
    window.addEventListener("click", focusInput);
    return () => window.removeEventListener("click", focusInput);
  }, [scanState, useCamera]);

  const playSound = (type: "success" | "error" | "warning") => {
    // Basic beep implementation using Web Audio API
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = "square";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      console.log("Audio not supported or blocked");
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cardId = inputValue.trim();
    if (!cardId) return;

    setInputValue(""); // Clear immediately for next scan
    await processScan(cardId);
  };

  const processScan = async (cardId: string) => {
    // Reset previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 1. O(1) Lookup
    const card = cards[cardId];
    
    if (!card || !card.studentId) {
      setScanState("unregistered");
      setScannedCardId(cardId);
      setMessage("بطاقة مجهولة. لمن تريد تعيينها؟");
      setStudentName("");
      setFinancialAlert(null);
      playSound("warning");
      // No auto-reset so user can interact with the dropdown
      return;
    }

    if (card.status !== "active") {
      setScanState("error");
      setMessage(`البطاقة موقوفة أو مفقودة (الحالة: ${card.status})`);
      setStudentName("");
      playSound("error");
      resetStateAfterDelay();
      return;
    }

    const student = students.find(s => s.id === card.studentId);
    if (!student) {
      setScanState("error");
      setMessage("لم يتم العثور على بيانات الطالب");
      setStudentName("");
      playSound("error");
      resetStateAfterDelay();
      return;
    }

    setStudentName(student.fullName);

    // 1.5 Financial Checks
    const now = new Date();
    const billingModel = settings?.billingModel ?? "prepaid";
    const targetDate = billingModel === "postpaid"
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;

    const hasPaid = payments.some(p => p.studentId === student.id && p.forMonth === targetMonth);
    const studentPayments = payments.filter(p => p.studentId === student.id);
    const lastPayment = studentPayments[0]; // First is newest if sorted, or just use it
    const hasRemainingBalance = lastPayment && lastPayment.remainingBalance > 0;

    let alertMsg = null;
    if (!hasPaid) {
      alertMsg = `🚨 اشتراك هذا الشهر غير مدفوع`;
    } else if (hasRemainingBalance) {
      alertMsg = `⚠️ تذكير: متبقي ${lastPayment.remainingBalance} ج.م`;
    }
    setFinancialAlert(alertMsg);

    // 2. Check for duplicate scan today for same group
    const today = new Date().toISOString().slice(0, 10);
    const hasAttended = attendance.some(a => 
      a.studentId === student.id && 
      a.attendedOn.startsWith(today) &&
      a.groupId === student.groupId
    );

    if (hasAttended) {
      setScanState("warning");
      setMessage("تم تسجيل حضور هذا الطالب مسبقاً اليوم!");
      playSound("warning");
      resetStateAfterDelay();
      return;
    }

    // 3. Optimistic UI & Save
    try {
      setScanState("success");
      setMessage("تم تسجيل الحضور بنجاح");
      playSound("success");
      
      // Async call - store handles optimistic update & rollback
      markAttendance(student.id, "present").catch(err => {
        // This will happen if DB unique constraint fails or network fails
        console.error("Backend validation failed:", err);
        setScanState("warning");
        setMessage("عذراً، تعذر تأكيد الحضور (قد يكون مسجلاً بالفعل)");
        playSound("warning");
      });
      
    } catch {
      setScanState("error");
      setMessage("حدث خطأ في النظام");
      playSound("error");
    }

    resetStateAfterDelay();
  };

  const resetStateAfterDelay = () => {
    timeoutRef.current = setTimeout(() => {
      setScanState("idle");
      setMessage("");
      setStudentName("");
      setScannedCardId("");
      setAssignSearch("");
      setFinancialAlert(null);
      // Ensure input gets focus back automatically if not using camera
      if (inputRef.current && !useCamera) inputRef.current.focus();
    }, 3000); // UI resets after 3 seconds
  };
  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 overflow-hidden">
      
      {/* Hidden Scanner Input */}
      <form onSubmit={handleScan} className="absolute opacity-0 pointer-events-none">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoFocus
        />
        <button type="submit">Scan</button>
      </form>

      {/* Main Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => setUseCamera(!useCamera)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-md border-2 ${
              useCamera 
                ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-5 h-5" />
            {useCamera ? 'إيقاف الكاميرا' : 'فتح الكاميرا 📷'}
          </button>
        </div>

        <div className={`w-full max-w-2xl rounded-3xl p-12 text-center transition-all duration-300 shadow-2xl ${
          scanState === 'idle' ? 'bg-white border-2 border-slate-200' :
          scanState === 'success' ? 'bg-emerald-500 border-emerald-600 scale-105' :
          scanState === 'error' ? 'bg-red-500 border-red-600 scale-105' :
          scanState === 'unregistered' ? 'bg-white border-2 border-amber-500 shadow-amber-500/20 scale-105' :
          'bg-amber-500 border-amber-600 scale-105'
        }`}>
          
          {scanState === 'idle' && !useCamera && (
            <div className="space-y-6 text-slate-400 flex flex-col items-center">
              <ScanLine className="w-32 h-32 animate-pulse text-slate-300" />
              <h2 className="text-3xl font-bold text-slate-600">جاهز للمسح</h2>
              <p className="text-xl">قم بتمرير البطاقة على جهاز القارئ...</p>
            </div>
          )}

          {scanState === 'idle' && useCamera && (
            <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <h2 className="text-2xl font-bold text-slate-700 mb-2">وجّه الكاميرا نحو الـ QR Code</h2>
              <CameraScanner 
                onScan={processScan} 
                paused={scanState !== 'idle'} 
              />
            </div>
          )}

          {scanState === 'success' && (
            <div className="space-y-6 text-white flex flex-col items-center animate-in zoom-in duration-200">
              <CheckCircle2 className="w-32 h-32" />
              <h2 className="text-4xl font-bold">{studentName}</h2>
              <p className="text-2xl opacity-90">{message}</p>
              {financialAlert && (
                <div className="mt-4 bg-white/20 text-white font-bold py-2 px-6 rounded-full text-xl animate-bounce">
                  {financialAlert}
                </div>
              )}
            </div>
          )}

          {scanState === 'error' && (
            <div className="space-y-6 text-white flex flex-col items-center animate-in zoom-in duration-200">
              <XCircle className="w-32 h-32" />
              <h2 className="text-4xl font-bold">خطأ!</h2>
              <p className="text-2xl opacity-90">{message}</p>
            </div>
          )}

          {scanState === 'warning' && (
            <div className="space-y-6 text-white flex flex-col items-center animate-in zoom-in duration-200">
              <AlertTriangle className="w-32 h-32" />
              <h2 className="text-4xl font-bold">{studentName}</h2>
              <p className="text-2xl opacity-90">{message}</p>
              {financialAlert && (
                <div className="mt-4 bg-white/20 text-white font-bold py-2 px-6 rounded-full text-xl">
                  {financialAlert}
                </div>
              )}
            </div>
          )}

          {scanState === 'unregistered' && (
            <div className="space-y-6 flex flex-col items-center animate-in zoom-in duration-200 w-full">
              <AlertTriangle className="w-24 h-24 text-amber-500" />
              <h2 className="text-3xl font-bold text-amber-600">بطاقة غير مسجلة!</h2>
              <p className="text-xl text-slate-600">{message}</p>
              
              <div className="w-full max-w-sm mt-4 text-left">
                <div className="relative mb-3">
                  <Search className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="ابحث عن طالب لربط البطاقة..."
                    className="w-full pl-4 pr-10 py-3 border-2 rounded-xl outline-none focus:border-amber-500 text-slate-800 text-lg bg-slate-50"
                    value={assignSearch}
                    onChange={e => setAssignSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-[180px] overflow-y-auto space-y-2 custom-scrollbar">
                  {students.filter(s => s.status === "active" && (s.fullName.includes(assignSearch) || s.phone.includes(assignSearch))).slice(0, 5).map(s => (
                    <button 
                      key={s.id}
                      onClick={async () => {
                        try {
                          await assignCard(scannedCardId, s.id);
                          await markAttendance(s.id, "present");
                          setScanState("success");
                          setStudentName(s.fullName);
                          setMessage("تم الربط وتسجيل الحضور بنجاح!");
                          setFinancialAlert(null);
                          playSound("success");
                          resetStateAfterDelay();
                        } catch {
                          setScanState("error");
                          setMessage("حدث خطأ أثناء الربط");
                          playSound("error");
                          resetStateAfterDelay();
                        }
                      }}
                      className="w-full text-right p-3 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-700 transition-colors font-medium flex justify-between items-center"
                    >
                      <span>{s.fullName}</span>
                      <span className="text-sm text-slate-400" dir="ltr">{s.phone}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => { setScanState("idle"); setScannedCardId(""); setAssignSearch(""); if(inputRef.current) inputRef.current.focus(); }}
                  className="w-full mt-4 py-3 border-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                  type="button"
                >
                  إلغاء وتجاهل
                </button>
              </div>
            </div>
          )}

        </div>
        
        {!useCamera && (
          <div className="mt-8 text-slate-400 font-medium">
            (القارئ يعمل في الخلفية دائماً، لا حاجة للنقر على أي شيء)
          </div>
        )}
      </div>

      {/* Live Feed Sidebar */}
      <div className="w-[400px] bg-white border-r border-slate-200 shadow-sm hidden lg:flex flex-col z-10">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800">
            <ClipboardList className="text-primary" /> سجل حضور اليوم
          </h3>
          <div className="mt-4 flex items-center justify-between bg-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-600">إجمالي الحضور</span>
            </div>
            <span className="text-2xl font-black text-primary">{todayAttendance.length}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {recentScans.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Clock className="w-12 h-12 opacity-20" />
              <p>لم يتم تسجيل حضور أحد بعد</p>
            </div>
          ) : (
            recentScans.map((record) => {
              const s = students.find(x => x.id === record.studentId);
              if (!s) return null;
              
              const isLate = record.status === 'late';
              const timeStr = new Date(record.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={record.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors animate-in slide-in-from-right-2">
                  <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full ${isLate ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-700 truncate">{s.fullName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeStr}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${isLate ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {isLate ? 'متأخر' : 'حاضر'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
