import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
  CheckSquare,
  GraduationCap,
} from "lucide-react";

export const navigationItems = [
  {
    labelKey: "nav.dashboard" as const,
    href: "/",
    icon: LayoutDashboard,
  },
  {
    labelKey: "nav.dailyTasks" as const,
    href: "/daily-tasks",
    icon: CheckSquare,
  },
  {
    labelKey: "nav.students" as const,
    href: "/students",
    icon: Users,
  },
  {
    labelKey: "nav.teachers" as const,
    href: "/teachers",
    icon: GraduationCap,
  },
  {
    labelKey: "nav.groups" as const,
    href: "/groups",
    icon: CalendarCheck,
  },
  {
    labelKey: "nav.attendance" as const,
    href: "/attendance",
    icon: BarChart3,
  },
  {
    labelKey: "nav.payments" as const,
    href: "/payments",
    icon: CreditCard,
  },
  {
    labelKey: "nav.expenses" as const,
    href: "/expenses",
    icon: WalletCards,
  },
  {
    labelKey: "nav.settings" as const,
    href: "/settings",
    icon: Settings,
  },
] as const;

