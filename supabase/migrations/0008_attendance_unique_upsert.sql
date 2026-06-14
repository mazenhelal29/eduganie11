-- Keep one attendance record per student per day so client upserts do not create duplicates.
WITH ranked_attendance AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY tenant_id, student_id, attended_on
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS row_number
  FROM public.attendance
)
DELETE FROM public.attendance
USING ranked_attendance
WHERE public.attendance.id = ranked_attendance.id
  AND ranked_attendance.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_tenant_student_day_uidx
ON public.attendance (tenant_id, student_id, attended_on);
