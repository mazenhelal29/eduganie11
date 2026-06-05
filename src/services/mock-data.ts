import type { Group, Payment, Student } from "@/types/domain";

export const dashboardMetrics = {
  totalStudents: 0,
  activeStudents: 0,
  todayAttendanceRate: 0,
  monthlyRevenue: 0,
  monthlyExpenses: 0,
  netProfit: 0,
};

export const groups: Group[] = [];
export const students: Student[] = [];
export const overduePayments: Payment[] = [];
