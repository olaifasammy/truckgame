import { ic } from '../core/icons';
import { $, action } from '../core/ui';
import { set } from '../core/store';
import { list } from '../core/router';

action('tab', d => set(S => { S.tab = (d as any).id; }));

export function render(S: any) {
  const navEl = $('nav');
  if (!navEl) return;
  navEl.innerHTML = list().filter(v => !v.hidden).map(v => {
    const isHQ = v.id === 'company';
    return `
      <div class="tab ${isHQ ? 'hq' : ''} ${v.id === S.tab ? 'on' : ''}" data-act="tab" data-id="${v.id}">
        ${isHQ ? `
          <div class="i-wrap">
            ${ic(v.icon)}
            <span class="hq-label">HQ DEPOT</span>
          </div>
        ` : `
          ${ic(v.icon)}
          ${v.label}
        `}
      </div>
    `;
  }).join('');
}
