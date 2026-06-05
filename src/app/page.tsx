import { AppShell } from "@/components/layouts/app-shell";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";

export default function Home() {
  return (
    <AppShell>
      <DashboardOverview />
    </AppShell>
  );
}
