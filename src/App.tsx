import { useEffect, useState } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, CalendarCheck2, CalendarDays, ChartNoAxesCombined, Plus, Download, ChevronDown, Menu, Sun, Moon, Check, X, ShieldCheck } from 'lucide-react';
import type { Data, Job, Followup } from '../shared/models';
import { today, addDays } from './utils/dates';
import { loadData, request } from './api';
import { Dashboard } from './pages/Dashboard';
import { Applications } from './pages/Applications';
import { Detail } from './pages/Detail';
import { Contacts } from './pages/Contacts';
import { Followups } from './pages/Followups';
import { Calendar } from './pages/Calendar';
import { InterviewForm } from './components/InterviewForm';
import { Analytics } from './pages/Analytics';
import { Modal } from './components/UI';
import { DailyQuote } from './components/DailyQuote';
import { PalettePicker, type Palette } from './components/PalettePicker';
import { Editor, type FormKind } from './components/Forms';
const nav = [{
  name: 'Dashboard',
  icon: LayoutDashboard,
  desc: 'Applications, conversations, and upcoming actions.'
}, {
  name: 'Applications',
  icon: BriefcaseBusiness,
  desc: 'Manage and compare your opportunities.'
}, {
  name: 'Contacts',
  icon: Users,
  desc: 'People, associated opportunities, and interactions.'
}, {
  name: 'Follow-ups',
  icon: CalendarCheck2,
  desc: 'Your upcoming and completed actions.'
}, {
  name: 'Calendar',
  icon: CalendarDays,
  desc: 'Interview appointments, preparation, and your schedule.'
}, {
  name: 'Analytics',
  icon: ChartNoAxesCombined,
  desc: 'Application activity and pipeline conversion.'
}];
export default function App() {
  const [data, setData] = useState<Data | null>(null);
  const [page, setPage] = useState('Dashboard');
  const [jobId, setJobId] = useState<number | null>(null);
  const [stage, setStage] = useState('');
  const [form, setForm] = useState<FormKind | null>(null);
  const [confirm, setConfirm] = useState<Followup | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState(false);
  const [exports, setExports] = useState(false);
  const [palette, setPalette] = useState<Palette>(() => localStorage.getItem('palette') === 'forest' ? 'forest' : 'ocean');
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    loadData().then(setData).catch(e => setError(e.message));
  }, []);
  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    localStorage.setItem('palette', palette);
  }, [palette]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    const hash = () => {
      const match = window.location.hash.match(/^#application\/(\d+)$/);
      if (match) {
        setPage('Applications');
        setJobId(Number(match[1]));
      } else {
        const name = nav.find(n => n.name.toLowerCase() === window.location.hash.slice(1))?.name;
        if (name) {
          setPage(name);
          setJobId(null);
        }
      }
    };
    hash();
    window.addEventListener('hashchange', hash);
    return () => window.removeEventListener('hashchange', hash);
  }, []);
  const navigate = (name: string) => {
    setPage(name);
    setJobId(null);
    setMobile(false);
    setStage('');
    window.location.hash = name.toLowerCase();
  };
  const save = async (path: string, body: any, method = 'POST') => {
    try {
      await request(path, body, method);
      setData(await loadData());
      setMessage('Changes saved');
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  };
  const openJob = (job: Job) => {
    setPage('Applications');
    setJobId(job.id);
    window.location.hash = 'application/' + job.id;
  };
  const current = data?.jobs.find(j => j.id === jobId);
  const item = nav.find(n => n.name === page)!;
  const overdue = data?.followups.filter(f => !f.completed && f.due_date < today()).length || 0;
  const ctx = data ? {
    data,
    openJob,
    edit: setForm,
    save: async (p: string, b: any, m?: string) => {
      try {
        await save(p, b, m);
      } catch {/* visible error banner */}
    },
    complete: async (f: Followup) => {
      try {
        await save('followups/' + f.id + '/complete', {
          again: false
        });
        setConfirm(f);
      } catch {/* banner */}
    }
  } : null;
  return <div className="app-shell"><aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}><div className="workspace-label">YOUR WORKSPACE</div><nav>{nav.map(n => <button className={`nav-item ${page === n.name ? 'active' : ''}`} key={n.name} onClick={() => navigate(n.name)}><n.icon size={19} /><span>{n.name}</span>{n.name === 'Follow-ups' && overdue > 0 ? <span className="nav-count">{overdue}</span> : null}</button>)}</nav><PalettePicker palette={palette} onChange={setPalette} /><div className="sidebar-bottom"><ShieldCheck size={15} /><span>Local & private</span><span className="online-dot" /></div><div className="profile"><span className="avatar">ME</span><div><strong>My job search</strong><small>Personal workspace</small></div><button className="icon-button" aria-label="Toggle dark mode" onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button></div></aside><main className="main"><div className="topbar"><div><button className="icon-button mobile-toggle" aria-label="Toggle navigation" onClick={() => setMobile(!mobile)}><Menu size={21} /></button><span className="topbar-label">Personal workspace</span><span className="topbar-divider">/</span><span>{page}</span></div><span className="today-label">{new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}</span></div><div className="content"><header className="page-heading"><div><h1>{current ? 'Opportunity workspace' : item.name}</h1><p>{current ? 'Everything you need to move this opportunity forward.' : item.desc}</p></div><div className="header-actions"><div className="export-control"><button className="button secondary" onClick={() => setExports(!exports)}><Download size={16} /><span>Export</span><ChevronDown size={13} /></button>{exports && <div className="dropdown export-menu">{[['csv', 'Applications CSV'], ['json', 'All data JSON'], ['backup', 'SQLite backup']].map(([type, label]) => <a key={type} href={type === 'backup' ? '/api/backup' : '/api/export/' + type} onClick={() => setExports(false)} download>{label}</a>)}</div>}</div><button className="button primary" onClick={() => setForm({
              type: 'job'
            })}><Plus size={17} />Add Application</button></div></header><DailyQuote />{error && <div className="error-banner" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={17} /></button></div>}{!data ? <div className="empty-state">{error ? <button className="button secondary" onClick={() => {
            setError('');
            loadData().then(setData).catch(e => setError(e.message));
          }}>Retry loading</button> : 'Loading your workspace…'}</div> : ctx && <>{current ? <Detail key={current.id} job={current} ctx={ctx} back={() => navigate('Applications')} /> : jobId ? <div className="empty-state">This application could not be found.<button className="text-button" onClick={() => navigate('Applications')}>Back to applications</button></div> : page === 'Dashboard' ? <Dashboard ctx={ctx} calendar={() => navigate('Calendar')} filter={s => {
            navigate('Applications');
            setStage(s);
          }} /> : page === 'Applications' ? <Applications key={stage} ctx={ctx} initialStage={stage} /> : page === 'Contacts' ? <Contacts ctx={ctx} /> : page === 'Follow-ups' ? <Followups ctx={ctx} /> : page === 'Calendar' ? <Calendar ctx={ctx} /> : <Analytics ctx={ctx} />}</>}</div></main>{form && data && <Modal title={form.type === 'job' ? form.job ? 'Edit application' : 'Add application' : form.type === 'contact' ? form.contact ? 'Edit contact' : 'Add contact' : form.type === 'followup' ? 'Add follow-up' : form.type === 'interview' ? form.interview ? 'Edit appointment' : form.job ? 'Schedule interview' : 'Add appointment' : form.type === 'note' ? 'Add a note' : 'Add activity'} close={() => setForm(null)}>{form.type === 'interview' ? <InterviewForm kind={form} data={data} save={save} close={() => setForm(null)} /> : <Editor kind={form} data={data} save={save} close={() => setForm(null)} />}</Modal>}{confirm && <Modal title="Follow-up completed" close={() => setConfirm(null)}><div className="completion-content"><div className="completion-icon"><Check size={26} /></div><h3>{confirm.next_action}</h3><p>Keep the momentum going with another follow-up 7 days from today.</p></div><div className="form-footer"><button disabled={busy} className="button secondary" onClick={() => setConfirm(null)}>Done</button><button disabled={busy} className="button primary" onClick={async () => {
          setBusy(true);
          try {
            await save('followups', {
              job_id: confirm.job_id,
              contact_id: confirm.contact_id,
              due_date: addDays(today(), 7),
              type: confirm.type,
              notes: confirm.notes,
              next_action: confirm.next_action
            });
            setConfirm(null);
          } catch {/* banner */} finally {
            setBusy(false);
          }
        }}>Add follow-up in 7 days</button></div></Modal>}{message && <div className="toast" role="status"><Check size={17} />{message}</div>}</div>;
}
