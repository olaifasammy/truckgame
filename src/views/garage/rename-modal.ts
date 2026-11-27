import { refresh, set } from '../../core/store';
import { action, toast } from '../../core/ui';
import { TRUCK_MODELS } from '../../domain/trucks/trucks.data';
import { GameState } from '../../types/state';

let renameModalTruckId: number | null = null;
let renameDraft = '';

function forceRenderBypass() {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  if (typeof window !== 'undefined') {
    (window as any).__forceRender = true;
  }
}

action('rename-truck', d => {
  const id = +(d as any).id;
  const S = (window as any).__getStore?.();
  const t = S?.fleet?.find((x: any) => x.id === id);
  const m = t ? (TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730']) : null;
  renameModalTruckId = id;
  renameDraft = t?.name || m?.name || '';
  forceRenderBypass();
  refresh();
  if (typeof document !== 'undefined') {
    requestAnimationFrame(() => {
      const input = document.getElementById('rename-truck-input') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }
});

action('rename-truck-input', d => {
  renameDraft = (d as any).value ?? '';
});

action('close-rename-modal', () => {
  renameModalTruckId = null;
  renameDraft = '';
  forceRenderBypass();
  refresh();
});

action('confirm-rename-truck', () => {
  if (renameModalTruckId === null) return;
  const id = renameModalTruckId;
  const trimmed = renameDraft.trim();
  if (!trimmed) {
    toast('Truck name cannot be empty', 'err');
    return;
  }
  if (trimmed.length > 40) {
    toast('Truck name must be 40 characters or less', 'err');
    return;
  }
  renameModalTruckId = null;
  renameDraft = '';
  forceRenderBypass();
  set((S: GameState) => {
    const t = S.fleet.find(x => x.id === id);
    if (t) t.name = trimmed;
  });
  toast(`Unit #${id} renamed to "${trimmed}"`, 'success');
});

export function renderRenameModal(S: GameState): string {
  if (renameModalTruckId === null) return '';
  const t = S.fleet.find((x: any) => x.id === renameModalTruckId);
  if (!t) return '';
  const m = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
  const escaped = renameDraft.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `
    <div style="position:fixed; inset:0; background:rgba(5,8,18,0.85); z-index:1200; display:flex; align-items:center; justify-content:center; padding:16px;">
      <div style="position:absolute; inset:0;" data-act="close-rename-modal"></div>
      <div style="background:#0f172a; border:1px solid var(--gold); border-radius:12px; width:100%; max-width:400px; padding:18px; position:relative; z-index:1; box-shadow:0 12px 36px rgba(0,0,0,0.6);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div>
            <div style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">FLEET REGISTRY</div>
            <div style="font-size:15px; font-weight:900; color:var(--tx); margin-top:2px;">Rename Unit #${t.id}</div>
            <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:1px;">${m.brand} ${m.name}${t.regNo ? ` · ${t.regNo}` : ''}</div>
          </div>
          <button type="button" style="background:none; border:none; color:var(--mu); font-size:18px; cursor:pointer; padding:0;" data-act="close-rename-modal" aria-label="Close">✕</button>
        </div>

        <div style="margin-bottom:14px;">
          <label for="rename-truck-input" style="display:block; font-size:10px; font-weight:800; color:var(--mu); font-family:monospace; margin-bottom:6px; text-transform:uppercase;">Unit Callsign / Name</label>
          <input
            id="rename-truck-input"
            type="text"
            maxlength="40"
            value="${escaped}"
            placeholder="Enter truck name..."
            data-act="rename-truck-input"
            onkeydown="if(event.key==='Enter'){event.preventDefault(); document.getElementById('confirm-rename-btn')?.click();} else if(event.key==='Escape'){event.preventDefault(); document.querySelector('[data-act=close-rename-modal]')?.click();}"
            style="width:100%; background:#000000; color:var(--tx); border:1px solid #1f293d; border-radius:8px; padding:10px 12px; font-size:13px; font-weight:700; outline:none; box-sizing:border-box;"
          />
        </div>

        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button type="button" class="btn alt" style="padding:8px 14px; font-size:11px; font-weight:800;" data-act="close-rename-modal">Cancel</button>
          <button type="button" id="confirm-rename-btn" class="btn gold" style="padding:8px 16px; font-size:11px; font-weight:900;" data-act="confirm-rename-truck">Save Name</button>
        </div>
      </div>
    </div>
  `;
}
