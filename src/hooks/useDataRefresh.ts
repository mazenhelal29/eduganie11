/**
 * useDataRefresh Hook
 * Automatically refreshes data when visibility changes or on mount
 */

import { useEffect, useRef } from "react";
import { useEduGenie } from "@/providers/edugenie-store";

const MIN_REFRESH_INTERVAL_MS = 30_000;

export function useDataRefresh() {
  const { refreshData } = useEduGenie();
  const lastRefreshAt = useRef(Date.now());
  const isRefreshing = useRef(false);

  useEffect(() => {
    const refreshIfStale = async () => {
      const now = Date.now();
      if (isRefreshing.current || now - lastRefreshAt.current < MIN_REFRESH_INTERVAL_MS) return;

      isRefreshing.current = true;
      lastRefreshAt.current = now;
      try {
        await refreshData();
      } finally {
        isRefreshing.current = false;
      }
    };

    // Refresh data when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshIfStale();
      }
    };

    // Refresh data when page regains focus
    const handleFocus = () => {
      refreshIfStale();
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshData]);
}
