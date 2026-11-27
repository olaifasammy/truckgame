import { refresh, set } from '../core/store';
import { action, toast } from '../core/ui';
import { addCompanyXp } from '../domain/company/progression';
import { DispatchExecution } from '../domain/dispatch/execution';
import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { replenish } from '../systems/jobs';
import { db } from '../db/db';

let showStateJson = false;
let importBuffer = '';

action('dev-add-cash', d => {
  const amount = Number((d as any).amount || 0);
  if (!Number.isFinite(amount) || amount === 0) return;
  set(S => {
    S.money = Math.max(0, Math.round((S.money || 0) + amount));
  });
  toast(`Dev: Added $${amount.toLocaleString()}`, 'success');
});

action('dev-reset-cash', () => {
  set(S => {
    S.money = 165000;
  });
  toast('Dev: Cash reset to $165,000', 'info');
});

action('dev-add-coins', d => {
  const amount = Number((d as any).amount || 0);
  if (!Number.isFinite(amount) || amount === 0) return;
  set(S => {
    S.coins = Math.max(0, Math.round((S.coins || 0) + amount));
  });
  toast(`Dev: Added ${amount} Fleet Bonds`, 'success');
});

action('dev-add-xp', d => {
  const amount = Number((d as any).amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) return;
  set(S => {
    addCompanyXp(S, amount);
  });
  toast(`Dev: Added ${amount.toLocaleString()} XP`, 'success');
});

action('dev-max-rep', () => {
  set(S => {
    S.reputation = 100;
  });
  toast('Dev: Reputation set to 100', 'success');
});

action('dev-refuel-all', () => {
  set(S => {
    (S.fleet || []).forEach((t: any) => {
      const model = TRUCK_MODELS[t.modelId];
      const tankSize = model?.tankSize || 800;
      const oilCap = model?.oilCapacity || 40;
      if (!t.fluids) t.fluids = {};
      t.fluids.fuel = tankSize;
      t.fluids.oil = oilCap;
      t.fluids.coolant = 100;
      t.fluids.adBlue = 100;
      t.fluids.transmissionOil = 100;
    });
  });
  toast('Dev: Refueled & topped up fluids for entire fleet', 'success');
});

action('dev-repair-all', () => {
  set(S => {
    (S.fleet || []).forEach((t: any) => {
      if (t.components) {
        Object.keys(t.components).forEach(k => {
          if (t.components[k]) t.components[k].health = 100;
        });
      }
      if (typeof t.condition === 'number') t.condition = 100;
      if (t.status === 'broken' || t.status === 'maintenance') t.status = 'idle';
    });
  });
  toast('Dev: Repaired all fleet components to 100%', 'success');
});

action('dev-rest-drivers', () => {
  set(S => {
    (S.drivers || []).forEach((drv: any) => {
      drv.fatigue = 0;
      drv.hosHours = 0;
      drv.stress = 0;
      drv.morale = Math.max(drv.morale ?? 80, 95);
    });
  });
  toast('Dev: Reset fatigue & HOS for all drivers', 'success');
});

action('dev-replenish-jobs', () => {
  set(S => {
    replenish(S);
  });
  toast('Dev: Freight market replenished', 'success');
});

action('dev-complete-active', () => {
  set(S => {
    const now = Date.now();
    (S.active || []).forEach((a: any) => {
      a.stage = 'done';
      a.end = now - 1000;
    });
    DispatchExecution.completeJobs(S, now);
  });
  toast('Dev: Completed all active dispatches', 'success');
});

action('dev-toggle-json', () => {
  showStateJson = !showStateJson;
  refresh();
});

action('dev-copy-json', async () => {
  try {
    const S = (window as any).__getStore?.();
    if (!S) return toast('Store unavailable', 'err');
    await navigator.clipboard.writeText(JSON.stringify(S, null, 2));
    toast('State JSON copied to clipboard', 'success');
  } catch {
    toast('Clipboard copy failed', 'err');
  }
});

action('dev-export-save', () => {
  try {
    const S = (window as any).__getStore?.();
    if (!S) return toast('Store unavailable', 'err');
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexhaul-save-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Exported save JSON', 'success');
  } catch {
    toast('Failed to export save', 'err');
  }
});

action('dev-import-buffer', d => {
  importBuffer = (d as any).value ?? '';
});

action('dev-import-save', () => {
  if (!importBuffer.trim()) {
    return toast('Paste a valid save JSON first', 'err');
  }
  try {
    const parsed = JSON.parse(importBuffer);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return toast('Invalid save format: expected JSON object', 'err');
    }
    if (!Array.isArray(parsed.fleet) || typeof parsed.money !== 'number') {
      return toast('Invalid save: missing fleet or money fields', 'err');
    }
    set(S => {
      Object.keys(S).forEach(k => delete S[k]);
      Object.assign(S, parsed);
    });
    importBuffer = '';
    toast('Save state imported successfully', 'success');
  } catch (e: any) {
    toast(`JSON parse error: ${e?.message || 'invalid JSON'}`, 'err');
  }
});

action('dev-clear-sw-cache', async () => {
  try {
    let clearedCaches = 0;
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      clearedCaches = keys.length;
    }
    let unregistered = 0;
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      unregistered = regs.length;
    }
    toast(`Cleared ${clearedCaches} cache(s) & ${unregistered} service worker(s)`, 'success');
  } catch {
    toast('Failed to clear service worker caches', 'err');
  }
});

