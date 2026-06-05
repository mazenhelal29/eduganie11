# Edugenie: Architecture & Implementation Overview

This document outlines the technical architecture and implementation details of the Edugenie SaaS platform.

## 1. Project Overview
Edugenie is a multi-tenant SaaS application designed for educational center management. It provides tools for student management, teacher administration, attendance tracking, daily tasks, expense management, and payment processing.

## 2. Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19
- **Styling**: Tailwind CSS, Shadcn UI (Radix UI)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form, Zod (Validation)
- **Icons**: Lucide React

---

## 3. Architecture

### 3.1 Folder Structure
- `app/`: Next.js App Router structure.
  - `(auth)`: Login, Register, and password recovery.
  - `(dashboard)`: Main educational center management interface (Students, Teachers, Groups, Attendance, Tasks, Payments).
  - `(admin)`: Center management (Settings, Reports, User Management).
- `components/`: Reusable UI components.
  - `ui/`: Base Shadcn components.
  - `dashboard/`: Feature-specific components.
  - `layout/`: Shared layout elements (Sidebar, Navbar).
- `services/`: Business logic and database interactions.
  - `auth.service.ts`: Authentication wrappers.
  - `students.service.ts`: Student CRUD operations.
  - `teachers.service.ts`: Teacher CRUD operations.
  - `attendance.service.ts`: Attendance tracking logic.
  - `groups.service.ts`: Study group management.
- `hooks/`: Custom React hooks for global state and logic.
  - `useAuth.ts`: Authentication state management.
  - `useRBAC.ts`: Role-Based Access Control logic.
- `lib/`: Core utilities and configurations.
  - `supabase/`: Supabase client definitions (Server/Client/Middleware).
  - `validations/`: Zod schemas for form validation.
- `supabase/migrations/`: SQL files defining the database schema and RLS policies.

### 3.2 Multitenancy & Security
- **Multi-tenant Isolation**: Handled via Supabase **Row Level Security (RLS)**. Each educational center can only access its own data based on `center_id`.
- **Authentication**: Managed by Supabase Auth with custom metadata for roles.
- **RBAC**: Implemented via a custom `useRBAC` hook and database-level checks.

---

## 4. Implementation Details

### 4.1 Subscription System
The system features a multi-tier subscription model:
- **Packages**: Defined in `subscription_packages` table.
- **Trials**: New educational centers start with a trial period.
- **Expiry Enforcement**: A middleware/service check ensures that expired subscriptions restrict access to dashboard features.

### 4.2 Data Fetching
- **Server Side**: Using Next.js Server Components for initial page loads.
- **Client Side**: Using React Query for interactive features (e.g., student search, attendance updates) to ensure a smooth, SPA-like experience.

### 4.3 Arabic Support (RTL)
- Fully localized interface with Arabic as the primary language.
- RTL layout support using a custom `RTLProvider`.
- Typography optimized with fonts like Cairo or Inter.

---

## 5. Database Schema Key Entities
- `centers`: Stores educational center information and subscription status.
- `students`: Student profiles linked to centers.
- `teachers`: Teacher profiles and credentials.
- `groups`: Study groups and classes.
- `attendance`: Daily attendance records for students.
- `daily_tasks`: Tasks assigned to students and teachers.
- `expenses`: Cost tracking for center operations.
- `payments`: Student payment records and billing.
- `audit_logs`: Tracking system changes for security.

---

## 6. Development Workflow
1. **Migrations**: All database changes are tracked in `supabase/migrations`.
2. **Components**: UI follows the Shadcn design system for consistency.
3. **Services**: All database interactions are abstracted into services to keep components clean.
