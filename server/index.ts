import express from 'express';
import { resolve } from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { openDatabase } from './db';
import { service, ValidationError } from './service';
import { seed } from './seed';
const db = openDatabase();
if (process.env.SEED_DATA === 'true') seed(db);
const s = service(db);
const app = express();
app.use(express.json({
  limit: '5mb'
}));
app.get('/api/data', (_req, res) => res.json(s.data()));
app.post('/api/jobs', (req, res) => res.status(201).json({
  id: s.createJob(req.body)
}));
app.patch('/api/jobs/:id', (req, res) => {
  s.updateJob(Number(req.params.id), req.body);
  res.json({
    ok: true
  });
});
app.post('/api/contacts', (req, res) => res.status(201).json({
  id: s.saveContact(req.body)
}));
app.patch('/api/contacts/:id', (req, res) => {
  s.saveContact(req.body, Number(req.params.id));
  res.json({
    ok: true
  });
});
app.post('/api/followups', (req, res) => res.status(201).json({
  id: s.addFollowup(req.body)
}));
app.post('/api/followups/:id/complete', (req, res) => {
  s.completeFollowup(Number(req.params.id), req.body.again === true);
  res.json({
    ok: true
  });
});
app.post('/api/interviews', (req, res) => res.status(201).json({ id: s.saveInterview(req.body) }));
app.patch('/api/interviews/:id', (req, res) => res.json({ id: s.saveInterview(req.body, Number(req.params.id)) }));
app.post('/api/activities', (req, res) => {
  s.addActivity(req.body);
  res.status(201).json({
    ok: true
  });
});
app.get('/api/export/json', (_req, res) => res.attachment('job-search-tracker.json').json(s.data()));
app.get('/api/export/csv', (_req, res) => {
  const data = s.data();
  const jobs = (data.jobs as Record<string, any>[]);
  const rows = jobs.map(j => ({
    ...j,
    interviews: JSON.stringify(data.interviews.filter(i => i.job_id === j.id)),
    contacts: JSON.stringify((data.contacts as any[]).filter(c => c.job_id === j.id)),
    followups: JSON.stringify((data.followups as any[]).filter(f => f.job_id === j.id)),
    activities: JSON.stringify((data.activities as any[]).filter(a => a.job_id === j.id))
  }));
  const keys = rows.length ? Object.keys(rows[0]) : ['id', 'company', 'title'];
  const escape = (v: any) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  res.attachment('job-search-tracker.csv').type('text/csv').send([keys.join(','), ...rows.map(r => keys.map(k => escape(r[(k as keyof typeof r)])).join(','))].join('\r\n'));
});
app.get('/api/backup', async (_req, res, next) => {
  const path = resolve(tmpdir(), `tracker-${randomUUID()}.sqlite`);
  try {
    await db.backup(path);
    res.download(path, 'job-search-tracker.sqlite', () => {
      if (existsSync(path)) unlinkSync(path);
    });
  } catch (e) {
    next(e);
  }
});
app.use('/api', (_req, res) => res.status(404).json({
  error: 'Endpoint not found.'
}));
if (existsSync('dist/index.html')) {
  app.use(express.static(resolve('dist')));
  app.get('*', (_req, res) => res.sendFile(resolve('dist/index.html')));
}
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (!(error instanceof ValidationError)) console.error(error);
  res.status(error instanceof ValidationError ? 400 : 500).json({
    error: error instanceof ValidationError ? error.message : 'Unable to save. Please try again.'
  });
});
const server = app.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => console.log('Job Search Tracker API: http://127.0.0.1:' + (process.env.PORT || 3001)));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => {
  db.close();
  process.exit(0);
}));
