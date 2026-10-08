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

## Start automatically at machine boot (Linux/systemd)

Stop any running `npm run dev` or `npm start` session first, then run this once from a terminal on your computer as your normal user:

```bash
bash scripts/install-autostart.sh
```

The installer builds the app, creates and enables a systemd user service, enables user lingering so it starts before login, and checks the app and API are running. Your system may request administrator permission to enable lingering. The service uses your existing database, disables demo seeding, and restarts after a crash. Open **http://127.0.0.1:3001**; no terminal needs to remain open. It does not automatically open a browser.

To use a custom existing database, set `DB_PATH` when running the installer. Run the installer from the directory where the app will remain; moving it requires rerunning the installer. The installer is idempotent and can also rebuild/restart the app after updates.

```bash
systemctl --user status job-search-tracker.service
journalctl --user -u job-search-tracker.service -n 50
```

After making changes:

```bash
npm run build
systemctl --user restart job-search-tracker.service
```

To stop the app and disable automatic startup:

```bash
systemctl --user disable --now job-search-tracker.service
```

User lingering is left enabled because other user services may rely on it. The installer supports Linux computers with systemd; macOS and Windows need their own startup mechanism.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Tests exercise duplicate protection, stage history, automatic follow-ups, contact ownership, validation, repeat completion, persistence after reopening SQLite, interview scheduling/rescheduling and validation, calendar/dashboard rendering, and database backups.

## Data and backups

Data lives in `data/tracker.sqlite`, created on first start. New workspaces start empty. To opt into fictional demo opportunities in a separate database, run `SEED_DATA=true DB_PATH=data/demo.sqlite npm run dev`; seeding only occurs when its jobs table is empty. Application and follow-up dates are interpreted as local calendar dates. Interview timestamps retain their exact instant and display in your computer’s current time zone. Existing database records survive development restarts and builds. On startup, legacy Fit, Interest, and priority columns are removed while applications and related records are retained. The database is excluded from Git.

To start an empty workspace, use a separate file with seeding disabled:

```bash
SEED_DATA=false DB_PATH=data/my-search.sqlite npm run dev
```

Use **Export → SQLite backup** to download a consistent snapshot of the complete database, including contacts, follow-ups, interviews, and history. **All data JSON** exports every table. CSV exports one row per opportunity with contacts, follow-ups, interviews, and activities in JSON columns.

To restore a SQLite backup, stop the app, retain a copy of your current database, and replace `data/tracker.sqlite` with the downloaded backup. Remove any stale `data/tracker.sqlite-wal` and `data/tracker.sqlite-shm` sidecar files before restarting. Use the same procedure with your custom `DB_PATH`. JSON/CSV import is not currently provided.

## Using the workspace

- Add or edit applications with source, compensation, preserved descriptions, and notes.
- Click pipeline stages to filter applications. Search company, role, contact names/contact notes, and application notes. Table column headers sort; Filters expands company, location, and application date range controls.
- Open an application and choose **Schedule interview**, or use its table row menu. Record the interview stage, date and start time, duration, phone/video/in-person format, contact information, meeting link or address, preparation, and notes. Edit to reschedule or cancel; mark appointments complete directly in the list. Scheduling does not change the application pipeline stage.
- **Calendar → Add appointment** defaults to a standalone appointment: enter a title, date/time, and any contact, location, meeting, or note details without selecting a company. You can optionally select an application to schedule an interview instead. Standalone appointments appear on the dashboard and are included in JSON exports and SQLite backups; the application CSV contains only application-associated records.
- **Calendar** shows a Sunday-first monthly schedule with a selected-day agenda. Click anywhere in a calendar day square to open a new appointment form with that date filled in. Click an existing appointment to edit it. The dashboard lists today’s scheduled appointments and the next four upcoming interviews, with a link to the complete calendar. Completed and cancelled appointments remain saved; cancelled appointments are hidden from the calendar unless enabled.
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
src/pages/             Separate dashboard, applications/detail, contacts, queue, calendar, analytics pages
src/utils/dates.ts      Local calendar date calculations
src/api.ts              API client
src/App.tsx             Navigation and workspace state
src/styles.css          Tailwind entrypoint and visual styles
```

The backend binds to `127.0.0.1` and is intended for a trusted local computer, without authentication. Dependencies are locked in `package-lock.json`; use `npm ci` for reproducible installs. SQLite's native dependency may require a C++ toolchain if a prebuilt binary is unavailable. The interface uses local system fonts and does not require remote assets. Integrations can be added through service functions and API routes without changing the storage/UI boundary.
