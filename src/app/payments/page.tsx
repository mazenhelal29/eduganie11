import { AppShell } from "@/components/layouts/app-shell";
import { PaymentsPage } from "@/features/payments/payments-page";

export default function PaymentsRoute() {
  return (
    <AppShell>
      <PaymentsPage />
    </AppShell>
  );
}
