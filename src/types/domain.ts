export type UserRole = "owner" | "admin" | "staff";

export type StudentStatus = "active" | "archived" | "paused";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type TenantEntity = {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
};

export type Teacher = TenantEntity & {
  fullName: string;
  phone: string;
  subject: string;
  isActive: boolean;
};

export type Student = TenantEntity & {
  fullName: string;
  phone: string;
  parentPhone?: string;
  notes?: string;
  joinDate: string;
  groupId?: string;
  teacherId?: string;
  status: StudentStatus;
};

export type GroupSchedule = {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  time: string;      // "HH:MM"
};

export type Group = TenantEntity & {
  name: string;
  subject: string;
  schedule: GroupSchedule[];
  capacity: number;
  monthlySessions: number;
  monthlyPrice: number;
  enrolled: number;
  isActive: boolean;
};

export type Payment = TenantEntity & {
  studentId: string;
  amount: number;
  paidAt: string;
  forMonth: string; // YYYY-MM
  remainingBalance: number;
};

export type Expense = TenantEntity & {
  category: "rent" | "salaries" | "utilities" | "miscellaneous";
  amount: number;
  spentAt: string;
  notes?: string;
};

export type AttendanceRecord = TenantEntity & {
  studentId: string;
  groupId?: string;
  attendedOn: string;
  status: AttendanceStatus;
  notes?: string;
};
