import AttendanceList from "../components/AttendanceList";
import AttendanceHistory from "../components/AttendanceHistory";

export default function HomePage() {
  return (
    <main>
      <h1>Attendance Tracker</h1>
      <AttendanceList />
      <AttendanceHistory />
    </main>
  );
}