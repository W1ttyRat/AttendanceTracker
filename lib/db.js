import { supabase, getCurrentUserId } from "./supabase";

export const STATUSES = [
  { value: "present", label: "Kohal" },
  { value: "absent", label: "Puudub" },
  { value: "late", label: "Hilines" },
  { value: "excused", label: "Vabastatud" },
];

// ---------- Kursused ----------

export async function getClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createClass(name) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("classes")
    .insert({ name: name, teacher_id: userId })
    .select("id, name")
    .single();
  if (error) throw error;
  return data;
}

// ---------- Õpilased ----------

export async function getAllStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name")
    .order("full_name");
  if (error) throw error;
  return data;
}

export async function createStudent(fullName) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("students")
    .insert({ full_name: fullName, created_by: userId })
    .select("id, full_name")
    .single();
  if (error) throw error;
  return data;
}

// ---------- Kursusele kuuluvad õpilased ----------

export async function getEnrolledStudents(classId) {
  const { data, error } = await supabase
    .from("class_enrollments")
    .select("students(id, full_name)")
    .eq("class_id", classId);
  if (error) throw error;
  return data
    .map((row) => row.students)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function enrollStudents(classId, studentIds) {
  const rows = studentIds.map((id) => ({ class_id: classId, student_id: id }));
  const { error } = await supabase.from("class_enrollments").insert(rows);
  if (error) throw error;
}

// ---------- Tunnid ----------

export async function getSession(classId, date) {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("id")
    .eq("class_id", classId)
    .eq("session_date", date)
    .maybeSingle();
  if (error) throw error;
  return data; // null, kui tundi veel pole
}

export async function createSession(classId, date) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("attendance_sessions")
    .insert({
      class_id: classId,
      session_date: date,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

// ---------- Kohalolek ----------

// Tagastab kujul { õpilaseId: "present", ... }
export async function getRecords(sessionId) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("student_id, status")
    .eq("session_id", sessionId);
  if (error) throw error;

  const result = {};
  data.forEach((r) => {
    result[r.student_id] = r.status;
  });
  return result;
}

export async function saveStatus(sessionId, studentId, status) {
  const { error } = await supabase
    .from("attendance_records")
    .upsert(
      { session_id: sessionId, student_id: studentId, status: status },
      { onConflict: "session_id,student_id" }
    );
  if (error) throw error;
}

// ---------- Ajalugu ----------

// Kõik kursuse tunnid, uusim ees
export async function getSessions(classId) {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("id, session_date")
    .eq("class_id", classId)
    .order("session_date", { ascending: false });
  if (error) throw error;
  return data;
}

// Tagastab kujul { "tunniId_õpilaseId": "present", ... }
export async function getRecordsForSessions(sessionIds) {
  if (sessionIds.length === 0) return {};
  const { data, error } = await supabase
    .from("attendance_records")
    .select("session_id, student_id, status")
    .in("session_id", sessionIds);
  if (error) throw error;

  const result = {};
  data.forEach((r) => {
    result[r.session_id + "_" + r.student_id] = r.status;
  });
  return result;
}