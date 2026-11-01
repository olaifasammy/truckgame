import { set, refresh } from '../core/store';
import { action, fmt } from '../core/ui';
import { ic } from '../core/icons';
import { markRead, deleteNote, markAllRead, deleteSelected, markSelectedRead, Notification } from '../systems/notify';

let selectedIds = new Set<string>();
let expandedId: string | null = null;

action('note-read', d => {
  set(S => markRead(S, (d as any).id));
  refresh();
});

action('note-delete', d => {
  set(S => deleteNote(S, (d as any).id));
  selectedIds.delete((d as any).id);
  refresh();
});

action('note-expand', d => {
  const id = (d as any).id;
  expandedId = expandedId === id ? null : id;
  if (expandedId) {
    set(S => markRead(S, id));
  }
  refresh();
});

action('note-sel-toggle', d => {
  const id = (d as any).id;
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  refresh();
});

action('note-sel-all', () => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const allIds = S.notes.map((n: any) => n.id);
  if (selectedIds.size === allIds.length) selectedIds.clear();
  else selectedIds = new Set(allIds);
  refresh();
});

action('note-delete-selected', () => {
  if (selectedIds.size === 0) return;
  if (confirm(`Delete ${selectedIds.size} selected messages?`)) {
    set(S => deleteSelected(S, Array.from(selectedIds)));
    selectedIds.clear();
    refresh();
  }
});

action('note-read-selected', () => {
  if (selectedIds.size === 0) return;
  set(S => markSelectedRead(S, Array.from(selectedIds)));
  selectedIds.clear();
  refresh();
});

