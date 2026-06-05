/**
 * Supabase Sync Service
 * Handles synchronization of queued operations with Supabase
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SyncQueue, type PendingSync } from "@/lib/storage/sync-queue";

class SupabaseSyncService {
  private supabase = createSupabaseBrowserClient();

  /**
   * Initialize sync listener
   */
  initializeSyncListener(): void {
    // Listen for sync requests
    window.addEventListener("sync:process", (event: Event) => {
      const customEvent = event as CustomEvent;
      this.processSyncItem(customEvent.detail).catch((error) => {
        console.error("[SupabaseSyncService] Error processing sync:", error);
      });
    });

    // Listen for online event
    window.addEventListener("app:online", () => {
      this.processQueue().catch((error) => {
        console.error("[SupabaseSyncService] Error processing queue:", error);
      });
    });

    console.log("[SupabaseSyncService] Sync listener initialized");
  }

  /**
   * Process a single sync item
   */
  private async processSyncItem(item: PendingSync): Promise<void> {
    if (!item) return;

    SyncQueue.markRetrying(item.id);

    try {
      switch (item.entity) {
        case "student":
          await this.syncStudent(item);
          break;
        case "teacher":
          await this.syncTeacher(item);
          break;
        case "group":
          await this.syncGroup(item);
          break;
        case "attendance":
          await this.syncAttendance(item);
          break;
        case "payment":
          await this.syncPayment(item);
          break;
        case "expense":
          await this.syncExpense(item);
          break;
        default:
          throw new Error(`Unknown entity: ${item.entity}`);
      }

      // Success - remove from queue
      SyncQueue.remove(item.id);
      console.log(`[SupabaseSyncService] Successfully synced ${item.entity} (${item.id})`);

      // Dispatch success event
      window.dispatchEvent(
        new CustomEvent("sync:item-success", { detail: { id: item.id, entity: item.entity } })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      SyncQueue.markFailed(item.id, message);
      console.error(`[SupabaseSyncService] Failed to sync ${item.entity}:`, error);

      // Dispatch error event
      window.dispatchEvent(
        new CustomEvent("sync:error", { detail: { id: item.id, error: message } })
      );
    } finally {
      // Dispatch processed event
      window.dispatchEvent(new Event("sync:processed"));
    }
  }

  /**
   * Process entire queue
   */
  private async processQueue(): Promise<void> {
    if (!navigator.onLine) {
      console.log("[SupabaseSyncService] Offline - skipping queue processing");
      return;
    }

    window.dispatchEvent(new Event("sync:start"));

    try {
      const retryable = SyncQueue.getRetryable();

      if (retryable.length === 0) {
        window.dispatchEvent(new Event("sync:complete"));
        return;
      }

      console.log(`[SupabaseSyncService] Processing ${retryable.length} queued items`);

      for (const item of retryable) {
        await this.processSyncItem(item);
        // Small delay between items to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      window.dispatchEvent(new Event("sync:complete"));
    } catch (error) {
      console.error("[SupabaseSyncService] Queue processing error:", error);
      window.dispatchEvent(
        new CustomEvent("sync:error", {
          detail: { message: error instanceof Error ? error.message : "Unknown error" },
        })
      );
    }
  }

  // Entity sync methods
  private async syncStudent(item: PendingSync): Promise<void> {
    const { operation, data } = item;
    const d = data as Record<string, unknown>;
    const table = this.supabase.from("students");

    switch (operation) {
      case "create":
        await table.insert(d);
        break;
      case "update":
        await table.update(d).eq("id", d.id);
        break;
      case "delete":
        await table.delete().eq("id", d.id);
        break;
    }
  }

  private async syncTeacher(item: PendingSync): Promise<void> {
    const { operation, data } = item;
    const d = data as Record<string, unknown>;
    const table = this.supabase.from("teachers");

    switch (operation) {
      case "create":
        await table.insert(d);
        break;
      case "update":
        await table.update(d).eq("id", d.id);
        break;
      case "delete":
        await table.delete().eq("id", d.id);
        break;
    }
  }

  private async syncGroup(item: PendingSync): Promise<void> {
    const { operation, data } = item;
    const d = data as Record<string, unknown>;
    const table = this.supabase.from("groups");

    switch (operation) {
      case "create":
        await table.insert(d);
        break;
      case "update":
        await table.update(d).eq("id", d.id);
        break;
      case "delete":
        await table.delete().eq("id", d.id);
        break;
    }
  }

  private async syncAttendance(item: PendingSync): Promise<void> {
    const { operation, data } = item;
    const d = data as Record<string, unknown>;
    const table = this.supabase.from("attendance");

    switch (operation) {
      case "create":
        await table.insert(d);
        break;
      case "update":
        await table.update(d).eq("id", d.id);
        break;
      case "delete":
        await table.delete().eq("id", d.id);
        break;
    }
  }

  private async syncPayment(item: PendingSync): Promise<void> {
    const { operation, data } = item;
    const d = data as Record<string, unknown>;
    const table = this.supabase.from("payments");

    switch (operation) {
      case "create":
        await table.insert(d);
        break;
      case "update":
        await table.update(d).eq("id", d.id);
        break;
      case "delete":
        await table.delete().eq("id", d.id);
        break;
    }
  }

  private async syncExpense(item: PendingSync): Promise<void> {
    const { operation, data } = item;
    const d = data as Record<string, unknown>;
    const table = this.supabase.from("expenses");

    switch (operation) {
      case "create":
        await table.insert(d);
        break;
      case "update":
        await table.update(d).eq("id", d.id);
        break;
      case "delete":
        await table.delete().eq("id", d.id);
        break;
    }
  }
}

// Export singleton instance
export const supabaseSyncService = new SupabaseSyncService();
