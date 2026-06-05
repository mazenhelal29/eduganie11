/**
 * Integration Guide: How to Use the New Sync System
 * Add this to your edugenie-store.tsx to prevent data loss
 */

import React, { useReducer, useEffect, useCallback, createContext, useContext } from "react";
import { supabaseSyncService } from "@/services/supabase-sync-service";
import { SyncQueue } from "@/lib/storage/sync-queue";
import { PersistentStore } from "@/lib/storage/persistent-store";

interface EdugenieState {
  students: any[];
  teachers: any[];
  groups: any[];
  attendance: any[];
  payments: any[];
  expenses: any[];
  isLoading: boolean;
  syncStatus: {
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
    lastError?: string;
  };
}

type Action =
  | { type: "hydrate"; payload: Partial<EdugenieState> }
  | { type: "addStudent"; payload: any }
  | { type: "updateStudent"; payload: any }
  | { type: "deleteStudent"; payload: string }
  | { type: "updateSyncStatus"; payload: any };

const STORAGE_KEY = "edugenie.mvp.state.v2";

/**
 * IMPROVED: Save to persistent storage with sync queue integration
 */
function saveState(state: EdugenieState, tenantId?: string) {
  if (!tenantId) return;

  try {
    const stateSnapshot = {
      students: state.students,
      teachers: state.teachers,
      groups: state.groups,
      attendance: state.attendance,
      payments: state.payments,
      expenses: state.expenses,
      settings: {
        billingModel: "prepaid",
      },
    };

    // Save to persistent storage (with checksum and versioning)
    PersistentStore.save(`${STORAGE_KEY}.${tenantId}`, stateSnapshot);

    // Also save to localStorage for quick access
    window.localStorage.setItem(
      `${STORAGE_KEY}.${tenantId}`,
      JSON.stringify(stateSnapshot)
    );
  } catch (error) {
    console.error("[EdugenieStore] Failed to save state:", error);
  }
}

/**
 * IMPROVED: Load from persistent storage
 */
function loadState(tenantId?: string): Partial<EdugenieState> | null {
  if (!tenantId) return null;

  try {
    // Try persistent store first (more reliable)
    const stored = PersistentStore.load(`${STORAGE_KEY}.${tenantId}`);
    if (stored) {
      console.log("[EdugenieStore] Loaded from PersistentStore");
      return stored as any;
    }

    // Fallback to localStorage
    const localData = window.localStorage.getItem(`${STORAGE_KEY}.${tenantId}`);
    if (localData) {
      console.log("[EdugenieStore] Loaded from localStorage");
      return JSON.parse(localData);
    }
  } catch (error) {
    console.error("[EdugenieStore] Failed to load state:", error);
  }

  return null;
}

/**
 * IMPROVED: Reducer with better sync handling
 */
const edugenieReducer = (state: EdugenieState, action: Action): EdugenieState => {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };

    case "addStudent":
      return {
        ...state,
        students: [...state.students, action.payload],
      };

    case "updateStudent":
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    case "deleteStudent":
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.payload),
      };

    case "updateSyncStatus":
      return {
        ...state,
        syncStatus: action.payload,
      };

    default:
      return state;
  }
};

/**
 * IMPROVED: Main EdugenieProvider with sync integration
 */
