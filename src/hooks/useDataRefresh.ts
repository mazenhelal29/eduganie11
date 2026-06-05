/**
 * useDataRefresh Hook
 * Automatically refreshes data when visibility changes or on mount
 */

import { useEffect } from "react";
import { useEduGenie } from "@/providers/edugenie-store";

export function useDataRefresh() {
  const { refreshData } = useEduGenie();

  useEffect(() => {
    // Refresh data when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshData();
      }
    };

    // Refresh data when page regains focus
    const handleFocus = () => {
      refreshData();
    };

    // Refresh on mount
    refreshData();

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshData]);
}
