export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          phone: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
      };
      students: {
        Row: {
          id: string;
          tenant_id: string;
          group_id: string | null;
          full_name: string;
          phone: string | null;
          parent_phone: string | null;
          notes: string | null;
          join_date: string;
          status: "active" | "paused" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          group_id?: string | null;
          full_name: string;
          phone?: string | null;
          parent_phone?: string | null;
          notes?: string | null;
          join_date?: string;
          status?: "active" | "paused" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_tenant_with_owner: {
        Args: {
          tenant_name: string;
          tenant_slug: string;
          owner_full_name: string;
          owner_phone?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: "owner" | "admin" | "staff";
      student_status: "active" | "paused" | "archived";
      subscription_status: "active" | "overdue" | "paused" | "cancelled";
      attendance_status: "present" | "absent" | "late" | "excused";
      expense_category: "rent" | "salaries" | "utilities" | "miscellaneous";
      notification_kind: "renewal" | "overdue" | "reminder" | "system";
    };
    CompositeTypes: Record<string, never>;
  };
};
