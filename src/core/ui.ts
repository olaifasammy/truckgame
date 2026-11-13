export const $ = (id: string): HTMLElement | null => document.getElementById(id);

export const fmt = Object.assign(
  (n: number): string => '$' + Math.round(n).toLocaleString(),
  {
    time: (at: number): string => {
      const d = new Date(at);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
);

export const dur = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatTimer = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${hours}:${pad(minutes)}:${pad(seconds)}`;
};

const actions = new Map<string, (dataset: DOMStringMap) => void>();
export const action = (name: string, fn: (dataset: DOMStringMap) => void) => actions.set(name, fn);

if (typeof document !== 'undefined') {
  document.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    const el = target?.closest('[data-act]') as HTMLElement;
    if (!el) return;
    // Don't fire click action handler on <select>, <option>, checkboxes, or radios to allow native change event to trigger
    if (el.tagName === 'SELECT' || el.tagName === 'OPTION') return;
    if (el.tagName === 'INPUT' && ((el as HTMLInputElement).type === 'checkbox' || (el as HTMLInputElement).type === 'radio')) return;
    const act = el.dataset.act;
    const fn = act && actions.get(act);
    if (fn) {
      const dataset: any = { ...el.dataset };
      const selectId = dataset.selectId || (dataset.id ? 'transfer-city-' + dataset.id : null);
      if (selectId) {
        const sel = document.getElementById(selectId) as HTMLSelectElement;
        if (sel) dataset.city = sel.value;
      }
      fn(dataset);
    }
  });

  document.addEventListener('change', e => {
    const target = e.target as HTMLElement;
    const el = target?.closest('[data-act]') as HTMLElement;
    if (!el) return;
    const act = el.dataset.act;
    const fn = act && actions.get(act);
    if (fn) {
      const inputEl = el as HTMLInputElement;
      const dataset = {
        ...el.dataset,
        value: inputEl.value,
        checked: inputEl.type === 'checkbox' ? String(inputEl.checked) : undefined
      };
      fn(dataset);
    }
  });

  document.addEventListener('input', e => {
    const target = e.target as HTMLElement;
    const el = target?.closest('[data-act]') as HTMLElement;
    if (!el) return;
    const act = el.dataset.act;
    const fn = act && actions.get(act);
    if (fn) {
      const inputEl = el as HTMLInputElement;
      const dataset = {
        ...el.dataset,
        value: inputEl.value,
        checked: inputEl.type === 'checkbox' ? String(inputEl.checked) : undefined
      };
      fn(dataset);
    }
  });
}

export function toast(msg: string, type: 'info' | 'success' | 'err' = 'info') {
  if (typeof document === 'undefined') return;
  const t = $('toast');
  if (!t) return;
  
  t.className = 'toast'; // reset
  if (type !== 'info') t.classList.add(type);
  
  t.textContent = msg;
  t.classList.add('s');
  
  // Multiple toasts support (simple queue)
  const existing = document.querySelectorAll('.toast.s').length;
  if (existing > 1) {
    t.style.marginTop = (existing - 1) * 50 + 'px';
  }

  setTimeout(() => {
    t.classList.remove('s');
    setTimeout(() => { t.style.marginTop = '0px'; }, 300);
  }, 3000);
}

export const rnd = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
