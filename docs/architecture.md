# EduGenie MVP Architecture

EduGenie is organized as a mobile-first multi-tenant SaaS for teachers and education centers. The MVP focuses on operational workflows: students, groups, attendance, subscriptions, payments, expenses, reports, and tenant settings.

## Application Layers

- `src/app`: Next.js App Router routes, metadata, PWA manifest, and layouts.
- `src/features`: Domain modules for auth, dashboard, students, groups, attendance, payments, expenses, and settings.
- `src/components`: Shared UI, shell navigation, and reusable layout components.
- `src/services`: API clients, query functions, and temporary mock data.
- `src/providers`: App-level providers such as TanStack Query and auth context.
- `src/types`: Shared TypeScript domain contracts.
- `supabase`: PostgreSQL schema, RLS policies, indexes, and future seed files.

## Multi-Tenant Model

Every operational record includes `tenant_id`. Supabase RLS policies compare each row's `tenant_id` to the authenticated user's tenant from `public.users`. This blocks cross-tenant access at the database layer even if an API route or client query is incorrect.

## MVP Screens

- Dashboard: operational metrics, attendance status, revenue, expenses, net profit, overdue subscriptions.
- Students: searchable smart list, add/edit/archive flow, profile with attendance and payments.
- Groups: schedule, capacity, active state, student assignment.
- Attendance: mobile optimized daily marking and bulk attendance.
- Payments: subscriptions, due dates, remaining balances, overdue tracking.
- Expenses: rent, salaries, utilities, miscellaneous expenses.
- Settings: tenant profile, roles, staff permissions, billing-ready structure.

## PWA Strategy

The app includes a manifest and service worker. Attendance is the first workflow to support offline persistence, with queued writes planned through IndexedDB before syncing to Supabase.
