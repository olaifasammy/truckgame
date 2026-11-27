import { CopilotTool } from '../copilot.types';
import { REGIONAL_HUBS, REGION_AUTHORITIES, RegionName, isRegionUnlocked } from '../../logistics/network';
import { upgradeHubFacility, buyHubWholesaleFuel, getHubFacility, getHubFacilityUpgradeCost } from '../../hubs/hub-facility';
import { FreightEngine } from '../../freight/engine/generator';
import { PART_BASE_PRICES, getWholesalePartPrice } from '../../trucks/maintenance';
import { PERKS } from '../../../data/shop';

export function findHub(query: string) {
  const q = (query || '').toLowerCase().trim();
  return REGIONAL_HUBS.find(
    h => h.id.toLowerCase() === q || h.city.toLowerCase() === q || h.name.toLowerCase().includes(q)
  );
}

export const HUB_TOOLS: CopilotTool[] = [
  {
    name: 'list_hubs',
    description: 'List all owned hubs (with parked trucks, open jobs, level, fuel) and available hubs in unlocked regions.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const ownedIds: string[] = S.depots || [];
      const unlocked = S.unlockedRegions || ['Africa'];
      const owned = REGIONAL_HUBS.filter(h => ownedIds.includes(h.id)).map(h => {
        const fac = getHubFacility(S, h.id);
        const parked = (S.fleet || []).filter((t: any) => t.loc === h.city).length;
        const jobs = (S.hubJobs?.[h.id] || []).length;
        return {
          id: h.id,
          name: h.name,
          city: h.city,
          region: h.region,
          level: fac.level,
          parkedTrucks: parked,
          availableJobs: jobs,
          fuelLiters: Math.round(fac.fuelLiters || 0)
        };
      });

      const available = REGIONAL_HUBS.filter(
        h => !ownedIds.includes(h.id) && unlocked.includes(h.region)
      ).map(h => ({
        id: h.id,
        name: h.name,
        city: h.city,
        region: h.region,
        cost: h.cost
      }));

      return {
        success: true,
        message: `You own ${owned.length} hub(s) and have ${available.length} available to purchase in unlocked regions.`,
        data: { owned, available },
        actions: owned.slice(0, 3).map(h => ({
          label: `Jobs: ${h.city} (${h.availableJobs})`,
          prompt: `show jobs in ${h.city}`
        }))
      };
    }
  },
  {
    name: 'buy_hub',
    description: 'Purchase a new regional hub terminal by city, name, or hub ID.',
    parameters: {
      type: 'object',
      properties: {
        hub: { type: 'string', description: 'Hub city, name, or ID (e.g. "Rotterdam", "hub_lagos")' }
      },
      required: ['hub']
    },
    execute: (S: any, { hub }: { hub: string }) => {
      const target = findHub(hub);
      if (!target) return { success: false, message: `Hub "${hub}" not found.` };
      if ((S.depots || []).includes(target.id)) {
        return { success: false, message: `You already own ${target.name} (${target.city}).` };
      }
      if (!isRegionUnlocked(S, target.region)) {
        return {
          success: false,
          message: `Region ${target.region} is locked. Unlock ${target.region} first.`,
          actions: [{ label: `Unlock ${target.region}`, prompt: `unlock region ${target.region}` }]
        };
      }
      if ((S.money || 0) < target.cost) {
        return {
          success: false,
          message: `Insufficient funds to buy ${target.name}. Need $${target.cost.toLocaleString()}, have $${Math.round(S.money || 0).toLocaleString()}.`
        };
      }
      S.money -= target.cost;
      if (!S.depots) S.depots = [];
      S.depots.push(target.id);
      getHubFacility(S, target.id);
      FreightEngine.replenishHub(S, target.id, 6);
      return {
        success: true,
        message: `Purchased ${target.name} (${target.city}) for $${target.cost.toLocaleString()} and generated initial freight loads.`,
        actions: [
          { label: `View ${target.city} Jobs`, prompt: `show jobs in ${target.city}` },
          { label: `Buy Truck in ${target.city}`, prompt: `buy scania_r500 in ${target.city}` }
        ]
      };
    }
  },
  {
    name: 'upgrade_hub',
    description: 'Upgrade an owned hub terminal level (increases berths, diesel tank, and daily capacity).',
    parameters: {
      type: 'object',
      properties: {
        hub: { type: 'string', description: 'Owned hub city, name, or ID' }
      },
      required: ['hub']
    },
    execute: (S: any, { hub }: { hub: string }) => {
      const target = findHub(hub);
      if (!target || !(S.depots || []).includes(target.id)) {
        return { success: false, message: `Owned hub "${hub}" not found.` };
      }
      const fac = getHubFacility(S, target.id);
      const cost = getHubFacilityUpgradeCost(fac, S);
      if ((S.money || 0) < cost) {
        return { success: false, message: `Need $${cost.toLocaleString()} to upgrade ${target.name} to Level ${fac.level + 1}.` };
      }
      const ok = upgradeHubFacility(S, target.id);
      if (!ok) return { success: false, message: `Could not upgrade ${target.name} (may be at max level).` };
      return {
        success: true,
        message: `Upgraded ${target.name} (${target.city}) to Level ${fac.level} for $${cost.toLocaleString()}.`
      };
    }
  },
  {
    name: 'buy_hub_fuel',
    description: 'Buy wholesale diesel fuel for an owned hub terminal tank.',
    parameters: {
      type: 'object',
      properties: {
        hub: { type: 'string', description: 'Owned hub city, name, or ID' },
        liters: { type: 'number', description: 'Liters to purchase (default 5000)' }
      },
      required: ['hub']
    },
    execute: (S: any, { hub, liters = 5000 }: { hub: string; liters?: number }) => {
      const target = findHub(hub);
      if (!target || !(S.depots || []).includes(target.id)) {
        return { success: false, message: `Owned hub "${hub}" not found.` };
      }
      const ok = buyHubWholesaleFuel(S, target.id, liters);
      if (!ok) {
        return { success: false, message: `Could not purchase ${liters}L wholesale fuel for ${target.city} (check funds or tank capacity).` };
      }
      return {
        success: true,
        message: `Purchased ${liters.toLocaleString()}L wholesale diesel for ${target.name} (${target.city}).`
      };
    }
  },
  {
    name: 'get_hub_jobs',
    description: 'List available freight jobs on a specific owned hub board (or summarize all hub boards).',
    parameters: {
      type: 'object',
      properties: {
        hub: { type: 'string', description: 'Optional hub city, name, or ID' }
      }
    },
    execute: (S: any, { hub }: { hub?: string }) => {
      const ownedIds: string[] = S.depots || [];
      if (hub) {
        const target = findHub(hub);
        if (!target || !ownedIds.includes(target.id)) {
          return { success: false, message: `Owned hub "${hub}" not found.` };
        }
        const jobs = (S.hubJobs?.[target.id] || []).map((j: any) => ({
          id: j.id,
          cargo: j.cargoName,
          route: `${j.from} -> ${j.to}${j.isRoundTrip ? ' (Round-Trip)' : ''}`,
          trailer: j.trailer,
          km: j.km,
          payout: `$${(j.pay || 0).toLocaleString()}`
        }));
        return {
          success: true,
          message: `${target.name} (${target.city}) has ${jobs.length} active freight manifest(s).`,
          data: jobs,
          actions: [
            { label: `Dispatch ${target.city}`, prompt: `dispatch hub ${target.city}` },
            { label: `Refresh ${target.city} ($250)`, prompt: `refresh jobs in ${target.city}` }
          ]
        };
      }

      const summary = REGIONAL_HUBS.filter(h => ownedIds.includes(h.id)).map(h => ({
        hub: h.city,
        jobs: (S.hubJobs?.[h.id] || []).length,
        idleTrucks: (S.fleet || []).filter((t: any) => t.loc === h.city && t.status === 'idle').length
      }));
      const total = summary.reduce((a, b) => a + b.jobs, 0);
      return {
        success: true,
        message: `${total} total job(s) across ${summary.length} owned hub(s).`,
        data: summary,
        actions: summary.slice(0, 3).map(s => ({
          label: `${s.hub} (${s.jobs} jobs)`,
          prompt: `show jobs in ${s.hub}`
        }))
      };
    }
  },
  {
    name: 'refresh_hub_jobs',
    description: 'Refresh a hub terminal freight board for $250.',
    parameters: {
      type: 'object',
      properties: {
        hub: { type: 'string', description: 'Owned hub city, name, or ID' }
      },
      required: ['hub']
    },
    execute: (S: any, { hub }: { hub: string }) => {
      const target = findHub(hub);
      if (!target || !(S.depots || []).includes(target.id)) {
        return { success: false, message: `Owned hub "${hub}" not found.` };
      }
      const cost = 250;
      if ((S.money || 0) < cost) {
        return { success: false, message: `Need $${cost} to refresh ${target.city} freight board.` };
      }
      S.money -= cost;
      if (!S.hubJobs) S.hubJobs = {};
      S.hubJobs[target.id] = [];
      FreightEngine.replenishHub(S, target.id, 6);
      const count = S.hubJobs[target.id].length;
      return {
        success: true,
        message: `Refreshed ${target.name} (${target.city}) freight board ($250 fee). Generated ${count} new load(s).`,
        actions: [{ label: `Show ${target.city} Jobs`, prompt: `show jobs in ${target.city}` }]
      };
    }
  },
  {
    name: 'unlock_region',
    description: 'Unlock a new operating continent/region (Africa, Europe, America, Asia).',
    parameters: {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'Region name: Africa, Europe, America, or Asia' }
      },
      required: ['region']
    },
    execute: (S: any, { region }: { region: string }) => {
      const match = (Object.keys(REGION_AUTHORITIES) as RegionName[]).find(
        r => r.toLowerCase() === (region || '').trim().toLowerCase()
      );
      if (!match) return { success: false, message: `Unknown region "${region}".` };
      if (isRegionUnlocked(S, match)) {
        return { success: false, message: `${match} is already unlocked.` };
      }
      const auth = REGION_AUTHORITIES[match];
      if ((S.money || 0) < auth.cost) {
        return {
          success: false,
          message: `Insufficient funds to unlock ${match}. Need $${auth.cost.toLocaleString()}, have $${Math.round(S.money || 0).toLocaleString()}.`
        };
      }
      S.money -= auth.cost;
      if (!S.unlockedRegions) S.unlockedRegions = ['Africa'];
      S.unlockedRegions.push(match);
      return {
        success: true,
        message: `Unlocked ${match} operating authority (${auth.name}) for $${auth.cost.toLocaleString()}!`,
        actions: [{ label: 'List Available Hubs', prompt: 'list hubs' }]
      };
    }
  },
  {
    name: 'get_warehouse_inventory',
    description: 'Inspect HQ Warehouse inventory: spare parts stock, unhitched yard trailers, and freight licenses.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const parts = S.partsInventory || {};
      const trailers = S.trailers || [];
      const licenses = S.licenses || [];
      return {
        success: true,
        message: `HQ Warehouse: ${Object.values(parts).reduce((a: number, b: any) => a + (Number(b) || 0), 0)} spare parts, ${trailers.length} yard trailer(s), ${licenses.length} freight license(s).`,
        data: { parts, trailers, licenses }
      };
    }
  },
  {
    name: 'buy_warehouse_parts',
    description: 'Purchase wholesale OEM spare parts (engine, transmission, brakes, tires, suspension, windshield, fuelFilter, oilFilter, airFilter, oil, coolant, adBlue) into HQ Warehouse inventory.',
    parameters: {
      type: 'object',
      properties: {
        part: { type: 'string', description: 'Part key (e.g. tires, brakes, oilFilter, engine)' },
        quantity: { type: 'number', description: 'Quantity to buy (4+ gets bulk wholesale discount)' }
      },
      required: ['part']
    },
    execute: (S: any, { part, quantity = 1 }: { part: string; quantity?: number }) => {
      const key = Object.keys(PART_BASE_PRICES).find(k => k.toLowerCase() === (part || '').toLowerCase().trim());
      if (!key) {
        return { success: false, message: `Unknown part "${part}". Valid parts: ${Object.keys(PART_BASE_PRICES).join(', ')}.` };
      }
      const qty = Math.max(1, Math.round(quantity));
      const unitPrice = getWholesalePartPrice(key, qty);
      const totalCost = unitPrice * qty;
      if ((S.money || 0) < totalCost) {
        return { success: false, message: `Insufficient funds. Need $${totalCost.toLocaleString()} for ${qty}x ${key}.` };
      }
      S.money -= totalCost;
      if (!S.partsInventory) S.partsInventory = {};
      S.partsInventory[key] = (S.partsInventory[key] || 0) + qty;
      return {
        success: true,
        message: `Purchased ${qty}x ${key} at wholesale ($${totalCost.toLocaleString()}) into HQ Warehouse.`
      };
    }
  },
  {
    name: 'buy_company_perk',
    description: 'Upgrade a company perk using corporate funds (or omit perkId to list all perks).',
    parameters: {
      type: 'object',
      properties: {
        perkId: { type: 'string', description: 'Perk key from PERKS (or omit to list perks)' }
      }
    },
    execute: (S: any, { perkId }: { perkId?: string }) => {
      if (!perkId) {
        const list = Object.entries(PERKS).map(([k, p]: [string, any]) => {
          const lvl = (S.perks || {})[k] || 0;
          return `${k}: ${p.label} (L${lvl}/${p.max}, next $${(p.base * (lvl + 1)).toLocaleString()})`;
        });
        return { success: true, message: `Company Perks: ${list.join(' | ')}` };
      }
      const key = Object.keys(PERKS).find(k => k.toLowerCase() === perkId.toLowerCase().trim() || PERKS[k].label.toLowerCase().includes(perkId.toLowerCase().trim()));
      if (!key) return { success: false, message: `Perk "${perkId}" not found.` };
      const p = PERKS[key];
      if (!S.perks) S.perks = {};
      const lvl = S.perks[key] || 0;
      if (lvl >= p.max) return { success: false, message: `${p.label} is already at max level (${p.max}).` };
      const cost = p.base * (lvl + 1);
      if ((S.money || 0) < cost) return { success: false, message: `Insufficient funds for ${p.label} ($${cost.toLocaleString()}).` };
      S.money -= cost;
      S.perks[key] = lvl + 1;
      return { success: true, message: `Upgraded ${p.label} to Level ${lvl + 1} for $${cost.toLocaleString()}!` };
    }
  }
];
