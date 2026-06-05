"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { createSupabaseClient, fetchUserTenant, fetchTenantData } from "@/services/supabase-sync";
import type { AttendanceRecord, Expense, Group, Payment, Student, Teacher } from "@/types/domain";

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
  isLoading: boolean;
};

type NewStudent = Pick<Student, "fullName" | "phone" | "parentPhone" | "groupId" | "notes" | "teacherId">;
type NewGroup = Pick<Group, "name" | "subject" | "schedule" | "capacity" | "monthlySessions" | "monthlyPrice">;
type NewPayment = Pick<Payment, "studentId" | "amount" | "remainingBalance" | "forMonth">;
type NewExpense = Pick<Expense, "category" | "amount" | "notes">;

type EduGenieActions = {
  updateSettings: (settings: Partial<EduGenieState["settings"]>) => void;
  addStudent: (student: NewStudent) => void;
  archiveStudent: (studentId: string) => void;
  addGroup: (group: NewGroup) => void;
  markAttendance: (studentId: string, status: AttendanceRecord["status"]) => void;
  markGroupAttendance: (records: { studentId: string; status: AttendanceRecord["status"] }[]) => void;
  addPayment: (payment: NewPayment) => void;
  addExpense: (expense: NewExpense) => void;
  addTeacher: (teacher: Omit<Teacher, "id" | "tenantId" | "createdAt" | "updatedAt" | "isActive">) => Promise<void>;
  refreshData: () => Promise<void>;
};

type EduGenieContextValue = EduGenieState &
  EduGenieActions & {
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
  | { type: "updateSettings"; payload: Partial<EduGenieState["settings"]> }
  | { type: "addStudent"; payload: Student }
  | { type: "updateStudentStatus"; payload: { id: string; status: Student["status"] } }
  | { type: "addGroup"; payload: Group }
  | { type: "addAttendanceRecords"; payload: AttendanceRecord[] }
  | { type: "addPayment"; payload: Payment }
  | { type: "addExpense"; payload: Expense }
  | { type: "addTeacher"; payload: Teacher };

const STORAGE_KEY = "edugenie.mvp.state.v2";

const initialState: EduGenieState = {
  settings: { billingModel: "prepaid" },
  teachers: [],
  students: [],
  groups: [],
  attendance: [],
  payments: [],
  expenses: [],
  isLoading: true,
};

const EduGenieContext = createContext<EduGenieContextValue | null>(null);

function reducer(state: EduGenieState, action: Action): EduGenieState {
  switch (action.type) {
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
    default:
      return state;
  }
}

export function EduGenieProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseClient(), []);

  // Fetch DB data on load
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // 1. Get the current user's tenant ID
        const activeTenantId = await fetchUserTenant(supabase);
        
        if (!activeTenantId) {
          if (isMounted) {
            dispatch({ type: "setLoading", payload: false });
          }
          return;
        }

        // Update tenantId if it changed
        if (isMounted && tenantId !== activeTenantId) {
          setTenantId(activeTenantId);
        }

        // 2. Try to load from cache for instant UI (optional)
        const cacheKey = `${STORAGE_KEY}.cache.${activeTenantId}`;
        const cachedData = window.localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (isMounted) dispatch({ type: "hydrate", payload: parsed });
          } catch (e) {
            console.error("Failed to parse cached data", e);
          }
        }

        // 3. Always fetch fresh data from Supabase (don't rely on cache)
        const data = await fetchTenantData(supabase, activeTenantId);
        if (isMounted) {
          dispatch({ type: "hydrate", payload: data });
          // Update cache with fresh data
          const cacheKey = `${STORAGE_KEY}.cache.${activeTenantId}`;
          window.localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (isMounted) {
          dispatch({ type: "setLoading", payload: false });
        }
      }
    }

    loadData();

    // Re-fetch data when auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTenantId(null); // Reset tenant ID to force re-fetch
      loadData();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Sync to local storage on state changes (cache only, not source of truth)
  useEffect(() => {
    if (!state.isLoading && tenantId) {
      // Store as cache for UI performance, but Supabase is source of truth
      const cacheKey = `${STORAGE_KEY}.cache.${tenantId}`;
      window.localStorage.setItem(cacheKey, JSON.stringify(state));
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
      const group = state.groups.find((g) => g.id === student.groupId);
      if (!group) return false;
      const paid = state.payments.some(
        (p) => p.studentId === student.id && p.forMonth === targetMonth && p.amount >= (group.monthlyPrice || 1)
      );
      return !paid;
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

        const student: Student = makeEntity({
          ...payload,
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
            parent_phone: student.parentPhone,
            notes: student.notes,
            group_id: student.groupId,
            teacher_id: student.teacherId,
            status: student.status,
          });

          if (error) throw error;

          // Only update state after successful save
          dispatch({ type: "addStudent", payload: student });
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
          const { error } = await supabase.from("attendance").insert({
            id: record.id,
            tenant_id: tenantId,
            student_id: record.studentId,
            group_id: record.groupId,
            status: record.status,
            attended_on: record.attendedOn,
          });

          if (error) throw error;

          // Only update state after successful save
          dispatch({ type: "addAttendanceRecords", payload: [record] });
        } catch (error) {
          console.error("Error marking attendance:", error);
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

          const { error } = await supabase.from("attendance").insert(dbRecords);
          if (error) throw error;

          // Only update state after successful save
          dispatch({ type: "addAttendanceRecords", payload: newRecords });
        } catch (error) {
          console.error("Error marking group attendance:", error);
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
      refreshData: async () => {
        const activeTenantId = await fetchUserTenant(supabase);
        if (activeTenantId) {
          dispatch({ type: "setLoading", payload: true });
          try {
            const data = await fetchTenantData(supabase, activeTenantId);
            dispatch({ type: "hydrate", payload: data });
            // Update cache with fresh data
            const cacheKey = `${STORAGE_KEY}.cache.${activeTenantId}`;
            window.localStorage.setItem(cacheKey, JSON.stringify(data));
          } catch (error) {
            console.error("Error refreshing data:", error);
          } finally {
            dispatch({ type: "setLoading", payload: false });
          }
        }
      },
    };
  }, [state, metrics, tenantId, supabase, addTeacher]);

  return <EduGenieContext.Provider value={value}>{children}</EduGenieContext.Provider>;
}

export function useEduGenie() {
  const context = useContext(EduGenieContext);
  if (!context) {
    throw new Error("useEduGenie must be used within EduGenieProvider");
  }
  return context;
}

