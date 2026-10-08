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
    <section className="card attendance-card" aria-labelledby="attendance-heading">
      <div className="card-header">
        <div>
          <p className="section-kicker">TODAY&apos;S SESSION</p>
          <h2 id="attendance-heading">
            Tundide tähistamine
          </h2>
          <p>Vali kursus ja kuupäev, siis märkige osalejate kohalolek.</p>
        </div>
        <span className="summary-badge">
          <strong>{presentCount}</strong> / {enrolled.length} kohal
        </span>
      </div>

      {error !== "" && (
        <p className="message message-error" role="alert">
          Viga: {error}
        </p>
      )}

      <div className="card-section">
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="class-select">Kursus</label>
            {classes.length > 0 && (
              <select
                id="class-select"
                className="select-control"
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
          <div className="form-field">
            <label htmlFor="session-date">Kuupäev</label>
            <input
              id="session-date"
              className="input-control"
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

        <div className="form-row add-row">
          <div className="form-field">
            <label htmlFor="new-class">Uue kursuse nimi</label>
            <input
              id="new-class"
              className="input-control"
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Näiteks 7. klass"
            />
          </div>
          <div className="form-action">
            <button onClick={handleAddClass}>Lisa kursus</button>
          </div>
        </div>
      </div>

      {classId !== "" && (
        <div id="participants" className="card-section participant-section">
          <div className="card-header compact-header">
            <div>
              <h2>Osalejad</h2>
              <p>Valige iga osaleja kohalolek.</p>
            </div>
          </div>

          {enrolled.length === 0 ? (
            <p className="empty-state">Sellel kursusel pole veel osalejaid.</p>
          ) : (
            <ul className="attendee-list">
              {enrolled.map((s) => (
                <li className="attendee-item" key={s.id}>
                  <div className="attendee-name">
                    <input
                      id={`attendee-${s.id}`}
                      className="attendance-check"
                      type="checkbox"
                      checked={statuses[s.id] === "present"}
                      onChange={(e) => handleStatusChange(s.id, e.target.checked ? "present" : "absent")}
                    />
                    <label htmlFor={`attendee-${s.id}`}>{s.full_name}</label>
                  </div>
                  <select
                    className="attendee-select"
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

          <div className="subsection">
            <h2 className="subsection-title">Lisa uus osaleja</h2>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="new-student">Osaleja nimi</label>
                <input
                  id="new-student"
                  className="input-control"
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Tähe osaleja nimi"
                />
              </div>
              <div className="form-action">
                <button onClick={handleAddStudent}>Lisa uus osaleja</button>
              </div>
            </div>
          </div>

          {notEnrolled.length > 0 && (
            <div className="subsection">
              <h2 className="subsection-title">Lisa kursusele</h2>
              <div className="form-row">
                  <div className="form-field">
                  <label htmlFor="student-enrollment">Õpilane</label>
                  <select
                    id="student-enrollment"
                    className="select-control"
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
                <div className="form-action button-pair">
                  <button onClick={handleEnrollOne}>Lisa kursusele</button>
                  <button className="secondary" onClick={handleEnrollAll}>
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