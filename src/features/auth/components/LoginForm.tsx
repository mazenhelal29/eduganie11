"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createBrowserClient } from "@supabase/ssr";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().email({ message: t.auth.signup.invalidEmail }),
    password: z.string().min(6, { message: t.auth.signup.passwordMinLength }),
  });

  type LoginValues = z.infer<typeof loginSchema>;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    // Super admin check by email - always redirect to super admin dashboard
    if (data.email.toLowerCase() === "mazenhelal29@gmail.com") {
      router.push("/super-admin");
      router.refresh();
      return;
    }

    // Check if regular user has a tenant
    let userData = null;
    try {
      const res = await supabase
        .from("users")
        .select("tenant_id")
        .maybeSingle();
      userData = res.data;
    } catch {
      setError("حدث خطأ في النظام");
    }

    if (!userData?.tenant_id) {
      router.push("/onboarding");
    } else {
      router.push("/");
    }

    router.refresh();
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t.auth.login.title}</h1>
        <p className="text-sm text-muted-foreground">{t.auth.login.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Field
            label={t.auth.login.email}
            type="email"
            placeholder={t.auth.login.emailPlaceholder}
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Field
            label={t.auth.login.password}
            type="password"
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        {error && <div className="text-sm text-red-500 text-center">{error}</div>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t.auth.login.submitting : t.auth.login.submit}
        </Button>
      </form>
    </div>
  );
}
