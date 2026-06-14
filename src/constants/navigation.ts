import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
  GraduationCap,
  Calendar,
  ScanLine,
} from "lucide-react";

export const navigationItems = [
  {
    labelKey: "nav.dashboard" as const,
    href: "/",
    icon: LayoutDashboard,
  },
  {
    labelKey: "nav.students" as const,
    href: "/students",
    icon: Users,
  },
  {
    labelKey: "nav.assignCards" as const,
    href: "/students/assign-card",
    icon: WalletCards,
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
    labelKey: "nav.schedule" as const,
    href: "/schedule",
    icon: Calendar,
  },
  {
    labelKey: "nav.attendance" as const,
    href: "/attendance",
    icon: BarChart3,
  },
  {
    labelKey: "nav.scanner" as const,
    href: "/attendance/scanner",
    icon: ScanLine,
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

