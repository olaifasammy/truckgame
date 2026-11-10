import { ic } from '../core/icons';
import { action } from '../core/ui';
import { refresh, set } from '../core/store';
import { processCopilotMessage } from '../domain/ai/copilot.engine';
import { CopilotMessage } from '../domain/ai/copilot.types';

let copilotMessages: CopilotMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: 'Hello, Chief! I am your NexHaul AI Operational Copilot. Ask for fleet status, treasury summaries, or command actions (e.g. "paint truck 1 red", "service truck 1").',
    timestamp: Date.now()
  }
];
let userInputText = '';
let apiKeyInput = '';
let isThinking = false;

action('copilot-send', async () => {
  if (!userInputText.trim()) return;
  const prompt = userInputText.trim();
  userInputText = '';

  const userMsg: CopilotMessage = {
    id: `msg-${Date.now()}-u`,
    sender: 'user',
    text: prompt,
    timestamp: Date.now()
  };

  copilotMessages.push(userMsg);
  isThinking = true;
  refresh();
  scrollToBottom();

  try {
    let currentState: any = {};
    set(S => { currentState = S; });

    const result = await processCopilotMessage(currentState, prompt, apiKeyInput.trim() || undefined);

    const assistantMsg: CopilotMessage = {
      id: `msg-${Date.now()}-a`,
      sender: 'assistant',
      text: result.reply,
      timestamp: Date.now(),
      toolCall: result.toolCall
    };

    copilotMessages.push(assistantMsg);
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
  };
}

export default {
  id: 'copilot',
  icon: 'cpu',
  label: 'AI Copilot',
  hidden: true,
  render(S: any) {
    return `
      <div style="padding:16px; max-width:900px; margin:0 auto; display:flex; flex-direction:column; height:calc(100vh - 80px); gap:12px;">
        
        <!-- Header -->
        <div style="background:#0e1320; border:1px solid var(--gold); border-radius:12px; padding:14px 18px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="color:var(--gold); font-size:24px; display:flex; align-items:center;">${ic('cpu')}</div>
            <div>
              <h2 style="margin:0; font-size:16px; font-weight:900; color:var(--tx);">NexHaul AI Operational Copilot</h2>
              <div style="font-size:10px; color:var(--mu);">Autonomous Fleet Dispatch & In-Game Tool Execution Terminal</div>
            </div>
          </div>
          <div style="font-size:10px; font-family:monospace; background:#0b101d; border:1px solid #1f293d; padding:6px 12px; border-radius:6px; color:var(--gold);">
            ACTIVE UNITS: ${S.fleet?.length || 0} · TREASURY: $${(S.money || 0).toLocaleString()}
          </div>
        </div>

        <!-- API Key Bar -->
        <div style="background:#0b101d; border:1px solid #1f293d; border-radius:8px; padding:8px 14px; display:flex; gap:12px; align-items:center; font-size:10px;">
          <span style="color:var(--mu); font-weight:700;">OpenAI / OpenRouter API Key (Optional):</span>
          <input type="password" placeholder="sk-..." value="${apiKeyInput}" style="background:#030712; border:1px solid #1f293d; color:var(--tx); padding:4px 8px; border-radius:6px; font-size:10px; flex:1; outline:none;" oninput="window.__copilotApiKey?.(this.value)" />
        </div>

        <!-- Chat Messages Container (Borderless & Background-free message items) -->
        <div id="copilot-messages-box" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; background:#070a14; border:1px solid #1f293d; border-radius:10px;">
          ${copilotMessages.map(msg => {
            const isUser = msg.sender === 'user';
            return `
              <div style="display:flex; flex-direction:column; align-items:${isUser ? 'flex-end' : 'flex-start'};">
                <div style="font-size:7px; color:var(--mu); margin-bottom:2px; font-family:monospace;">
                  ${isUser ? 'CHIEF OPERATOR' : 'AI COPILOT'} · ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div style="color:${isUser ? '#93c5fd' : 'var(--tx)'}; max-width:85%; font-size:10px; line-height:1.4; white-space:pre-wrap; font-family:monospace; padding:2px 0;">
                  ${msg.text}
                  ${msg.toolCall ? `
                    <div style="margin-top:4px; padding:2px 6px; background:#040710; border-left:2px solid var(--gold); font-size:8px; color:var(--gold);">
                      ⚙️ Tool Executed: <b>${msg.toolCall.name}</b>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
          ${isThinking ? `
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-family:monospace; font-weight:700; padding:4px;">
              <span>🤖 Copilot analyzing fleet data & executing tools...</span>
            </div>
          ` : ''}
        </div>

        <!-- Input Bar -->
        <div style="background:#0b101d; border:1px solid #1f293d; border-radius:10px; padding:10px 14px; display:flex; gap:8px;">
          <input type="text" placeholder="Type command (e.g. 'status', 'paint truck 1 red', 'service truck 1')..." value="${userInputText}" style="background:#030712; border:1px solid #1f293d; color:var(--tx); padding:10px 12px; border-radius:8px; font-size:11px; flex:1; outline:none; font-family:monospace;" oninput="window.__copilotInput?.(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault(); document.querySelector('[data-act=copilot-send]').click();}" />
          <button class="btn gold" style="padding:10px 18px; font-size:11px; font-weight:900;" data-act="copilot-send">
            SEND ➔
          </button>
        </div>

      </div>
    `;
  }
};
