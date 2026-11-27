import { CopilotActionChip } from './copilot.types';
import { COPILOT_TOOLS, executeCopilotTool } from './copilot.tools';

interface LocalIntentResult {
  reply: string;
  toolCall?: { name: string; args: Record<string, any> };
  actions?: CopilotActionChip[];
}

function runTool(
  S: any,
  name: string,
  args: Record<string, any>,
  formatter?: (res: any) => string
): LocalIntentResult {
  const res = executeCopilotTool(S, name, args);
  const reply = formatter ? formatter(res) : res.message;
  return {
    reply,
    toolCall: { name, args },
    actions: res.actions
  };
}

/**
 * Natural, forgiving Local Intent Parser for full-game management without an external API key.
 */
function processLocalIntent(S: any, prompt: string): LocalIntentResult {
  const p = prompt.trim().toLowerCase();

  // --- HUBS & REGIONS ---
  if (/^(list|show|my)\s+hubs?\b/.test(p) || p === 'hubs') {
    return runTool(S, 'list_hubs', {}, res => {
      if (!res.success) return res.message;
      const owned = res.data.owned.map((h: any) =>
        `• ${h.name} (${h.city}, L${h.level}): ${h.parkedTrucks} trucks · ${h.availableJobs} jobs · ${h.fuelLiters}L fuel`
      ).join('\n');
      const avail = res.data.available.slice(0, 6).map((h: any) =>
        `• ${h.name} (${h.city}, ${h.region}) — $${h.cost.toLocaleString()}`
      ).join('\n');
      return `${res.message}\n\nOWNED HUBS:\n${owned || 'None'}\n\nAVAILABLE TO BUY:\n${avail || 'Unlock more regions to expand.'}`;
    });
  }

  const buyHubMatch = p.match(/(?:buy|purchase|open)\s+hub\s+([a-z0-9_\s-]+)/i);
  if (buyHubMatch) {
    return runTool(S, 'buy_hub', { hub: buyHubMatch[1].trim() });
  }

  const upgradeHubMatch = p.match(/upgrade\s+hub\s+([a-z0-9_\s-]+)/i);
  if (upgradeHubMatch) {
    return runTool(S, 'upgrade_hub', { hub: upgradeHubMatch[1].trim() });
  }

  const fuelHubMatch = p.match(/(?:buy|order)\s+(?:fuel|diesel)\s+(?:in|for|at)?\s*([a-z0-9_\s-]+?)(?:\s+(\d+))?$/i);
  if (fuelHubMatch) {
    return runTool(S, 'buy_hub_fuel', {
      hub: fuelHubMatch[1].trim(),
      liters: fuelHubMatch[2] ? parseInt(fuelHubMatch[2], 10) : 5000
    });
  }

  const refreshHubJobsMatch = p.match(/refresh\s+(?:jobs?|board)\s+(?:in|at|for)\s+([a-z0-9_\s-]+)/i);
  if (refreshHubJobsMatch) {
    return runTool(S, 'refresh_hub_jobs', { hub: refreshHubJobsMatch[1].trim() });
  }

  const showHubJobsMatch = p.match(/(?:show|list|get|view)?\s*(?:hub\s+)?jobs?\s+(?:in|at|for)\s+([a-z0-9_\s-]+)/i);
  if (showHubJobsMatch) {
    return runTool(S, 'get_hub_jobs', { hub: showHubJobsMatch[1].trim() }, res => {
      if (!res.success) return res.message;
      const lines = (res.data || []).slice(0, 8).map((j: any) =>
        `• #${j.id}: ${j.cargo} (${j.route}, ${j.km}km, ${j.trailer}) — ${j.payout}`
      ).join('\n');
      return `${res.message}\n${lines || 'Board is empty. Tap Refresh to generate loads.'}`;
    });
  }

  if (/\bhub\s+jobs?\b|\bjobs?\s+summary\b/.test(p)) {
    return runTool(S, 'get_hub_jobs', {}, res => {
      if (!res.success) return res.message;
      const lines = (res.data || []).map((h: any) =>
        `• ${h.hub}: ${h.jobs} jobs · ${h.idleTrucks} idle trucks`
      ).join('\n');
      return `${res.message}\n${lines}`;
    });
  }

  const unlockRegMatch = p.match(/unlock\s+(?:region\s+)?(africa|europe|america|asia)/i);
  if (unlockRegMatch) {
    return runTool(S, 'unlock_region', { region: unlockRegMatch[1] });
  }

  // --- DISPATCH, AUCTIONS & TENDERS ---
  const dispatchPairMatch = p.match(/dispatch\s+(?:job\s+)?#?(\d+)\s+(?:on|to|with)?\s*(?:truck\s+)?#?(\d+)/i);
  if (dispatchPairMatch) {
    return runTool(S, 'dispatch_truck', {
      jobId: parseInt(dispatchPairMatch[1], 10),
      truckId: parseInt(dispatchPairMatch[2], 10)
    });
  }

  const dispatchHubMatch = p.match(/dispatch\s+(?:hub\s+|idle\s+trucks?\s+in\s+)([a-z0-9_\s-]+)/i);
  if (dispatchHubMatch && !['all', 'ready', 'fleet'].includes(dispatchHubMatch[1].trim())) {
    return runTool(S, 'auto_dispatch_hub', { hub: dispatchHubMatch[1].trim() });
  }

  if (/dispatch\s+(?:all|idle|fleet|ready)/.test(p) || p === 'dispatch') {
    return runTool(S, 'auto_dispatch_hub', {});
  }

  if (/(enable|turn\s+on|start|disable|turn\s+off|pause)\s+ai\s+(?:dispatch|auto)/i.test(p)) {
    const enabled = /(enable|turn\s+on|start)/i.test(p);
    return runTool(S, 'toggle_ai_dispatch', { enabled });
  }

  const bidMatch = p.match(/(?:place\s+)?bid\s+#?(\d+)\s+\$?(\d+)/i);
  if (bidMatch) {
    return runTool(S, 'place_bid', {
      auctionId: parseInt(bidMatch[1], 10),
      amount: parseInt(bidMatch[2], 10)
    });
  }

  if (/\bauctions?\b|\bbid\s+jobs?\b/.test(p)) {
    return runTool(S, 'list_auctions', {}, res => {
      if (!res.success) return res.message;
      const lines = (res.data || []).slice(0, 8).map((a: any) =>
        `• #${a.id}: ${a.cargo} (${a.route}) · Current: ${a.currentBid} (${a.leader})`
      ).join('\n');
      return `${res.message}\n${lines}`;
    });
  }

  const signTenderMatch = p.match(/(?:sign|accept)\s+tender\s+([a-z0-9_-]+)/i);
  if (signTenderMatch) {
    return runTool(S, 'sign_tender', { tenderId: signTenderMatch[1] });
  }

  if (/\btenders?\b|\bcontracts?\b/.test(p)) {
    return runTool(S, 'list_tenders', {}, res => {
      if (!res.success) return res.message;
      const lines = (res.data || []).slice(0, 8).map((t: any) =>
        `• ${t.id}: ${t.client} (${t.lane}) · ${t.payPerLoad}/load [${t.status}]`
      ).join('\n');
      return `${res.message}\n${lines}`;
    });
  }

  // --- HR, DRIVERS & LICENSES ---
  const staffMatch = p.match(/staff\s+(?:idle\s+trucks?\s+)?(?:in|at)?\s*([a-z0-9_\s-]+)?/i);
  if (staffMatch && p.startsWith('staff')) {
    const hub = staffMatch[1]?.trim();
    return runTool(S, 'staff_idle_trucks', hub && hub !== 'all' ? { hub } : {});
  }

  const hireMatch = p.match(/hire\s+driver(?:\s+#?(\d+)|\s+(?:in\s+)?(africa|europe|america|asia))?/i);
  if (hireMatch) {
    return runTool(S, 'hire_driver', {
      driverId: hireMatch[1] ? parseInt(hireMatch[1], 10) : undefined,
      region: hireMatch[2] || undefined
    });
  }

  const assignMatch = p.match(/assign\s+(?:driver\s+)?#?(\d+)\s+(?:to\s+)?(?:truck\s+)?#?(\d+)/i);
  if (assignMatch) {
    return runTool(S, 'assign_driver', {
      driverId: parseInt(assignMatch[1], 10),
      truckId: parseInt(assignMatch[2], 10)
    });
  }

  const licenseMatch = p.match(/(?:buy|unlock)\s+license\s+([a-z0-9_\s-]+)/i);
  if (licenseMatch) {
    return runTool(S, 'buy_license', { licenseId: licenseMatch[1].trim() });
  }

  if (/(?:register|dmv|dmw)\s+(?:all\s+)?(?:vehicles?|trucks?|fleet)/i.test(p) || /register\s+all/i.test(p)) {
    const cityMatch = p.match(/\bin\s+([a-z\s]+)$/i);
    return runTool(S, 'register_vehicles_dmv', cityMatch ? { city: cityMatch[1].trim() } : {});
  }

  const regOneMatch = p.match(/register\s+(?:truck|vehicle|unit)\s+#?(\d+)(?:\s+in\s+([a-z\s]+))?/i);
  if (regOneMatch) {
    return runTool(S, 'register_vehicles_dmv', {
      truckId: parseInt(regOneMatch[1], 10),
      city: regOneMatch[2]?.trim() || undefined
    });
  }

  if (/renew\s+(?:fleet\s+)?road\s+tax/i.test(p)) {
    return runTool(S, 'renew_fleet_road_tax', {});
  }

  if (/(?:train|upskill|upgrade)\s+(?:all\s+)?drivers?/i.test(p) && !/#?\d+/.test(p)) {
    return runTool(S, 'train_driver', { all: true });
  }

  const trainMatch = p.match(/(?:train|upskill|upgrade)\s+driver\s+(?:#?(\d+)|([a-z\s]+))/i);
  if (trainMatch) {
    return runTool(S, 'train_driver', {
      driverId: trainMatch[1] ? parseInt(trainMatch[1], 10) : undefined,
      driverName: trainMatch[2]?.trim() || undefined
    });
  }

  const certifyMatch = p.match(/certify\s+driver\s+#?(\d+)\s+(.+)/i);
  if (certifyMatch) {
    return runTool(S, 'certify_driver', {
      driverId: parseInt(certifyMatch[1], 10),
      certification: certifyMatch[2].trim()
    });
  }

  if (/\bdrivers?\b|\bpool\b|\bhr\b/.test(p)) {
    return runTool(S, 'get_driver_pool', {}, res => {
      if (!res.success) return res.message;
      const emp = res.data.employed.slice(0, 8).map((d: any) =>
        `• #${d.id} ${d.name} (S${d.skill}, ${d.region}) -> ${d.assignedTo}`
      ).join('\n');
      const pool = res.data.pool.slice(0, 5).map((d: any) =>
        `• #${d.id} ${d.name} (S${d.skill}, ${d.region}) — ${d.hireCost}`
      ).join('\n');
      return `${res.message}\n\nEMPLOYED:\n${emp || 'None'}\n\nHIRING POOL:\n${pool || 'Empty'}`;
    });
  }

  // --- FLEET, TRAILERS & MAINTENANCE ---
  const suggestTruckMatch = p.match(/(?:suggest|recommend|what|which|best)\s+(?:a\s+)?trucks?(?:\s+to\s+buy)?(?:\s+(?:for|in|at)\s+([a-z0-9_\s-]+))?/i);
  if (suggestTruckMatch || /(?:what|which)\s+trucks?\s+(?:should|can)\s+i\s+buy/i.test(p)) {
    const hub = suggestTruckMatch?.[1]?.trim();
    return runTool(S, 'recommend_trucks', hub ? { hub } : {}, res => {
      if (!res.success) return res.message;
      const lines = (res.data || []).map((s: any) =>
        `• ${s.hub} (${s.region}, ${s.stationedTrucks} trucks): ${s.modelName} + ${s.recommendedTrailer} trailer — $${s.totalCost.toLocaleString()}`
      ).join('\n');
      return `${res.message}\n${lines}`;
    });
  }

  const buyTrailerMatch = p.match(/(?:buy|purchase)\s+trailer\s+([a-z0-9_]+)/i);
  if (buyTrailerMatch) {
    return runTool(S, 'buy_trailer', { trailerType: buyTrailerMatch[1] });
  }

  const hitchMatch = p.match(/hitch\s+([a-z0-9_]+)\s+(?:to\s+)?(?:truck\s+)?#?(\d+)/i);
  if (hitchMatch) {
    return runTool(S, 'hitch_trailer', {
      trailerType: hitchMatch[1],
      truckId: parseInt(hitchMatch[2], 10)
    });
  }

  const unhitchMatch = p.match(/unhitch\s+(?:truck\s+)?#?(\d+)/i);
  if (unhitchMatch) {
    return runTool(S, 'unhitch_trailer', { truckId: parseInt(unhitchMatch[1], 10) });
  }

  const buyTruckMatch = p.match(/(?:buy|purchase)\s+(?:a\s+)?([a-z0-9_-]+)(?:\s+with\s+([a-z0-9_]+))?(?:\s+(?:in|at|to)\s+([a-z0-9_\s-]+))?/i);
  if (buyTruckMatch && !['hub', 'trailer', 'license', 'fuel', 'diesel'].includes(buyTruckMatch[1].toLowerCase())) {
    return runTool(S, 'buy_truck', {
      modelId: buyTruckMatch[1],
      trailer: buyTruckMatch[2] || undefined,
      location: buyTruckMatch[3]?.trim() || undefined
    });
  }

  const sellTruckMatch = p.match(/sell\s+truck\s+#?(\d+)/i);
  if (sellTruckMatch) {
    return runTool(S, 'sell_truck', { truckId: parseInt(sellTruckMatch[1], 10) });
  }

  const bulkSvcMatch = p.match(/(?:service|refuel|maintain)\s+(?:idle\s+)?(?:fleet|all|trucks?)(?:\s+(?:in|at)\s+([a-z0-9_\s-]+))?/i);
  if (bulkSvcMatch) {
    return runTool(S, 'bulk_service_fleet', { hub: bulkSvcMatch[1]?.trim() || undefined });
  }

  const svcMatch = p.match(/service\s+truck\s+#?(\d+)/i);
  if (svcMatch) {
    return runTool(S, 'service_truck_consumables', { truck: svcMatch[1] });
  }

  if (/(?:top\s*up|service)\s+(?:all\s+)?consumables/i.test(p)) {
    return runTool(S, 'service_truck_consumables', { truck: 'all' });
  }

  const upgradeMatch = p.match(/upgrade\s+(?:truck\s+)?#?(\S+)\s+(?:with\s+)?(eco_tuning|performance_chip|heavy_suspension|16spd_crawler|12spd_highway|heavy_diff_lock|highway_eco_axle|all_terrain_winter|heavy_traction|highway_eco_tires)/i);
  if (upgradeMatch) {
    return runTool(S, 'upgrade_truck_powertrain', { truck: upgradeMatch[1], upgrade: upgradeMatch[2].toLowerCase() });
  }

  if (/rest\s+all\s+drivers/i.test(p)) {
    return runTool(S, 'rest_driver', { all: true });
  }
  const restDriverMatch = p.match(/rest\s+driver\s+(.+)/i);
  if (restDriverMatch) {
    return runTool(S, 'rest_driver', { driver: restDriverMatch[1].trim() });
  }

  if (/pay\s+(?:all\s+)?(?:dot\s+)?(?:fines|violations|citations)/i.test(p)) {
    return runTool(S, 'pay_dot_violations', {});
  }

  const tollMatch = p.match(/(?:enable|buy|get)\s+(?:all\s+)?(ez\s*pass|customs\s*bond|toll\s*pass)(?:\s+for\s+(?:truck\s+)?#?(\S+))?/i);
  if (tollMatch) {
    const type = /customs/i.test(tollMatch[1]) ? 'customs_bond' : 'ez_pass';
    return runTool(S, 'manage_toll_passes', { type, truck: tollMatch[2] || 'all' });
  }

  const relocateMatch = p.match(/relocate\s+(?:truck\s+)?#?(\S+)\s+to\s+(.+)/i);
  if (relocateMatch) {
    return runTool(S, 'relocate_truck', { truck: relocateMatch[1], city: relocateMatch[2].trim() });
  }

  const renameMatch = p.match(/rename\s+(?:truck\s+)?#?(\S+)\s+to\s+(.+)/i);
  if (renameMatch) {
    return runTool(S, 'rename_truck', { truck: renameMatch[1], newName: renameMatch[2].trim() });
  }

  const leaseMatch = p.match(/lease\s+([a-z0-9_-]+)(?:\s+(?:in|at)\s+(.+))?/i);
  if (leaseMatch) {
    return runTool(S, 'lease_truck', { modelId: leaseMatch[1], hub: leaseMatch[2]?.trim() });
  }

  const perkMatch = p.match(/(?:buy|unlock)\s+(?:company\s+)?perk\s+([a-z0-9_-]+)/i);
  if (perkMatch) {
    return runTool(S, 'buy_company_perk', { perkId: perkMatch[1] });
  }

  const repMatch = p.match(/repair\s+truck\s+#?(\d+)/i);
  if (repMatch) {
    return runTool(S, 'repair_truck_components', { truckId: parseInt(repMatch[1], 10) });
  }

  const paintMatch = p.match(/paint\s+truck\s+#?(\d+)\s+([#a-z0-9]+)/i);
  if (paintMatch) {
    return runTool(S, 'set_truck_color', { truckId: parseInt(paintMatch[1], 10), color: paintMatch[2] });
  }

  if (/\bfleet\b|\btrucks?\b|\bgarage\b/.test(p)) {
    return runTool(S, 'get_fleet_status', {}, res => {
      if (!res.success) return res.message;
      const lines = res.data.fleet.slice(0, 12).map((t: any) =>
        `• #${t.id} ${t.name} [${t.status.toUpperCase()}] @ ${t.loc} · ${t.trailer} · Driver: ${t.driver} · Fuel ${t.fuel}`
      ).join('\n');
      return `${res.message}\n${lines}`;
    });
  }

  // --- FINANCE, LOANS & CRYPTO ---
  const loanMatch = p.match(/(take|repay)\s+loan(?:\s+\$?(\d+))?/i);
  if (loanMatch) {
    return runTool(S, 'manage_loan', {
      action: loanMatch[1].toLowerCase(),
      amount: loanMatch[2] ? parseInt(loanMatch[2], 10) : 50000
    });
  }

  if (/\bloans?\b|\bcredit\b/.test(p)) {
    return runTool(S, 'manage_loan', { action: 'status' });
  }

  if (/\bmoney\b|\bfinance\b|\bpnl\b|\bp&l\b|\bcash\b|\bprofit\b/.test(p)) {
    return runTool(S, 'get_financial_summary', {});
  }

  const cryptoTradeMatch = p.match(/(buy|sell)\s+\$?(\d+)\s+(?:of\s+)?([a-z]{2,5})/i);
  if (cryptoTradeMatch) {
    return runTool(S, 'trade_crypto', {
      action: cryptoTradeMatch[1].toLowerCase(),
      usdAmount: parseInt(cryptoTradeMatch[2], 10),
      symbol: cryptoTradeMatch[3].toUpperCase()
    });
  }

  if (/crypto\s+bot|trading\s+bot/i.test(p)) {
    const enable = /enable|start|turn\s+on/i.test(p);
    return runTool(S, 'toggle_ai_crypto_bot', { enabled: enable });
  }

  return {
    reply: `I can manage your entire NexHaul operation! Try one of the quick buttons above or commands like:\n• "list hubs" / "buy hub rotterdam" / "show jobs in lagos"\n• "dispatch hub lagos" / "dispatch all idle trucks" / "show auctions"\n• "staff idle trucks" / "hire driver in europe" / "service idle fleet"\n• "buy scania_r500 with box in lagos" / "daily pnl" / "loan status"`,
    actions: [
      { label: 'List Hubs', prompt: 'list hubs' },
      { label: 'Hub Jobs Summary', prompt: 'hub jobs' },
      { label: 'Dispatch Idle Fleet', prompt: 'dispatch all idle trucks' },
      { label: 'Daily P&L', prompt: 'daily pnl' }
    ]
  };
}

/**
 * Sends a prompt to Gemini (if API key provided) or executes locally via the full-game intent engine.
 * Supports optional `mutateFn` (e.g. store `set`) so all state mutations are safely persisted.
 */
export async function processCopilotMessage(
  S: any,
  prompt: string,
  apiKey?: string,
  mutateFn?: (fn: (state: any) => void) => void
): Promise<{ reply: string; toolCall?: any; actions?: CopilotActionChip[] }> {
  if (!apiKey) {
    let result: LocalIntentResult = { reply: 'Unable to process command.' };
    if (mutateFn) {
      mutateFn(latest => {
        result = processLocalIntent(latest, prompt);
      });
    } else {
      result = processLocalIntent(S, prompt);
    }
    return result;
  }

  try {
    const systemPrompt = `You are the NexHaul Logistics AI Co-Pilot. You manage the player's entire trucking & hub empire: hubs, hub freight boards, dispatch, live auctions, 30-day tenders, trucks, trailers, drivers, licenses, maintenance, loans, and finance.
When the user gives a multi-step command (e.g. buy trucks, hire drivers, and dispatch them), execute EVERY step sequentially using your tools before giving your final reply. Use get_dealership_catalog / list_hubs to check models and owned hubs if needed, buy_truck with quantity for batch purchases, staff_idle_trucks to hire & assign drivers, and auto_dispatch_hub to dispatch trucks. Be concise and report actual results from the tool outputs.`;

    const functionDeclarations = COPILOT_TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }));

    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
    const executedTools: { name: string; args: Record<string, any>; result: any }[] = [];
    let latestActions: CopilotActionChip[] | undefined;
    const MAX_TOOL_TURNS = 10;

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      let response: Response;
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            tools: [{ function_declarations: functionDeclarations }]
          })
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`API HTTP ${response.status}`);
      }

      const data = await response.json();
      const modelContent = data.candidates?.[0]?.content;
      const parts: any[] = modelContent?.parts || [];
      if (parts.length === 0) throw new Error('Empty AI response');

      const functionCalls = parts.filter((p: any) => p.functionCall);
      if (functionCalls.length === 0) {
        const textReply = parts.map((p: any) => p.text || '').join('').trim() || 'Command processed.';
        const lastTool = executedTools[executedTools.length - 1];
        return {
          reply: textReply,
          toolCall: executedTools.length > 0
            ? {
                name: executedTools.map(t => t.name).join(' → '),
                args: lastTool.args,
                result: lastTool.result
              }
            : undefined,
          actions: latestActions
        };
      }

      // Execute all function calls returned in this turn
      contents.push({ role: 'model', parts });
      const functionResponseParts: any[] = [];

      for (const part of functionCalls) {
        const { name, args } = part.functionCall;
        let execResult: any = { success: false, message: 'No state.' };
        if (mutateFn) {
          mutateFn(latest => {
            execResult = executeCopilotTool(latest, name, args || {});
          });
        } else {
          execResult = executeCopilotTool(S, name, args || {});
        }
        executedTools.push({ name, args: args || {}, result: execResult });
        if (execResult.actions) latestActions = execResult.actions;

        functionResponseParts.push({
          functionResponse: {
            name,
            response: {
              success: execResult.success,
              message: execResult.message,
              data: execResult.data
            }
          }
        });
      }

      contents.push({ role: 'user', parts: functionResponseParts });
    }

    const summary = executedTools.map(t => `${t.result.success ? '✅' : '⚠️'} ${t.result.message}`).join('\n');
    const lastTool = executedTools[executedTools.length - 1];
    return {
      reply: summary || 'Operations completed.',
      toolCall: lastTool ? { name: executedTools.map(t => t.name).join(' → '), args: lastTool.args, result: lastTool.result } : undefined,
      actions: latestActions
    };
  } catch (err: any) {
    let fallback: LocalIntentResult = { reply: 'Error.' };
    if (mutateFn) {
      mutateFn(latest => {
        fallback = processLocalIntent(latest, prompt);
      });
    } else {
      fallback = processLocalIntent(S, prompt);
    }
    return {
      reply: `(Offline Fallback · ${err.message})\n${fallback.reply}`,
      toolCall: fallback.toolCall,
      actions: fallback.actions
    };
  }
}
