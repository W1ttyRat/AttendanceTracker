import AttendanceList from "../components/AttendanceList";
import AttendanceHistory from "../components/AttendanceHistory";
import AuthGate from "../components/AuthGate";

export default function HomePage() {
  return (
    <AuthGate>
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark">A</div><strong>Attendance</strong></div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="nav-label">MENU</p>
          <a className="nav-item active" href="#attendance">Attendance</a>
          <a className="nav-item" href="#history">History</a>
          <a className="nav-item" href="#participants">Students</a>
        </nav>
        <div className="sidebar-bottom"><div className="avatar">Teacher</div><div><strong>Teacher account</strong><small>Signed in anonymously</small></div></div>
      </aside>

      <div className="main-panel">
        <header className="app-header">
          <div className="hero-copy">
            <p className="eyebrow">THURSDAY, OCTOBER 8</p>
            <h1>Attendance</h1>
            <p className="app-subtitle">Record today&apos;s attendance and review previous sessions.</p>
          </div>
          <div className="header-actions"><div className="header-badge"><span className="status-dot" /> Synced</div><button className="profile-button" aria-label="Open profile"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20c.7-3.35 2.85-5.25 6.5-5.25s5.8 1.9 6.5 5.25" /></svg></button></div>
        </header>

        <div className="app-content">
          <div id="attendance"><AttendanceList /></div>
          <div id="history"><AttendanceHistory /></div>
        </div>

        <footer className="app-footer">ATTEND <span>•</span> KEEPING EVERYONE IN THE ROOM</footer>
      </div>
    </main>
    </AuthGate>
  );
}