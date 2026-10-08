import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(["present", "absent", "late", "excused"]);

function getAuthenticatedClient(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return {
      error: Response.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  return { supabase, token };
}

async function getAuthenticatedUser(request) {
  const result = getAuthenticatedClient(request);

  if (result.error) {
    return { error: result.error };
  }

  const { data, error } = await result.supabase.auth.getUser(result.token);

  if (error || !data.user) {
    return {
      error: Response.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      ),
    };
  }

  return { user: data.user, supabase: result.supabase };
}

function isValidUuid(value) {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

export async function GET(request) {
  const authenticated = await getAuthenticatedUser(request);

  if (authenticated.error) {
    return authenticated.error;
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId || !isValidUuid(sessionId)) {
    return Response.json(
      { error: "A valid session_id query parameter is required" },
      { status: 400 }
    );
  }

  const { data: attendanceRecords, error } = await authenticated.supabase
    .from("attendance_records")
    .select("id, session_id, student_id, status, note, recorded_at")
    .eq("session_id", sessionId)
    .order("student_id", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ attendance_records: attendanceRecords });
}

export async function POST(request) {
  const authenticated = await getAuthenticatedUser(request);

  if (authenticated.error) {
    return authenticated.error;
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const { session_id, student_id, status, note } = payload;

  if (!isValidUuid(session_id) || !isValidUuid(student_id)) {
    return Response.json(
      { error: "session_id and student_id must be valid UUIDs" },
      { status: 400 }
    );
  }

  if (!VALID_STATUSES.has(status)) {
    return Response.json(
      { error: "status must be present, absent, late, or excused" },
      { status: 400 }
    );
  }

  const { data: session, error: sessionError } = await authenticated.supabase
    .from("attendance_sessions")
    .select("id, class_id, created_by")
    .eq("id", session_id)
    .single();

  if (sessionError || !session) {
    return Response.json(
      { error: "Attendance session was not found" },
      { status: 404 }
    );
  }

  if (session.created_by !== authenticated.user.id) {
    return Response.json(
      { error: "You are not authorized to record this session" },
      { status: 403 }
    );
  }

  const { data: enrollment, error: enrollmentError } = await authenticated.supabase
    .from("class_enrollments")
    .select("class_id, student_id")
    .eq("class_id", session.class_id)
    .eq("student_id", student_id)
    .single();

  if (enrollmentError || !enrollment) {
    return Response.json(
      { error: "The student is not enrolled in this class" },
      { status: 400 }
    );
  }

  const { data: attendanceRecord, error } = await authenticated.supabase
    .from("attendance_records")
    .insert({
      session_id,
      student_id,
      status,
      note: note ?? null,
    })
    .select("id, session_id, student_id, status, note, recorded_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "This student already has an attendance record for this session" },
        { status: 409 }
      );
    }

    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(
    { attendance_record: attendanceRecord },
    { status: 201 }
  );
}