action('dev-hard-reset', async () => {
  if (typeof window !== 'undefined' && !window.confirm('Erase all local save data (IndexedDB + localStorage) and reload?')) {
    return;
  }
  try {
    await (db as any).state.clear();
  } catch {}
  try {
    localStorage.clear();
  } catch {}
  window.location.reload();
});

export default {
  id: 'devtools',
  icon: 'settings',
  label: 'DevTools',
  hidden: true,
  render: (S: any) => {
    const rawJson = JSON.stringify(S);
    const saveKb = (new Blob([rawJson]).size / 1024).toFixed(1);
    const prettyJson = showStateJson
      ? JSON.stringify(S, null, 2).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      : '';

    return `
      <div style="padding:14px 14px 88px; display:flex; flex-direction:column; gap:12px;">
        <!-- Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; background:#0b101d; border:1px solid #1f293d; border-radius:10px; padding:12px 14px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <button type="button" class="btn alt" style="padding:6px 10px; font-size:10px;" data-act="tab" data-id="company">← HQ</button>
            <div>
              <div style="font-size:13px; font-weight:900; color:var(--gold); letter-spacing:0.6px; font-family:monospace;">DEVELOPER CONSOLE</div>
              <div style="font-size:9px; color:var(--mu); font-family:monospace;">DIRECT STATE &amp; CACHE DIAGNOSTICS</div>
            </div>
          </div>
          <span style="font-size:9px; font-family:monospace; color:var(--grn); background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); padding:3px 7px; border-radius:4px;">
            ${saveKb} KB
          </span>
        </div>

        <!-- Telemetry Snapshot -->
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
          <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:9px;">
            <div style="font-size:9px; color:var(--mu); font-family:monospace;">CASH</div>
            <div style="font-size:12px; font-weight:900; color:var(--grn); font-family:monospace;">$${Math.round(S.money || 0).toLocaleString()}</div>
          </div>
          <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:9px;">
            <div style="font-size:9px; color:var(--mu); font-family:monospace;">BONDS / XP</div>
            <div style="font-size:12px; font-weight:900; color:var(--gold); font-family:monospace;">${S.coins || 0} / ${(S.xp || 0).toLocaleString()}</div>
          </div>
          <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:9px;">
            <div style="font-size:9px; color:var(--mu); font-family:monospace;">FLEET / ACTIVE</div>
            <div style="font-size:12px; font-weight:900; color:var(--tx); font-family:monospace;">${(S.fleet || []).length} / ${(S.active || []).length}</div>
          </div>
        </div>

        <!-- Economy & Progression -->
        <div class="card" style="background:#0b101d; border:1px solid #1f293d; border-radius:10px; padding:12px;">
          <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace; margin-bottom:10px; letter-spacing:0.5px;">ECONOMY &amp; PROGRESSION</div>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-add-cash" data-amount="100000">+$100,000 Cash</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-add-cash" data-amount="1000000">+$1,000,000 Cash</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-add-coins" data-amount="50">+50 Fleet Bonds</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-add-coins" data-amount="500">+500 Fleet Bonds</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-add-xp" data-amount="1000">+1,000 XP</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-add-xp" data-amount="10000">+10,000 XP</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-max-rep">Set Rep = 100</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-reset-cash">Reset Cash ($165k)</button>
          </div>
        </div>

        <!-- Fleet, Drivers & Dispatch -->
        <div class="card" style="background:#0b101d; border:1px solid #1f293d; border-radius:10px; padding:12px;">
          <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace; margin-bottom:10px; letter-spacing:0.5px;">FLEET, DRIVERS &amp; DISPATCH</div>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-refuel-all">Refuel All Trucks</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-repair-all">Repair All Trucks</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-rest-drivers">Rest All Drivers</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-replenish-jobs">Replenish Market</button>
            <button type="button" class="btn" style="grid-column:1 / -1; font-size:10px; padding:9px;" data-act="dev-complete-active">Complete Active Dispatches (${(S.active || []).length})</button>
          </div>
        </div>

        <!-- Save State & Offline Cache -->
        <div class="card" style="background:#0b101d; border:1px solid #1f293d; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px;">
          <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace; letter-spacing:0.5px;">SAVE DATA &amp; PWA CACHE</div>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-toggle-json">${showStateJson ? 'Hide State JSON' : 'Inspect State JSON'}</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-copy-json">Copy State JSON</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-export-save">Export Save (.json)</button>
            <button type="button" class="btn alt" style="font-size:10px; padding:8px;" data-act="dev-clear-sw-cache">Clear SW Cache</button>
          </div>

          ${showStateJson ? `
            <pre style="margin:4px 0 0; max-height:240px; overflow:auto; background:#000000; border:1px solid #1f293d; border-radius:8px; padding:10px; font-size:10px; color:#cbd5e1; font-family:monospace; white-space:pre-wrap; word-break:break-word;">${prettyJson}</pre>
          ` : ''}

          <div style="margin-top:4px; display:flex; flex-direction:column; gap:6px;">
            <textarea
              rows="3"
              placeholder="Paste exported save JSON here to import..."
              data-act="dev-import-buffer"
              style="width:100%; background:#000000; color:var(--tx); border:1px solid #1f293d; border-radius:8px; padding:8px; font-size:10px; font-family:monospace; box-sizing:border-box; outline:none; resize:vertical;"
            >${importBuffer.replace(/</g, '&lt;')}</textarea>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn alt" style="flex:1; font-size:10px; padding:8px;" data-act="dev-import-save">Import Save JSON</button>
              <button type="button" class="btn alt" style="font-size:10px; padding:8px; border-color:rgba(239,68,68,0.5); color:#ef4444;" data-act="dev-hard-reset">Hard Reset Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