function renderItem(n: Notification) {
  const typeColors: Record<string, string> = {
    alert: '#ef4444',
    finance: '#10b981',
    ops: '#3b82f6',
    system: '#6366f1',
    tender: '#f59e0b',
    compliance: '#ec4899'
  };

  const color = typeColors[n.type] || '#ccc';
  const isExpanded = expandedId === n.id;
  const isSelected = selectedIds.has(n.id);

  return `
    <div class="note-row ${n.read ? 'read' : 'unread'} ${isExpanded ? 'expanded' : ''}" 
         style="background: ${n.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)'}; 
                border: 1px solid ${isSelected ? 'var(--gold)' : (n.read ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)')}; 
                border-radius: 8px; margin-bottom: 8px; transition: all 0.2s; position: relative; overflow: hidden;">
      
      <div style="display: flex; align-items: center; padding: 12px 16px; gap: 12px; cursor: pointer;" data-act="note-expand" data-id="${n.id}">
        <!-- Checkbox (stager for selection) -->
        <div data-act="note-sel-toggle" data-id="${n.id}" style="width: 18px; height: 18px; border: 2px solid ${isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.3)'}; border-radius: 4px; display: grid; place-items: center; flex-shrink: 0; background: ${isSelected ? 'var(--gold)' : 'transparent'};">
          ${isSelected ? `<span style="color: black; font-size: 12px; font-weight: 900;">✓</span>` : ''}
        </div>

        <div style="width: 3px; height: 24px; background: ${color}; border-radius: 2px; flex-shrink: 0;"></div>
        
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div style="font-weight: 700; color: ${n.read ? 'var(--mu)' : 'var(--tx)'}; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${n.priority > 0 ? (n.priority === 2 ? '🚨 ' : '⚠️ ') : ''}${n.title}
            </div>
            <div style="font-size: 10px; color: var(--mu); font-family: monospace; flex-shrink: 0;">${fmt.time(n.at)}</div>
          </div>
          <div style="font-size: 12px; color: ${n.read ? 'rgba(255,255,255,0.3)' : 'var(--mu)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
            ${n.msg}
          </div>
        </div>

        <div style="font-size: 10px; color: var(--mu); transition: transform 0.2s; transform: rotate(${isExpanded ? '90deg' : '0deg'});">
          ${ic('chev')}
        </div>
      </div>

      ${isExpanded ? `
        <div style="padding: 0 16px 16px 46px; border-top: 1px solid rgba(255,255,255,0.05); margin-top: -4px;">
          <div style="padding-top: 12px; font-size: 13px; color: var(--tx); line-height: 1.6; white-space: pre-wrap;">
            ${n.body || n.msg}
          </div>
          
          <div style="display: flex; gap: 12px; margin-top: 16px;">
            <button class="btn" style="padding: 4px 12px; font-size: 10px; font-weight: 800; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);" data-act="note-delete" data-id="${n.id}">DELETE MESSAGE</button>
            <div style="flex: 1;"></div>
            <span style="font-size: 10px; color: var(--mu); font-family: monospace; align-self: center;">Ref ID: ${n.id} · Origin: ${n.type.toUpperCase()}</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export default {
  id: 'notifications',
  label: 'Inbox',
  icon: 'mail',
  render(S: any) {
    const notes = S.notes || [];
    const unreadCount = notes.filter((n: any) => !n.read).length;
    const allSelected = notes.length > 0 && selectedIds.size === notes.length;

    return `
      <div class="view-header" style="margin-bottom: 16px; padding: 0 4px;">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <h2 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: var(--tx);">Company Communications</h2>
            <p style="margin: 4px 0 0; color: var(--mu); font-size: 12px; font-family: monospace;">${unreadCount} UNREAD LOGS · ${notes.length} TOTAL ARCHIVED</p>
          </div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: rgba(255,255,255,0.03); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
            <button class="btn alt" style="padding: 6px 12px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 6px;" data-act="note-sel-all">
               <div style="width: 14px; height: 14px; border: 2px solid ${allSelected ? 'var(--gold)' : 'rgba(255,255,255,0.3)'}; border-radius: 3px; display: grid; place-items: center; background: ${allSelected ? 'var(--gold)' : 'transparent'};">
                 ${allSelected ? `<span style="color: black; font-size: 10px; font-weight: 900;">✓</span>` : ''}
               </div>
               SELECT ALL
            </button>

            ${selectedIds.size > 0 ? `
              <div style="height: 20px; width: 1px; background: rgba(255,255,255,0.1); margin: 0 4px;" class="hide-mobile"></div>
              <button class="btn alt" style="padding: 6px 12px; font-size: 10px; font-weight: 800; color: var(--grn);" data-act="note-read-selected">MARK READ</button>
              <button class="btn alt" style="padding: 6px 12px; font-size: 10px; font-weight: 800; color: #ef4444;" data-act="note-delete-selected">DELETE (${selectedIds.size})</button>
            ` : `
              <div class="hide-mobile" style="font-size: 9px; color: var(--mu); margin-left: 4px; font-family: monospace;">SELECT MESSAGES FOR BATCH PROCESSING</div>
            `}
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; max-width: 800px; margin: 0 auto;">
        ${notes.length === 0 ? `
          <div style="padding: 80px 20px; text-align: center; background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;">
            <div style="font-size: 48px; margin-bottom: 16px; filter: grayscale(1);">📩</div>
            <div style="font-weight: 800; color: var(--tx); font-size: 16px;">Secure Inbox Empty</div>
            <div style="font-size: 12px; color: var(--mu); margin-top: 4px; font-family: monospace;">ALL CORPORATE COMMUNICATIONS ARCHIVED OR PURGED.</div>
          </div>
        ` : notes.map((n: any) => renderItem(n)).join('')}
      </div>

      <style>
        .note-row:hover { background: rgba(255,255,255,0.08) !important; }
        .note-row.unread { border-left: 3px solid var(--gold) !important; }
        .note-row.expanded { background: rgba(255,255,255,0.07) !important; }
        @media (max-width: 480px) {
          .hide-mobile { display: none !important; }
          .note-row { border-radius: 0 !important; margin-left: -16px; margin-right: -16px; border-left: 0; border-right: 0; }
        }
      </style>
    `;
  }
};
