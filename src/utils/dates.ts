export const today = () => localDate(new Date());
export function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(date: string, n: number) {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return localDate(d);
}
export function days(date: string, end = today()) {
  return date ? Math.round((Date.parse(end + 'T12:00:00') - Date.parse(date.slice(0, 10) + 'T12:00:00')) / 86400000) : null;
}
export function formatDate(date: string) {
  return date ? new Date(date.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  }) : '—';
}
