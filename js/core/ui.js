export const $=id=>document.getElementById(id);
export const rnd=a=>a[Math.floor(Math.random()*a.length)];
export const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
export const dur=ms=>{const s=Math.round(ms/1000),m=Math.floor(s/60);return m?`${m}m ${s%60}s`:`${s}s`};
let tt;
export function toast(t){const e=$('toast');e.textContent=t;e.classList.add('s');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('s'),1600)}
const acts={};
export const action=(name,fn)=>{acts[name]=fn};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');
 if(el&&!el.disabled&&acts[el.dataset.act])acts[el.dataset.act](el.dataset,el,e)});
