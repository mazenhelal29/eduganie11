"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createSupabaseClient, fetchUserTenant, fetchTenantData } from "@/services/supabase-sync";
import type { AttendanceRecord, Expense, Group, Payment, Student, Teacher, StudentCard } from "@/types/domain";

type EduGenieState = {
  settings: {
    billingModel: "prepaid" | "postpaid";
  };
  teachers: Teacher[];
  students: Student[];
  groups: Group[];
  attendance: AttendanceRecord[];
  payments: Payment[];
  expenses: Expense[];
  cards: Record<string, StudentCard>;
  isLoading: boolean;
  isSuperAdmin: boolean;
  subscription: {
    endDate: string;
    isActive: boolean;
  };
};

type NewStudent = Pick<Student, "fullName" | "phone" | "parentPhone" | "groupId" | "notes" | "teacherId"> & { cardId?: string };
type NewGroup = Pick<Group, "name" | "subject" | "teacherId" | "schedule" | "capacity" | "monthlySessions" | "monthlyPrice">;
type NewPayment = Pick<Payment, "studentId" | "amount" | "remainingBalance" | "forMonth">;
type NewExpense = Pick<Expense, "category" | "amount" | "notes">;

type EduGenieActions = {
  updateSettings: (settings: Partial<EduGenieState["settings"]>) => Promise<void>;
  addStudent: (student: NewStudent) => Promise<Student>;
  archiveStudent: (studentId: string) => Promise<void>;
  addGroup: (group: NewGroup) => Promise<void>;
  markAttendance: (studentId: string, status: AttendanceRecord["status"]) => Promise<void>;
  markGroupAttendance: (records: { studentId: string; status: AttendanceRecord["status"] }[]) => Promise<void>;
  addPayment: (payment: NewPayment) => Promise<void>;
  addExpense: (expense: NewExpense) => Promise<void>;
  addTeacher: (teacher: Omit<Teacher, "id" | "tenantId" | "createdAt" | "updatedAt" | "isActive">) => Promise<void>;
  editStudent: (studentId: string, data: Partial<NewStudent>) => Promise<void>;
  editGroup: (groupId: string, data: Partial<NewGroup>) => Promise<void>;
  editTeacher: (teacherId: string, data: Partial<Omit<Teacher, "id" | "tenantId" | "createdAt" | "updatedAt">>) => Promise<void>;
  archiveGroup: (groupId: string) => Promise<void>;
  archiveTeacher: (teacherId: string) => Promise<void>;
  assignCard: (cardId: string, studentId: string) => Promise<void>;
  refreshData: () => Promise<void>;
};

type EduGenieContextValue = EduGenieState &
  EduGenieActions & {
    tenantId: string | null;
    metrics: {
      totalStudents: number;
      activeStudents: number;
      todayAttendanceRate: number;
      monthlyRevenue: number;
      monthlyExpenses: number;
      netProfit: number;
      overdueCount: number;
    };
  };

type Action =
  | { type: "hydrate"; payload: Omit<EduGenieState, "isLoading"> }
  | { type: "setLoading"; payload: boolean }
  | { type: "reset" }
  | { type: "updateSettings"; payload: Partial<EduGenieState["settings"]> }
  | { type: "addStudent"; payload: Student }
  | { type: "updateStudentStatus"; payload: { id: string; status: Student["status"] } }
  | { type: "addGroup"; payload: Group }
  | { type: "addAttendanceRecords"; payload: AttendanceRecord[] }
  | { type: "addPayment"; payload: Payment }
  | { type: "addExpense"; payload: Expense }
  | { type: "addTeacher"; payload: Teacher }
  | { type: "updateStudent"; payload: Student }
  | { type: "updateGroup"; payload: Group }
  | { type: "updateTeacher"; payload: Teacher }
  | { type: "updateGroupStatus"; payload: { id: string; isActive: boolean } }
  | { type: "updateTeacherStatus"; payload: { id: string; isActive: boolean } }
  | { type: "assignCard"; payload: StudentCard };

const STORAGE_KEY = "edugenie.mvp.state.v2";
const CACHE_TTL_MS = 5 * 60 * 1000;

