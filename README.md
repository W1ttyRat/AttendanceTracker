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

## public key
sb_publishable_Iek6yZEkn-nnr0s8nyrOPw_lkrJNoc2
- `app/page.js` - App Router home page
- `app/api/health/route.js` - Node.js-compatible App Router route handler

The `app/` directory is the primary routing system. New pages should be added
as route segments under `app/`; API endpoints should use `route.js` files in
`app/api/`.
