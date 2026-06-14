"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogOut, Globe, AlertTriangle, CreditCard, Code, MessageCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "@/providers/i18n-provider";
import { useEduGenie } from "@/providers/edugenie-store";

function formatDaysRemaining(endDateStr: string): string {
  const end = new Date(endDateStr);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return "الاشتراك منتهي";
  if (diffDays === 1) return "متبقي يوم واحد";
  if (diffDays === 2) return "متبقي يومين";
  if (diffDays <= 10) return `متبقي ${diffDays} أيام`;
  return `متبقي ${diffDays} يوماً`;
}

export function SettingsPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useTranslation();
  const { settings, updateSettings, subscription } = useEduGenie();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">{t.settings.tenantTitle}</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="rounded-md border p-3">
            <p className="font-medium">{t.settings.tenantTitle}</p>
            <p className="text-muted-foreground">{t.settings.tenantDesc}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="font-medium">{t.settings.rolesTitle}</p>
            <p className="text-muted-foreground">{t.settings.rolesDesc}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">حالة الاشتراك</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">فترة الاشتراك</p>
              <p className="text-muted-foreground">
                {subscription.isActive 
                  ? formatDaysRemaining(subscription.endDate)
                  : "الاشتراك منتهي"}
              </p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-bold ${subscription.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {subscription.isActive ? "نشط" : "منتهي"}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            تاريخ الانتهاء: {new Date(subscription.endDate).toLocaleDateString('ar-EG')}
          </p>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">{t.settings.languageTitle}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.settings.languageDesc}
        </p>
        <LanguageSwitcher />
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">{t.settings.billingTitle}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{t.settings.billingDesc}</p>
        <div className="grid grid-cols-2 gap-3">
          {(["prepaid", "postpaid"] as const).map((model) => {
            const isActive = (settings?.billingModel ?? "prepaid") === model;
            return (
              <button
                key={model}
                type="button"
                onClick={() => updateSettings({ billingModel: model })}
                className={`focus-ring flex flex-col gap-1 rounded-lg border-2 p-4 text-start transition-colors ${
                  isActive
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <span className={`text-sm font-semibold ${isActive ? "text-accent" : ""}`}>
                  {t.settings[model]}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t.settings[`${model}Desc` as "prepaidDesc" | "postpaidDesc"]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-accent/20 bg-gradient-to-br from-card to-accent/5 p-4 shadow-sm relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-3xl"></div>
        <div className="mb-1 flex items-center gap-2 relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Code className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Maz-tech</h2>
        </div>
        <p className="mb-4 text-xs font-light tracking-wider text-muted-foreground relative">
          ENG:Mazen , ENG:Anwaar
        </p>
        <p className="mb-5 text-sm leading-relaxed text-foreground/80 relative">
          نحن هنا دائماً لمساعدتك! للاستفسارات، طلب الدعم الفني، أو تجديد الاشتراك، لا تتردد في التواصل معنا.
        </p>
        
        <a
          href="https://wa.me/201221475856"
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] transition-all hover:bg-[#20bd5a] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          تواصل عبر واتساب
        </a>
      </section>

      <section className="rounded-lg border border-red-200 bg-card p-4 shadow-sm lg:col-span-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-red-600">{t.settings.logoutTitle}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.settings.logoutDesc}
            </p>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 active:bg-red-200"
            >
              <LogOut className="h-4 w-4" />
              {t.settings.logoutBtn}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{t.settings.logoutConfirm}</span>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                {t.settings.logoutCancel}
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {isLoggingOut ? t.settings.logoutLoading : t.settings.logoutConfirmBtn}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
