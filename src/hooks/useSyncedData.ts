/**
 * useSyncedData Hook
 * Provides automatic persistence and synchronization between client and server
 */

import { useEffect, useState, useCallback } from "react";
import { SyncQueue, type SyncEntity, type SyncOperation } from "@/lib/storage/sync-queue";
import { PersistentStore } from "@/lib/storage/persistent-store";

interface UseSyncedDataOptions {
  autoSync?: boolean;
  persistKey?: string;
}

interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncTime?: number;
  error?: string;
}

export function useSyncedData<T>(
  key: string,
  initialValue: T,
  options: UseSyncedDataOptions = {}
) {
  const { autoSync = true, persistKey = key } = options;

  const [data, setData] = useState<T>(() => {
    // Load from persistent storage first
    const stored = PersistentStore.load<T>(persistKey);
    return stored ?? initialValue;
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
  });

  // Update sync status
  const updateSyncStatus = useCallback(() => {
    const stats = SyncQueue.getStats();
    setSyncStatus({
      isSyncing: stats.isProcessing,
      pendingCount: stats.pending,
      failedCount: stats.failed,
      lastSyncTime: Date.now(),
    });
  }, []);

  // Persist data whenever it changes
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setData((prevData) => {
      const updated = typeof newData === "function" ? (newData as any)(prevData) : newData;
      // Persist to storage immediately
      PersistentStore.save(persistKey, updated);
      return updated;
    });
  }, [persistKey]);

  // Queue operation for sync
  const queueSync = useCallback(
    (entity: SyncEntity, operation: SyncOperation, syncData: unknown) => {
      const id = SyncQueue.add(entity, operation, syncData);
      updateSyncStatus();
      return id;
    },
    [updateSyncStatus]
  );

  // Listen for sync events
  useEffect(() => {
    const handleSyncStart = () => {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    };

    const handleSyncComplete = () => {
      updateSyncStatus();
    };

    const handleSyncError = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSyncStatus((prev) => ({
        ...prev,
        error: customEvent.detail?.message,
      }));
    };

    window.addEventListener("sync:start", handleSyncStart);
    window.addEventListener("sync:complete", handleSyncComplete);
    window.addEventListener("sync:error", handleSyncError);

    return () => {
      window.removeEventListener("sync:start", handleSyncStart);
      window.removeEventListener("sync:complete", handleSyncComplete);
      window.removeEventListener("sync:error", handleSyncError);
    };
  }, [updateSyncStatus]);

  // Listen for online/offline changes
  useEffect(() => {
    if (!autoSync) return;

    const handleOnline = () => {
      console.log("[useSyncedData] Coming online, triggering sync");
      window.dispatchEvent(new Event("app:online"));
      updateSyncStatus();
    };

    const handleOffline = () => {
      console.log("[useSyncedData] Going offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [autoSync, updateSyncStatus]);

  // Initialize sync status
  useEffect(() => {
    updateSyncStatus();
  }, [updateSyncStatus]);

  return {
    data,
    setData: updateData,
    queueSync,
    syncStatus,
    updateSyncStatus,
  };
}

/**
 * Hook to monitor sync queue status globally
 */
export function useSyncQueueStatus() {
  const [status, setStatus] = useState(() => SyncQueue.getStats());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(SyncQueue.getStats());
    };

    // Update on visibility change
    const handleVisibilityChange = () => {
      updateStatus();
    };

    // Poll every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return status;
}
