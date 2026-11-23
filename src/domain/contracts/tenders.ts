/**
 * Enterprise 30-Day Corporate Tenders & Contracts of Affreightment Engine
 *
 * - Offers are deterministic per 6-hour rotation (same seed = same offers) and built from CLIENT_TEMPLATES,
 *   so client, cargo, trailer, certificates and reputation gates always make sense together.
 * - Signed contracts are tracked with real expiry, and their loads are kept on the freight board by
 *   planTenderLoads() (paced, parallel, never over-listed) instead of one-at-a-time.
 * - Expired contracts are settled by settleExpiredTenders().
 */

import { LOCATIONS } from '../../data/world';
import { REGIONAL_HUBS } from '../logistics/network';
import { CARGO_TYPES } from '../freight/cargo/registry';
import { distKm } from '../../systems/calc';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';
import { recordTransaction } from '../../core/ledger';

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

export const TENDER_ROTATION_MS = 6 * 60 * 60 * 1000;   // offers rotate every 6 real hours
export const TENDER_OFFER_COUNT = 4;
export const SIM_DAY_MS = 12 * 60 * 60 * 1000;          // engine: 12 real hours = 1 simulation day
export const MAX_ACTIVE_TENDERS = 3;                    // signed contracts at once
export const MAX_LOADS_ON_BOARD = 2;                    // loads of ONE contract visible at the same time
export const LOAD_LISTING_COOLDOWN_MS = 30_000;         // pacing between new loads of the same contract
export const PARTIAL_COMPLETION_FLOOR = 0.5;            // below this at expiry the contract counts as failed
export const FAILED_CONTRACT_REP_PENALTY = 20;

export interface CorporateTender {
  id: string;
  client: string;
  industry: string;
  lane: string;
  from: string;
  to: string;
  region: string;
  cargoType: string;
  trailerRequired: string;
  durationDays: number;
  ratePerDelivery: number;
  slaTarget: number; // e.g. 96%
  requiredCerts: string[];
  minFleetSize: number;
  minReputation: number;
  totalLoads: number;
  completedLoads: number;
  loadsRemaining: number;
  bonusPayout: number;
  desc: string;
  icon: string;
  expiresAtMs: number;      // offer: when it rotates out. Signed contract: when the contract ends.
  startDate?: number;
  endsAtMs?: number;        // signed contracts only
  nextLoadAt?: number;      // signed contracts only: pacing for the next board listing
  bonusAwarded?: boolean;
}

export interface ClientTemplate {
  client: string;
  industry: string;
  cargoId: string;
  trailerRequired: string;
  icon: string;
  desc: string;
  requiredCerts: string[];
  minFleetSize: number;
  minReputation: number;
  baseRateMultiplier: number;
}

