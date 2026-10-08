"use client";

import { useState, useEffect } from "react";
import {
  STATUSES,
  getClasses,
  createClass,
  getAllStudents,
  createStudent,
  getEnrolledStudents,
  enrollStudents,
  getSession,
  createSession,
  getRecords,
  saveStatus,
} from "../lib/db";

// Käivitab tegevuse ja näitab veateate, kui see ebaõnnestub
async function run(action, setError) {
  try {
    setError("");
    await action();
  } catch (e) {
    console.log(e);
    setError(e.message);
  }
}

export default function AttendanceList() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("sv-SE"));
  const [allStudents, setAllStudents] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [newClassName, setNewClassName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [studentToEnroll, setStudentToEnroll] = useState("");
  const [error, setError] = useState("");

  // 1. Lehe avamisel: kursused ja kõik õpilased
  useEffect(() => {
    run(async () => {
      const classList = await getClasses();
      setClasses(classList);
      if (classList.length > 0) setClassId(classList[0].id);
      setAllStudents(await getAllStudents());
    }, setError);
  }, []);

  // 2. Kui kursus muutub: selle kursuse õpilased
  useEffect(() => {
    if (!classId) return;
    run(async () => {
      setEnrolled(await getEnrolledStudents(classId));
    }, setError);
  }, [classId]);

  // 3. Kui kursus või kuupäev muutub: selle tunni märked
  useEffect(() => {
    if (!classId) return;
    run(async () => {
      setSessionId(null);
      setStatuses({});
      const session = await getSession(classId, date);
      if (!session) return; // tundi pole veel, nimekiri jääb märkimata
      setSessionId(session.id);
      setStatuses(await getRecords(session.id));
    }, setError);
  }, [classId, date]);

  // Arvutused näitamiseks
  const enrolledIds = enrolled.map((s) => s.id);
  const notEnrolled = allStudents.filter((s) => !enrolledIds.includes(s.id));
  const presentCount = enrolled.filter(
    (s) => statuses[s.id] === "present"
  ).length;

  function handleAddClass() {
    if (newClassName.trim() === "") return;
    run(async () => {
      const created = await createClass(newClassName.trim());
      setClasses([...classes, created]);
      setClassId(created.id);
      setNewClassName("");
    }, setError);
  }

  function handleAddStudent() {
    if (newStudentName.trim() === "") return;
    if (!classId) {
      setError("Lisa või vali esmalt kursus.");
      return;
    }
    run(async () => {
      const student = await createStudent(newStudentName.trim());
      await enrollStudents(classId, [student.id]);
      setAllStudents([...allStudents, student]);
      setEnrolled([...enrolled, student]);
      setNewStudentName("");
    }, setError);
  }

  function handleEnrollOne() {
    if (studentToEnroll === "") return;
    run(async () => {
      await enrollStudents(classId, [studentToEnroll]);
      setEnrolled(await getEnrolledStudents(classId));
      setStudentToEnroll("");
    }, setError);
  }

  function handleEnrollAll() {
    run(async () => {
      await enrollStudents(
        classId,
        notEnrolled.map((s) => s.id)
      );
      setEnrolled(await getEnrolledStudents(classId));
    }, setError);
  }

  function handleStatusChange(studentId, status) {
    run(async () => {
      // Kui selle päeva tundi pole, loome selle nüüd
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await createSession(classId, date);
        currentSessionId = session.id;
        setSessionId(session.id);
      }
      await saveStatus(currentSessionId, studentId, status);
      setStatuses({ ...statuses, [studentId]: status });
    }, setError);
  }

  return (
    <div>
      {error !== "" && <p>Viga: {error}</p>}

      <h2>Kursus</h2>
      {classes.length > 0 && (
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <div>
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="Uue kursuse nimi"
        />
        <button onClick={handleAddClass}>Lisa kursus</button>
      </div>

      {classId !== "" && (
        <div>
          <h2>Tund</h2>
          <label>
            Kuupäev:{" "}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <h2>Osalejad</h2>
          <p>
            Kohal: {presentCount} / {enrolled.length}
          </p>

          {enrolled.length === 0 && <p>Sellel kursusel pole veel osalejaid.</p>}

          <ul>
            {enrolled.map((s) => (
              <li key={s.id}>
                {s.full_name}{" "}
                <select
                  value={statuses[s.id] || ""}
                  onChange={(e) => handleStatusChange(s.id, e.target.value)}
                >
                  <option value="" disabled>
                    märkimata
                  </option>
                  {STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <h2>Osalejate lisamine</h2>
          <div>
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Uue osaleja nimi"
            />
            <button onClick={handleAddStudent}>Lisa uus osaleja</button>
          </div>

          {notEnrolled.length > 0 && (
            <div>
              <select
                value={studentToEnroll}
                onChange={(e) => setStudentToEnroll(e.target.value)}
              >
                <option value="">vali olemasolev õpilane</option>
                {notEnrolled.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
              <button onClick={handleEnrollOne}>Lisa kursusele</button>
              <button onClick={handleEnrollAll}>
                Lisa kõik õpilased kursusele
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}