type TenantData = Omit<EduGenieState, "isLoading">;
type CachedTenantData = {
  savedAt: number;
  data: TenantData;
};

const initialState: EduGenieState = {
  settings: { billingModel: "prepaid" },
  teachers: [],
  students: [],
  groups: [],
  attendance: [],
  payments: [],
  expenses: [],
  cards: {},
  isLoading: true,
  isSuperAdmin: false,
  subscription: { endDate: new Date().toISOString(), isActive: true },
};

const EduGenieContext = createContext<EduGenieContextValue | null>(null);

function getCacheKey(tenantId: string) {
  return `${STORAGE_KEY}.cache.${tenantId}`;
}

function readTenantCache(tenantId: string | null): CachedTenantData | null {
  if (!tenantId) return null;
  try {
    const raw = window.localStorage.getItem(getCacheKey(tenantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTenantData | TenantData;

    if ("savedAt" in parsed && "data" in parsed) {
      return parsed;
    }

    return { savedAt: 0, data: parsed as TenantData };
  } catch (error) {
    console.error("Failed to parse cached tenant data", error);
    return null;
  }
}

function writeTenantCache(tenantId: string | null, data: TenantData) {
  if (!tenantId) return;
  const payload: CachedTenantData = { savedAt: Date.now(), data };
  const write = () => window.localStorage.setItem(getCacheKey(tenantId), JSON.stringify(payload));

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(write, { timeout: 1000 });
    return;
  }

  globalThis.setTimeout(write, 0);
}

function reducer(state: EduGenieState, action: Action): EduGenieState {
  switch (action.type) {
    case "reset":
      return { ...initialState, isLoading: true };
    case "hydrate":
      return { ...state, ...action.payload, isLoading: false };
    case "setLoading":
      return { ...state, isLoading: action.payload };
    case "updateSettings":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "addStudent":
      return { ...state, students: [action.payload, ...state.students] };
    case "updateStudentStatus":
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.payload.id ? { ...s, status: action.payload.status, updatedAt: new Date().toISOString() } : s
        ),
      };
    case "addGroup":
      return { ...state, groups: [action.payload, ...state.groups] };
    case "assignCard":
      return {
        ...state,
        cards: { ...state.cards, [action.payload.cardId]: action.payload },
      };
    case "addAttendanceRecords": {
      const newIds = action.payload.map(r => r.studentId);
      const attendedOn = action.payload[0]?.attendedOn;
      return {
        ...state,
        attendance: [
          ...action.payload,
          ...state.attendance.filter((record) => !(newIds.includes(record.studentId) && record.attendedOn === attendedOn)),
        ],
      };
    }
    case "addPayment":
      return { ...state, payments: [action.payload, ...state.payments] };
    case "addExpense":
      return { ...state, expenses: [...state.expenses, action.payload] };
    case "addTeacher":
      return { ...state, teachers: [...state.teachers, action.payload] };
    case "updateStudent":
      return {
        ...state,
        students: state.students.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };
    case "updateGroup":
      return {
        ...state,
        groups: state.groups.map((g) => (g.id === action.payload.id ? action.payload : g)),
      };
    case "updateTeacher":
      return {
        ...state,
        teachers: state.teachers.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case "updateGroupStatus":
      return {
        ...state,
        groups: state.groups.map((g) => (g.id === action.payload.id ? { ...g, isActive: action.payload.isActive, updatedAt: new Date().toISOString() } : g)),
      };
    case "updateTeacherStatus":
      return {
        ...state,
        teachers: state.teachers.map((t) => (t.id === action.payload.id ? { ...t, isActive: action.payload.isActive, updatedAt: new Date().toISOString() } : t)),
      };
    default:
      return state;
  }
}

