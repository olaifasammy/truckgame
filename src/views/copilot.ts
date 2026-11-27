import { ic } from '../core/icons';
import { action } from '../core/ui';
import { get, refresh, set } from '../core/store';
import { processCopilotMessage } from '../domain/ai/copilot.engine';
import { CopilotMessage } from '../domain/ai/copilot.types';

let copilotMessages: CopilotMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: 'NexHaul AI Operations Console ready. Tap any quick command below or type naturally (e.g. "list hubs", "show jobs in lagos", "dispatch hub lagos", "staff idle trucks", "daily pnl").',
    timestamp: Date.now(),
    actions: [
      { label: 'List Hubs', prompt: 'list hubs' },
      { label: 'Hub Jobs Summary', prompt: 'hub jobs' },
      { label: 'Dispatch Idle Fleet', prompt: 'dispatch all idle trucks' },
      { label: 'Daily P&L', prompt: 'daily pnl' }
    ]
  }
];
const API_KEY_STORAGE = 'nexhaul.copilot.apiKey';

let userInputText = '';
let apiKeyInput = typeof localStorage !== 'undefined' ? (localStorage.getItem(API_KEY_STORAGE) || '') : '';
let showApiKeyBar = false;
let activeQuickCat: 'hubs' | 'dispatch' | 'fleet' | 'drivers' | 'finance' = 'hubs';
let isThinking = false;

const QUICK_COMMANDS: Record<typeof activeQuickCat, { label: string; prompt: string }[]> = {
  hubs: [
    { label: 'List Hubs', prompt: 'list hubs' },
    { label: 'Hub Jobs Summary', prompt: 'hub jobs' },
    { label: 'Unlock Europe', prompt: 'unlock region europe' },
    { label: 'Unlock America', prompt: 'unlock region america' }
  ],
  dispatch: [
    { label: 'Dispatch All Idle', prompt: 'dispatch all idle trucks' },
    { label: 'Live Auctions', prompt: 'show auctions' },
    { label: '30-Day Tenders', prompt: 'show tenders' },
    { label: 'Enable AI Auto', prompt: 'enable ai dispatch' }
  ],
  fleet: [
    { label: 'Suggest Trucks', prompt: 'suggest trucks to buy' },
    { label: 'Fleet Status', prompt: 'fleet status' },
    { label: 'Service & Refuel Idle', prompt: 'service idle fleet' },
    { label: 'Buy Box Trailer', prompt: 'buy trailer box' }
  ],
  drivers: [
    { label: 'Drivers & Pool', prompt: 'drivers' },
    { label: 'Staff Idle Trucks', prompt: 'staff idle trucks' },
    { label: 'Hire Driver', prompt: 'hire driver' },
    { label: 'Buy ADR License', prompt: 'buy license adr_hazmat' }
  ],
  finance: [
    { label: 'Daily P&L', prompt: 'daily pnl' },
    { label: 'Credit & Loans', prompt: 'loan status' },
    { label: 'Take $50k Loan', prompt: 'take loan 50000' },
    { label: 'Enable Crypto Bot', prompt: 'enable crypto bot' }
  ]
};

async function runPrompt(prompt: string) {
  if (!prompt.trim() || isThinking) return;
  const clean = prompt.trim();

  copilotMessages.push({
    id: `msg-${Date.now()}-u`,
    sender: 'user',
    text: clean,
    timestamp: Date.now()
  });
  isThinking = true;
  refresh();
  scrollToBottom();

  try {
    const result = await processCopilotMessage(
      get(),
      clean,
      apiKeyInput.trim() || undefined,
      set
    );

    copilotMessages.push({
      id: `msg-${Date.now()}-a`,
      sender: 'assistant',
      text: result.reply,
      timestamp: Date.now(),
      toolCall: result.toolCall,
      actions: result.actions
    });
  } catch (e: any) {
    copilotMessages.push({
      id: `msg-${Date.now()}-err`,
      sender: 'assistant',
      text: `Error processing copilot request: ${e?.message || e}`,
      timestamp: Date.now()
    });
  } finally {
    isThinking = false;
    refresh();
    scrollToBottom();
  }
}

action('copilot-send', () => {
  const prompt = userInputText.trim();
  if (!prompt) return;
  userInputText = '';
  runPrompt(prompt);
});

action('copilot-quick', d => {
  const prompt = (d as any).prompt;
  if (prompt) runPrompt(prompt);
});

action('copilot-cat', d => {
  activeQuickCat = (d as any).cat || 'hubs';
  refresh();
});

action('copilot-toggle-key', () => {
  showApiKeyBar = !showApiKeyBar;
  refresh();
});

function scrollToBottom() {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const box = document.getElementById('copilot-messages-box');
      if (box) box.scrollTop = box.scrollHeight;
    }, 40);
  }
}

if (typeof window !== 'undefined') {
  (window as any).__copilotInput = (val: string) => {
    userInputText = val;
  };
  (window as any).__copilotApiKey = (val: string) => {
    apiKeyInput = val;
    try {
      const trimmed = val.trim();
      if (trimmed) {
        localStorage.setItem(API_KEY_STORAGE, trimmed);
      } else {
        localStorage.removeItem(API_KEY_STORAGE);
      }
    } catch {}
  };
}

action('copilot-clear-key', () => {
  apiKeyInput = '';
  try {
    localStorage.removeItem(API_KEY_STORAGE);
  } catch {}
  refresh();
});

