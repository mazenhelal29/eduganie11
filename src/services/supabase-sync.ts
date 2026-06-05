import { createBrowserClient } from "@supabase/ssr";
import type { AttendanceRecord, Expense, Group, Payment, Student, Teacher } from "@/types/domain";

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function fetchUserTenant(supabase: ReturnType<typeof createSupabaseClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  return profile?.tenant_id || null;
}

// Fetch all data for the current tenant
export async function fetchTenantData(supabase: ReturnType<typeof createSupabaseClient>, tenantId: string) {
  const [groupsRes, studentsRes, attendanceRes, paymentsRes, expensesRes, settingsRes, teachersRes] = await Promise.all([
    supabase.from("groups").select("*").eq("tenant_id", tenantId),
    supabase.from("students").select("*").eq("tenant_id", tenantId),
    supabase.from("attendance").select("*").eq("tenant_id", tenantId),
    supabase.from("payments").select("*").eq("tenant_id", tenantId),
    supabase.from("expenses").select("*").eq("tenant_id", tenantId),
    supabase.from("tenant_settings").select("*").eq("tenant_id", tenantId).single(),
    supabase.from("teachers").select("*").eq("tenant_id", tenantId),
  ]);

  return {
    groups: (groupsRes.data || []).map(mapGroupFromDb),
    students: (studentsRes.data || []).map(mapStudentFromDb),
    attendance: (attendanceRes.data || []).map(mapAttendanceFromDb),
    payments: (paymentsRes.data || []).map(mapPaymentFromDb),
    expenses: (expensesRes.data || []).map(mapExpenseFromDb),
    teachers: (teachersRes.data || []).map(mapTeacherFromDb),
    settings: settingsRes.data ? { billingModel: settingsRes.data.billing_model } : { billingModel: "prepaid" },
  };
}

function mapTeacherFromDb(row: any): Teacher {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    fullName: row.full_name,
    phone: row.phone || "",
    subject: row.subject || "",
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Mapping functions to adapt DB snake_case to frontend camelCase
function mapGroupFromDb(row: any): Group {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    subject: row.subject,
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    capacity: row.capacity,
    monthlySessions: row.monthly_sessions,
    monthlyPrice: row.monthly_price,
    enrolled: 0, // Computed later
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStudentFromDb(row: any): Student {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    fullName: row.full_name,
    phone: row.phone || "",
    parentPhone: row.parent_phone || "",
    notes: row.notes || "",
    joinDate: row.join_date,
    groupId: row.group_id,
    teacherId: row.teacher_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAttendanceFromDb(row: any): AttendanceRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    studentId: row.student_id,
    groupId: row.group_id,
    attendedOn: row.attended_on,
    status: row.status,
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPaymentFromDb(row: any): Payment {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    studentId: row.student_id,
    amount: row.amount,
    paidAt: row.paid_at,
    forMonth: row.for_month,
    remainingBalance: row.remaining_balance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExpenseFromDb(row: any): Expense {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    category: row.category,
    amount: row.amount,
    spentAt: row.spent_at,
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
