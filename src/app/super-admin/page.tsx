"use client";

import { useEffect, useState } from "react";
import { Building2, Users, CreditCard, Activity } from "lucide-react";
import { createSupabaseClient } from "@/services/supabase-sync";

type DashboardStats = {
  totalTenants: number;
  activeTenants: number;
  expiredTenants: number;
  totalUsers: number;
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function loadStats() {
      try {
        const [{ count: tenantsCount }, { data: tenants }, { count: usersCount }] = await Promise.all([
          supabase.from("tenants").select("*", { count: "exact", head: true }),
          supabase.from("tenants").select("subscription_end_date"),
          supabase.from("users").select("*", { count: "exact", head: true }),
        ]);

        const now = new Date();
        let active = 0;
        let expired = 0;
        
        tenants?.forEach(t => {
          if (new Date(t.subscription_end_date) > now) {
            active++;
          } else {
            expired++;
          }
        });

        setStats({
          totalTenants: tenantsCount || 0,
          activeTenants: active,
          expiredTenants: expired,
          totalUsers: usersCount || 0,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [supabase]);

  if (isLoading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { name: "إجمالي المراكز", value: stats.totalTenants, icon: Building2, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "المراكز النشطة", value: stats.activeTenants, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "المراكز المنتهية", value: stats.expiredTenants, icon: CreditCard, color: "text-red-600", bg: "bg-red-100" },
    { name: "إجمالي المستخدمين", value: stats.totalUsers, icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">نظرة عامة</h2>
        <p className="text-muted-foreground">ملخص لجميع المراكز والمشتركين في النظام.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
