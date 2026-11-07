/**
 * Smart AI Floating Icon Component
 * Draggable anywhere on the screen, displays when any AI feature is active.
 * Tapping opens the AI Dispatch & Operations console.
 */

import { ic } from '../core/icons';
import { set, refresh } from '../core/store';

let posX = typeof window !== 'undefined' ? window.innerWidth - 75 : 300;
let posY = typeof window !== 'undefined' ? window.innerHeight - 150 : 500;
let isDragging = false;
let startX = 0;
let startY = 0;
let hasDragged = false;

export function renderAiFloatingWidget(S: any): string {
  const aiState = S.aiState || {};
  const isSubActive = !!(aiState.subscriptionActive && Date.now() < (aiState.expiresTimestamp || 0));
  const isMaintActive = !!aiState.maintenanceAddonActive;
  const isCryptoActive = !!S.aiCryptoBot?.enabled;
  
  const isAnyActive = isSubActive || isMaintActive || isCryptoActive;
  if (!isAnyActive || S.tab === 'dispatch') return '';

  return `
    <div id="ai-floating-widget" 
      style="position:fixed; left:${posX}px; top:${posY}px; z-index:9999; cursor:grab; user-select:none; touch-action:none;"
      onmousedown="window.__aiWidgetStart(event)"
      ontouchstart="window.__aiWidgetStart(event)"
      onclick="window.__aiWidgetClick(event)">
      <div style="background:linear-gradient(135deg, #0f172a, #1e293b); border:2px solid var(--gold); border-radius:50%; width:54px; height:54px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(0,0,0,0.6); position:relative;">
        <div style="color:var(--gold); font-size:22px; display:flex; align-items:center; justify-content:center;">
          ${ic('cpu')}
        </div>
        <div style="position:absolute; top:-2px; right:-2px; background:var(--grn); width:12px; height:12px; border-radius:50%; border:2px solid #0f172a;"></div>
      </div>
    </div>
  `;
}

if (typeof window !== 'undefined') {
  (window as any).__aiWidgetStart = (e: MouseEvent | TouchEvent) => {
    isDragging = true;
    hasDragged = false;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startX = clientX - posX;
    startY = clientY - posY;

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      hasDragged = true;
      const moveX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      posX = Math.max(10, Math.min(window.innerWidth - 64, moveX - startX));
      posY = Math.max(70, Math.min(window.innerHeight - 100, moveY - startY));
      
      const widget = document.getElementById('ai-floating-widget');
      if (widget) {
        widget.style.left = `${posX}px`;
        widget.style.top = `${posY}px`;
      }
    };

    const onEnd = () => {
      isDragging = false;
      window.removeEventListener('mousemove', onMove as any);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove as any);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove as any);
    window.addEventListener('touchend', onEnd);
  };

  (window as any).__aiWidgetClick = (e: MouseEvent) => {
    if (hasDragged) return;
    set(S => { S.tab = 'dispatch'; });
    refresh();
  };
}
