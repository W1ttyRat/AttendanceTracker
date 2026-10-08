import AttendanceList from "../components/AttendanceList";
import AttendanceHistory from "../components/AttendanceHistory";
import AuthGate from "../components/AuthGate";

export default function HomePage() {
  return (
    <AuthGate>
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark">A</div><strong>attend<span>.</span></strong></div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="nav-label">WORKSPACE</p>
          <a className="nav-item active" href="#attendance"><span>▣</span> Attendance</a>
          <a className="nav-item" href="#history"><span>◷</span> History</a>
          <a className="nav-item" href="#participants"><span>♙</span> Participants</a>
          <p className="nav-label nav-label-spaced">YOUR SPACE</p>
          <div className="class-chip"><span className="class-dot" /> My classes <strong>⌄</strong></div>
        </nav>
        <div className="sidebar-bottom"><div className="avatar">T</div><div><strong>Teacher mode</strong><small>Workspace active</small></div><span>•••</span></div>
      </aside>

      <div className="main-panel">
        <header className="app-header">
          <div className="hero-copy">
            <p className="eyebrow">THURSDAY, OCTOBER 8 <span className="eyebrow-line" /></p>
            <h1>Good morning, <em>teacher.</em></h1>
            <p className="app-subtitle">A clear view of who is here and what needs your attention.</p>
          </div>
          <div className="header-actions"><div className="header-badge"><span className="status-dot" /> Synced</div><button className="profile-button" aria-label="Open profile"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20c.7-3.35 2.85-5.25 6.5-5.25s5.8 1.9 6.5 5.25" /></svg></button></div>
        </header>

        <div className="stat-strip" aria-label="Attendance overview">
          <div><span className="stat-icon blue">◉</span><div><small>Today&apos;s attendance</small><strong>Take roll call</strong></div><b>→</b></div>
          <div><span className="stat-icon green">✓</span><div><small>Classes on track</small><strong>Ready to teach</strong></div><b>→</b></div>
          <div><span className="stat-icon orange">↗</span><div><small>Weekly insight</small><strong>View history</strong></div><b>→</b></div>
        </div>

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