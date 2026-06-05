import { AppShell } from "@/components/layouts/app-shell";
import { SettingsPage } from "@/features/settings/settings-page";

export default function SettingsRoute() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}
