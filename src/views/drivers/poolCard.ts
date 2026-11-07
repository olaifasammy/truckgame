import { ic } from '../../core/icons';
import { TRAIT_REGISTRY } from '../../domain/drivers/drivers.names';
import { hireFee } from './helpers';

export function renderPoolCard(d: any): string {
  const trait = TRAIT_REGISTRY[d.trait as keyof typeof TRAIT_REGISTRY];
  const cost = hireFee(d);
  const regionStr = (d.region || 'Africa').toUpperCase();
  const salary = d.salary || 200;

  return `
    <div class="card" style="background:var(--s1); border:1px solid var(--line);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; background:var(--bg); border:1px solid var(--gold); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--gold); font-size:16px;">${ic('user')}</div>
          <div>
            <div style="font-weight:800; font-size:13px; color:var(--tx);">${d.name}</div>
            <div style="font-size:10px; color:var(--gold); font-weight:700; margin-top:2px;">${regionStr} · Skill ${d.skill}/5 · Wage: $${salary}/day</div>
            <div style="font-size:10px; color:var(--accent); font-weight:700; margin-top:2px;">Trait: ${trait?.name || 'Standard'}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; font-weight:900; color:var(--gold); margin-bottom:4px;">$${cost.toLocaleString()}</div>
          <button class="btn gold" style="padding:6px 14px; font-size:10px; font-weight:900;" data-act="hire-driver" data-id="${d.id}">
            HIRE
          </button>
        </div>
      </div>
    </div>
  `;
}
