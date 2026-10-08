"use client";

import { useState, useEffect } from "react";
import {
  STATUSES,
  getClasses,
  getEnrolledStudents,
  getSessions,
  getRecordsForSessions,
} from "../lib/db";

// Muudab "present" tekstiks "Kohal"
function statusLabel(value) {
  const found = STATUSES.find((s) => s.value === value);
  return found ? found.label : "-";
}

export default function AttendanceHistory() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const [error, setError] = useState("");

  // Lehe avamisel: kursused
  useEffect(() => {
    async function loadClasses() {
      try {
        const list = await getClasses();
        setClasses(list);
        if (list.length > 0) setClassId(list[0].id);
      } catch (e) {
        console.log(e);
        setError(e.message);
      }
    }
    loadClasses();
  }, []);

  // Kui kursus muutub (või vajutatakse "Värskenda"): laeb ajaloo
  useEffect(() => {
    if (!classId) return;

    async function loadHistory() {
      try {
        setError("");
        setStudents(await getEnrolledStudents(classId));
        const sessionList = await getSessions(classId);
        setSessions(sessionList);
        setRecords(await getRecordsForSessions(sessionList.map((s) => s.id)));
      } catch (e) {
        console.log(e);
        setError(e.message);
      }
    }
    loadHistory();
  }, [classId, refreshCount]);

  return (
    <section className="card" aria-labelledby="history-heading">
      <div className="card-header">
        <div>
          <p className="section-kicker">OVERVIEW</p>
          <h2 id="history-heading">
            Eelmiste tundide kohalolek
          </h2>
          <p>Vaata osalejate staatust iga sessiooni kohta.</p>
        </div>
      </div>

      {error !== "" && <p className="message message-error">Viga: {error}</p>}

      {classes.length > 0 && (
        <div className="form-row history-controls">
          <div className="form-field">
            <label htmlFor="history-class">Kursus</label>
            <select
              id="history-class"
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
          </div>
          <div className="form-action">
            <button
              className="secondary"
              onClick={() => setRefreshCount(refreshCount + 1)}
            >
              Värskenda
            </button>
          </div>
        </div>
      )}

      <div>
        {sessions.length === 0 ? (
          <p className="empty-state">
            Selle kursuse tunde pole veel märgitud.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Osaleja</th>
                  {sessions.map((se) => (
                    <th key={se.id}>{se.session_date}</th>
                  ))}
                  <th>Kohal kokku</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id}>
                    <td>{st.full_name}</td>
                    {sessions.map((se) => {
                      const status = records[se.id + "_" + st.id];
                      return (
                        <td key={se.id}>
                          <span className={`status-badge status-${status || "not-set"}`}>
                            {statusLabel(status)}
                          </span>
                        </td>
                      );
                    })}
                    <td>
                      {sessions.filter(
                        (se) => records[se.id + "_" + st.id] === "present"
                      ).length} / {sessions.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}