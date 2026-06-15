"use client";

import { useState, useRef, useEffect } from "react";
import { useEduGenie } from "@/providers/edugenie-store";
import { toast } from "@/components/ui/toast";
import { CreditCard, ScanLine, Search, User, CheckCircle2, AlertCircle } from "lucide-react";

export default function AssignCardPage() {
  const { students, cards, assignCard } = useEduGenie();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [cardInput, setCardInput] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when a student is selected
  useEffect(() => {
    if (selectedStudentId) {
      inputRef.current?.focus();
    }
  }, [selectedStudentId]);

  const filteredStudents = students.filter(s =>
    s.status === "active" &&
    (s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm))
  ).slice(0, 10);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Find if student already has a card
  const existingCardForStudent = Object.values(cards).find(c => c.studentId === selectedStudentId && c.status === "active");

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !cardInput.trim()) return;

    const trimmedCardId = cardInput.trim();

    // Validate if card is already assigned to someone else
    const cardInUse = cards[trimmedCardId];
    if (cardInUse && cardInUse.studentId && cardInUse.studentId !== selectedStudentId && cardInUse.status === 'active') {
      const owner = students.find(s => s.id === cardInUse.studentId);
      toast.error(`هذه البطاقة معينة مسبقاً للطالب: ${owner?.fullName || "غير معروف"}`);
      setCardInput("");
      return;
    }

    if (existingCardForStudent && existingCardForStudent.cardId !== trimmedCardId) {
      if (!window.confirm("هذا الطالب يمتلك بطاقة بالفعل. هل تريد استبدالها بهذه البطاقة الجديدة؟")) {
        setCardInput("");
        return;
      }
    }

    setIsAssigning(true);
    try {
      await assignCard(trimmedCardId, selectedStudentId);
      toast.success("تم تعيين البطاقة بنجاح");
      setCardInput("");
      setSelectedStudentId(null);
      setSearchTerm("");
    } catch {
      toast.error("حدث خطأ أثناء تعيين البطاقة");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary" />
            تعيين البطاقات
          </h1>
          <p className="text-muted-foreground mt-2">
            قم بالبحث عن الطالب ثم مرر البطاقة على جهاز القارئ (Scanner).
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Step 1: Select Student */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
              اختر الطالب
            </h2>

            <div className="relative mb-4">
              <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredStudents.map(student => {
                const hasCard = Object.values(cards).some(c => c.studentId === student.id && c.status === "active");
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full text-right p-3 rounded-lg border transition-all ${selectedStudentId === student.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "hover:border-primary/50 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${hasCard ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">{student.fullName}</div>
                          <div className="text-sm text-muted-foreground" dir="ltr">{student.phone}</div>
                        </div>
                      </div>
                      {hasCard && (
                        <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          مُعيّن
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {searchTerm && filteredStudents.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  لا يوجد نتائج مطابقة
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Scan Card */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-4 shadow-sm h-full">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
              امسح البطاقة
            </h2>

            {selectedStudent ? (
              <div className="space-y-6 flex flex-col items-center justify-center h-[300px]">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                    <ScanLine className="w-8 h-8" />
                  </div>
                  <h3 className="font-medium text-lg">{selectedStudent.fullName}</h3>
                  {existingCardForStudent ? (
                    <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      يمتلك بطاقة بالفعل (سيتم الاستبدال)
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      جاهز لتعيين بطاقة جديدة
                    </div>
                  )}
                </div>

                <form onSubmit={handleAssign} className="w-full max-w-xs">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="مرر البطاقة هنا..."
                    className="w-full text-center py-3 border-2 border-primary/20 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium"
                    value={cardInput}
                    onChange={(e) => setCardInput(e.target.value)}
                    disabled={isAssigning}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!cardInput.trim() || isAssigning}
                    className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-xl font-medium disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {isAssigning ? "جاري التعيين..." : "حفظ البطاقة"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <User className="w-12 h-12 opacity-20" />
                <p>يرجى اختيار طالب أولاً من القائمة الجانبية</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
