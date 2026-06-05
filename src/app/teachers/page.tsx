import { AppShell } from "@/components/layouts/app-shell";
import { TeachersPage } from "@/features/teachers/teachers-page";

export default function TeachersRoute() {
  return (
    <AppShell>
      <TeachersPage />
    </AppShell>
  );
}
