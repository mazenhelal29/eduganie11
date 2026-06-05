"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { EduGenieProvider } from "@/providers/edugenie-store";
import { I18nProvider } from "@/providers/i18n-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <EduGenieProvider>{children}</EduGenieProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
