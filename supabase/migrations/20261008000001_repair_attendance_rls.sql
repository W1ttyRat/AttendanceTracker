-- Recreate ownership policies after the attendance tables are deployed.
-- Anonymous Supabase users use the authenticated role and auth.uid() is their
-- stable user UUID.

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage their classes" ON public.classes;
CREATE POLICY "Teachers can manage their classes"
ON public.classes
FOR ALL
TO authenticated
USING (teacher_id = (SELECT auth.uid()))
WITH CHECK (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own student records" ON public.students;
CREATE POLICY "Users can manage their own student records"
ON public.students
FOR ALL
TO authenticated
USING (created_by = (SELECT auth.uid()))
WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their class enrollments" ON public.class_enrollments;
CREATE POLICY "Users can view their class enrollments"
ON public.class_enrollments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.classes
        WHERE classes.id = class_enrollments.class_id
          AND classes.teacher_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can enroll their own students in their classes" ON public.class_enrollments;
CREATE POLICY "Users can enroll their own students in their classes"
ON public.class_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.classes
        WHERE classes.id = class_enrollments.class_id
          AND classes.teacher_id = (SELECT auth.uid())
    )
    AND EXISTS (
        SELECT 1
        FROM public.students
        WHERE students.id = class_enrollments.student_id
          AND students.created_by = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Teachers can manage sessions for their classes" ON public.attendance_sessions;
CREATE POLICY "Teachers can manage sessions for their classes"
ON public.attendance_sessions
FOR ALL
TO authenticated
USING (
    created_by = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1
        FROM public.classes
        WHERE classes.id = attendance_sessions.class_id
          AND classes.teacher_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    created_by = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1
        FROM public.classes
        WHERE classes.id = attendance_sessions.class_id
          AND classes.teacher_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Teachers can manage records for their sessions" ON public.attendance_records;
CREATE POLICY "Teachers can manage records for their sessions"
ON public.attendance_records
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.attendance_sessions
        JOIN public.classes ON classes.id = attendance_sessions.class_id
        WHERE attendance_sessions.id = attendance_records.session_id
          AND classes.teacher_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.attendance_sessions
        JOIN public.classes ON classes.id = attendance_sessions.class_id
        WHERE attendance_sessions.id = attendance_records.session_id
          AND classes.teacher_id = (SELECT auth.uid())
    )
);
