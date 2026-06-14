import { createBrowserClient } from "@supabase/ssr";
import type { AttendanceRecord, Expense, Group, Payment, Student, Teacher } from "@/types/domain";

type DbRow = Record<string, unknown>;

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function fetchUserTenant(supabase: ReturnType<typeof createSupabaseClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if this is the super admin by email (works even before DB migration)
  const isSuperAdminByEmail = user.email?.toLowerCase() === "mazenhelal29@gmail.com";

  let tenantId: string | null = null;
  let isSuperAdminFromDb = false;

  try {
    const { data: profile } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    tenantId = profile?.tenant_id || null;
  } catch {
    // profile fetch failed - OK for super admin
  }

  try {
    const { data: saData } = await supabase
      .from("users")
      .select("is_superadmin")
      .eq("id", user.id)
      .maybeSingle();
    isSuperAdminFromDb = (saData as any)?.is_superadmin === true;
  } catch {
    // is_superadmin column may not exist yet
  }

  const isSuperAdmin = isSuperAdminFromDb || isSuperAdminByEmail;

  // Super admin may not have a tenant - that's OK
  if (isSuperAdmin && !tenantId) {
    return { tenantId: null as string | null, isSuperAdmin: true };
  }

  if (!tenantId) return null;

  return { tenantId, isSuperAdmin };
}

const SELECTS = {
  groups: "id,tenant_id,name,subject,teacher_id,schedule,capacity,monthly_sessions,monthly_price,is_active,created_at,updated_at",
  students:
    "id,tenant_id,full_name,phone,parent_phone,notes,join_date,group_id,teacher_id,status,created_at,updated_at",
  attendance: "id,tenant_id,student_id,group_id,attended_on,status,notes,created_at,updated_at",
  payments: "id,tenant_id,student_id,amount,paid_at,for_month,remaining_balance,created_at,updated_at",
  expenses: "id,tenant_id,category,amount,spent_at,notes,created_at,updated_at",
  settings: "tenant_id,billing_model",
  tenant_details: "id,subscription_end_date",
  teachers: "id,tenant_id,full_name,phone,subject,payment_type,rate,is_active,created_at,updated_at",
  cards: "id,tenant_id,card_id,student_id,status,created_at,updated_at",
} as const;

// Fetch all data for the current tenant
export async function fetchTenantData(supabase: ReturnType<typeof createSupabaseClient>, tenantId: string) {
  const [groupsRes, studentsRes, attendanceRes, paymentsRes, expensesRes, settingsRes, teachersRes, cardsRes] = await Promise.all([
    supabase.from("groups").select(SELECTS.groups).eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    supabase
      .from("students")
      .select(SELECTS.students)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("attendance")
      .select(SELECTS.attendance)
      .eq("tenant_id", tenantId)
      .order("attended_on", { ascending: false })
      .limit(1500),
    supabase
      .from("payments")
      .select(SELECTS.payments)
      .eq("tenant_id", tenantId)
      .order("paid_at", { ascending: false })
      .limit(1500),
    supabase
      .from("expenses")
      .select(SELECTS.expenses)
      .eq("tenant_id", tenantId)
      .order("spent_at", { ascending: false })
      .limit(1000),
    supabase.from("tenant_settings").select(SELECTS.settings).eq("tenant_id", tenantId).maybeSingle(),
    supabase
      .from("teachers")
      .select(SELECTS.teachers)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("cards")
      .select(SELECTS.cards)
      .eq("tenant_id", tenantId)
  ]);


  let subscriptionEndDate: string | null = null;
  try {
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("id,subscription_end_date")
      .eq("id", tenantId)
      .maybeSingle();
    subscriptionEndDate = (tenantData as any)?.subscription_end_date || null;
  } catch {
    // subscription_end_date column may not exist yet
  }
  

  assertSupabaseResult("groups", groupsRes.error);
  assertSupabaseResult("students", studentsRes.error);
  assertSupabaseResult("attendance", attendanceRes.error);
  assertSupabaseResult("payments", paymentsRes.error);
  assertSupabaseResult("expenses", expensesRes.error);
  assertSupabaseResult("tenant_settings", settingsRes.error);
  assertSupabaseResult("teachers", teachersRes.error);
  assertSupabaseResult("cards", cardsRes.error);

  return {
    groups: (groupsRes.data || []).map(mapGroupFromDb),
    students: (studentsRes.data || []).map(mapStudentFromDb),
    attendance: (attendanceRes.data || []).map(mapAttendanceFromDb),
    payments: (paymentsRes.data || []).map(mapPaymentFromDb),
    expenses: (expensesRes.data || []).map(mapExpenseFromDb),
    teachers: (teachersRes.data || []).map(mapTeacherFromDb),
    cards: (cardsRes.data || []).map(mapCardFromDb),
    settings: settingsRes.data ? { billingModel: settingsRes.data.billing_model } : { billingModel: "prepaid" },
    subscription: {
      endDate: subscriptionEndDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }
  };
}

function assertSupabaseResult(tableName: string, error: { message: string } | null) {
  if (error) {
    throw new Error(`Failed to load ${tableName}: ${error.message}`);
  }
}

function mapTeacherFromDb(row: DbRow): Teacher {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    fullName: row.full_name as string,
    phone: (row.phone as string | null) || "",
    subject: (row.subject as string | null) || "",
    paymentType: row.payment_type as Teacher["paymentType"] | undefined,
    rate: row.rate ? Number(row.rate) : undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Mapping functions to adapt DB snake_case to frontend camelCase
function mapGroupFromDb(row: DbRow): Group {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    subject: row.subject as string,
    teacherId: row.teacher_id as string | undefined,
    schedule: Array.isArray(row.schedule) ? (row.schedule as Group["schedule"]) : [],
    capacity: Number(row.capacity || 0),
    monthlySessions: Number(row.monthly_sessions || 0),
    monthlyPrice: Number(row.monthly_price || 0),
    enrolled: 0, // Computed later
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapStudentFromDb(row: DbRow): Student {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    fullName: row.full_name as string,
    phone: (row.phone as string | null) || "",
    parentPhone: (row.parent_phone as string | null) || "",
    notes: (row.notes as string | null) || "",
    joinDate: row.join_date as string,
    groupId: row.group_id as string | undefined,
    teacherId: row.teacher_id as string | undefined,
    status: row.status as Student["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapAttendanceFromDb(row: DbRow): AttendanceRecord {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    studentId: row.student_id as string,
    groupId: row.group_id as string | undefined,
    attendedOn: row.attended_on as string,
    status: row.status as AttendanceRecord["status"],
    notes: (row.notes as string | null) || "",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapPaymentFromDb(row: DbRow): Payment {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    studentId: row.student_id as string,
    amount: Number(row.amount || 0),
    paidAt: row.paid_at as string,
    forMonth: row.for_month as string,
    remainingBalance: Number(row.remaining_balance || 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapExpenseFromDb(row: DbRow): Expense {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    category: row.category as Expense["category"],
    amount: Number(row.amount || 0),
    spentAt: row.spent_at as string,
    notes: (row.notes as string | null) || "",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapCardFromDb(row: DbRow): import("@/types/domain").StudentCard {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    cardId: row.card_id as string,
    studentId: row.student_id as string | null,
    status: row.status as "active" | "lost" | "disabled",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