export default {
  id: 'copilot',
  icon: 'cpu',
  label: 'AI Copilot',
  hidden: true,
  render(S: any) {
    const ownedHubs = (S.depots || []).length;
    const cmds = QUICK_COMMANDS[activeQuickCat] || QUICK_COMMANDS.hubs;

    return `
      <div style="padding:14px; max-width:900px; margin:0 auto; display:flex; flex-direction:column; height:calc(100vh - 80px); gap:10px;">
        
        <!-- Header -->
        <div style="background:#0e1320; border:1px solid var(--gold); border-radius:12px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="color:var(--gold); font-size:22px; display:flex; align-items:center;">${ic('cpu')}</div>
            <div>
              <h2 style="margin:0; font-size:15px; font-weight:900; color:var(--tx);">NexHaul AI Operations Console</h2>
              <div style="font-size:10px; color:var(--mu);">Full-Empire Control · Hubs, Dispatch, Fleet, HR & Treasury</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="font-size:9.5px; font-family:monospace; background:#0b101d; border:1px solid #1f293d; padding:5px 10px; border-radius:6px; color:var(--gold);">
              HUBS: ${ownedHubs} · FLEET: ${S.fleet?.length || 0} · $${Math.round(S.money || 0).toLocaleString()}
            </div>
            <button class="btn alt" style="padding:5px 9px; font-size:9.5px; font-weight:800; ${apiKeyInput.trim() ? 'border-color:rgba(34,197,94,0.45); color:var(--grn);' : ''}" data-act="copilot-toggle-key" title="Configure Optional Gemini API Key">
              ⚙️ AI Key ${apiKeyInput.trim() ? '✓' : ''}
            </button>
          </div>
        </div>

        ${showApiKeyBar ? `
          <div style="background:#0b101d; border:1px solid #1f293d; border-radius:8px; padding:8px 12px; display:flex; gap:8px; align-items:center; font-size:10px;">
            <span style="color:var(--mu); font-weight:700; white-space:nowrap;">Gemini API Key (Saved Locally):</span>
            <input type="password" placeholder="AIza..." value="${apiKeyInput.replace(/"/g, '&quot;')}" style="background:#030712; border:1px solid #1f293d; color:var(--tx); padding:5px 8px; border-radius:6px; font-size:10px; flex:1; outline:none;" oninput="window.__copilotApiKey?.(this.value)" />
            ${apiKeyInput.trim() ? `<button type="button" class="btn alt" style="padding:4px 8px; font-size:9px; color:#ef4444; border-color:rgba(239,68,68,0.4);" data-act="copilot-clear-key">Clear</button>` : ''}
          </div>
        ` : ''}

        <!-- Quick-Command Category Bar -->
        <div style="background:#0b101d; border:1px solid #1f293d; border-radius:10px; padding:8px 10px; display:flex; flex-direction:column; gap:7px;">
          <div style="display:flex; gap:5px; flex-wrap:wrap;">
            ${(['hubs', 'dispatch', 'fleet', 'drivers', 'finance'] as const).map(cat => `
              <button class="btn ${activeQuickCat === cat ? 'gold' : 'alt'}" style="padding:4px 10px; font-size:9px; font-weight:800; text-transform:uppercase;" data-act="copilot-cat" data-cat="${cat}">
                ${cat}
              </button>
            `).join('')}
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${cmds.map(c => `
              <button class="btn alt" style="padding:5px 10px; font-size:9.5px; font-weight:700; border-color:rgba(193,154,91,0.35); color:var(--tx);" data-act="copilot-quick" data-prompt="${c.prompt}">
                ⚡ ${c.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Chat Messages Container -->
        <div id="copilot-messages-box" style="flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:12px; background:#070a14; border:1px solid #1f293d; border-radius:10px;">
          ${copilotMessages.map(msg => {
            const isUser = msg.sender === 'user';
            return `
              <div style="display:flex; flex-direction:column; align-items:${isUser ? 'flex-end' : 'flex-start'};">
                <div style="font-size:7.5px; color:var(--mu); margin-bottom:2px; font-family:monospace;">
                  ${isUser ? 'CHIEF OPERATOR' : 'AI COPILOT'} · ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div style="color:${isUser ? '#93c5fd' : 'var(--tx)'}; max-width:90%; font-size:10.5px; line-height:1.45; white-space:pre-wrap; font-family:monospace; padding:2px 0;">
                  ${msg.text}
                  ${msg.toolCall ? `
                    <div style="margin-top:4px; padding:2px 6px; background:#040710; border-left:2px solid var(--gold); font-size:8.5px; color:var(--gold);">
                      ⚙️ Executed: <b>${msg.toolCall.name}</b>
                    </div>
                  ` : ''}
                </div>
                ${!isUser && msg.actions && msg.actions.length > 0 ? `
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
                    ${msg.actions.map(a => `
                      <button class="btn alt" style="padding:3px 9px; font-size:9px; font-weight:800; border-color:rgba(193,154,91,0.45); color:var(--gold);" data-act="copilot-quick" data-prompt="${a.prompt}">
                        ▸ ${a.label}
                      </button>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
          ${isThinking ? `
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-family:monospace; font-weight:700; padding:4px;">
              <span>🤖 Executing operations...</span>
            </div>
          ` : ''}
        </div>

        <!-- Input Bar -->
        <div style="background:#0b101d; border:1px solid #1f293d; border-radius:10px; padding:8px 12px; display:flex; gap:8px;">
          <input type="text" placeholder="Command anything (e.g. 'list hubs', 'dispatch hub lagos', 'staff idle trucks', 'daily pnl')..." value="${userInputText}" style="background:#030712; border:1px solid #1f293d; color:var(--tx); padding:9px 12px; border-radius:8px; font-size:11px; flex:1; outline:none; font-family:monospace;" oninput="window.__copilotInput?.(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault(); document.querySelector('[data-act=copilot-send]').click();}" />
          <button class="btn gold" style="padding:9px 16px; font-size:11px; font-weight:900;" data-act="copilot-send">
            SEND ➔
          </button>
        </div>

      </div>
    `;
  }
};
