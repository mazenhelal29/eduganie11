/**
 * Sync Queue Manager
 * Manages pending operations that failed to sync to Supabase
 */

export type SyncOperation = "create" | "update" | "delete";
export type SyncEntity = "student" | "teacher" | "group" | "attendance" | "payment" | "expense";

export interface PendingSync {
  id: string;
  entity: SyncEntity;
  operation: SyncOperation;
  data: unknown;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  status: "pending" | "retrying" | "failed";
}

export interface SyncQueueState {
  items: PendingSync[];
  isProcessing: boolean;
  lastProcessedTime: number;
}

const SYNC_QUEUE_KEY = "edugenie:sync-queue";
const RETRY_DELAYS = [1000, 3000, 10000, 30000, 60000]; // Progressive backoff

export class SyncQueue {
  private static queue: PendingSync[] = [];
  private static isProcessing = false;
  private static processTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize queue from storage
   */
  static initialize(): void {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("[SyncQueue] Failed to initialize:", error);
      this.queue = [];
    }
  }

  /**
   * Add operation to sync queue
   */
  static add(
    entity: SyncEntity,
    operation: SyncOperation,
    data: unknown
  ): string {
    const id = `${entity}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const pendingSync: PendingSync = {
      id,
      entity,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    };

    this.queue.push(pendingSync);
    this.persist();

    console.log(`[SyncQueue] Added ${operation} for ${entity}:`, id);

    // Trigger processing
    this.scheduleProcess();

    return id;
  }

  /**
   * Remove item from queue
   */
  static remove(id: string): void {
    this.queue = this.queue.filter((item) => item.id !== id);
    this.persist();
  }

  /**
   * Mark as failed and schedule retry
   */
  static markFailed(id: string, error: string): void {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      item.status = "failed";
      item.lastError = error;
      this.persist();
    }
  }

  /**
   * Mark as retrying
   */
  static markRetrying(id: string): void {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      item.status = "retrying";
      item.retryCount++;
      this.persist();
    }
  }

  /**
   * Get all pending operations
   */
  static getPending(): PendingSync[] {
    return this.queue.filter((item) => item.status === "pending");
  }

  /**
   * Get failed operations
   */
  static getFailed(): PendingSync[] {
    return this.queue.filter((item) => item.status === "failed");
  }

  /**
   * Get retry candidates (respecting backoff)
   */
  static getRetryable(): PendingSync[] {
    const now = Date.now();
    return this.queue.filter((item) => {
      if (item.status === "pending") return true;

      if (item.status === "failed" && item.retryCount < RETRY_DELAYS.length) {
        const lastRetry = item.timestamp + 1000; // Simplified
        const delay = RETRY_DELAYS[Math.min(item.retryCount, RETRY_DELAYS.length - 1)];
        return now - lastRetry >= delay;
      }

      return false;
    });
  }

  /**
   * Get queue statistics
   */
  static getStats() {
    return {
      total: this.queue.length,
      pending: this.getPending().length,
      failed: this.getFailed().length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear entire queue (use with caution!)
   */
  static clear(): void {
    this.queue = [];
    localStorage.removeItem(SYNC_QUEUE_KEY);
    console.warn("[SyncQueue] Queue cleared");
  }

  /**
   * Schedule processing with debounce
   */
  private static scheduleProcess(): void {
    if (this.processTimer) {
      clearTimeout(this.processTimer);
    }

    this.processTimer = setTimeout(() => {
      if (!this.isProcessing && navigator.onLine) {
        this.process().catch((error) => {
          console.error("[SyncQueue] Process error:", error);
        });
      }
    }, 500); // Debounce for 500ms
  }

  /**
   * Process queue (must be implemented by the app)
   */
  private static async process(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const retryable = this.getRetryable();

      for (const item of retryable) {
        try {
          // This will be called by a hook that has access to Supabase
          const event = new CustomEvent("sync:process", { detail: item });
          window.dispatchEvent(event);

          // Wait for response
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 5000);
            const handler = (e: Event) => {
              clearTimeout(timeout);
              resolve(null);
            };
            window.addEventListener("sync:processed", handler, { once: true });
          });
        } catch (error) {
          console.error(`[SyncQueue] Failed to process ${item.id}:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Persist queue to storage
   */
  private static persist(): void {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("[SyncQueue] Failed to persist:", error);
    }
  }
}

// Initialize on import
SyncQueue.initialize();