export function EduGenieProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseClient(), []);
  const lastFetchAt = useRef(0);
  const activeLoad = useRef<Promise<void> | null>(null);

  const loadData = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (activeLoad.current && !force) {
        return activeLoad.current;
      }

      const task = (async () => {
        try {
          // 1. Get the current user's tenant ID
          const activeTenantId = await fetchUserTenant(supabase);

          if (!activeTenantId) {
            // No logged-in user — reset state and stop loading
            dispatch({ type: "reset" });
            dispatch({ type: "setLoading", payload: false });
            return;
          }

          // Update tenantId if it changed and clear previous data if switching accounts
          setTenantId((prev) => {
            if (prev && activeTenantId.tenantId !== prev) {
              dispatch({ type: "reset" });
            }
            return activeTenantId.tenantId;
          });

          // Super admin without a tenant - just mark as loaded with isSuperAdmin flag
          if (activeTenantId.isSuperAdmin && !activeTenantId.tenantId) {
            dispatch({
              type: "hydrate",
              payload: {
                ...initialState,
                isSuperAdmin: true,
                subscription: { endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), isActive: true },
              },
            });
            return;
          }


          // 2. Try to load from cache for instant UI (optional)
          const cached = readTenantCache(activeTenantId.tenantId);
          if (cached) {
            dispatch({ type: "hydrate", payload: { ...cached.data, isSuperAdmin: activeTenantId.isSuperAdmin } });
            if (!force && Date.now() - cached.savedAt < CACHE_TTL_MS) {
              return;
            }
          }

          // 3. Always fetch fresh data from Supabase (don't rely on cache)
          const data = await fetchTenantData(supabase, activeTenantId.tenantId!);

          const now = new Date();
          const endDate = new Date(data.subscription.endDate);
          const isActive = endDate > now;

          const cardsRecord = data.cards.reduce((acc, card) => {
            acc[card.cardId] = card;
            return acc;
          }, {} as Record<string, StudentCard>);

          const { cards, ...restData } = data;
          void cards;
          const finalData = {
            ...restData,
            cards: cardsRecord,
            isSuperAdmin: activeTenantId.isSuperAdmin,
            subscription: { endDate: data.subscription.endDate, isActive },
          };

          dispatch({ type: "hydrate", payload: finalData });
          lastFetchAt.current = Date.now();
          // Update cache with fresh data
          writeTenantCache(activeTenantId.tenantId!, finalData);
        } catch (error) {
          console.error("Error loading data:", error);
          dispatch({ type: "setLoading", payload: false });
        } finally {
          activeLoad.current = null;
        }
      })();

      activeLoad.current = task;
      return task;
    },
    [supabase],
  );

  // Fetch DB data on load
  useEffect(() => {
    let isMounted = true;

    const runLoad = () => {
      if (isMounted) {
        loadData();
      }
    };

    runLoad();

    // Re-fetch data when auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") return;
      dispatch({ type: "reset" }); // تفريغ البيانات فوراً
      setTenantId(null); // Reset tenant ID to force re-fetch
      loadData({ force: true });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadData, supabase]);

  // Sync to local storage on state changes (cache only, not source of truth)
  useEffect(() => {
    if (!state.isLoading && tenantId) {
      // Store as cache for UI performance, but Supabase is source of truth
      const cacheableState: TenantData = {
        settings: state.settings,
        teachers: state.teachers,
        students: state.students,
        groups: state.groups,
        attendance: state.attendance,
        payments: state.payments,
        expenses: state.expenses,
        cards: state.cards,
        isSuperAdmin: state.isSuperAdmin,
        subscription: state.subscription,
      };
      writeTenantCache(tenantId, cacheableState);
    }
  }, [state, tenantId]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const billingModel = state.settings?.billingModel ?? "prepaid";
    const targetDate = billingModel === "postpaid"
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;

    const activeStudents = state.students.filter((student) => student.status === "active");
    const groupById = new Map(state.groups.map((group) => [group.id, group]));
    const paidByStudentMonth = new Set(state.payments.map((payment) => `${payment.studentId}:${payment.forMonth}`));
    const todayAttendance = state.attendance.filter((record) => record.attendedOn === today);
    const presentCount = todayAttendance.filter((record) => record.status === "present" || record.status === "late").length;
    const currentMonthStr = today.slice(0, 7);

    const monthlyRevenue = state.payments
      .filter((p) => p.forMonth === currentMonthStr || p.paidAt?.startsWith(currentMonthStr))
      .reduce((sum, payment) => sum + payment.amount, 0);
    const monthlyExpenses = state.expenses
      .filter((e) => e.spentAt?.startsWith(currentMonthStr))
      .reduce((sum, expense) => sum + expense.amount, 0);

    const overdueCount = activeStudents.filter((student) => {
      const group = student.groupId ? groupById.get(student.groupId) : null;
      if (!group) return false;
      return !paidByStudentMonth.has(`${student.id}:${targetMonth}`);
    }).length;

    return {
      totalStudents: state.students.length,
      activeStudents: activeStudents.length,
      todayAttendanceRate: activeStudents.length ? Math.round((presentCount / activeStudents.length) * 100) : 0,
      monthlyRevenue,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses,
      overdueCount,
    };
  }, [state]);

  const refreshData = useCallback(async () => {
    const activeTenantId = tenantId ? { tenantId, isSuperAdmin: state.isSuperAdmin } : (await fetchUserTenant(supabase));
    if (!activeTenantId) return;

    // Super admin with no tenant — nothing to refresh
    if (activeTenantId.isSuperAdmin && !activeTenantId.tenantId) return;

    const recentlyFetched = Date.now() - lastFetchAt.current < 15_000;
    if (recentlyFetched && state.students.length > 0) return;

    dispatch({ type: "setLoading", payload: true });
    try {
      const data = await fetchTenantData(supabase, activeTenantId.tenantId!);
      setTenantId(activeTenantId.tenantId);

      const now = new Date();
      const endDate = new Date(data.subscription.endDate);
      const isActive = endDate > now;

      const cardsRecord = data.cards.reduce((acc, card) => {
        acc[card.cardId] = card;
        return acc;
      }, {} as Record<string, StudentCard>);

      const { cards, ...restData } = data;
      void cards;
      const finalData = {
        ...restData,
        cards: cardsRecord,
        isSuperAdmin: activeTenantId.isSuperAdmin,
        subscription: { endDate: data.subscription.endDate, isActive },
      };

      dispatch({ type: "hydrate", payload: finalData });
      lastFetchAt.current = Date.now();
      writeTenantCache(activeTenantId.tenantId!, finalData);
    } catch (error) {
      console.error("Error refreshing data:", error);
      dispatch({ type: "setLoading", payload: false });
    }
  }, [state.students.length, state.isSuperAdmin, supabase, tenantId]);

  const addTeacher = useCallback(
    async (teacher: Omit<Teacher, "id" | "tenantId" | "createdAt" | "updatedAt" | "isActive">) => {
      if (!tenantId) {
        throw new Error("No tenant ID found");
      }

      const newTeacher: Teacher = {
        ...teacher,
        id: crypto.randomUUID(),
        tenantId: tenantId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        // Save to Supabase first
        const { error } = await supabase.from("teachers").insert({
          id: newTeacher.id,
          tenant_id: tenantId,
          full_name: teacher.fullName,
          phone: teacher.phone,
          subject: teacher.subject,
          payment_type: teacher.paymentType,
          rate: teacher.rate,
          is_active: true,
          created_at: newTeacher.createdAt,
          updated_at: newTeacher.updatedAt,
        });

        if (error) throw error;

        // Only update state after successful save
        dispatch({ type: "addTeacher", payload: newTeacher });
      } catch (error) {
        console.error("Error adding teacher:", error);
        throw error;
      }
    },
    [tenantId, supabase]
  );

  const value = useMemo<EduGenieContextValue>(() => {
    const makeEntity = <T extends object>(data: T) => ({
      id: crypto.randomUUID(),
      tenantId: tenantId || "guest",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    });

    return {
      ...state,
      tenantId,
      metrics,
      updateSettings: async (payload) => {
        if (!tenantId || !payload.billingModel) {
          return; // No-op if no tenant or payload
        }

        try {
          // Save to Supabase first
          const { error } = await supabase.from("tenant_settings").upsert({
            tenant_id: tenantId,
            billing_model: payload.billingModel,
          });

          if (error) throw error;

          // Only update state after successful save
          dispatch({ type: "updateSettings", payload });
        } catch (error) {
          console.error("Error updating settings:", error);
          throw error;
        }
      },
      addStudent: async (payload) => {
        if (!tenantId) {
          throw new Error("No tenant ID found");
        }

        const { cardId, ...studentData } = payload;

        if (cardId) {
          const trimmedCardId = cardId.trim();
          
          // Direct DB check for absolute certainty
          const { data: existingDbCard } = await supabase
            .from("cards")
            .select("student_id, status")
            .eq("tenant_id", tenantId)
            .eq("card_id", trimmedCardId)
            .maybeSingle();

          if (existingDbCard && existingDbCard.student_id && existingDbCard.status === "active") {
            throw new Error("هذه البطاقة مستخدمة بالفعل لطالب آخر");
          }
        }

        const student: Student = makeEntity({
          ...studentData,
          status: "active",
          joinDate: new Date().toISOString().slice(0, 10),
        });

        try {
          // Save to Supabase first
          const { error } = await supabase.from("students").insert({
            id: student.id,
            tenant_id: tenantId,
            full_name: student.fullName,
            phone: student.phone,
            parent_phone: student.parentPhone || null,
            notes: student.notes || null,
            group_id: student.groupId || null,
            teacher_id: student.teacherId || null,
            status: student.status,
          });

          if (error) throw error;

          // Only update state after successful save
          dispatch({ type: "addStudent", payload: student });

          // If a cardId was provided, assign it to the new student
          if (cardId) {
            const trimmedCardId = cardId.trim();
            const cardRecord: StudentCard = {
              id: crypto.randomUUID(),
              tenantId,
              cardId: trimmedCardId,
              studentId: student.id,
              status: "active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const existingCard = state.cards[trimmedCardId];
            if (existingCard) {
              cardRecord.id = existingCard.id;
            }

            dispatch({ type: "assignCard", payload: cardRecord });

            await supabase.from("cards").upsert({
              id: cardRecord.id,
              tenant_id: tenantId,
              card_id: trimmedCardId,
              student_id: student.id,
              status: "active",
            }, { onConflict: "tenant_id,card_id" });
          }

          return student;
        } catch (error) {
          console.error("Error adding student:", error);
          throw error;
        }
      },
      archiveStudent: async (studentId) => {
        if (!tenantId) {
          throw new Error("No tenant ID found");
        }

        try {
          // Update in Supabase first
          const { error } = await supabase.from("students").update({ status: "archived" }).eq("id", studentId);
          if (error) throw error;

          // Only update state after successful save
          dispatch({ type: "updateStudentStatus", payload: { id: studentId, status: "archived" } });
        } catch (error) {
          console.error("Error archiving student:", error);
          throw error;
        }
      },
      editStudent: async (studentId, data) => {
        if (!tenantId) throw new Error("No tenant ID found");
        const existing = state.students.find(s => s.id === studentId);
        if (!existing) throw new Error("Student not found");

        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        try {
          const { error } = await supabase.from("students").update({
            full_name: updated.fullName,
            phone: updated.phone,
            parent_phone: updated.parentPhone,
            notes: updated.notes,
            group_id: updated.groupId,
            teacher_id: updated.teacherId,
            updated_at: updated.updatedAt,
          }).eq("id", studentId);

          if (error) throw error;
          dispatch({ type: "updateStudent", payload: updated });
        } catch (error) {
          console.error("Error updating student:", error);
          throw error;
        }
      },
      addGroup: async (payload) => {
        if (!tenantId) {
          throw new Error("No tenant ID found");
        }

        const group: Group = makeEntity({
          ...payload,
          enrolled: 0,
          isActive: true,
        });

        try {
          // Save to Supabase first
          const { error } = await supabase.from("groups").insert({
            id: group.id,
            tenant_id: tenantId,
            name: group.name,
            subject: group.subject,
            teacher_id: group.teacherId,
            schedule: group.schedule,
            capacity: group.capacity,
            monthly_sessions: group.monthlySessions,
            monthly_price: group.monthlyPrice,
          });

          if (error) throw error;

          // Only update state after successful save
          dispatch({ type: "addGroup", payload: group });
        } catch (error) {
          console.error("Error adding group:", error);
          throw error;
        }
      },
      editGroup: async (groupId, data) => {
        if (!tenantId) throw new Error("No tenant ID found");
        const existing = state.groups.find(g => g.id === groupId);
        if (!existing) throw new Error("Group not found");

        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        try {
          const { error } = await supabase.from("groups").update({
            name: updated.name,
            subject: updated.subject,
            teacher_id: updated.teacherId,
            schedule: updated.schedule,
            capacity: updated.capacity,
            monthly_sessions: updated.monthlySessions,
            monthly_price: updated.monthlyPrice,
            updated_at: updated.updatedAt,
          }).eq("id", groupId);

          if (error) throw error;
          dispatch({ type: "updateGroup", payload: updated });
        } catch (error) {
          console.error("Error updating group:", error);
          throw error;
        }
      },
      archiveGroup: async (groupId) => {
        if (!tenantId) throw new Error("No tenant ID found");
        try {
          const { error } = await supabase.from("groups").update({
            is_active: false,
            updated_at: new Date().toISOString(),
          }).eq("id", groupId);

          if (error) throw error;
          dispatch({ type: "updateGroupStatus", payload: { id: groupId, isActive: false } });
        } catch (error) {
          console.error("Error archiving group:", error);
          throw error;
        }
      },
      assignCard: async (cardId, studentId) => {
        if (!tenantId) throw new Error("No tenant ID found");

        const trimmedCardId = cardId.trim();
        
        // Direct DB check for absolute certainty
        const { data: existingDbCard } = await supabase
          .from("cards")
          .select("student_id, status")
          .eq("tenant_id", tenantId)
          .eq("card_id", trimmedCardId)
          .maybeSingle();

        if (existingDbCard && existingDbCard.student_id && existingDbCard.student_id !== studentId && existingDbCard.status === "active") {
          throw new Error("هذه البطاقة مستخدمة بالفعل لطالب آخر");
        }

        // Optimistically create the card payload
        const cardRecord: StudentCard = {
          id: crypto.randomUUID(), // Temporarily random until DB returns
          tenantId,
          cardId: trimmedCardId,
          studentId,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // If card exists in state, we use its ID for upsert
        const existingCard = state.cards[cardId];
        if (existingCard) {
          cardRecord.id = existingCard.id;
        }

        dispatch({ type: "assignCard", payload: cardRecord });

        try {
          // If the student already has a card, we should deactivate it in DB
          // Wait, this is best handled via upsert or a separate RPC. We will upsert the new one.
          // In a real scenario, we might want to disable previous cards first.
          // For now, we update the card_id to point to the student.

          const { data, error } = await supabase.from("cards").upsert({
            id: cardRecord.id,
            tenant_id: tenantId,
            card_id: cardId,
            student_id: studentId,
            status: "active",
          }, { onConflict: "tenant_id,card_id" }).select().single();

          if (error) throw error;

          // Update state with actual DB ID
          dispatch({
            type: "assignCard", payload: {
              ...cardRecord,
              id: data.id,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            }
          });
        } catch (error) {
          console.error("Error assigning card:", error);
          // Rollback: Reload data or dispatch reverse action
          throw error;
        }
      },

      markAttendance: async (studentId, status) => {
        if (!tenantId) {
          throw new Error("No tenant ID found");
        }

        const student = state.students.find((s) => s.id === studentId);
        const record: AttendanceRecord = makeEntity({
          studentId,
          groupId: student?.groupId,
          status,
          attendedOn: new Date().toISOString().slice(0, 10),
        });

        try {
          // Save to Supabase first
          const { error } = await supabase.from("attendance").upsert({
            id: record.id,
            tenant_id: tenantId,
            student_id: record.studentId,
            group_id: record.groupId,
            status: record.status,
            attended_on: record.attendedOn,
          }, { onConflict: "tenant_id,student_id,attended_on" });

          if (error) throw new Error(error.message || JSON.stringify(error));

          // Only update state after successful save
          dispatch({ type: "addAttendanceRecords", payload: [record] });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error("Error marking attendance:", msg);
          throw error;
        }
      },
      markGroupAttendance: async (records) => {
        if (!tenantId) {
          throw new Error("No tenant ID found");
        }

        const attendedOn = new Date().toISOString().slice(0, 10);
        const newRecords = records.map((r) => {
          const student = state.students.find((s) => s.id === r.studentId);
          return makeEntity({
            studentId: r.studentId,
            groupId: student?.groupId,
            status: r.status,
            attendedOn,
          }) as AttendanceRecord;
        });

        try {
          // Save to Supabase first
          const dbRecords = newRecords.map(r => ({
            id: r.id,
            tenant_id: tenantId,
            student_id: r.studentId,
            group_id: r.groupId,
            status: r.status,
            attended_on: r.attendedOn,
          }));

          const { error } = await supabase.from("attendance").upsert(dbRecords, {
            onConflict: "tenant_id,student_id,attended_on",
          });
          if (error) throw new Error(error.message || JSON.stringify(error));

          // Only update state after successful save
          dispatch({ type: "addAttendanceRecords", payload: newRecords });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error("Error marking group attendance:", msg);
          throw error;
        }
      },
      addPayment: async (payload) => {
        if (!tenantId) {
          throw new Error("No tenant ID found");
        }

        const payment: Payment = makeEntity({
          ...payload,
          paidAt: new Date().toISOString().slice(0, 10),
        });

        try {
          // Save to Supabase first
          const { error } = await supabase.from("payments").insert({
            id: payment.id,
            tenant_id: tenantId,
            student_id: payment.studentId,
            amount: payment.amount,
            remaining_balance: payment.remainingBalance,
            paid_at: payment.paidAt,
            for_month: payment.forMonth,
          });

          if (error) throw error;

          // Only update state after successful save
          dispatch({ type: "addPayment", payload: payment });
        } catch (error) {
          console.error("Error adding payment:", error);
          throw error;
        }
      },
      addExpense: async (payload) => {
        if (!tenantId) {
          throw new Error("No tenant ID found");
        }

        const expense: Expense = makeEntity({
          ...payload,
          spentAt: new Date().toISOString().slice(0, 10),
        });

        try {
          // Save to Supabase first
          const { error } = await supabase.from("expenses").insert({
            id: expense.id,
            tenant_id: tenantId,
            category: expense.category,
            amount: expense.amount,
            spent_at: expense.spentAt,
            notes: expense.notes,
          });

          if (error) throw error;

          // Only update state after successful save
          dispatch({ type: "addExpense", payload: expense });
        } catch (error) {
          console.error("Error adding expense:", error);
          throw error;
        }
      },
      addTeacher,
      editTeacher: async (teacherId, data) => {
        if (!tenantId) throw new Error("No tenant ID found");
        const existing = state.teachers.find(t => t.id === teacherId);
        if (!existing) throw new Error("Teacher not found");

        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        try {
          const { error } = await supabase.from("teachers").update({
            full_name: updated.fullName,
            phone: updated.phone,
            subject: updated.subject,
            payment_type: updated.paymentType,
            rate: updated.rate,
            is_active: updated.isActive,
            updated_at: updated.updatedAt,
          }).eq("id", teacherId);

          if (error) throw error;
          dispatch({ type: "updateTeacher", payload: updated });
        } catch (error) {
          console.error("Error updating teacher:", error);
          throw error;
        }
      },
      archiveTeacher: async (teacherId) => {
        if (!tenantId) throw new Error("No tenant ID found");
        try {
          const { error } = await supabase.from("teachers").update({ is_active: false }).eq("id", teacherId);
          if (error) throw error;
          dispatch({ type: "updateTeacherStatus", payload: { id: teacherId, isActive: false } });
        } catch (error) {
          console.error("Error archiving teacher:", error);
          throw error;
        }
      },
      refreshData,
    };
  }, [state, metrics, tenantId, supabase, addTeacher, refreshData]);

  return <EduGenieContext.Provider value={value}>{children}</EduGenieContext.Provider>;
}

export function useEduGenie() {
  const context = useContext(EduGenieContext);
  if (!context) {
    throw new Error("useEduGenie must be used within EduGenieProvider");
  }
  return context;
}
