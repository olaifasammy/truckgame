import { CopilotMessage } from './copilot.types';
import { COPILOT_TOOLS, executeCopilotTool } from './copilot.tools';

/**
 * Local Intent Parser fallback for offline / disconnected copilot commands.
 */
function processLocalIntent(S: any, prompt: string): { reply: string; toolCall?: any } {
  const lower = prompt.toLowerCase();

  if (lower.includes('dealership') || lower.includes('catalog') || lower.includes('trucks for sale') || lower.includes('browse')) {
    const res = COPILOT_TOOLS['get_dealership_catalog'].execute(S, {});
    return {
      reply: `Dealership Truck Catalog (${(res.data || []).length} models available):\n` +
        (res.data || []).slice(0, 8).map((m: any) => `• [${m.modelId}] ${m.brand} ${m.name} (${m.region}) - ${m.hp} HP, ${m.axle} - ${m.price}`).join('\n') +
        ((res.data || []).length > 8 ? `\n...and ${(res.data || []).length - 8} more models.` : ''),
      toolCall: { name: 'get_dealership_catalog', args: {}, result: res }
    };
  }

  if (lower.includes('fleet') || lower.includes('status') || lower.includes('my trucks')) {
    const res = COPILOT_TOOLS['get_fleet_status'].execute(S, {});
    return {
      reply: `Here is your current fleet status summary:\n` + 
        (res.data || []).map((t: any) => `• #${t.id} ${t.name} (${t.model}) at ${t.location} - Status: ${t.status}, Fuel: ${t.fuel}, Wear: ${t.wear}, Driver: ${t.driver}`).join('\n'),
      toolCall: { name: 'get_fleet_status', args: {}, result: res }
    };
  }

  if (lower.includes('money') || lower.includes('finance') || lower.includes('treasury') || lower.includes('cash') || lower.includes('loan')) {
    const res = COPILOT_TOOLS['get_financial_summary'].execute(S, {});
    return {
      reply: res.message,
      toolCall: { name: 'get_financial_summary', args: {}, result: res }
    };
  }

  if (lower.includes('contract') || lower.includes('job') || lower.includes('freight') || lower.includes('market')) {
    const res = COPILOT_TOOLS['get_available_contracts'].execute(S, {});
    return {
      reply: `Available Market Contracts:\n` + 
        (res.data || []).map((j: any) => `• [${j.id}] ${j.cargo} from ${j.origin} to ${j.destination} (${j.distance}) - Payout: ${j.payout}`).join('\n'),
      toolCall: { name: 'get_available_contracts', args: {}, result: res }
    };
  }

  if (lower.includes('driver') || lower.includes('candidate') || lower.includes('hire')) {
    const res = COPILOT_TOOLS['get_driver_pool'].execute(S, {});
    return {
      reply: `Driver Recruitment Pool:\n` + 
        (res.data || []).map((d: any) => `• #${d.id} ${d.name} (${d.skill}) - Wage: ${d.wage}`).join('\n'),
      toolCall: { name: 'get_driver_pool', args: {}, result: res }
    };
  }

  // Buy truck intent e.g. "buy scania_s730 in lagos" or "buy volvo fh16" or "buy scania s730"
  const buyTruckMatch = prompt.match(/buy\s+(?:truck\s+)?(.+?)(?:\s+in\s+([a-zA-Z\s]+))?$/i);
  if (buyTruckMatch && !lower.includes('trailer') && !lower.includes('crypto')) {
    let rawTarget = buyTruckMatch[1].trim();
    // Strip trailing 'in city' if regex missed it
    const inMatch = rawTarget.match(/(.*?)\s+in\s+([a-zA-Z\s]+)$/i);
    let modelId = rawTarget;
    let city = 'LAGOS';
    if (inMatch) {
      modelId = inMatch[1].trim();
      city = inMatch[2].trim().toUpperCase();
    } else if (buyTruckMatch[2]) {
      city = buyTruckMatch[2].trim().toUpperCase();
    }

    const res = executeCopilotTool(S, 'buy_truck', { modelId, city });
    return {
      reply: res.message,
      toolCall: { name: 'buy_truck', args: { modelId, city }, result: res }
    };
  }

  // Sell truck intent e.g. "sell truck 1"
  const sellTruckMatch = prompt.match(/sell\s+truck\s+#?(\d+)/i);
  if (sellTruckMatch) {
    const truckId = parseInt(sellTruckMatch[1], 10);
    const res = executeCopilotTool(S, 'sell_truck', { truckId });
    return {
      reply: res.message,
      toolCall: { name: 'sell_truck', args: { truckId }, result: res }
    };
  }

  // Buy trailer intent e.g. "buy trailer reefer"
  const buyTrailerMatch = prompt.match(/buy\s+trailer\s+([a-zA-Z_-]+)/i);
  if (buyTrailerMatch) {
    const trailerType = buyTrailerMatch[1];
    const res = executeCopilotTool(S, 'buy_trailer', { trailerType });
    return {
      reply: res.message,
      toolCall: { name: 'buy_trailer', args: { trailerType }, result: res }
    };
  }

  // Crypto trade intent e.g. "buy 5000 btc" or "trade crypto buy btc 5000"
  const cryptoMatch = prompt.match(/(?:trade\s+crypto\s+)?(buy|sell)\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:usd\s+of\s+)?([a-zA-Z]+)/i);
  if (cryptoMatch) {
    const action = cryptoMatch[1].toLowerCase();
    const amountUsd = parseFloat(cryptoMatch[2]);
    const assetId = cryptoMatch[3].toLowerCase();
    const res = executeCopilotTool(S, 'trade_crypto', { action, assetId, amountUsd });
    return {
      reply: res.message,
      toolCall: { name: 'trade_crypto', args: { action, assetId, amountUsd }, result: res }
    };
  }

  // Crypto bot intent
  if (lower.includes('crypto bot') || lower.includes('ai crypto')) {
    const enable = lower.includes('enable') || lower.includes('on') || lower.includes('start');
    const res = executeCopilotTool(S, 'toggle_ai_crypto_bot', { enabled: enable });
    return {
      reply: res.message,
      toolCall: { name: 'toggle_ai_crypto_bot', args: { enabled: enable }, result: res }
    };
  }

  // Paint / color intent e.g. "paint truck 1 red"
  const paintMatch = prompt.match(/(?:paint|color)\s+(?:truck\s*)?#?(\d+)\s+(?:to\s+)?([#a-zA-Z0-9]+)/i);
  if (paintMatch) {
    const truckId = parseInt(paintMatch[1], 10);
    let color = paintMatch[2].toLowerCase();
    const res = executeCopilotTool(S, 'set_truck_color', { truckId, color });
    return {
      reply: res.message,
      toolCall: { name: 'set_truck_color', args: { truckId, color }, result: res }
    };
  }

  // Service consumables intent e.g. "service truck 1"
  const serviceMatch = prompt.match(/(?:service|top\s*up|fluids)\s+(?:truck\s*)?#?(\d+)/i);
  if (serviceMatch) {
    const truckId = parseInt(serviceMatch[1], 10);
    const res = executeCopilotTool(S, 'service_truck_consumables', { truckId });
    return {
      reply: res.message,
      toolCall: { name: 'service_truck_consumables', args: { truckId }, result: res }
    };
  }

  // Repair intent e.g. "repair truck 1"
  const repairMatch = prompt.match(/repair\s+(?:truck\s*)?#?(\d+)/i);
  if (repairMatch) {
    const truckId = parseInt(repairMatch[1], 10);
    const res = executeCopilotTool(S, 'repair_truck_components', { truckId, parts: ['engine', 'transmission', 'brakes', 'tires'] });
    return {
      reply: res.message,
      toolCall: { name: 'repair_truck_components', args: { truckId, parts: ['engine', 'transmission', 'brakes', 'tires'] }, result: res }
    };
  }

  return {
    reply: `NexHaul Copilot Operational AI (Local Mode): I received your command: "${prompt}". You can ask me to:\n• Browse Dealership ("show dealership catalog")\n• Buy/Sell Trucks ("buy scania s730", "sell truck 1")\n• Buy Trailers ("buy trailer reefer")\n• Trade Crypto ("buy 5000 btc") & Crypto Bot ("enable crypto bot")\n• Fleet Status, Finances, Repairs, & Repainting.`
  };
}

/**
 * Hybrid Copilot processing: Tries cloud LLM API (OpenAI or OpenRouter) if online and configured, falls back to local intent engine.
 */
export async function processCopilotMessage(S: any, prompt: string, apiKey?: string): Promise<{ reply: string; toolCall?: any }> {
  if (apiKey && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const isOpenRouter = apiKey.startsWith('sk-or-');
      const endpoint = isOpenRouter 
        ? 'https://openrouter.ai/api/v1/chat/completions' 
        : 'https://api.openai.com/v1/chat/completions';
      
      const model = isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini';

      const fleetSummary = (S.fleet || []).map((t: any) => 
        `Truck #${t.id}: ${t.name} (${t.modelId}), Status: ${t.status}, Fuel: ${t.fuel?.toFixed(1)}%, Wear: ${t.wear?.toFixed(1)}%, Loc: ${t.location}, Driver ID: ${t.driverId || 'None'}, Color: ${t.color || 'default'}`
      ).join('\n');

      const loansTotal = (S.loans || []).reduce((acc: number, l: any) => acc + (l.remainingBalance || l.amount || 0), 0);
      const cryptoCash = S.cryptoPortfolio?.cash || 50000;
      const cryptoHoldings = JSON.stringify(S.cryptoPortfolio?.holdings || {});

      const systemPrompt = `You are NexHaul Copilot, an advanced AI logistics assistant integrated directly into the NexHaul FMS simulation. 
Current Company State:
- Treasury Balance: $${(S.money || 0).toLocaleString()}
- Outstanding Loans: $${loansTotal.toLocaleString()}
- Crypto Portfolio Cash: $${cryptoCash.toLocaleString()}
- Crypto Holdings: ${cryptoHoldings}
- AI Crypto Bot Enabled: ${!!S.aiCryptoBot?.enabled}
- Fleet Size: ${(S.fleet || []).length} trucks
- Active Fleet Details:
${fleetSummary || 'No trucks in fleet yet.'}

You have FULL ACCESS to the vehicle dealership and enterprise tools:
- get_dealership_catalog (filterRegion?: string)
- buy_truck (modelId: string, city?: string)
- sell_truck (truckId: number)
- buy_trailer (trailerType: string)
- trade_crypto (action: 'buy'|'sell', assetId: string, amountUsd: number)
- toggle_ai_crypto_bot (enabled: boolean)
- set_truck_color, service_truck_consumables, repair_truck_components, assign_driver
- get_fleet_status, get_financial_summary, get_available_contracts, get_driver_pool

Always invoke the appropriate tool when the operator requests dealership browsing, truck purchases, sales, crypto trading, or fleet management. Keep replies concise and professional.`;

      const toolsDef = Object.values(COPILOT_TOOLS).map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      }));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      if (isOpenRouter) {
        headers['HTTP-Referer'] = 'https://nexhaul.logistics.sim';
        headers['X-Title'] = 'NexHaul Logistics Simulation';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          tools: toolsDef,
          tool_choice: 'auto'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const message = data.choices?.[0]?.message;
        
        if (message?.tool_calls && message.tool_calls.length > 0) {
          const toolCall = message.tool_calls[0];
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments || '{}');
          
          const toolRes = executeCopilotTool(S, fnName, fnArgs);
          return {
            reply: message.content || toolRes.message,
            toolCall: { name: fnName, args: fnArgs, result: toolRes }
          };
        } else if (message?.content) {
          return { reply: message.content };
        }
      } else {
        const errBody = await response.text();
        console.warn('Cloud Copilot API error response:', response.status, errBody);
      }
    } catch (e) {
      console.warn('Cloud Copilot API exception, falling back to local engine:', e);
    }
  }

  return processLocalIntent(S, prompt);
}
