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
    <section className="card shadow-sm" aria-labelledby="history-heading">
      <div className="card-header bg-transparent border-0 px-0 pt-0">
        <div>
          <h2 id="history-heading" className="h4 mb-1">
            Elimiste tundide kohalolek
          </h2>
          <p className="text-muted mb-0">Vaata osalejate staatust iga sessiooni kohta.</p>
        </div>
      </div>

      {error !== "" && <p className="alert alert-danger mb-3">Viga: {error}</p>}

      {classes.length > 0 && (
        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-md-8">
            <label htmlFor="history-class" className="form-label fw-semibold">Kursus</label>
            <select
              id="history-class"
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
          </div>
          <div className="col-12 col-md-4">
            <button
              className="btn btn-outline-primary w-100"
              onClick={() => setRefreshCount(refreshCount + 1)}
            >
              Värskenda
            </button>
          </div>
        </div>
      )}

      <div className="card-body px-0 pb-0">
        {sessions.length === 0 ? (
          <p className="empty-state">
            Selle kursuse tunde pole veel märgitud.
          </p>
        ) : (
          <div className="table-responsive rounded-3">
            <table className="table table-striped table-hover align-middle mb-0">
              <thead className="table-light">
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