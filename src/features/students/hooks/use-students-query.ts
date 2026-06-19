import { useQuery } from "@tanstack/react-query";
import { createSupabaseClient } from "@/services/supabase-sync";
import { useEduGenie } from "@/providers/edugenie-store";
import type { Student } from "@/types/domain";

interface UseStudentsQueryParams {
  page: number;
  pageSize: number;
  searchQuery: string;
  groupId: string | null;
  attendanceFilter: "all" | "high" | "medium" | "low";
  sortBy: "name" | "attendance";
}

export function useStudentsQuery({
  page,
  pageSize,
  searchQuery,
  groupId,
  attendanceFilter,
  sortBy,
}: UseStudentsQueryParams) {
  const { tenantId } = useEduGenie();

  return useQuery({
    queryKey: ["students", tenantId, page, pageSize, searchQuery, groupId, attendanceFilter, sortBy],
    queryFn: async () => {
      if (!tenantId) {
        return { data: [], count: 0 };
      }

      const supabase = createSupabaseClient();
      let query = supabase
        .from("students")
        .select("id,tenant_id,full_name,phone,parent_phone,notes,join_date,group_id,teacher_id,status,created_at,updated_at", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      // Searching
      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,parent_phone.ilike.%${searchQuery}%`);
      }

      // Filtering by group
      if (groupId) {
        if (groupId === "unassigned") {
          query = query.is("group_id", null);
        } else {
          query = query.eq("group_id", groupId);
        }
      }

      // Sorting
      if (sortBy === "name") {
        query = query.order("full_name", { ascending: true });
      } else {
        // Fallback or generic sort, since we don't have attendance rate in DB yet, sort by created_at
        query = query.order("created_at", { ascending: false });
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        throw error;
      }

      // We map the raw db data to our domain Student model
      const mappedData: Student[] = (data || []).map((row) => ({
        id: row.id as string,
        tenantId: row.tenant_id as string,
        fullName: row.full_name as string,
        phone: (row.phone as string | null) || "",
        parentPhone: (row.parent_phone as string | null) || "",
        notes: (row.notes as string | null) || "",
        joinDate: row.join_date as string,
        groupId: row.group_id as string | undefined,
        teacherId: row.teacher_id as string | undefined,
        status: row.status as Student["status"],
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      }));

      // NOTE: Attendance filtering / sorting on DB level is hard without an RPC or View.
      // Currently, it's done client-side for now on the paginated data.
      return {
        data: mappedData,
        count: count || 0,
      };
    },
    enabled: !!tenantId,
    staleTime: 60 * 1000, // 1 minute
  });
}
