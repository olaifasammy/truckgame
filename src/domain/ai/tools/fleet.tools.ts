import { CopilotTool } from '../copilot.types';
import { TRUCK_MODELS, TRAILERS, TRAILER_PRICES } from '../../trucks/trucks.data';
import { createTruck } from '../../trucks/trucks.physics';
import { LOCATIONS } from '../../../data/world';
import { VehicleMaintenance, CONSUMABLES_SERVICE_COST } from '../../trucks/maintenance';
import { VehicleUpgrades } from '../../trucks/upgrades';
import { registerTruckAtCity, bulkRenewFleetRoadTax, payAllViolations, buyEzPass, buyCustomsBond, getCompanySafetyRating, GOV_FEES } from '../../trucks/registration';

function calcTruckPrice(modelId: string, negotiatorLvl = 0): number {
  const base = TRUCK_MODELS[modelId]?.price || 150000;
  const disc = Math.min(0.15, (negotiatorLvl || 0) * 0.03);
  return Math.round(base * (1 - disc));
}
import { getHubFacility } from '../../hubs/hub-facility';
import { getHubWholesaleFuelPrice } from '../../economy/fuel-market';
import { REGIONAL_HUBS } from '../../logistics/network';
import { getHubCharacteristics } from '../../hubs/characteristics';
import { findHub } from './hub.tools';

export function resolveTruck(S: any, idOrName: string | number) {
  if (typeof idOrName === 'number') {
    return (S.fleet || []).find((t: any) => t.id === idOrName);
  }
  const q = String(idOrName || '').toLowerCase().trim();
  const num = parseInt(q.replace('#', ''), 10);
  if (!isNaN(num)) {
    const byId = (S.fleet || []).find((t: any) => t.id === num);
    if (byId) return byId;
  }
  return (S.fleet || []).find((t: any) => t.name.toLowerCase().includes(q));
}