const CLIENT_TEMPLATES: ClientTemplate[] = [
  {
    client: 'Continental Automotive AG',
    industry: 'Automotive & Heavy Powertrains',
    cargoId: 'industrial_machinery',
    trailerRequired: 'curtain',
    icon: '🚗',
    desc: 'High-frequency linehaul transporting vehicle sub-assemblies and transmission modules between assembly plants.',
    requiredCerts: [],
    minFleetSize: 1,
    minReputation: 80,
    baseRateMultiplier: 1.15
  },
  {
    client: 'BASF Chemical Logistics Europe',
    industry: 'Energy & ADR Petrochemicals',
    cargoId: 'gasoline',
    trailerRequired: 'tanker',
    icon: '☣️',
    desc: 'Regulated chemical and refined fuel distribution demanding dedicated hazmat-certified tanker drivers.',
    requiredCerts: ['ADR Hazmat'],
    minFleetSize: 2,
    minReputation: 95,
    baseRateMultiplier: 1.45
  },
  {
    client: 'Nordic Cold Chain Solutions',
    industry: 'Food & Temperature-Controlled Perishables',
    cargoId: 'frozen_fish',
    trailerRequired: 'reefer',
    icon: '❄️',
    desc: 'Critical cold-chain corridor moving perishable seafood and dairy under continuous temperature telematics.',
    requiredCerts: ['Cold Chain'],
    minFleetSize: 1,
    minReputation: 85,
    baseRateMultiplier: 1.30
  },
  {
    client: 'Apex Semiconductor & Microelectronics',
    industry: 'High-Tech & Precision Electronics',
    cargoId: 'electronics',
    trailerRequired: 'box',
    icon: '🖥️',
    desc: 'Air-ride secure linehaul delivering sensitive silicon wafers and server blade arrays between fab hubs.',
    requiredCerts: [],
    minFleetSize: 2,
    minReputation: 100,
    baseRateMultiplier: 1.35
  },
  {
    client: 'Dangote Industrial & Infrastructure Ltd',
    industry: 'Heavy Mining & Construction Aggregates',
    cargoId: 'steel_pipes',
    trailerRequired: 'flatbed',
    icon: '⛏️',
    desc: 'Heavy industrial flatbed haulage transporting structural steel beams and drilling equipment for port expansion.',
    requiredCerts: [],
    minFleetSize: 2,
    minReputation: 90,
    baseRateMultiplier: 1.25
  },
  {
    client: 'Pacific Aerospace & Defense Logistics',
    industry: 'Aerospace & Strategic Components',
    cargoId: 'aviation_parts',
    trailerRequired: 'lowboy',
    icon: '🛰️',
    desc: 'Classified transport of high-value propulsion assemblies and turbine modules between regional aerospace hubs.',
    requiredCerts: [],
    minFleetSize: 3,
    minReputation: 110,
    baseRateMultiplier: 1.60
  },
  {
    client: 'Maersk Intermodal Overland Drayage',
    industry: 'Containerized Ocean Port Drayage',
    cargoId: 'general_freight',
    trailerRequired: 'container',
    icon: '🚢',
    desc: 'Scheduled maritime intermodal container runs linking deepwater port terminals to inland rail dry docks.',
    requiredCerts: [],
    minFleetSize: 2,
    minReputation: 85,
    baseRateMultiplier: 1.20
  },
  {
    client: 'Pfizer BioPharma Distribution Trust',
    industry: 'Specialized Pharmaceuticals & Vaccines',
    cargoId: 'vaccines',
    trailerRequired: 'reefer',
    icon: '💉',
    desc: 'Ultra-low temperature cryogenic vaccine transport requiring strict 99% on-time delivery compliance.',
    requiredCerts: ['Cold Chain'],
    minFleetSize: 2,
    minReputation: 105,
    baseRateMultiplier: 1.50
  }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const norm = (s: any) => String(s ?? '').toUpperCase();

/** Small deterministic PRNG so a rotation always yields the same offers. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function citiesInRegion(region: string): string[] {
  return Object.entries(LOCATIONS)
    .filter(([, loc]: [string, any]) => norm(loc.region) === norm(region))
    .map(([key]) => key);
}

/** Cities the player really operates from: owned hub cities + where fleet trucks are parked. */
function operatingOrigins(S: any): string[] {
  const hubCities = (S?.depots || [])
    .map((id: string) => REGIONAL_HUBS.find(h => h.id === id)?.city)
    .filter(Boolean) as string[];
  // NOTE: the fleet lives in S.fleet (older code read S.trucks, which never exists)
  const truckCities = (S?.fleet || S?.trucks || [])
    .map((t: any) => t.loc || t.registeredCity)
    .filter(Boolean) as string[];
  return Array.from(new Set([...hubCities, ...truckCities])).filter(c => LOCATIONS[c]);
}

const pick = <T,>(arr: T[], r: () => number): T => arr[Math.floor(r() * arr.length) % arr.length];

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

/**
 * Dynamic 30-day corporate tender offers for the current 6-hour rotation (+ manual refresh seed).
 * Pure: the same state in the same rotation returns the same offers.
 */
export function getDynamicCorporateTenders(S: any): CorporateTender[] {
  const now = Date.now();
  const cycleSeed = Math.floor(now / TENDER_ROTATION_MS) + (S?.tenderRefreshSeed || 0);
  const expiresAtMs = (Math.floor(now / TENDER_ROTATION_MS) + 1) * TENDER_ROTATION_MS;

  const hubRegions = (S?.depots || [])
    .map((id: string) => REGIONAL_HUBS.find(h => h.id === id)?.region)
    .filter(Boolean) as string[];
  const unlocked = Array.from(new Set<string>([...(S?.unlockedRegions || []), ...hubRegions]));

  const origins = operatingOrigins(S);
  const offers: CorporateTender[] = [];
  const usedClients = new Set<string>();

  for (let idx = 0; idx < TENDER_OFFER_COUNT; idx++) {
    const r = mulberry32(cycleSeed * 7919 + idx * 104729 + 17);

    // Client: walk the template list from a seeded start so offers in one rotation are distinct clients
    const start = Math.floor(r() * CLIENT_TEMPLATES.length);
    let tpl = CLIENT_TEMPLATES[(start + idx) % CLIENT_TEMPLATES.length];
    for (let k = 0; k < CLIENT_TEMPLATES.length && usedClients.has(tpl.client); k++) {
      tpl = CLIENT_TEMPLATES[(start + idx + k + 1) % CLIENT_TEMPLATES.length];
    }
    usedClients.add(tpl.client);

    // Region: only regions where we have an origin AND a destination to run to
    const candidates = unlocked.filter(reg => {
      const cities = citiesInRegion(reg);
      return cities.length >= 2 && origins.some(o => norm(LOCATIONS[o]?.region) === norm(reg));
    });
    const regionPool = candidates.length > 0
      ? candidates
      : unlocked.filter(reg => citiesInRegion(reg).length >= 2);
    if (regionPool.length === 0) continue;
    const region = pick(regionPool, r);
    const regionCities = citiesInRegion(region);

    // Lane: origin from our own network inside this region, destination 150–1400 km away when possible
    const regionOrigins = origins.filter(o => norm(LOCATIONS[o]?.region) === norm(region));
    const from = regionOrigins.length > 0 ? pick(regionOrigins, r) : regionCities[0];
    const others = regionCities.filter(c => c !== from);
    if (others.length === 0) continue;
    const inBand = others.filter(c => { const d = distKm(from, c); return d >= 150 && d <= 1400; });
    const to = pick(inBand.length > 0 ? inBand : others, r);
    const laneKm = distKm(from, to);

    // Cargo/trailer: registry is authoritative, template is the fallback
    const cargo =
      CARGO_TYPES.find((c: any) => c.id === tpl.cargoId) ||
      pick(CARGO_TYPES.filter((c: any) => c.trailer === tpl.trailerRequired), r) ||
      CARGO_TYPES[0];
    const trailerRequired = (cargo as any)?.trailer || tpl.trailerRequired;

    const certs = new Set<string>(tpl.requiredCerts);
    if ((cargo as any)?.isHazmat) certs.add('ADR Hazmat');
    if ((cargo as any)?.tempControlled) certs.add('Cold Chain');

    const totalLoads = 8 + Math.floor(r() * 13); // 8–20
    const perKmRate = 1.95 + (tpl.baseRateMultiplier * 0.35);
    const ratePerDelivery = Math.max(450, Math.round(laneKm * perKmRate));
    const bonusPayout = Math.round((ratePerDelivery * totalLoads * 0.06) / 500) * 500; // 6% SLA Completion Bonus

    offers.push({
      id: `tender_${(cargo as any).id}_${cycleSeed}_${idx}`,
      client: tpl.client,
      industry: tpl.industry,
      lane: `${from} ⇄ ${to}`,
      from,
      to,
      region,
      cargoType: (cargo as any).id,
      trailerRequired,
      durationDays: 30,
      ratePerDelivery,
      slaTarget: 95 + Math.floor(r() * 4),
      requiredCerts: Array.from(certs),
      minFleetSize: tpl.minFleetSize,
      minReputation: tpl.minReputation,
      totalLoads,
      completedLoads: 0,
      loadsRemaining: totalLoads,
      bonusPayout,
      desc: `${tpl.desc} Dedicated lane: ${from} ⇄ ${to} (${laneKm} km).`,
      icon: tpl.icon,
      expiresAtMs
    });
  }

  return offers;
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

/** Why this player can't sign this offer right now (null = fine). Safe to show in the UI. */
export function getTenderSignError(S: any, tenderDef: CorporateTender): string | null {
  const signed: CorporateTender[] = S.corporateTenders || [];
  if (signed.some(t => t.id === tenderDef.id)) return 'Contract already signed.';
  if (signed.length >= MAX_ACTIVE_TENDERS) return `You can hold at most ${MAX_ACTIVE_TENDERS} active contracts.`;
  if (signed.some(t => t.client === tenderDef.client && t.from === tenderDef.from && t.to === tenderDef.to)) {
    return 'You already hold a contract with this client on this lane.';
  }

  const fleetSize = S.fleet?.length || 0;
  if (fleetSize < tenderDef.minFleetSize) return `Requires a fleet of ${tenderDef.minFleetSize}+ trucks (you have ${fleetSize}).`;

  const reputation = S.reputation ?? 100;
  if (reputation < tenderDef.minReputation) return `Requires ${tenderDef.minReputation} reputation (you have ${Math.round(reputation)}).`;

  for (const c of tenderDef.requiredCerts) {
    if (c === 'ADR Hazmat' && !S.licenses?.includes('adr_hazmat')) return 'Requires the ADR Hazmat license.';
    if (c === 'Cold Chain' && !S.licenses?.includes('cold_chain')) return 'Requires the Cold Chain license.';
  }
  return null;
}

/** Same as signCorporateTender but tells you why it failed. */
export function trySignCorporateTender(S: any, tenderId: string): { ok: boolean; reason?: string } {
  if (!S.corporateTenders) S.corporateTenders = [];
  if (S.corporateTenders.some((t: any) => t.id === tenderId)) return { ok: false, reason: 'Contract already signed.' };

  const def = getDynamicCorporateTenders(S).find(t => t.id === tenderId);
  if (!def) return { ok: false, reason: 'This offer has rotated out.' };

  const err = getTenderSignError(S, def);
  if (err) return { ok: false, reason: err };

  const now = Date.now();
  S.corporateTenders.push({
    ...JSON.parse(JSON.stringify(def)),
    startDate: now,
    endsAtMs: now + def.durationDays * SIM_DAY_MS,
    expiresAtMs: now + def.durationDays * SIM_DAY_MS, // for a signed contract this is the contract end
    nextLoadAt: now,                                   // first load is listed right away
    completedLoads: 0,
    loadsRemaining: def.totalLoads,
    bonusAwarded: false
  });
  return { ok: true };
}

/** Boolean wrapper kept for existing callers. */
export function signCorporateTender(S: any, tenderId: string): boolean {
  return trySignCorporateTender(S, tenderId).ok;
}

// ---------------------------------------------------------------------------
// Keeping contract loads on the board
// ---------------------------------------------------------------------------

export interface TenderLoadPlan {
  tenderId: string;
  onBoard: number;
  inTransit: number;
}

/**
 * Which signed contracts need another load listed right now.
 * - Counts loads on the board AND in transit, so a contract is never over-listed past its totalLoads.
 * - Up to MAX_LOADS_ON_BOARD loads per contract are visible at once (parallel trucks).
 * - Paced by nextLoadAt so loads trickle in like the rest of the board instead of all at once.
 * Returns at most ONE load per contract per call; call again on the next tick for more.
 */
export function planTenderLoads(S: any, now: number = Date.now()): TenderLoadPlan[] {
  const plans: TenderLoadPlan[] = [];
  for (const t of (S.corporateTenders || []) as CorporateTender[]) {
    if ((t.loadsRemaining || 0) <= 0) continue;
    if (t.endsAtMs && now >= t.endsAtMs) continue;
    if (t.nextLoadAt && now < t.nextLoadAt) continue;

    const onBoard = (S.jobs || []).filter((j: any) => j.tenderId === t.id).length;
    const inTransit = (S.active || []).filter((a: any) => a.tenderId === t.id && (a.currentLeg || 1) === 1).length;
    const unassigned = t.loadsRemaining - onBoard - inTransit;
    if (unassigned <= 0) continue;
    if (onBoard >= MAX_LOADS_ON_BOARD) continue;

    plans.push({ tenderId: t.id, onBoard, inTransit });
  }
  return plans;
}

/** Call after listing a load so the next one is paced. */
export function consumeTenderListing(S: any, tenderId: string, now: number = Date.now()) {
  const t = (S.corporateTenders || []).find((x: any) => x.id === tenderId);
  if (t) t.nextLoadAt = now + LOAD_LISTING_COOLDOWN_MS;
}

/** Cheap check the engine tick uses to decide whether to replenish the board right now. */
export function tenderLoadsDue(S: any, now: number = Date.now()): boolean {
  return !!(S.corporateTenders && S.corporateTenders.length > 0 && planTenderLoads(S, now).length > 0);
}

// ---------------------------------------------------------------------------
// Expiry
// ---------------------------------------------------------------------------

/**
 * Ends contracts whose term is over.
 *   completed >= SLA target %  -> volume bonus paid (if not already)
 *   completed >= 50%           -> closes quietly
 *   below 50%                  -> reputation penalty
 * Their unclaimed loads are pulled from the board. Loads already in transit still pay normally.
 */
export function settleExpiredTenders(S: any, now: number = Date.now()): CorporateTender[] {
  const list: CorporateTender[] = S.corporateTenders || [];
  const expired = list.filter(t => t.endsAtMs && now >= t.endsAtMs && !t.bonusAwarded);
  if (expired.length === 0) return [];

  for (const t of expired) {
    const done = t.completedLoads || 0;
    const pct = t.totalLoads > 0 ? (done / t.totalLoads) * 100 : 0;

    if (pct >= t.slaTarget) {
      t.bonusAwarded = true;
      recordTransaction(S, 'revenue_bonus', t.bonusPayout, `Corporate Tender SLA Bonus: ${t.client}`);
      if (S.stats) S.stats.earned = (S.stats.earned || 0) + t.bonusPayout;
      pushNote(S, `${t.client} contract ended: ${done}/${t.totalLoads} loads (${Math.round(pct)}%) met the ${t.slaTarget}% SLA. Bonus +$${t.bonusPayout.toLocaleString()}.`, {
        title: 'TENDER COMPLETED', type: 'tender', priority: 1
      });
      toast(`Tender completed: ${t.client} +$${t.bonusPayout.toLocaleString()}`, 'success');
    } else if (pct >= PARTIAL_COMPLETION_FLOOR * 100) {
      pushNote(S, `${t.client} contract ended with ${done}/${t.totalLoads} loads (${Math.round(pct)}%). SLA of ${t.slaTarget}% was not met, so no volume bonus.`, {
        title: 'TENDER CLOSED', type: 'tender'
      });
    } else {
      S.reputation = Math.max(0, (S.reputation ?? 100) - FAILED_CONTRACT_REP_PENALTY);
      pushNote(S, `${t.client} contract failed: only ${done}/${t.totalLoads} loads delivered. Reputation -${FAILED_CONTRACT_REP_PENALTY}.`, {
        title: 'TENDER FAILED', type: 'tender', priority: 1
      });
      toast(`Tender failed: ${t.client} (-${FAILED_CONTRACT_REP_PENALTY} rep)`, 'err');
    }
  }

  const ids = new Set(expired.map(t => t.id));
  S.corporateTenders = list.filter(t => !ids.has(t.id));
  S.jobs = (S.jobs || []).filter((j: any) => !ids.has(j.tenderId));
  return expired;
}

/** Handy for the UI: progress and time left on a signed contract. */
export function getTenderStatus(t: CorporateTender, now: number = Date.now()) {
  const pctLoads = t.totalLoads > 0 ? Math.round(((t.completedLoads || 0) / t.totalLoads) * 100) : 0;
  const msLeft = Math.max(0, (t.endsAtMs ?? t.expiresAtMs) - now);
  const simDaysLeft = Math.ceil(msLeft / SIM_DAY_MS);
  const onTrack = pctLoads >= Math.min(100, Math.round((1 - msLeft / (t.durationDays * SIM_DAY_MS)) * 100));
  return { pctLoads, msLeft, simDaysLeft, onTrack };
}
