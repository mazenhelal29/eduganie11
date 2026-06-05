import { AppShell } from "@/components/layouts/app-shell";
import { AttendancePage } from "@/features/attendance/attendance-page";

export default function AttendanceRoute() {
  return (
    <AppShell>
      <AttendancePage />
    </AppShell>
  );
}