export const FLEET_TOOLS: CopilotTool[] = [
  {
    name: 'get_fleet_status',
    description: 'Inspect all owned trucks, their locations, trailer hitches, drivers, fuel, condition, and status.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const fleet = (S.fleet || []).map((t: any) => {
        const model = TRUCK_MODELS[t.modelId];
        const driver = (S.drivers || []).find((d: any) => d.id === t.driverId);
        return {
          id: t.id,
          name: t.name,
          model: model ? `${model.brand} ${model.name}` : t.modelId,
          status: t.status,
          loc: t.loc,
          trailer: t.trailer || 'none',
          driver: driver ? driver.name : 'Unassigned',
          fuel: `${Math.round(t.fuel || 0)}%`,
          cond: `${Math.round(t.cond ?? 100)}%`
        };
      });
      return {
        success: true,
        message: `You have ${fleet.length} truck(s) and ${(S.trailers || []).length} spare yard trailer(s).`,
        data: { fleet, yardTrailers: S.trailers || [] }
      };
    }
  },
  {
    name: 'get_dealership_catalog',
    description: 'Get truck models and trailer prices available at the dealership.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const trucks = Object.values(TRUCK_MODELS).map(m => ({
        id: m.id,
        name: `${m.brand} ${m.name}`,
        region: m.region,
        price: calcTruckPrice(m.id, S.skills?.negotiator || 0),
        haul: m.haul
      }));
      const trailers = Object.entries(TRAILER_PRICES).map(([k, price]) => ({
        id: k,
        name: TRAILERS[k as keyof typeof TRAILERS] || k,
        price
      }));
      return {
        success: true,
        message: `${trucks.length} truck model(s) and ${trailers.length} trailer type(s) available.`,
        data: { trucks: trucks.slice(0, 20), trailers }
      };
    }
  },
  {
    name: 'recommend_trucks',
    description: 'Recommend which trucks and trailers to buy based on your owned hubs, regional hub specialties, existing fleet gaps, and current cash balance.',
    parameters: {
      type: 'object',
      properties: {
        hub: { type: 'string', description: 'Optional specific hub city/name to evaluate' }
      }
    },
    execute: (S: any, { hub }: { hub?: string }) => {
      const cash = Math.round(S.money || 0);
      const ownedHubIds: string[] = S.depots || [];
      const ownedHubs = REGIONAL_HUBS.filter(h => ownedHubIds.includes(h.id));
      if (ownedHubs.length === 0) {
        return { success: false, message: 'You do not own any hubs yet. Buy a hub first.' };
      }

      const targetHubs = hub
        ? ownedHubs.filter(h => h.id.toLowerCase() === hub.toLowerCase() || h.city.toLowerCase() === hub.toLowerCase() || h.name.toLowerCase().includes(hub.toLowerCase()))
        : ownedHubs;

      if (targetHubs.length === 0) {
        return { success: false, message: `Owned hub "${hub}" not found.` };
      }

      const neg = S.skills?.negotiator || 0;
      const fleet = S.fleet || [];

      // Prioritize hubs with fewest stationed trucks first
      const rankedHubs = [...targetHubs].sort((a, b) => {
        const aCount = fleet.filter((t: any) => t.loc === a.city).length;
        const bCount = fleet.filter((t: any) => t.loc === b.city).length;
        return aCount - bCount;
      });

      const suggestions: any[] = [];
      const actions: { label: string; prompt: string }[] = [];

      for (const h of rankedHubs.slice(0, 3)) {
        const chars = getHubCharacteristics(h.id);
        const hubFleet = fleet.filter((t: any) => t.loc === h.city);
        const preferredTrailer = chars.specialties?.[0]?.trailer || 'curtain';
        const trailerPrice = TRAILER_PRICES[preferredTrailer as keyof typeof TRAILER_PRICES] || 15000;

        // Filter regional or compatible models that fit budget (keep 15% cash buffer when possible)
        const budget = cash > 50000 ? Math.round(cash * 0.85) : cash;
        const candidates = Object.values(TRUCK_MODELS)
          .filter(m => m.haul.includes(preferredTrailer as any))
          .map(m => ({
            model: m,
            truckCost: calcTruckPrice(m.id, neg),
            totalCost: calcTruckPrice(m.id, neg) + trailerPrice,
            sameRegion: m.region === h.region
          }))
          .filter(c => c.totalCost <= budget)
          .sort((a, b) => {
            if (a.sameRegion !== b.sameRegion) return a.sameRegion ? -1 : 1;
            return b.totalCost - a.totalCost; // Best affordable spec
          });

        const best = candidates[0];
        if (best) {
          suggestions.push({
            hub: h.city,
            region: h.region,
            stationedTrucks: hubFleet.length,
            modelId: best.model.id,
            modelName: `${best.model.brand} ${best.model.name}`,
            recommendedTrailer: preferredTrailer,
            totalCost: best.totalCost
          });
          actions.push({
            label: `Buy ${best.model.brand} + ${preferredTrailer} @ ${h.city} ($${best.totalCost.toLocaleString()})`,
            prompt: `buy ${best.model.id} with ${preferredTrailer} in ${h.city}`
          });
        }
      }

      if (suggestions.length === 0) {
        const cheapest = Object.values(TRUCK_MODELS)
          .map(m => ({ m, price: calcTruckPrice(m.id, neg) }))
          .sort((a, b) => a.price - b.price)[0];
        return {
          success: false,
          message: `Cash ($${cash.toLocaleString()}) is too low for a new tractor + trailer package. Cheapest tractor is ${cheapest.m.brand} ${cheapest.m.name} at $${cheapest.price.toLocaleString()}.`,
          actions: [{ label: 'Take $50k Loan', prompt: 'take loan 50000' }]
        };
      }

      return {
        success: true,
        message: `Based on your $${cash.toLocaleString()} balance and ${ownedHubs.length} owned hub(s), here are the best truck purchases:`,
        data: suggestions,
        actions
      };
    }
  },
  {
    name: 'buy_truck',
    description: 'Purchase one or more trucks from the dealership and deliver them to an owned hub.',
    parameters: {
      type: 'object',
      properties: {
        modelId: { type: 'string', description: 'Model ID or name (e.g. scania_s730, daf, volvo)' },
        location: { type: 'string', description: 'Delivery hub city (default homeCity)' },
        trailer: { type: 'string', description: 'Optional trailer type to buy and hitch immediately' },
        color: { type: 'string', description: 'Optional paint hex or color name' },
        quantity: { type: 'number', description: 'Number of trucks to buy (default 1, max 50)' }
      },
      required: ['modelId']
    },
    execute: (S: any, args: any) => {
      const q = (args.modelId || '').toLowerCase().trim();
      const model = TRUCK_MODELS[args.modelId] ||
        Object.values(TRUCK_MODELS).find(m => m.id.toLowerCase().includes(q) || `${m.brand} ${m.name}`.toLowerCase().includes(q));
      if (!model) return { success: false, message: `Model "${args.modelId}" not found.` };

      const destHub = args.location ? findHub(args.location) : null;
      const destCity = destHub ? destHub.city : (args.location || S.homeCity || 'LAGOS').toUpperCase();
      if (!LOCATIONS[destCity]) return { success: false, message: `Invalid destination city "${destCity}".` };

      const qty = Math.max(1, Math.min(50, Math.floor(Number(args.quantity) || 1)));
      const truckCost = calcTruckPrice(model.id, S.skills?.negotiator || 0);
      let trailerCost = 0;
      const trType = args.trailer && TRAILERS[args.trailer as keyof typeof TRAILERS] ? args.trailer : null;
      if (trType) trailerCost = TRAILER_PRICES[trType as keyof typeof TRAILER_PRICES] || 0;

      const unitTotal = truckCost + trailerCost;
      const total = unitTotal * qty;
      if ((S.money || 0) < total) {
        return { success: false, message: `Insufficient funds for ${qty}x ${model.brand} ${model.name}. Need $${total.toLocaleString()}, have $${Math.round(S.money || 0).toLocaleString()}.` };
      }

      S.money -= total;
      if (!S.fleet) S.fleet = [];
      const boughtIds: number[] = [];
      let hitched = false;

      for (let i = 0; i < qty; i++) {
        const id = (S.nextId = (S.nextId || 100) + 1);
        const t = createTruck(id, model.id, `${model.brand} #${id}`, destCity, trType && model.haul.includes(trType as any) ? trType as any : null);
        if (args.color) t.color = args.color;
        if (t.trailer) hitched = true;
        if (trType && !t.trailer) S.trailers = [...(S.trailers || []), trType];
        S.fleet.push(t);
        boughtIds.push(id);
      }

      return {
        success: true,
        message: `Purchased ${qty}x ${model.brand} ${model.name} (${boughtIds.map(id => `#${id}`).join(', ')}) stationed at ${destCity}${hitched ? ` with ${trType} trailer(s)` : ''} for $${total.toLocaleString()}.`,
        data: { boughtIds, destCity, totalCost: total },
        actions: [{ label: `Staff ${destCity}`, prompt: `staff idle trucks in ${destCity}` }]
      };
    }
  },
  {
    name: 'sell_truck',
    description: 'Sell an idle truck for 65% of its original purchase value.',
    parameters: {
      type: 'object',
      properties: { truckId: { type: 'number', description: 'Truck ID' } },
      required: ['truckId']
    },
    execute: (S: any, { truckId }: { truckId: number }) => {
      const idx = (S.fleet || []).findIndex((t: any) => t.id === truckId);
      if (idx === -1) return { success: false, message: `Truck #${truckId} not found.` };
      const t = S.fleet[idx];
      if (t.status !== 'idle') return { success: false, message: `Cannot sell ${t.name} while ${t.status}.` };
      const refund = Math.round(calcTruckPrice(t.modelId, 0) * 0.65);
      if (t.trailer) {
        if (!S.trailers) S.trailers = [];
        S.trailers.push(t.trailer);
      }
      S.fleet.splice(idx, 1);
      S.money = (S.money || 0) + refund;
      return { success: true, message: `Sold ${t.name} for $${refund.toLocaleString()}.` };
    }
  },
  {
    name: 'buy_trailer',
    description: 'Purchase a new trailer into your yard.',
    parameters: {
      type: 'object',
      properties: { trailerType: { type: 'string', description: 'Trailer type (box, curtain, reefer, flatbed, lowboy, tanker, tipper, carrier, container, double_trailer)' } },
      required: ['trailerType']
    },
    execute: (S: any, { trailerType }: { trailerType: string }) => {
      const key = trailerType.toLowerCase().trim() as keyof typeof TRAILERS;
      if (!TRAILERS[key]) return { success: false, message: `Unknown trailer type "${trailerType}".` };
      const price = TRAILER_PRICES[key] || 15000;
      if ((S.money || 0) < price) return { success: false, message: `Need $${price.toLocaleString()} to buy ${TRAILERS[key]}.` };
      S.money -= price;
      if (!S.trailers) S.trailers = [];
      S.trailers.push(key);
      return { success: true, message: `Purchased ${TRAILERS[key]} for $${price.toLocaleString()}.` };
    }
  },
  {
    name: 'hitch_trailer',
    description: 'Hitch a trailer from your yard onto an idle truck.',
    parameters: {
      type: 'object',
      properties: {
        truckId: { type: 'number', description: 'Truck ID' },
        trailerType: { type: 'string', description: 'Trailer type in S.trailers' }
      },
      required: ['truckId', 'trailerType']
    },
    execute: (S: any, { truckId, trailerType }: { truckId: number; trailerType: string }) => {
      const t = resolveTruck(S, truckId);
      if (!t) return { success: false, message: `Truck #${truckId} not found.` };
      if (t.status !== 'idle') return { success: false, message: `${t.name} must be idle to hitch a trailer.` };
      const key = trailerType.toLowerCase().trim();
      const idx = (S.trailers || []).indexOf(key);
      if (idx === -1) return { success: false, message: `No "${key}" trailer available in your yard.` };
      const model = TRUCK_MODELS[t.modelId];
      if (model && !model.haul.includes(key as any)) {
        return { success: false, message: `${model.brand} ${model.name} cannot haul a ${key} trailer.` };
      }
      if (t.trailer) S.trailers.push(t.trailer);
      S.trailers.splice(idx, 1);
      t.trailer = key;
      return { success: true, message: `Hitched ${TRAILERS[key as keyof typeof TRAILERS] || key} to ${t.name}.` };
    }
  },
  {
    name: 'unhitch_trailer',
    description: 'Unhitch a truck trailer and store it in your yard.',
    parameters: {
      type: 'object',
      properties: { truckId: { type: 'number', description: 'Truck ID' } },
      required: ['truckId']
    },
    execute: (S: any, { truckId }: { truckId: number }) => {
      const t = resolveTruck(S, truckId);
      if (!t) return { success: false, message: `Truck #${truckId} not found.` };
      if (t.status !== 'idle') return { success: false, message: `${t.name} must be idle to unhitch.` };
      if (!t.trailer) return { success: false, message: `${t.name} is already bobtail.` };
      if (!S.trailers) S.trailers = [];
      S.trailers.push(t.trailer);
      const old = t.trailer;
      t.trailer = null;
      return { success: true, message: `Unhitched ${old} trailer from ${t.name} into yard.` };
    }
  },
  {
    name: 'set_truck_color',
    description: 'Repaint a truck.',
    parameters: {
      type: 'object',
      properties: {
        truckId: { type: 'number', description: 'Truck ID' },
        color: { type: 'string', description: 'Hex color code' }
      },
      required: ['truckId', 'color']
    },
    execute: (S: any, { truckId, color }: { truckId: number; color: string }) => {
      const t = resolveTruck(S, truckId);
      if (!t) return { success: false, message: `Truck #${truckId} not found.` };
      t.color = color;
      return { success: true, message: `Repainted ${t.name} to ${color}.` };
    }
  },
  {
    name: 'service_truck_consumables',
    description: 'Replenish oil, coolant, and DEF for a specific truck.',
    parameters: {
      type: 'object',
      properties: { truckId: { type: 'number', description: 'Truck ID' } },
      required: ['truckId']
    },
    execute: (S: any, { truckId }: { truckId: number }) => {
      const t = resolveTruck(S, truckId);
      if (!t) return { success: false, message: `Truck #${truckId} not found.` };
      const err = VehicleMaintenance.serviceConsumables(S, t.id);
      if (err) return { success: false, message: err };
      return { success: true, message: `Serviced ${t.name} consumables (oil, coolant, DEF) via hub workshop.` };
    }
  },
  {
    name: 'repair_truck_components',
    description: 'Repair degraded mechanical components on a truck.',
    parameters: {
      type: 'object',
      properties: { truckId: { type: 'number', description: 'Truck ID' } },
      required: ['truckId']
    },
    execute: (S: any, { truckId }: { truckId: number }) => {
      const t = resolveTruck(S, truckId);
      if (!t) return { success: false, message: `Truck #${truckId} not found.` };
      const comps = t.components || {};
      const wornParts = Object.keys(comps).filter(k => (comps[k] ?? 100) < 90);
      if (wornParts.length === 0) return { success: true, message: `${t.name} components are in top condition.` };
      const err = VehicleMaintenance.startRepair(S, t.id, wornParts);
      if (err) return { success: false, message: err };
      return { success: true, message: `Started maintenance bay repair on ${t.name} for ${wornParts.join(', ')}.` };
    }
  },
  {
    name: 'bulk_service_fleet',
    description: 'Refuel, top up consumables, and repair idle trucks (at a specific hub or across the entire fleet).',
    parameters: {
      type: 'object',
      properties: { hub: { type: 'string', description: 'Optional hub city/name' } }
    },
    execute: (S: any, { hub }: { hub?: string }) => {
      const targetHub = hub ? findHub(hub) : null;
      const trucks = (S.fleet || []).filter((t: any) => t.status === 'idle' && (!targetHub || t.loc === targetHub.city));
      if (trucks.length === 0) return { success: false, message: `No idle trucks found${targetHub ? ` at ${targetHub.city}` : ''}.` };

      let refueled = 0;
      let serviced = 0;
      let spent = 0;
      for (const t of trucks) {
        if ((t.fuel ?? 100) < 95) {
          const model = TRUCK_MODELS[t.modelId];
          const cap = model?.fuelCap || 1000;
          const needLiters = Math.round(((100 - (t.fuel || 0)) / 100) * cap);
          const hubMatch = findHub(t.loc);
          const fac = hubMatch && (S.depots || []).includes(hubMatch.id) ? getHubFacility(S, hubMatch.id) : null;
          if (fac && fac.fuelLiters >= needLiters) {
            fac.fuelLiters -= needLiters;
            t.fuel = 100;
            refueled++;
          } else {
            const pricePerL = getHubWholesaleFuelPrice(t.loc) * 1.25;
            const fuelCost = Math.round(needLiters * pricePerL);
            if ((S.money || 0) >= fuelCost) {
              S.money -= fuelCost;
              spent += fuelCost;
              t.fuel = 100;
              refueled++;
            }
          }
        }
        if ((S.money || 0) >= CONSUMABLES_SERVICE_COST && (
          (t.components?.oil ?? 100) < 90 ||
          (t.components?.coolant ?? 100) < 90 ||
          (t.components?.adBlue ?? 100) < 90
        )) {
          const err = VehicleMaintenance.serviceConsumables(S, t.id);
          if (!err) {
            spent += CONSUMABLES_SERVICE_COST;
            serviced++;
          }
        }
      }

      return {
        success: true,
        message: `Fleet service complete${targetHub ? ` at ${targetHub.city}` : ''}: ${refueled} refueled, ${serviced} serviced ($${spent.toLocaleString()} spent).`
      };
    }
  },
  {
    name: 'register_vehicles_dmv',
    description: 'Register unregistered fleet vehicles at the DMV / DOT Government Registry (issues license plates, 1-year road tax, and inspection certificate).',
    parameters: {
      type: 'object',
      properties: {
        truckId: { type: 'number', description: 'Optional specific truck ID to register; omit to register all unregistered vehicles' },
        city: { type: 'string', description: 'Optional hub city for registration (defaults to each truck location or primary HQ hub)' }
      }
    },
    execute: (S: any, { truckId, city }: { truckId?: number; city?: string }) => {
      const fleet = S.fleet || [];
      if (fleet.length === 0) {
        return { success: false, message: 'No trucks in your fleet.' };
      }

      const defaultHubCity = REGIONAL_HUBS.find(h => (S.offices || []).includes(h.id))?.city || 'LAGOS';
      const targets = truckId
        ? fleet.filter((t: any) => t.id === truckId)
        : fleet.filter((t: any) => !t.regNo || t.registrationStatus === 'unregistered');

      if (targets.length === 0) {
        return {
          success: true,
          message: truckId
            ? `Truck #${truckId} not found.`
            : 'All vehicles in your fleet are already registered at the DMV.'
        };
      }

      let registered = 0;
      let totalCost = 0;
      const plates: string[] = [];

      for (const t of targets) {
        if (t.regNo && t.registrationStatus !== 'unregistered') continue;
        if ((S.money || 0) < GOV_FEES.REGISTRATION) break;
        const regCity = (city || t.loc || defaultHubCity).toUpperCase();
        if (registerTruckAtCity(S, t.id, regCity)) {
          registered++;
          totalCost += GOV_FEES.REGISTRATION;
          plates.push(`#${t.id} (${t.regNo})`);
        }
      }

      if (registered === 0) {
        return {
          success: false,
          message: `Insufficient funds to register vehicles ($${GOV_FEES.REGISTRATION.toLocaleString()} per truck).`
        };
      }

      return {
        success: true,
        message: `Registered ${registered} vehicle(s) at DMV for $${totalCost.toLocaleString()}: ${plates.join(', ')}.`,
        data: { registered, totalCost, plates }
      };
    }
  },
  {
    name: 'renew_fleet_road_tax',
    description: 'Bulk-renew annual HVUT road tax for all registered fleet vehicles whose road tax is expired or expiring soon.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const res = bulkRenewFleetRoadTax(S);
      if (res.renewedCount === 0) {
        return { success: true, message: 'No registered vehicles currently need road tax renewal (or insufficient funds).' };
      }
      return {
        success: true,
        message: `Renewed annual road tax for ${res.renewedCount} vehicle(s) (-$${res.totalCost.toLocaleString()}).`,
        data: res
      };
    }
  },
  {
    name: 'pay_dot_violations',
    description: 'Pay and clear all outstanding DOT compliance violations and citations.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const unpaid = (S.violations || []).filter((v: any) => !v.paid);
      if (unpaid.length === 0) {
        return { success: true, message: 'No unpaid DOT violations on record.' };
      }
      const total = unpaid.reduce((a: number, v: any) => a + (v.fine || 0), 0);
      if (!payAllViolations(S)) {
        return { success: false, message: `Insufficient funds to settle $${total.toLocaleString()} in DOT fines.` };
      }
      return { success: true, message: `Settled ${unpaid.length} DOT violation(s) for $${total.toLocaleString()} and cleared records.` };
    }
  },
  {
    name: 'manage_toll_passes',
    description: 'Purchase an Automated EZ-Pass Transponder Network or International Customs Surety Bond.',
    parameters: {
      type: 'object',
      properties: {
        passType: { type: 'string', description: 'ez_pass or customs_bond' }
      },
      required: ['passType']
    },
    execute: (S: any, { passType }: { passType: string }) => {
      const t = (passType || '').toLowerCase();
      if (t === 'ez_pass' || t === 'ezpass') {
        if (S.ezPass) return { success: true, message: 'EZ-Pass Transponder Network is already active.' };
        return buyEzPass(S)
          ? { success: true, message: 'Activated Automated EZ-Pass Transponder Network!' }
          : { success: false, message: `Insufficient funds for EZ-Pass ($${GOV_FEES.EZ_PASS_NETWORK.toLocaleString()}).` };
      }
      if (t === 'customs_bond' || t === 'customs') {
        if (S.customsBond) return { success: true, message: 'International Customs Surety Bond is already active.' };
        return buyCustomsBond(S)
          ? { success: true, message: 'Activated International Customs Surety Bond!' }
          : { success: false, message: `Insufficient funds for Customs Bond ($${GOV_FEES.CUSTOMS_BOND.toLocaleString()}).` };
      }
      return { success: false, message: 'Specify passType: ez_pass or customs_bond.' };
    }
  },
  {
    name: 'relocate_truck',
    description: 'Deadhead/relocate an idle truck to another owned hub in the same region.',
    parameters: {
      type: 'object',
      properties: {
        truckId: { type: 'number', description: 'Truck ID' },
        hubCity: { type: 'string', description: 'Destination owned hub city name' }
      },
      required: ['truckId', 'hubCity']
    },
    execute: (S: any, { truckId, hubCity }: { truckId: number; hubCity: string }) => {
      const truck = (S.fleet || []).find((t: any) => t.id === truckId);
      if (!truck) return { success: false, message: `Truck #${truckId} not found.` };
      if ((S.active || []).some((a: any) => a.truckId === truckId)) {
        return { success: false, message: `Truck #${truckId} is currently on an active dispatch.` };
      }
      const dest = REGIONAL_HUBS.find(
        h => (S.offices || []).includes(h.id) && (h.city.toLowerCase() === hubCity.toLowerCase().trim() || h.id.toLowerCase() === hubCity.toLowerCase().trim())
      );
      if (!dest) return { success: false, message: `You do not own a hub at "${hubCity}".` };
      const origin = LOCATIONS[truck.loc];
      if (origin && origin.region !== dest.region) {
        return { success: false, message: `Cannot drive Truck #${truckId} cross-region (${origin.region} -> ${dest.region}).` };
      }
      const fee = 250;
      if ((S.money || 0) < fee) return { success: false, message: `Insufficient funds ($${fee} deadhead cost).` };
      S.money -= fee;
      truck.loc = dest.city.toUpperCase();
      return { success: true, message: `Relocated Truck #${truckId} to ${dest.city} (-$${fee} deadhead fuel/tolls).` };
    }
  },
  {
    name: 'rename_truck',
    description: 'Rename a truck unit in the fleet registry.',
    parameters: {
      type: 'object',
      properties: {
        truckId: { type: 'number', description: 'Truck ID' },
        name: { type: 'string', description: 'New truck name/callsign (max 40 chars)' }
      },
      required: ['truckId', 'name']
    },
    execute: (S: any, { truckId, name }: { truckId: number; name: string }) => {
      const truck = (S.fleet || []).find((t: any) => t.id === truckId);
      if (!truck) return { success: false, message: `Truck #${truckId} not found.` };
      const clean = (name || '').trim().slice(0, 40);
      if (!clean) return { success: false, message: 'New truck name cannot be empty.' };
      truck.name = clean;
      return { success: true, message: `Renamed Truck #${truckId} to "${clean}".` };
    }
  },
  {
    name: 'lease_truck',
    description: 'Lease a new tractor ($18,000 down payment + daily lease payment) and station it at an owned hub.',
    parameters: {
      type: 'object',
      properties: {
        modelId: { type: 'string', description: 'Truck model ID (e.g. scania_s730, volvo_fh16)' },
        hub: { type: 'string', description: 'Owned hub city (optional)' }
      },
      required: ['modelId']
    },
    execute: (S: any, { modelId, hub }: { modelId: string; hub?: string }) => {
      if (getCompanySafetyRating(S).grade === 'UNSATISFACTORY') {
        return { success: false, message: 'Credit Freeze: Resolve FMCSA Unsatisfactory safety rating before leasing.' };
      }
      const model = TRUCK_MODELS[modelId];
      if (!model) return { success: false, message: `Unknown truck model "${modelId}".` };
      const downPayment = 18000;
      if ((S.money || 0) < downPayment) {
        return { success: false, message: `Insufficient funds for lease down payment ($${downPayment.toLocaleString()}).` };
      }
      const targetHub = hub
        ? REGIONAL_HUBS.find(h => (S.offices || []).includes(h.id) && h.city.toLowerCase().includes(hub.toLowerCase()))
        : REGIONAL_HUBS.find(h => (S.offices || []).includes(h.id));
      const loc = targetHub ? targetHub.city.toUpperCase() : 'LAGOS';
      S.money -= downPayment;
      const newId = S.nextId || (S.fleet.reduce((m: number, t: any) => Math.max(m, t.id || 0), 0) + 1);
      S.nextId = newId + 1;
      const newTruck = createTruck(newId, modelId, loc);
      S.fleet.push(newTruck);
      if (!S.leases) S.leases = [];
      const dailyRate = Math.round((model.price * 1.15) / 90);
      S.leases.push({
        id: `lease_${Date.now()}`,
        modelId,
        truckId: newId,
        dailyRate,
        daysRemaining: 90,
        buyoutPrice: Math.round(model.price * 0.4)
      });
      return {
        success: true,
        message: `Leased ${model.brand} ${model.name} (Unit #${newId}) at ${loc} for $18,000 down + $${dailyRate.toLocaleString()}/day.`
      };
    }
  },
  {
    name: 'upgrade_truck_powertrain',
    description: 'Install dynamic powertrain, ECU, suspension, gearbox, axle, or tire upgrades on an idle truck (affects real physics).',
    parameters: {
      type: 'object',
      properties: {
        truck: { type: 'string', description: 'Truck ID or name' },
        upgrade: {
          type: 'string',
          enum: ['eco_tuning', 'performance_chip', 'heavy_suspension', '16spd_crawler', '12spd_highway', 'heavy_diff_lock', 'highway_eco_axle', 'all_terrain_winter', 'heavy_traction', 'highway_eco_tires'],
          description: 'Upgrade type to install'
        }
      },
      required: ['truck', 'upgrade']
    },
    execute: (S: any, { truck, upgrade }: { truck: string; upgrade: string }) => {
      const t = resolveTruck(S, truck);
      if (!t) return { success: false, message: `Truck "${truck}" not found.` };
      if (t.status !== 'idle') return { success: false, message: `${t.name} must be idle to install upgrades.` };
      let err: string | null = null;
      if (upgrade === 'eco_tuning') err = VehicleUpgrades.upgradeEcoTuning(S, t.id);
      else if (upgrade === 'performance_chip') err = VehicleUpgrades.upgradePerformanceChip(S, t.id);
      else if (upgrade === 'heavy_suspension') err = VehicleUpgrades.upgradeHeavyDutySuspension(S, t.id);
      else if (upgrade === '16spd_crawler' || upgrade === '12spd_highway') err = VehicleUpgrades.upgradeGearbox(S, t.id, upgrade);
      else if (upgrade === 'heavy_diff_lock') err = VehicleUpgrades.upgradeAxle(S, t.id, 'heavy_diff_lock');
      else if (upgrade === 'highway_eco_axle') err = VehicleUpgrades.upgradeAxle(S, t.id, 'highway_eco');
      else if (upgrade === 'all_terrain_winter' || upgrade === 'heavy_traction') err = VehicleUpgrades.upgradeTires(S, t.id, upgrade);
      else if (upgrade === 'highway_eco_tires') err = VehicleUpgrades.upgradeTires(S, t.id, 'highway_eco');
      else return { success: false, message: `Unknown upgrade "${upgrade}".` };

      if (err) return { success: false, message: err };
      return { success: true, message: `Installed ${upgrade} on ${t.name}. Physics & telemetry updated.` };
    }
  },
  {
    name: 'service_truck_consumables',
    description: 'Top up AdBlue/DEF, Coolant, and Lube Oil on a specific idle truck or all idle trucks.',
    parameters: {
      type: 'object',
      properties: {
        truck: { type: 'string', description: 'Truck ID/name, or "all" for all idle trucks' }
      },
      required: ['truck']
    },
    execute: (S: any, args: { truck?: string; truckId?: number }) => {
      const targetKey = String(args.truck ?? args.truckId ?? '');
      const targets = targetKey.toLowerCase() === 'all'
        ? (S.fleet || []).filter((t: any) => t.status === 'idle')
        : [resolveTruck(S, targetKey)].filter(Boolean);
      if (targets.length === 0) return { success: false, message: `No matching idle truck found for "${targetKey}".` };
      let done = 0;
      for (const t of targets) {
        const err = VehicleMaintenance.serviceConsumables(S, t.id);
        if (!err) done++;
      }
      if (done === 0) return { success: false, message: 'Could not service consumables (insufficient funds or truck busy).' };
      return { success: true, message: `Serviced AdBlue, Coolant & Lube Oil on ${done} truck(s).` };
    }
  }
];
