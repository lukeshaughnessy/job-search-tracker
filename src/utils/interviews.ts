import type { Interview } from '../../shared/models';
import { localDate } from './dates';
export const localTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
export const interviewDate = (i: Interview) => localDate(new Date(i.starts_at));
export const interviewTime = (i: Interview) => new Date(i.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
export const sortedInterviews = (items: Interview[]) => [...items].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
export function localAppointmentISO(date: string, time: string) {
  const start = new Date(`${date}T${time}:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !Number.isFinite(start.getTime()) || localDate(start) !== date || `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}` !== time) throw new Error('Choose a valid date and time. This time may fall within a daylight saving clock change.');
  return start.toISOString();
}
