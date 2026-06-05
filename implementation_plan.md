# Implementation Plan - Offline Support & Data Sync

The goal is to allow educators and administrators to use the Edugenie system fully while offline and automatically synchronize data once the internet connection is restored.

## User Review Required

> [!IMPORTANT]
> This change introduces a local database (IndexedDB) to the user's browser. Data will be stored locally and synced. 
> 1. Do you have a preference for the local database library? I recommend **Dexie.js** for its simplicity and robustness.
> 2. We will need to register a Service Worker, which requires the app to be served over HTTPS in production.

## Proposed Changes

### 1. PWA Foundation
*   **[NEW] `public/manifest.json`**: Define the PWA manifest (icons, theme color, display mode).
*   **[MODIFY] `next.config.ts`**: Configure PWA support using `next-pwa` or a custom service worker setup.
*   **[NEW] `public/sw.js`**: Custom service worker for caching assets and handling background sync.

### 2. Local Storage Layer (IndexedDB)
*   **[NEW] `lib/db/offline-db.ts`**: Initialize Dexie.js with schemas for `students`, `teachers`, `attendance`, `daily_tasks`, `expenses`, `payments`, and an `offline_queue` for pending mutations.
*   **[NEW] `hooks/useOfflineSync.ts`**: A hook that monitors the `offline_queue` and attempts to sync data to Supabase when the connection is restored.

### 3. Data Fetching & Persistence
*   **[MODIFY] `components/providers/QueryProvider.tsx`**: 
    *   Add `PersistQueryClientProvider` from `@tanstack/react-query-persist-client`.
    *   Configure `createIndexedDBPersister` to save the React Query cache to IndexedDB.
*   **[MODIFY] `services/*.service.ts`**:
    *   Update service methods to check connectivity.
    *   If offline, read from/write to the local Dexie DB.
    *   If online, perform Supabase actions and update the local DB as a cache.

### 4. UI Indicators
*   **[NEW] `components/ui/OfflineBanner.tsx`**: A subtle banner or status indicator showing when the app is in offline mode and the status of synchronization.

## Detailed Workflow for "Offline Usage"
1.  **Initial Load**: The app fetches data and populates both React Query cache and Dexie DB.
2.  **Going Offline**: The service worker takes over asset serving. React Query uses its persistent cache.
3.  **Making Changes**: When a user records student attendance or adds a task:
    *   The app detects "offline" status.
    *   The record is saved to the local database table and the `offline_queue`.
    *   The UI updates optimistically.
4.  **Coming Online**:
    *   The `useOfflineSync` hook detects the `online` event.
    *   It iterates through the `offline_queue`, sending each record to Supabase.
    *   Once confirmed, it removes the item from the queue and refreshes the React Query cache.

## Verification Plan

### Automated Tests
*   Simulate offline mode in the browser.
*   Verify that the app loads and displays cached student/teacher/attendance data.
*   Verify that recording attendance or adding tasks while offline saves it to IndexedDB.
*   Restore connection and verify the data is sent to Supabase.

### Manual Verification
*   Open the app, disconnect Wi-Fi.
*   Navigate between dashboard and students/groups list.
*   Record attendance for a test student.
*   Reconnect Wi-Fi and check if the attendance appears in the Supabase dashboard.
