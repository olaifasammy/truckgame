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
  if (!S) return;
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

  // 2. Strict Inbox Filtering: Only track allowed event categories per Engineering Constitution v2.0
  const lowerMsg = (msg + ' ' + note.title).toLowerCase();
  
  // New truck payment & Arrival
  const isTruckArrival = lowerMsg.includes('purchase') || lowerMsg.includes('delivery complete') || lowerMsg.includes('equipment in transit') || lowerMsg.includes('acquired');
  
  // Vehicle transfer
  const isTransfer = lowerMsg.includes('movement complete') || lowerMsg.includes('repositioning') || lowerMsg.includes('transferred to');
  
  // Crypto & Bonds activities
  const isCryptoBonds = lowerMsg.includes('crypto') || lowerMsg.includes('bitcoin') || lowerMsg.includes('mining') || lowerMsg.includes('fleet bond') || lowerMsg.includes('flb') || lowerMsg.includes('collateral') || lowerMsg.includes('liquidat') || lowerMsg.includes('margin');
  
  // Bid winnings & Sales leads
  const isSalesTender = lowerMsg.includes('tender won') || lowerMsg.includes('secured') || lowerMsg.includes('bid won') || lowerMsg.includes('sales opportunity') || lowerMsg.includes('prospective client');
  
  // New accounts creations
  const isAccountCreation = lowerMsg.includes('registration') || lowerMsg.includes('officially registered') || lowerMsg.includes('empire established');
  
  // Serious Road Accidents
  const isSeriousAccident = lowerMsg.includes('serious road accident') || lowerMsg.includes('major collision');
  
  // Receipt of large fuel quantities bought
  const isLargeFuel = lowerMsg.includes('wholesale fuel') || (lowerMsg.includes('refilled') && lowerMsg.includes('bunker'));
  
  // Daily, weekly & monthly accounts
  const isFinancialSummary = lowerMsg.includes('daily account') || lowerMsg.includes('weekly account') || lowerMsg.includes('monthly account') || lowerMsg.includes('financial summary') || lowerMsg.includes('financial statement') || lowerMsg.includes('performance audit') || lowerMsg.includes('enterprise report');

  const shouldInbox = isTruckArrival || isTransfer || isCryptoBonds || isSalesTender || isAccountCreation || isSeriousAccident || isLargeFuel || isFinancialSummary;

  if (shouldInbox) {
    S.notes.unshift(note);
    if (S.notes.length > 150) S.notes.pop();
  }
  
  return note;
}

export function markRead(S: any, id: string) {
  if (!S || !S.notes) return;
  const note = S.notes.find((n: any) => n.id === id);
  if (note) note.read = true;
}

export function deleteNote(S: any, id: string) {
  if (!S || !S.notes) return;
  S.notes = S.notes.filter((n: any) => n.id !== id);
}

export function markAllRead(S: any) {
  if (!S || !S.notes) return;
  for (const n of S.notes) {
    n.read = true;
  }
}

export function deleteSelected(S: any, ids: Set<string> | string[]) {
  if (!S || !S.notes) return;
  const idSet = ids instanceof Set ? ids : new Set(ids);
  S.notes = S.notes.filter((n: any) => !idSet.has(n.id));
}

export function markSelectedRead(S: any, ids: Set<string> | string[]) {
  if (!S || !S.notes) return;
  const idSet = ids instanceof Set ? ids : new Set(ids);
  for (const n of S.notes) {
    if (idSet.has(n.id)) n.read = true;
  }
}
