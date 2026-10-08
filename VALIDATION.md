# Verification status

## Latest checks

Dependencies are now installed and `package-lock.json` exists.

- `npm run build` passes, including TypeScript checking and the Vite production build.
- `npm run lint` passes.
- `npm test` exits successfully using `node --import tsx --test`, avoiding the tsx CLI IPC socket restriction.
- The production HTML includes a stylesheet link, and the emitted CSS contains the dashboard and workspace styles.
- The dashboard components can render against real seeded SQLite data with React's server renderer.

The missing `src/styles.css` import in `src/main.tsx` was restored. This was the cause of the unstyled interface. Typography, card spacing, summary layout, and status contrast were also improved.

Chrome visual inspection could not run: the sandbox blocks Chrome's crash handler socket operation. Live browser interaction and restarting the full HTTP application still require checking in the user's normal local terminal. Earlier SQLite schema, backup, reopen-persistence, and calendar utility checks passed.

## Local verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

Open http://127.0.0.1:5173 and refresh the page. If running the production server instead, restart `npm start` after rebuilding. Create an application, add outreach, change stages, complete a follow-up, save notes, and export data; restart the server and confirm the changes remain. Check mobile layout and dark mode.


## Interview scheduling update

- Lint and production build passed, including TypeScript checking.
- All three test files passed. Direct execution confirmed four interview service/date tests and one UI rendering test.
- Temporary SQLite tests verified migration without losing existing jobs, scheduling, rescheduling, completion, cancellation, validation, persistence after reopening, and appointments in a restored backup.
- React server rendering verified dashboard today/upcoming sections, exclusion of cancelled appointments, calendar events and agenda, application detail, and the populated scheduling form.
- Live startup with a temporary database was denied by the execution environment: listen EPERM on 127.0.0.1:3001. Browser layout and HTTP interactions remain unverified here. Restart locally using the README commands to load backend routes and add interview storage automatically.


## Standalone appointments and Sunday-first calendar

Service and rendering tests passed for standalone appointment creation with no applications, required title validation, editing/completion, dashboard/calendar display, Sunday-first headings and date alignment, persistence and backups, and migration preserving older interview IDs and contact relationships. Full test suite, lint, and production build passed. Browser interactions remain unverified in the socket-restricted execution environment.


## Linux boot startup installer

Added scripts/install-autostart.sh with a single production user service, optional custom database, user lingering, crash restarts, and enabled/active/HTTP health checks. Shell syntax validation passed and generated unit contents were inspected. systemd-analyze verification and systemd service activation could not run because this environment denies operating-system socket access (SO_PASSCRED / operation not permitted). Startup settings outside the workspace cannot be written here. The installer must be run locally before boot startup can be claimed enabled.
