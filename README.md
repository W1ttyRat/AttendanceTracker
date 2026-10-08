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