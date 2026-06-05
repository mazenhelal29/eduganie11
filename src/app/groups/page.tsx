import { AppShell } from "@/components/layouts/app-shell";
import { GroupsPage } from "@/features/groups/groups-page";

export default function GroupsRoute() {
  return (
    <AppShell>
      <GroupsPage />
    </AppShell>
  );
}
