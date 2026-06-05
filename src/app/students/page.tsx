import { AppShell } from "@/components/layouts/app-shell";
import { StudentsPage } from "@/features/students/students-page";

export default function StudentsRoute() {
  return (
    <AppShell>
      <StudentsPage />
    </AppShell>
  );
}
