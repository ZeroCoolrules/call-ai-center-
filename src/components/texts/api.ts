// Fetch helpers for the AI Text Assistant screens.
import type { TextCategory, TextDraft, TextMessage, TextSettings, TextStatus, ThreadSummary } from '../../types/texts';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/texts${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const textsApi = {
  status: () => request<TextStatus>('GET', '/status'),
  saveSettings: (s: Partial<TextSettings>) => request<TextStatus>('PUT', '/settings', s),
  setMode: (key: TextCategory, mode: 'auto' | 'review') => request<TextStatus>('PUT', `/categories/${key}`, { mode }),
  resetCategory: (key: TextCategory) => request<TextStatus>('POST', `/categories/${key}/reset`),

  drafts: (status: 'pending' | 'all' = 'pending') => request<TextDraft[]>('GET', `/drafts?status=${status}`),
  send: (id: string, text: string, book: boolean) => request<TextDraft>('POST', `/drafts/${id}/send`, { text, book }),
  dismiss: (id: string) => request<TextDraft>('POST', `/drafts/${id}/dismiss`),
  redraft: (id: string, hint: string) => request<TextDraft>('POST', `/drafts/${id}/redraft`, { hint }),
  setCategory: (id: string, category: TextCategory) => request<TextDraft>('PUT', `/drafts/${id}/category`, { category }),

  threads: () => request<ThreadSummary[]>('GET', '/threads'),
  thread: (phone: string) => request<TextMessage[]>('GET', `/threads/${encodeURIComponent(phone)}`),
  reply: (phone: string, text: string) => request('POST', `/threads/${encodeURIComponent(phone)}/send`, { text }),

  test: (text: string, phone?: string) => request<TextDraft>('POST', '/test', { text, phone }),
  connect: () => request<{ result: 'added' | 'exists'; url: string }>('POST', '/connect'),
};
