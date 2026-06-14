"use client";

import { useEduGenie } from "@/providers/edugenie-store";
import { usePathname } from "next/navigation";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

const SUPER_ADMIN_EMAIL = "mazenhelal29@gmail.com";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, subscription, isLoading } = useEduGenie();
  const pathname = usePathname();

  // Direct email check from Supabase auth session (independent of store)
  const [emailChecked, setEmailChecked] = useState(false);
  const [isSuperAdminByEmail, setIsSuperAdminByEmail] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email?.toLowerCase();
      setIsSuperAdminByEmail(email === SUPER_ADMIN_EMAIL);
      setEmailChecked(true);
    }).catch(() => {
      setEmailChecked(true);
    });
  }, []);

  // Combined super admin check
  const effectivelyAdmin = isSuperAdmin || isSuperAdminByEmail;

  // On super-admin routes: wait until BOTH store and email check are ready
  if (pathname?.startsWith("/super-admin")) {
    if (isLoading || !emailChecked) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      );
    }

    if (!effectivelyAdmin) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">غير مصرح بالدخول</h1>
            <p className="text-slate-600">هذه الصفحة مخصصة لمدير النظام فقط.</p>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // On other routes: let loading pass through normally
  if (isLoading) return <>{children}</>;

  // Super admin bypasses all subscription checks
  if (effectivelyAdmin) return <>{children}</>;

  // Check subscription for regular users
  if (subscription.isActive) return <>{children}</>;

  // Subscription expired
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">انتهت فترة الاشتراك</h1>
        <p className="text-muted-foreground mb-8">
          عفواً، لقد انتهت صلاحية اشتراك المركز الخاص بك. يرجى التواصل مع الدعم الفني لتجديد الاشتراك واستعادة الوصول إلى النظام.
        </p>
        <a
          href="https://wa.me/201221475856"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-4 text-sm font-bold text-white transition-all hover:bg-[#1DA851] active:scale-95 shadow-lg shadow-[#25D366]/20"
        >
          <MessageCircle className="h-5 w-5" />
          تواصل معنا عبر واتساب
        </a>
      </div>
    </div>
  );
}
