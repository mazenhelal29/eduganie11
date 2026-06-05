/**
 * Example: Using the new Sync System
 * This shows how to use PersistentStore, SyncQueue, and useSyncedData
 * in your components and services
 */

import { useSyncedData, useSyncQueueStatus } from "@/hooks/useSyncedData";
import { PersistentStore } from "@/lib/storage/persistent-store";
import { SyncQueue } from "@/lib/storage/sync-queue";
import { supabaseSyncService } from "@/services/supabase-sync-service";
import { useEffect } from "react";

/**
 * EXAMPLE 1: Using useSyncedData Hook
 * This will automatically persist data and sync with server
 */
export function StudentListExample() {
  const { data: students, setData: setStudents, queueSync, syncStatus } = useSyncedData(
    "students",
    [],
    { persistKey: "edugenie:students" }
  );

  const addStudent = async (studentData: any) => {
    // 1. Update local state (immediately shown to user)
    const newStudent = { ...studentData, id: Date.now().toString() };
    setStudents([...students, newStudent]);

    // 2. Queue for sync (will retry if fails)
    queueSync("student", "create", newStudent);
  };

  return (
    <div>
      <h1>Students</h1>

      {/* Show sync status */}
      {syncStatus.pendingCount > 0 && (
        <div className="bg-yellow-100 p-3">
          📡 {syncStatus.pendingCount} changes pending sync
        </div>
      )}

      {syncStatus.failedCount > 0 && (
        <div className="bg-red-100 p-3">
          ⚠️ {syncStatus.failedCount} changes failed - will retry
        </div>
      )}

      {/* Student list */}
      <ul>
        {students.map((student) => (
          <li key={student.id}>{student.name}</li>
        ))}
      </ul>

      <button onClick={() => addStudent({ name: "New Student" })}>
        {syncStatus.isSyncing ? "Syncing..." : "Add Student"}
      </button>
    </div>
  );
}

/**
 * EXAMPLE 2: Using PersistentStore directly
 * For more control over storage
 */
export function ManualStorageExample() {
  const handleSave = () => {
    const data = {
      name: "Test Center",
      students: 50,
      teachers: 10,
    };

    // Save with versioning and checksum
    PersistentStore.save("center-info", data);
    console.log("Saved!");
  };

  const handleLoad = () => {
    // Load with integrity check
    const data = PersistentStore.load("center-info");
    console.log("Loaded:", data);
  };

  const handleClear = () => {
    PersistentStore.clear();
    console.log("All data cleared");
  };

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleLoad}>Load</button>
      <button onClick={handleClear}>Clear</button>
    </div>
  );
}

/**
 * EXAMPLE 3: Monitoring Sync Queue
 * Show users what's being synced
 */
export function SyncQueueMonitor() {
  const queueStatus = useSyncQueueStatus();

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Sync Queue</h3>

      <div className="text-sm space-y-1">
        <p>Total: {queueStatus.total}</p>
        <p>Pending: {queueStatus.pending}</p>
        <p>Failed: {queueStatus.failed}</p>
        <p>Status: {queueStatus.isProcessing ? "🔄 Processing" : "✅ Idle"}</p>
      </div>

      {queueStatus.failed > 0 && (
        <button
          onClick={() => {
            // Manually trigger retry
            window.dispatchEvent(new Event("app:online"));
          }}
          className="mt-3 px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Retry Failed
        </button>
      )}
    </div>
  );
}

/**
 * EXAMPLE 4: Initialize sync service on app startup
 * Add this to your app's root layout or _app.tsx
 */
export function SyncInitializer() {
  useEffect(() => {
    console.log("[App] Initializing sync service");

    // Initialize the sync service
    supabaseSyncService.initializeSyncListener();

    // Restore sync queue from storage
    SyncQueue.initialize();

    // When app comes online, process queue
    const handleOnline = () => {
      console.log("[App] Online - processing sync queue");
      window.dispatchEvent(new Event("app:online"));
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}

/**
 * EXAMPLE 5: Better way to handle student creation
 * Integrated with the sync system
 */
export async function createStudentWithSync(
  studentData: any,
  setStudents: (updater: any) => void
) {
  const id = `temp-${Date.now()}`;
  const student = { ...studentData, id };

  // Step 1: Update UI immediately (optimistic)
  setStudents((prev: any) => [...prev, student]);

  // Step 2: Queue for sync
  SyncQueue.add("student", "create", student);

  // Step 3: Listen for sync result
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Sync timeout"));
    }, 30000);

    const handleSuccess = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail.id === id) {
        clearTimeout(timeout);
        window.removeEventListener("sync:item-success", handleSuccess);
        resolve(event.detail);
      }
    };

    const handleError = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail.id === id) {
        clearTimeout(timeout);
        window.removeEventListener("sync:error", handleError);
        reject(new Error(event.detail.error));
      }
    };

    window.addEventListener("sync:item-success", handleSuccess);
    window.addEventListener("sync:error", handleError);
  });
}
