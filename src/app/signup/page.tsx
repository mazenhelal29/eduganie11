"use client";

import { SignupForm } from "@/features/auth/components/SignupForm";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/providers/i18n-provider";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function SignupPage() {
  const { t } = useTranslation();

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="absolute right-4 top-4 md:right-8 md:top-8 z-50">
        <LanguageSwitcher />
      </div>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary/90 overflow-hidden">
          <Image src="/logo.jpg" alt="Background Banner" fill className="object-cover opacity-20" priority />
        </div>
        <div className="relative z-20 flex items-center gap-3 text-2xl font-bold">
          <Image src="/logo.jpg" alt="EduGenie Logo" width={48} height={48} className="rounded-xl object-cover shadow-md" />
          {t.common.edugenie}
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              {t.common.quote}
            </p>
          </blockquote>
        </div>
      </div>
      <div className="p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <SignupForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            {t.auth.signup.hasAccount}{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              {t.auth.signup.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
