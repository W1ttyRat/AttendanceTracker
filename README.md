# AttendanceTracker

Next.js application using React, the App Router, and Node.js-compatible route
handlers.

## Requirements

- Node.js 18.18 or newer
- npm

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Project structure

- `app/layout.js` - root layout and application metadata

- `app/page.js` - App Router home page
- `app/api/health/route.js` - Node.js-compatible App Router route handler

The `app/` directory is the primary routing system. New pages should be added
as route segments under `app/`; API endpoints should use `route.js` files in
`app/api/`.

## Database

The project uses PostgreSQL. Run [db/schema.sql](./db/schema.sql) against a
PostgreSQL 14+ database to create the attendance tables:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

The schema includes classes, students, class enrollments, attendance sessions,
and attendance records. Authentication and user profiles are intentionally
outside this database schema. Students do not need login accounts.

### Tables

#### `classes`

Stores the classes managed by teachers.

- `id` - UUID primary key
- `name` - class name
- `description` - optional class description
- `teacher_id` - UUID from the teacher's JWT `sub`
- `starts_on`, `ends_on` - optional class date range
- `created_at`, `updated_at` - timestamps

#### `students`

Stores student names entered by teachers. Students do not need login accounts.

- `id` - UUID primary key
- `full_name` - student's name
- `created_by` - UUID from the creating teacher's JWT `sub`
- `created_at`, `updated_at` - timestamps

#### `class_enrollments`

Connects students to classes. The combined `class_id` and `student_id` pair
must be unique, so a student cannot be enrolled in the same class twice.

- `class_id` - references `classes.id`
- `student_id` - references `students.id`
- `enrolled_at` - enrollment timestamp

#### `attendance_sessions`

Represents one attendance-taking session for a class on a specific date. A
class can have only one session per date.

- `id` - UUID primary key
- `class_id` - references `classes.id`
- `session_date` - date attendance was taken
- `title`, `notes` - optional session details
- `created_by` - UUID from the teacher's JWT `sub`
- `created_at` - creation timestamp

#### `attendance_records`

Stores one student's attendance result for one attendance session. The
combined `session_id` and `student_id` pair must be unique.

- `id` - UUID primary key
- `session_id` - references `attendance_sessions.id`
- `student_id` - UUID referencing the student
- `status` - `present`, `absent`, `late`, or `excused`
- `note` - optional explanation
- `recorded_at` - timestamp when the record was saved

### Relationships

```text
classes 1 ──── many attendance_sessions
classes many ──── many students through class_enrollments
attendance_sessions 1 ──── many attendance_records
students 1 ──── many attendance_records
```

### Seed data

Sample data for all tables is available in [db/seed.sql](./db/seed.sql). It
creates two classes, 20 students, class enrollments, attendance sessions, and
attendance records. Replace the placeholder `teacher_id`/`created_by` UUID
with the teacher's verified JWT `sub` before running it:

```bash
psql "$DATABASE_URL" -f db/seed.sql
```

## JWT user IDs

The `teacher_id`, `student_id`, and `created_by` columns store UUIDs from the
authenticated user's JWT subject (`sub`). The database does not create or
validate users. Your Node.js backend should verify the JWT before using these
values and should take the user ID from the verified token rather than trusting
an ID sent by the browser.

Teachers can type student names into the `students.full_name` field. For
example, after verifying the teacher's JWT on the backend:

```sql
INSERT INTO students (full_name, created_by)
VALUES ($1, $2)
RETURNING id, full_name;
```

Then enroll the student in a class:

```sql
INSERT INTO class_enrollments (class_id, student_id)
VALUES ($1, $2);
```

### Attendance reports

Count absences and other attendance statuses for each student:

```sql
SELECT
    s.id,
    s.full_name,
    COUNT(*) FILTER (WHERE ar.status = 'absent') AS absence_count,
    COUNT(*) FILTER (WHERE ar.status = 'late') AS late_count,
    COUNT(*) FILTER (WHERE ar.status = 'present') AS present_count,
    COUNT(*) FILTER (WHERE ar.status = 'excused') AS excused_count
FROM students s
LEFT JOIN attendance_records ar ON ar.student_id = s.id
GROUP BY s.id, s.full_name
ORDER BY absence_count DESC, s.full_name;
```

View the individual absence history:

```sql
SELECT
    s.full_name,
    c.name AS class_name,
    ats.session_date,
    ats.title,
    ar.note,
    ar.recorded_at
FROM attendance_records ar
JOIN students s ON s.id = ar.student_id
JOIN attendance_sessions ats ON ats.id = ar.session_id
JOIN classes c ON c.id = ats.class_id
WHERE ar.status = 'absent'
ORDER BY ats.session_date DESC, s.full_name;
```

## public key
NEXT_PUBLIC_SUPABASE_URL=https://wzfsgsfhlchyxtiubxhj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Iek6yZEkn-nnr0s8nyrOPw_lkrJNoc2
