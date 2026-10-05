# Job Search Tracker

A local personal CRM for an engineering management job search. React, TypeScript, Vite, Tailwind CSS, Lucide, Express, and SQLite. No account required.

## Install and run

Requires Node.js 20.19+ and npm. From this directory:

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. Vite runs the UI on 5173 and proxies `/api` to the Express server on 3001. If 5173 is occupied, use the address printed by Vite. Stop both processes with Ctrl+C.

For a built version served by one process:

```bash
npm run build
npm start
```

Open **http://127.0.0.1:3001**. Restart `npm start` after rebuilding frontend changes.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Tests exercise duplicate protection, stage history, automatic follow-ups, contact ownership, validation, repeat completion, persistence after reopening SQLite, and database backups.

## Data and backups

Data lives in `data/tracker.sqlite`, created on first start. New workspaces start empty. To opt into fictional demo opportunities in a separate database, run `SEED_DATA=true DB_PATH=data/demo.sqlite npm run dev`; seeding only occurs when its jobs table is empty. All dates are interpreted as local calendar dates. Existing database records survive development restarts and builds. The database is excluded from Git.

To start an empty workspace, use a separate file with seeding disabled:

```bash
SEED_DATA=false DB_PATH=data/my-search.sqlite npm run dev
```

Use **Export → SQLite backup** to download a consistent snapshot of the complete database, including contacts, follow-ups, and history. **All data JSON** exports every table. CSV exports one row per opportunity with contacts, follow-ups, and activities in JSON columns.

To restore a SQLite backup, stop the app, retain a copy of your current database, and replace `data/tracker.sqlite` with the downloaded backup. Remove any stale `data/tracker.sqlite-wal` and `data/tracker.sqlite-shm` sidecar files before restarting. Use the same procedure with your custom `DB_PATH`. JSON/CSV import is not currently provided.

## Using the workspace

- Add or edit applications with fit and interest ratings, priority, source, compensation, preserved descriptions, and notes.
- Click pipeline stages to filter applications. Search company, role, contact names/contact notes, and application notes. Table column headers sort; Filters expands company, location, and application date range controls.
- Change a stage directly in the table; its row menu adds contacts, notes, follow-ups, or marks rejected.
- Applications with an applied date automatically receive a follow-up seven days later. Changing an undated opportunity to Applied records today and adds a follow-up. Recording a new last-contacted date creates an outreach activity and another follow-up. These are separate entries, never overwrites.
- Complete an action with one click on its check button, then optionally add another action seven days later.
- Contact records belong to opportunities. Contacts with the same email are grouped in their detail panel to show interactions across opportunities. To associate a person with another opportunity, add their contact with the same email to that opportunity.
- Notes and descriptions have explicit save buttons. The timeline records stage/contact/follow-up changes and accepts manual, optionally contact-linked entries.
- A sourced quote rotates daily among 10 different authors using your local calendar date. The author and a link to the original text appear below it; rotation requires no external service.
- The sidebar color selector switches between **Forest** (the original green palette) and **Ocean** (soft blue, the default). Your choice is stored in the browser, and both support light and dark modes.
- The sidebar theme button switches between light and dark; preference is stored in the browser.

## Analytics definitions

Active applications excludes Interested opportunities without an applied date, rejected, withdrawn, and offers. Active state includes Interested; the active application card additionally requires an applied date. This week starts Monday. Due actions include today and overdue.

Analytics denominators include jobs with an applied date. Responses count Contacted or a reached recruiter/interview/offer milestone; rejection alone does not establish a response. Later milestones imply earlier funnel stages, and stage history preserves progression even after rejection or withdrawal. Interviews start at Hiring Manager. Source rates use each source's submitted applications. Average stage times require at least two recorded chronological pairs; skipped stages without dates do not contribute. These are opportunity-level rates, not message-level metrics.

## Structure

```text
shared/models.ts       Types, stage/source choices, computed state
server/db.ts           SQLite schema and connection
server/service.ts      Validation and transactional business operations
server/seed.ts          Date-relative fictional demo data
server/index.ts         HTTP routes, exports, backup, static hosting
server/service.test.ts  Database/business behavior tests
src/components/        Reusable UI and forms
src/pages/             Separate dashboard, applications/detail, contacts, queue, analytics pages
src/utils/dates.ts      Local calendar date calculations
src/api.ts              API client
src/App.tsx             Navigation and workspace state
src/styles.css          Tailwind entrypoint and visual styles
```

The backend binds to `127.0.0.1` and is intended for a trusted local computer, without authentication. Dependencies are locked in `package-lock.json`; use `npm ci` for reproducible installs. SQLite's native dependency may require a C++ toolchain if a prebuilt binary is unavailable. The interface uses local system fonts and does not require remote assets. Integrations can be added through service functions and API routes without changing the storage/UI boundary.
