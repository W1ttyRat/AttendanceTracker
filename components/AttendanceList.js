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

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureDate(value) {
  return value > getTodayInputValue();
}

// Käivitab tegevuse ja näitab veateate, kui see ebaõnnestub
async function run(action, setError) {
  try {
    setError("");
    await action();
  } catch (e) {
    console.log(e);
    setError(e.message || "Tegevus ebaõnnestus.");
  }
}

export default function AttendanceList() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [newClassName, setNewClassName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [studentToEnroll, setStudentToEnroll] = useState("");
  const [error, setError] = useState("");
  const [date, setDate] = useState(getTodayInputValue());

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
    if (isFutureDate(date)) {
      setError("Kuupäev ei saa olla tulevikku.");
      return;
    }

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
    <section className="card shadow-sm" aria-labelledby="attendance-heading">
      <div className="card-header bg-transparent border-0 px-0 pt-0">
        <div>
          <h2 id="attendance-heading" className="h4 mb-1">
            Tunde tähistamine
          </h2>
          <p className="text-muted mb-0">Vali kursus ja kuupäev, siis märkige osalejate kohalolek.</p>
        </div>
        <span className="badge rounded-pill fs-6">
          {presentCount} / {enrolled.length} kohal
        </span>
      </div>

      {error !== "" && (
        <p className="alert alert-danger mb-3" role="alert">
          Viga: {error}
        </p>
      )}

      <div className="card-body px-0 pt-0">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6">
            <label htmlFor="class-select" className="form-label fw-semibold">Kursus</label>
            {classes.length > 0 && (
              <select
                id="class-select"
                className="form-select"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="session-date" className="form-label fw-semibold">Kuupäev</label>
            <input
              id="session-date"
              className="form-control"
              type="date"
              value={date}
              onChange={(e) => {
                const nextDate = e.target.value;

                if (isFutureDate(nextDate)) {
                  setError("Kuupäev ei saa olla tulevikku.");
                  return;
                }

                setError("");
                setDate(nextDate);
              }}
            />
          </div>
        </div>

        <div className="row g-3 align-items-end mt-3">
          <div className="col-12 col-md-8">
            <label htmlFor="new-class" className="form-label fw-semibold">Uue kursuse nimi</label>
            <input
              id="new-class"
              className="form-control"
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Näiteks 7. klass"
            />
          </div>
          <div className="col-12 col-md-4">
            <button className="btn btn-primary w-100" onClick={handleAddClass}>Lisa kursus</button>
          </div>
        </div>
      </div>

      {classId !== "" && (
        <div className="card-body px-0">
          <div className="card-header bg-transparent border-0 px-0 pt-0 mb-3">
            <div>
              <h2 className="h5 mb-1">Osalejad</h2>
              <p className="text-muted mb-0">Valige iga osaleja kohalolek.</p>
            </div>
          </div>

          {enrolled.length === 0 ? (
            <p className="empty-state">Sellel kursusel pole veel osalejaid.</p>
          ) : (
            <ul className="list-unstyled d-grid gap-2 mb-3">
              {enrolled.map((s) => (
                <li className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 rounded-3 border p-3 bg-white" key={s.id}>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <input
                      id={`attendee-${s.id}`}
                      className="form-check-input"
                      type="checkbox"
                      checked={statuses[s.id] === "present"}
                      onChange={(e) => handleStatusChange(s.id, e.target.checked ? "present" : "absent")}
                    />
                    <label htmlFor={`attendee-${s.id}`} className="form-check-label mb-0 fw-semibold">{s.full_name}</label>
                  </div>
                  <select
                    className="form-select"
                    style={{ minWidth: 190, width: "auto" }}
                    value={statuses[s.id] || ""}
                    onChange={(e) => handleStatusChange(s.id, e.target.value)}
                    aria-label={`${s.full_name} kohalolek`}
                  >
                    <option value="" disabled> Märkimata</option>
                    {STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}

          <div className="border-top pt-3 mb-3">
            <h2 className="h6 mb-2">Lisa uus osaleja</h2>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-8">
                <label htmlFor="new-student" className="form-label fw-semibold">Osaleja nimi</label>
                <input
                  id="new-student"
                  className="form-control"
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Tähe osaleja nimi"
                />
              </div>
              <div className="col-12 col-md-4">
                <button className="btn btn-primary w-100" onClick={handleAddStudent}>Lisa uus osaleja</button>
              </div>
            </div>
          </div>

          {notEnrolled.length > 0 && (
            <div className="border-top pt-3">
              <h2 className="h6 mb-2">Lisa kursusele</h2>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-8">
                  <label htmlFor="student-enrollment" className="form-label fw-semibold">Õpilane</label>
                  <select
                    id="student-enrollment"
                    className="form-select"
                    value={studentToEnroll}
                    onChange={(e) => setStudentToEnroll(e.target.value)}
                  >
                    <option value="">Vali olemasolev õpilane</option>
                    {notEnrolled.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4 d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" onClick={handleEnrollOne}>Lisa kursusele</button>
                  <button className="btn btn-outline-primary flex-grow-1" onClick={handleEnrollAll}>
                    Lisa kõik õpilased kursusele
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}