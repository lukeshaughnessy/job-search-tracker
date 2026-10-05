import type { Data } from '../shared/models';
export async function request(path: string, body?: unknown, method = 'POST') {
  const response = await fetch('/api/' + path, body === undefined ? undefined : {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Request failed');
  return value;
}
export const loadData = (): Promise<Data> => request('data');
