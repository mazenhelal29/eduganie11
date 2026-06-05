/**
 * Persistent Storage Manager
 * Handles local storage with versioning, compression, and fallback
 */

const STORAGE_PREFIX = "edugenie:";
const STORAGE_VERSION = 1;

interface StorageEntry<T> {
  version: number;
  data: T;
  timestamp: number;
  checksum: string;
}

/**
 * Simple checksum to detect data corruption
 */
function generateChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

export class PersistentStore {
  /**
   * Save data with versioning and checksum
   */
  static save<T>(key: string, data: T): void {
    try {
      const entry: StorageEntry<T> = {
        version: STORAGE_VERSION,
        data,
        timestamp: Date.now(),
        checksum: generateChecksum(data),
      };

      const fullKey = `${STORAGE_PREFIX}${key}`;
      const serialized = JSON.stringify(entry);

      // Check storage quota
      if (serialized.length > 5 * 1024 * 1024) {
        console.warn(
          `[PersistentStore] Data too large for ${key}: ${serialized.length} bytes`
        );
      }

      localStorage.setItem(fullKey, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.error("[PersistentStore] Storage quota exceeded");
        this.clearOldEntries();
      } else {
        console.error(`[PersistentStore] Failed to save ${key}:`, error);
      }
    }
  }

  /**
   * Load data with integrity check
   */
  static load<T>(key: string, defaultValue?: T): T | null {
    try {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      const stored = localStorage.getItem(fullKey);

      if (!stored) return defaultValue ?? null;

      const entry: StorageEntry<T> = JSON.parse(stored);

      // Version check
      if (entry.version !== STORAGE_VERSION) {
        console.warn(`[PersistentStore] Version mismatch for ${key}`);
        return defaultValue ?? null;
      }

      // Integrity check
      const currentChecksum = generateChecksum(entry.data);
      if (currentChecksum !== entry.checksum) {
        console.error(`[PersistentStore] Data corruption detected for ${key}`);
        return defaultValue ?? null;
      }

      return entry.data;
    } catch (error) {
      console.error(`[PersistentStore] Failed to load ${key}:`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Remove specific entry
   */
  static remove(key: string): void {
    try {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`[PersistentStore] Failed to remove ${key}:`, error);
    }
  }

  /**
   * Clear all Edugenie data
   */
  static clear(): void {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(STORAGE_PREFIX)
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("[PersistentStore] Failed to clear storage:", error);
    }
  }

  /**
   * Clear old entries when storage is full
   */
  private static clearOldEntries(): void {
    try {
      const entries: Array<[string, number]> = [];

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry: StorageEntry<unknown> = JSON.parse(stored);
            entries.push([key, entry.timestamp]);
          }
        }
      });

      // Remove oldest 25% of entries
      entries.sort((a, b) => a[1] - b[1]);
      const removeCount = Math.ceil(entries.length * 0.25);

      for (let i = 0; i < removeCount; i++) {
        localStorage.removeItem(entries[i][0]);
      }

      console.log(
        `[PersistentStore] Cleared ${removeCount} old entries to free space`
      );
    } catch (error) {
      console.error("[PersistentStore] Error clearing old entries:", error);
    }
  }

  /**
   * Get storage usage
   */
  static getUsage(): { used: number; available: number; percentage: number } {
    let used = 0;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        used += localStorage.getItem(key)?.length ?? 0;
      }
    });

    const available = 5 * 1024 * 1024; // 5MB typical limit
    return {
      used,
      available,
      percentage: (used / available) * 100,
    };
  }
}
