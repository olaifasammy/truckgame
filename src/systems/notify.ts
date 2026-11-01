export type NotificationType = 'alert' | 'finance' | 'ops' | 'system' | 'tender' | 'compliance';

export interface Notification {
  id: string;
  title: string;
  msg: string;
  body?: string; // Long form content
  at: number;
  read: boolean;
  type: NotificationType;
  priority: 0 | 1 | 2;
}

/**
 * Pushes a structured notification to the company inbox
 */
export function pushNote(S: any, msg: string, options?: { title?: string, type?: NotificationType, priority?: 0 | 1 | 2, body?: string }) {
  if (!S.notes) S.notes = [];
  
  const id = Math.random().toString(36).substring(2, 11);
  const note: Notification = {
    id,
    title: options?.title || 'System Notification',
    msg,
    body: options?.body,
    at: Date.now(),
    read: false,
    type: options?.type || 'system',
    priority: options?.priority ?? 0
  };

  S.notes.unshift(note);
  
  // Cap at 150 historical notifications for realism/performance
  if (S.notes.length > 150) S.notes.pop();
  
  return note;
}

export function markRead(S: any, id: string) {
  const n = S.notes.find((x: any) => x.id === id);
  if (n) n.read = true;
}

export function markAllRead(S: any) {
  S.notes.forEach((n: any) => n.read = true);
}

export function deleteNote(S: any, id: string) {
  S.notes = S.notes.filter((n: any) => n.id !== id);
}

export function deleteSelected(S: any, ids: string[]) {
  S.notes = S.notes.filter((n: any) => !ids.includes(n.id));
}

export function markSelectedRead(S: any, ids: string[]) {
  S.notes.forEach((n: any) => {
    if (ids.includes(n.id)) n.read = true;
  });
}