export function EdugenieProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(edugenieReducer, {
    students: [],
    teachers: [],
    groups: [],
    attendance: [],
    payments: [],
    expenses: [],
    isLoading: true,
    syncStatus: {
      isSyncing: false,
      pendingCount: 0,
      failedCount: 0,
    },
  });

  const [tenantId, setTenantId] = React.useState<string | undefined>();

  // Initialize sync service and restore queue
  useEffect(() => {
    console.log("[EdugenieProvider] Initializing...");

    // Initialize sync service
    supabaseSyncService.initializeSyncListener();

    // Restore sync queue
    SyncQueue.initialize();

    // Listen for sync events
    const handleSyncStart = () => {
      dispatch({
        type: "updateSyncStatus",
        payload: {
          isSyncing: true,
          pendingCount: SyncQueue.getStats().pending,
          failedCount: SyncQueue.getStats().failed,
        },
      });
    };

    const handleSyncComplete = () => {
      dispatch({
        type: "updateSyncStatus",
        payload: {
          isSyncing: false,
          pendingCount: SyncQueue.getStats().pending,
          failedCount: SyncQueue.getStats().failed,
        },
      });
    };

    const handleSyncError = (event: Event) => {
      const customEvent = event as CustomEvent;
      dispatch({
        type: "updateSyncStatus",
        payload: {
          isSyncing: false,
          pendingCount: SyncQueue.getStats().pending,
          failedCount: SyncQueue.getStats().failed,
          lastError: customEvent.detail?.message,
        },
      });
    };

    window.addEventListener("sync:start", handleSyncStart);
    window.addEventListener("sync:complete", handleSyncComplete);
    window.addEventListener("sync:error", handleSyncError);

    return () => {
      window.removeEventListener("sync:start", handleSyncStart);
      window.removeEventListener("sync:complete", handleSyncComplete);
      window.removeEventListener("sync:error", handleSyncError);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    async function initialize() {
      try {
        // Get tenant ID (you already have this logic)
        // const activeTenantId = await fetchUserTenant(supabase);
        // setTenantId(activeTenantId);

        // Load from persistent storage
        const localState = loadState(tenantId);
        if (localState) {
          dispatch({ type: "hydrate", payload: localState });
        }

        // Sync with server when online
        if (navigator.onLine) {
          // Fetch latest from Supabase
          // const data = await fetchTenantData(supabase, tenantId);
          // dispatch({ type: "hydrate", payload: data });
        }
      } catch (error) {
        console.error("[EdugenieProvider] Initialization error:", error);
      }
    }

    if (tenantId) {
      initialize();
    }
  }, [tenantId]);

  // Save state whenever it changes
  useEffect(() => {
    if (!state.isLoading && tenantId) {
      saveState(state, tenantId);
    }
  }, [state, tenantId]);

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log("[EdugenieProvider] Coming online, triggering sync");
      window.dispatchEvent(new Event("app:online"));

      // Re-fetch data from server to ensure consistency
      // fetchTenantData(supabase, tenantId).then(data => {
      //   dispatch({ type: "hydrate", payload: data });
      // });
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [tenantId]);

  // Methods with improved sync handling
  const addStudent = useCallback(
    (studentData: any) => {
      const student = { ...studentData, id: Date.now().toString() };

      // 1. Update local state immediately
      dispatch({ type: "addStudent", payload: student });

      // 2. Queue for sync with server
      SyncQueue.add("student", "create", student);

      // 3. Update sync status
      dispatch({
        type: "updateSyncStatus",
        payload: {
          ...state.syncStatus,
          pendingCount: SyncQueue.getStats().pending,
        },
      });
    },
    [state.syncStatus]
  );

  const updateStudent = useCallback(
    (studentData: any) => {
      // 1. Update local state immediately
      dispatch({ type: "updateStudent", payload: studentData });

      // 2. Queue for sync
      SyncQueue.add("student", "update", studentData);

      // 3. Update sync status
      dispatch({
        type: "updateSyncStatus",
        payload: {
          ...state.syncStatus,
          pendingCount: SyncQueue.getStats().pending,
        },
      });
    },
    [state.syncStatus]
  );

  const deleteStudent = useCallback(
    (studentId: string) => {
      // 1. Update local state immediately
      dispatch({ type: "deleteStudent", payload: studentId });

      // 2. Queue for sync
      SyncQueue.add("student", "delete", { id: studentId });

      // 3. Update sync status
      dispatch({
        type: "updateSyncStatus",
        payload: {
          ...state.syncStatus,
          pendingCount: SyncQueue.getStats().pending,
        },
      });
    },
    [state.syncStatus]
  );

  const value = {
    state,
    dispatch,
    actions: {
      addStudent,
      updateStudent,
      deleteStudent,
      // Add other actions...
    },
  };

  return (
    <EdugenieContext.Provider value={value}>
      {children}
    </EdugenieContext.Provider>
  );
}

/**
 * Create context
 */
const EdugenieContext = createContext<any>(null);

export function useEdugenie() {
  const context = useContext(EdugenieContext);
  if (!context) {
    throw new Error("useEdugenie must be used within EdugenieProvider");
  }
  return context;
}
