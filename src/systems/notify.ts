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
 * Pushes a structured notification to the company inbox.
 * Strict Inbox Filtering: Only tracks FX & Crypto, major item purchases, truck breakdowns, asset increases, and rank promotions.
 */
export function pushNote(S: any, msg: string, options?: { title?: string, type?: NotificationType, priority?: 0 | 1 | 2, body?: string }) {
  if (!S.notes) S.notes = [];
  if (!S.logs) S.logs = [];
  
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

  // 1. Central Logs (Always recorded for history)
  S.logs.unshift(note);
  if (S.logs.length > 250) S.logs.pop();

  // 2. Strict Inbox Filtering: Only track allowed event categories
  const lowerMsg = (msg + ' ' + note.title).toLowerCase();
  
  const isFxCrypto = lowerMsg.includes('exchange') || lowerMsg.includes('fleet bond') || lowerMsg.includes('crypto') || lowerMsg.includes('bitcoin') || lowerMsg.includes('mining') || lowerMsg.includes('flb');
  const isMajorPurchase = lowerMsg.includes('purchase') || lowerMsg.includes('acquired') || lowerMsg.includes('depot') || lowerMsg.includes('leased') || lowerMsg.includes('investment');
  const isTruckBreakdown = lowerMsg.includes('breakdown') || lowerMsg.includes('failure') || lowerMsg.includes('damage') || lowerMsg.includes('citation') || lowerMsg.includes('accident');
  const isAssetIncrease = lowerMsg.includes('asset') || lowerMsg.includes('delivery complete') || lowerMsg.includes('expanded') || lowerMsg.includes('terminal');
  const isRankPromotion = lowerMsg.includes('rank') || lowerMsg.includes('vip') || lowerMsg.includes('promotion') || lowerMsg.includes('attained');

  const shouldInbox = isFxCrypto || isMajorPurchase || isTruckBreakdown || isAssetIncrease || isRankPromotion;

  if (shouldInbox) {
    S.notes.unshift(note);
    if (S.notes.length > 150) S.notes.pop();
  }
  
  return note;
}

export function markRead(S: any, id: string) {
  if (!S.notes) return;
  const note = S.notes.find((n: any) => n.id === id);
  if (note) note.read = true;
}

export function deleteNote(S: any, id: string) {
  if (!S.notes) return;
  S.notes = S.notes.filter((n: any) => n.id !== id);
}

export function markAllRead(S: any) {
  if (!S.notes) return;
  for (const n of S.notes) {
    n.read = true;
  }
}

export function deleteSelected(S: any, ids: Set<string> | string[]) {
  if (!S.notes) return;
  const idSet = ids instanceof Set ? ids : new Set(ids);
  S.notes = S.notes.filter((n: any) => !idSet.has(n.id));
}

export function markSelectedRead(S: any, ids: Set<string> | string[]) {
  if (!S.notes) return;
  const idSet = ids instanceof Set ? ids : new Set(ids);
  for (const n of S.notes) {
    if (idSet.has(n.id)) n.read = true;
  }
}
