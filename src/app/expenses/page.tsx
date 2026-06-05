import { AppShell } from "@/components/layouts/app-shell";
import { ExpensesPage } from "@/features/expenses/expenses-page";

export default function ExpensesRoute() {
  return (
    <AppShell>
      <ExpensesPage />
    </AppShell>
  );
}
