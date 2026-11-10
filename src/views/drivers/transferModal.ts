import { Region } from '../../domain/drivers/drivers.types';
import { transferFee } from './helpers';

export function renderTransferModal(transferDriverObj: any): string {
  if (!transferDriverObj) return '';
  return `
    <div style="position:fixed; inset:0; background:rgba(5,8,18,0.95); z-index:1500; display:flex; align-items:center; justify-content:center; padding:16px;">
      <div style="background:var(--s1); border:1px solid var(--gold); border-radius:16px; width:100%; max-width:400px; padding:20px; position:relative;">
        <button style="position:absolute; top:14px; right:16px; background:none; border:none; color:var(--mu); font-size:18px; cursor:pointer;" data-act="close-transfer-modal">✕</button>
        <h3 style="margin:0 0 4px 0; font-size:16px; color:var(--tx);">Transfer ${transferDriverObj.name}</h3>
        <div style="font-size:11px; color:var(--mu); margin-bottom:16px;">Current Region: <b style="color:var(--gold);">${transferDriverObj.region || 'Africa'}</b> · Fee: <b style="color:var(--gold);">$${(transferFee || 0).toLocaleString()}</b></div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
          ${(['America', 'Europe', 'Africa', 'Asia'] as Region[]).map(reg => `
            <button class="btn ${transferDriverObj.region === reg ? 'gold' : 'alt'}" style="padding:10px; font-weight:800; justify-content:center;" data-act="execute-transfer" data-driver-id="${transferDriverObj.id}" data-region="${reg}" ${transferDriverObj.region === reg ? 'disabled' : ''}>
              Transfer to ${reg}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
