"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

import { Lock, Unlock, Play, Pause, Search } from "lucide-react";
import { createSupabaseClient } from "@/services/supabase-sync";
import { toast } from "@/components/ui/toast";

type TenantWithStatus = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  created_at: string;
  subscription_end_date: string;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = useMemo(() => createSupabaseClient(), []);

  const loadTenants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch {
      toast.error("حدث خطأ أثناء تحميل المراكز");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);
  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const updateSubscription = async (id: string, daysToAdd: number) => {
    try {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + daysToAdd);
      
      const { error } = await supabase
        .from("tenants")
        .update({ subscription_end_date: newDate.toISOString() })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("تم تحديث اشتراك المركز بنجاح");
      loadTenants();
    } catch {
      toast.error("حدث خطأ أثناء تحديث الاشتراك");
    }
  };

  const blockTenant = async (id: string) => {
    try {
      // Set to yesterday to block
      const newDate = new Date();
      newDate.setDate(newDate.getDate() - 1);
      
      const { error } = await supabase
        .from("tenants")
        .update({ subscription_end_date: newDate.toISOString() })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("تم إيقاف المركز بنجاح");
      loadTenants();
    } catch {
      toast.error("حدث خطأ أثناء إيقاف المركز");
    }
  };

  const filteredTenants = tenants.filter(
    (t) => t.name.includes(searchTerm) || t.slug.includes(searchTerm) || (t.phone && t.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة المراكز المشتركة</h2>
          <p className="text-muted-foreground">تحكم في اشتراكات وصلاحيات وصول جميع المراكز.</p>
        </div>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث عن مركز..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border pl-4 pr-10 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">اسم المركز / الرابط</th>
                <th className="p-4 font-medium">رقم الهاتف</th>
                <th className="p-4 font-medium">تاريخ التسجيل</th>
                <th className="p-4 font-medium">حالة الاشتراك</th>
                <th className="p-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">جاري التحميل...</td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد نتائج مطابقة</td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const endDate = new Date(tenant.subscription_end_date);
                  const isActive = endDate > new Date();
                  
                  return (
                    <tr key={tenant.id} className="transition-colors hover:bg-muted/30">
                      <td className="p-4">
                        <p className="font-semibold">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">/{tenant.slug}</p>
                      </td>
                      <td className="p-4">{tenant.phone || "—"}</td>
                      <td className="p-4">{new Date(tenant.created_at).toLocaleDateString('ar-EG')}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {isActive ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            {isActive ? "نشط" : "منتهي"}
                          </span>
                          <span className="text-xs text-muted-foreground" dir="ltr">
                          <span className="text-xs text-muted-foreground" dir="ltr">
                          {new Date(endDate).toLocaleDateString('ar-EG')}
                        </span>
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <button
                              onClick={() => {
                                if(confirm(`هل أنت متأكد من إيقاف اشتراك مركز ${tenant.name}؟`)) blockTenant(tenant.id);
                              }}
                              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              <Pause className="h-3.5 w-3.5" /> إيقاف
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if(confirm(`هل تريد تفعيل مركز ${tenant.name} لمدة شهر إضافي؟`)) updateSubscription(tenant.id, 30);
                              }}
                              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              <Play className="h-3.5 w-3.5" /> تفعيل شهر
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
