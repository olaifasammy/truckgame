import { Region, FreightJob, JobKind } from '../types';
import { COMPANIES } from '../companies/registry';
import { CARGO_TYPES } from '../cargo/registry';
import { TRUCK_MODELS } from '../../trucks/trucks.data';
import { CITIES, LOCATIONS, RegionName, resolveTruckRegion } from '../../../data/world';
import { REGIONAL_HUBS } from '../../logistics/network';
import { rnd, toast } from '../../../core/ui';
import { BiddingEngine } from '../bids/engine';
import { distKm, getRouteEnv, fuelCostForTrip } from '../../../systems/calc';
import { getCompanyProgression } from '../../company/progression';
import { SAMPLE_TENDERS } from '../../logistics/network';
import { getDynamicCorporateTenders, planTenderLoads, consumeTenderListing } from '../../contracts/tenders';
import { pushNote } from '../../../systems/notify';
import { getHubCharacteristics, getHubSectorBonus, getHubNetworkSynergyBonus } from '../../hubs/characteristics';
import { isCityUnlockedHub, getHubFacilityYieldBonus } from '../../hubs/hub-facility';
import { SIM_HOUR_MS } from '../../trucks/trucks.journey';

// Internal constants for simulation
const INSURANCE_POLICIES: any = {
  liability: { dailyCost: 85 },
  collision: { dailyCost: 220 },
  cargo: { dailyCost: 310 }
};

export class FreightEngine {
  /**
   * Generates a realistic freight job or auction with authentic route physics.
   * - Bidding jobs: Exclusively high-paying contracts, scaling higher with VIP rank.
   * - Normal jobs: Modest, balanced payouts.
   */
  static generate(S: any, options: { 
    forceRegion?: RegionName; 
    forceFrom?: string;
    forceTo?: string;
    forceTrailer?: string;
    isBackhaul?: boolean;
    vip?: boolean; 
    isAuction?: boolean; 
    auctionDuration?: number; 
    tenderId?: string; 
  } = {}): FreightJob | any {
    const prog = S ? getCompanyProgression(S) : { tier: 0 };
    const vipLevel = prog.tier >= 3 ? (prog.tier - 2) : 0;

    const tender = options.tenderId
      ? ((S?.corporateTenders || []).find((t: any) => t.id === options.tenderId) ||
         getDynamicCorporateTenders(S).find(t => t.id === options.tenderId) ||
         SAMPLE_TENDERS.find(t => t.id === options.tenderId))
      : null;

    if (tender && tender.from && tender.to) {
      if (!options.forceFrom) options.forceFrom = tender.from;
      if (!options.forceTo) options.forceTo = tender.to;
    }

    // Collect all trailer types the player currently owns (hitched to fleet or stored in HQ yard)
    const ownedTrailers = new Set<string>();
    const localTrailers = new Set<string>();
    const hasAdr = !!(S?.licenses?.includes('adr_hazmat'));

    (S?.fleet || []).forEach((t: any) => {
      const model = TRUCK_MODELS[t.modelId];
      const isLocal =
        (options.forceFrom && t.loc === options.forceFrom) ||
        (!options.forceFrom && options.forceRegion && resolveTruckRegion(t.loc) === options.forceRegion);

      if (t.trailer) {
        ownedTrailers.add(t.trailer);
        if (isLocal) localTrailers.add(t.trailer);
      } else if (model?.haul) {
        // Bobtail tractor: can haul any yard trailer compatible with its chassis
        (S?.trailers || []).forEach((tr: string) => {
          if (model.haul.includes(tr as any)) {
            ownedTrailers.add(tr);
            if (isLocal) localTrailers.add(tr);
          }
        });
      }
    });
    (S?.trailers || []).forEach((tr: string) => ownedTrailers.add(tr));
    
    // Consignor-supplied tankers are available if the carrier has ADR authority
    if (hasAdr) {
      ownedTrailers.add('hazmat');
      ownedTrailers.add('tanker');
    }

    // Helper: pick uniformly by trailer type so every owned vehicle/trailer has equal chance
    const pickBalancedCargo = (pool: typeof CARGO_TYPES, targetTrailers: Set<string>) => {
      const eligible = pool.filter(c => {
        if (!targetTrailers.has(c.trailer)) return false;
        if (c.isHazmat && !hasAdr) return false;
        return true;
      });
      if (eligible.length === 0) return null;
      const trailerTypes = Array.from(new Set(eligible.map(c => c.trailer)));
      const chosenTrailer = rnd(trailerTypes);
      const trailerCargos = eligible.filter(c => c.trailer === chosenTrailer);
      return rnd(trailerCargos);
    };

    let cargo;
    if (tender) {
      // Pick cargo suitable for the tender, ensuring varied consignments per contract
      const trailerPool = CARGO_TYPES.filter(c => c.trailer === tender.trailerRequired);
      const industryMap: Record<string, string[]> = {
        'Automotive & Heavy Industry': ['steel_pipes', 'electronics', 'furniture', 'industrial_machinery'],
        'Automotive & Heavy Powertrains': ['industrial_machinery', 'electronics', 'auto_parts'],
        'Energy & ADR Petrochemicals': ['gasoline', 'liquid_oxy', 'toxic_waste', 'crude_oil'],
        'Pharmaceuticals & Food Perishables': ['frozen_fish', 'vaccines', 'produce', 'meat', 'dairy'],
        'Food & Temperature-Controlled Perishables': ['frozen_fish', 'vaccines', 'produce', 'meat'],
        'High-Tech & Precision Electronics': ['electronics', 'server_blades', 'semiconductors'],
        'Heavy Mining & Construction Aggregates': ['steel_pipes', 'gravel', 'industrial_machinery', 'excavator'],
        'Specialized Pharmaceuticals & Vaccines': ['vaccines', 'medical_supplies', 'produce'],
        'Containerized Ocean Port Drayage': ['general_freight', 'electronics', 'textiles', 'consumer_goods']
      };
      const possibleCargos = industryMap[tender.industry] || (tender.cargoType ? [tender.cargoType] : ['electronics']);
      const tenderPool = CARGO_TYPES.filter(c => possibleCargos.includes(c.id) || c.trailer === tender.trailerRequired);
      cargo = rnd(tenderPool.length ? tenderPool : (trailerPool.length ? trailerPool : CARGO_TYPES));
    } else if (options.isAuction) {
      // Job bidding MUST generate higher paying jobs only
      const ultraTierChance = Math.min(0.92, 0.40 + (vipLevel * 0.015));
      const ultraCargos = CARGO_TYPES.filter(c => c.baseValue >= 35);
      const premiumCargos = CARGO_TYPES.filter(c => c.baseValue >= 11.0);
      const pool = (Math.random() < ultraTierChance && ultraCargos.length > 0) ? ultraCargos : (premiumCargos.length ? premiumCargos : CARGO_TYPES);

      // 70% probability to match player's owned trailers (balanced across trailer types)
      const matched = (ownedTrailers.size > 0 && Math.random() < 0.70)
        ? pickBalancedCargo(pool, ownedTrailers)
        : null;
      cargo = matched || rnd(pool);
    } else {
      // Normal job generator: payouts shouldn't be too high, everyday freight
      const standardCargos = CARGO_TYPES.filter(c => c.baseValue < 30);
      const pool = standardCargos.length ? standardCargos : CARGO_TYPES;

      if (options.forceTrailer) {
        const trailerCargos = pool.filter(c => c.trailer === options.forceTrailer && (!c.isHazmat || hasAdr));
        if (trailerCargos.length > 0) {
          cargo = rnd(trailerCargos);
        }
      }

      if (!cargo) {
        // 85% probability to match trailers at this hub/region first, then global owned trailers
        const preferLocal = localTrailers.size > 0 && Math.random() < 0.85;
        const preferGlobal = ownedTrailers.size > 0 && Math.random() < 0.80;
        cargo = (preferLocal ? pickBalancedCargo(pool, localTrailers) : null)
          || (preferGlobal ? pickBalancedCargo(pool, ownedTrailers) : null)
          || rnd(pool);
      }
    }

    const company = rnd(COMPANIES);

    // Filter available regions strictly to those unlocked by company operating authority
    // If state has no unlockedRegions, fallback to the region of the player's first depot/HQ
    let unlockedRegions: RegionName[] = (S?.unlockedRegions && S.unlockedRegions.length > 0)
      ? S.unlockedRegions
      : [];
    
    if (unlockedRegions.length === 0 && S?.depots && S.depots.length > 0) {
      const hqId = S.depots[0];
      const hub = REGIONAL_HUBS.find(h => h.id === hqId);
      if (hub) {
        unlockedRegions = [hub.region];
      }
    }

    // Absolute fallback: pick any region from existing LOCATIONS data if state is empty
    if (unlockedRegions.length === 0) {
      const allPossibleRegions = Array.from(new Set(Object.values(LOCATIONS).map(l => l.region)));
      unlockedRegions = allPossibleRegions.length > 0 ? [allPossibleRegions[0] as RegionName] : ['Africa'];
    }

    let targetRegion: RegionName;
    if (options.forceFrom) {
      targetRegion = resolveTruckRegion(options.forceFrom);
    } else if (tender && (tender as any).region && unlockedRegions.includes((tender as any).region as RegionName)) {
      targetRegion = (tender as any).region as RegionName;
    } else if (options.forceRegion && unlockedRegions.includes(options.forceRegion)) {
      targetRegion = options.forceRegion;
    } else if (tender) {
      // If it's a tender but no region is specified, spread it across unlocked regions
      // based on tender ID to ensure stability but variation.
      const tenderSeed = (tender.id || '').split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
      targetRegion = unlockedRegions[tenderSeed % unlockedRegions.length];
    } else {
      targetRegion = rnd(unlockedRegions);
    }

    // Filter cities strictly within the target operating region
    const regionCities = Object.entries(LOCATIONS)
      .filter(([_, loc]) => loc.region === targetRegion)
      .map(([key]) => key);

    // Carrier hubs owned in this region
    const ownedHubsInRegion = (S?.depots || []).filter((depotId: string) => {
      const hub = REGIONAL_HUBS.find(h => h.id === depotId);
      return hub && hub.region === targetRegion;
    }).map((depotId: string) => {
      const hub = REGIONAL_HUBS.find(h => h.id === depotId);
      return hub ? hub.city : null;
    }).filter((city: string | null) => city !== null) as string[];

    let from: string;
    let to: string;

    const allCityKeys = Object.keys(CITIES);
    const validRegionCities = regionCities.length > 0 ? regionCities : allCityKeys;

    // Direct / Backhaul routing ("To & Fro" return freight)
    // Strict Origin Rules: Jobs must ONLY originate from locations where the player owns a hub/depot.
    const ownedHubCities = (S?.depots || []).map((depotId: string) => {
      const hub = REGIONAL_HUBS.find(h => h.id === depotId);
      return hub ? hub.city : null;
    }).filter(Boolean) as string[];

    // If no hubs are owned yet (e.g. initial game state), use HQ city
    if (ownedHubCities.length === 0 && S?.hqCity) {
      ownedHubCities.push(S.hqCity);
    }

    // Ensure origins are valid AND within the target operating region if specified
    const allAvailableOrigins = Array.from(new Set(ownedHubCities));
    const regionalOrigins = targetRegion 
      ? allAvailableOrigins.filter(city => LOCATIONS[city]?.region === targetRegion)
      : allAvailableOrigins;

    if (options.forceFrom && LOCATIONS[options.forceFrom]) {
      from = options.forceFrom;
    } else if (regionalOrigins.length > 0) {
      // Both normal and bid jobs generate from only the hub locations owned within the target region
      from = rnd(regionalOrigins);
    } else {
      // Fallback: Use HQ if owned, otherwise use any owned hub city
      const hqCity = S?.hqCity || (ownedHubCities.length > 0 ? ownedHubCities[0] : null);
      if (hqCity && isCityUnlockedHub(S, hqCity)) {
        from = hqCity;
      } else if (ownedHubCities.length > 0) {
        from = rnd(ownedHubCities);
      } else {
        // Ultimate fallback to first location in world data if no hubs owned yet
        from = Object.keys(LOCATIONS)[0];
      }
    }

    // Strict Region Landmass Boundary: Trucks operate strictly within the same geographical region
    const fromRegion = LOCATIONS[from]?.region || targetRegion || 'Africa';
    const sameRegionCities = allCityKeys.filter(c => c !== from && LOCATIONS[c]?.region === fromRegion);
    const destinationPool = sameRegionCities.length > 0 ? sameRegionCities : validRegionCities.filter(c => c !== from);

    // Realistic Strategy 1 Distance Cap:
    // Non-hub feeder destinations: 50 km to 1,500 km max
    // Owned inter-hub trunk destinations: 50 km to 2,800 km max
    const destinationCandidates = destinationPool.map(c => {
      const km = distKm(from, c);
      const countryFrom = LOCATIONS[from]?.country;
      const countryTo = LOCATIONS[c]?.country;
      const isDifferentCountry = !!(countryFrom && countryTo && countryFrom !== countryTo);
      const isOwnedDestHub = isCityUnlockedHub(S, c);
      const maxAllowedKm = isOwnedDestHub ? 2800 : 1500;
      return { city: c, km, isDifferentCountry, isOwnedDestHub, maxAllowedKm };
    }).filter(d => d.km >= 50 && d.km <= d.maxAllowedKm);

    // Backup pool if all candidates in landmass are under 50km or empty
    const candidatePoolToUse = destinationCandidates.length > 0 
      ? destinationCandidates 
      : destinationPool.map(c => {
          const isOwnedDestHub = isCityUnlockedHub(S, c);
          const maxAllowedKm = isOwnedDestHub ? 2800 : 1500;
          return { 
            city: c, 
            km: Math.min(maxAllowedKm, Math.max(50, distKm(from, c))), 
            isDifferentCountry: false,
            isOwnedDestHub,
            maxAllowedKm 
          };
        });

    if (options.forceTo && LOCATIONS[options.forceTo] && options.forceTo !== from) {
      to = options.forceTo;
    } else if (options.isAuction) {
      // BID / AUCTION JOBS: Prioritize long-haul corridors (600 km to 2,200 km)
      const longDistanceCandidates = candidatePoolToUse.filter(d => d.km >= 600);
      const poolToUse = longDistanceCandidates.length >= 2 ? longDistanceCandidates : candidatePoolToUse;
      poolToUse.sort((a, b) => b.km - a.km);
      const topCount = Math.max(1, Math.floor(poolToUse.length * 0.45));
      to = rnd(poolToUse.slice(0, topCount)).city;
    } else if (tender) {
      to = rnd(candidatePoolToUse).city;
    } else {
      // NORMAL FREIGHT BOARD: Real-World Trade Gravity Distribution Model
      // 60% Short Regional (<= 500km), 30% Medium Intercity (500-1200km), 10% Long Linehaul (1200-2200km)
      const randVal = Math.random();
      let gravityPool: typeof candidatePoolToUse = [];

      if (randVal < 0.60) {
        gravityPool = candidatePoolToUse.filter(d => d.km <= 500);
      } else if (randVal < 0.90) {
        gravityPool = candidatePoolToUse.filter(d => d.km > 500 && d.km <= 1200);
      } else {
        gravityPool = candidatePoolToUse.filter(d => d.km > 1200);
      }

      if (gravityPool.length === 0) gravityPool = candidatePoolToUse;
      to = rnd(gravityPool).city;
    }

    if (!to || to === from) {
      to = candidatePoolToUse[0]?.city || sameRegionCities[0] || 'IBADAN';
    }

    const countryFrom = LOCATIONS[from]?.country;
    let countryTo = LOCATIONS[to]?.country;
    let isCrossCountry = !!(countryFrom && countryTo && countryFrom !== countryTo);
    const rawBaseKm = distKm(from, to);
    // Strict clamp: Distance is strictly capped at 2,200 km max
    let finalBaseKm = Math.min(2200, Math.max(50, rawBaseKm));
    let finalTo = to;

    // Realistic Cargo Weight (tonnes)
    let weight = 6 + Math.random() * 18;
    if (cargo.trailer === 'lowboy') weight = 22 + Math.random() * 38;
    else if (cargo.trailer === 'tipper') weight = 18 + Math.random() * 24;
    else if (cargo.trailer === 'tanker' || cargo.trailer === 'hazmat') weight = 20 + Math.random() * 26;
    else if (cargo.trailer === 'rigid_box' || options.forceTrailer === 'rigid_box') {
      weight = 3.5 + Math.random() * 8.0; // Rigids & Vans: 3.5t to 11.5t (strictly <= 12t)
    }

    if (cargo.trailer === 'rigid_box' || options.forceTrailer === 'rigid_box') {
      finalBaseKm = Math.min(finalBaseKm, 350); // Local / regional only, <= 350 km
      isCrossCountry = false;
      if (countryFrom && countryTo && countryFrom !== countryTo) {
        const sameCountryCities = Object.keys(LOCATIONS).filter(c => c !== from && LOCATIONS[c]?.country === countryFrom);
        if (sameCountryCities.length > 0) {
          finalTo = rnd(sameCountryCities);
          countryTo = LOCATIONS[finalTo]?.country;
          finalBaseKm = Math.min(distKm(from, finalTo), 350);
        }
      }
    } else {
      // Normal job distance guardrail: Max 5,000 km for normal jobs. Bid/special jobs can exceed 5,000 km.
      if (!options.isAuction && !tender) {
        finalBaseKm = Math.min(5000, finalBaseKm);
      }
    }

    const baseKm = finalBaseKm;
    to = finalTo;
    const routeEnv = getRouteEnv(from, to, 0, baseKm, Date.now(), S?.simulationDay || 1);
    const isLongDistance = baseKm > 750 || isCrossCountry;

    // NORMAL FREIGHT BOARD: Ultra-realistic commercial freight rates ($1.85 - $2.45/km base)
    // Pricing based on Cargo Value, Weight, Distance, and Route Environmental Risk (Weather/Terrain)
    let rate = 1.85 + (cargo.baseValue * 0.020);
    let surcharge = 0;

    // 1. Linehaul Distance Premium (Logistics complexity for longer legs)
    if (baseKm > 1800) surcharge += 0.12;
    else if (baseKm > 1200) surcharge += 0.08;
    else if (baseKm > 750) surcharge += 0.04;

    // 2. High-Value & Hazardous Handling (Special equipment/permits required)
    if (cargo.isHazmat) surcharge += 0.18;
    if (cargo.isFragile) surcharge += 0.12;
    if (cargo.tempControlled) surcharge += 0.14;
    if (cargo.baseValue > 40) surcharge += 0.10; // Luxury/High-Value cargo premium

    // 3. Realistic Payload Tonnage Surcharge (Physical mechanical wear compensation)
    // Tonnage over 20t significantly increases fuel burn and wear
    if (weight > 20) {
      const weightSurcharge = (weight - 20) * 0.012; // +1.2% per tonne over 20t
      surcharge += Math.min(0.35, weightSurcharge); 
    }

    // 4. Route Environmental & Road Condition Hazards (Constitution 6.6)
    // Adverse weather and terrain increase operational risk and transit time
    if (routeEnv.weather === 'snow' || routeEnv.terrain === 'icy_road') {
      surcharge += 0.15; // Extreme winter risk
    } else if (routeEnv.weather === 'rain') {
      surcharge += 0.05; // Wet pavement safety margin
    } else if (routeEnv.weather === 'heatwave') {
      surcharge += 0.08; // Cooling system & tire thermal stress
    }

    // Road Grade Incline (Gravity drag & brake wear)
    const grade = routeEnv.roadGrade || 0;
    if (grade > 6.0) surcharge += 0.18;      // Severe alpine grades
    else if (grade > 4.0) surcharge += 0.10; // Moderate mountain grades

    // Terrain-specific challenges (Constitution 6.1)
    if (routeEnv.terrain === 'mountain_pass') surcharge += 0.12;
    if (routeEnv.terrain === 'desert_corridor') surcharge += 0.08;
    if (routeEnv.terrain === 'rough_road' || routeEnv.terrain === 'unpaved') surcharge += 0.20;
    
    // Remote/Difficult Terrain (e.g. Cross-Border, Desert, Jungle legs)
    if (isCrossCountry) surcharge += 0.10;

    if (options.vip) surcharge += 0.05;

    // Determine Base Rate & Total Multiplier
    if (options.isAuction) {
      rate = 2.25 + (cargo.baseValue * 0.035);
      rate *= (1.0 + Math.min(0.55, surcharge));
      rate = Math.min(4.80, rate); 
    } else {
      rate *= (1.0 + Math.min(0.50, surcharge));
      const maxRateCap = cargo.trailer === 'lowboy' ? 4.50 : 3.80;
      rate = Math.min(maxRateCap, rate);
    }

    // Minimum per km floor: $1.80/km to $2.20/km max
    // Premium floor for specialized Hazmat or Heavy hauls
    let minPerKm = cargo.baseValue > 30 ? 2.20 : 1.80;
    if (cargo.isHazmat || weight > 30) minPerKm = 2.40;
    const effectiveRate = Math.max(rate, minPerKm);
    
    let trailerMultiplier = 1.0;
    if (cargo.trailer === 'lowboy') trailerMultiplier = 1.22; 
    else if (cargo.trailer === 'double_trailer') trailerMultiplier = 1.12;
    else if (cargo.trailer === 'tanker' || cargo.trailer === 'hazmat') trailerMultiplier = 1.18; 
    else if (cargo.trailer === 'tipper') trailerMultiplier = 1.12; 

    const calculatedPayRaw = tender ? Math.round((tender.ratePerDelivery || 2500) * (0.95 + Math.random() * 0.10)) : Math.round(baseKm * effectiveRate);
    
    const hubChar = getHubCharacteristics(from);
    const sectorBonus = getHubSectorBonus(from, cargo.id);
    const corridorSynergy = getHubNetworkSynergyBonus(S, from, to);
    const facilityYield = getHubFacilityYieldBonus(S, from);

    // Terminal Handling & Logistics Processing Fee (Constitution 6.3)
    // Represents fixed costs of loading, gate fees, and hub administrative overhead.
    const tier = hubChar ? hubChar.tier : 3;
    const facilityLvl = S?.hubFacilities?.[hubChar?.hubId]?.level || 1;
    let terminalHandlingFee = 0;
    if (tier === 1) terminalHandlingFee = 650 + (facilityLvl * 150);
    else if (tier === 2) terminalHandlingFee = 400 + (facilityLvl * 100);
    else terminalHandlingFee = 250 + (facilityLvl * 50);

    const rawHubMult = (hubChar ? hubChar.demandMultiplier : 1.0) * sectorBonus * corridorSynergy.rateMultiplier * facilityYield;
    const hubMultiplier = Math.min(1.45, rawHubMult);

    const calculatedPay = Math.round((calculatedPayRaw + terminalHandlingFee) * trailerMultiplier * hubMultiplier);
    
    // DEADHEAD FUEL PRICING: If destination is NOT a hub, calculate return fuel cost compensation
    let deadheadFuelCompensation = 0;
    const isDestinationHub = ownedHubsInRegion.includes(to);
    if (!isDestinationHub && S && S.fleet && S.fleet.length > 0) {
      const nearestHub = ownedHubsInRegion.sort((a, b) => distKm(to, a) - distKm(to, b))[0];
      if (nearestHub) {
        const dhKm = distKm(to, nearestHub);
        const avgTruck = S.fleet[0];
        const fuelLiters = fuelCostForTrip(dhKm, avgTruck, 0, routeEnv);
        deadheadFuelCompensation = Math.round(fuelLiters * 0.85); 
      }
    }

    // Minimum Logistics Dispatch Floor: No commercial haul should be under ~$1,120 
    // accounts for driver day-rate, dispatch overhead, and loading dock time.
    const pay = Math.max(1120, calculatedPay + deadheadFuelCompensation);

    // List of active surcharges for UI transparency
    const activeSurcharges: string[] = [];
    if (cargo.isHazmat) activeSurcharges.push('Hazmat');
    if (cargo.isFragile) activeSurcharges.push('Fragile');
    if (cargo.tempControlled) activeSurcharges.push('Cold Chain');
    if (weight > 20) activeSurcharges.push('Heavy Payload');
    if (routeEnv.weather !== 'clear') activeSurcharges.push('Adverse Weather');
    if ((routeEnv.roadGrade || 0) > 4.0) activeSurcharges.push('Steep Grade');
    if (routeEnv.terrain && routeEnv.terrain !== 'asphalt') activeSurcharges.push('Challenging Terrain');
    if (isCrossCountry) activeSurcharges.push('International');
    if (baseKm > 1200) activeSurcharges.push('Linehaul');
    if (facilityLvl >= 5) activeSurcharges.push('Priority Terminal');

    // Long distance jobs can be round-trip (70% probability), short distance (15% probability)
    const isRoundTrip = !options.tenderId && (isLongDistance ? Math.random() < 0.70 : Math.random() < 0.15);
    let finalPay = pay;
    let totalKm = baseKm;
    let returnCargoObj: any = null;
    let leg1Pay = pay;
    let leg2Pay = 0;

    if (isRoundTrip) {
      const compatibleReturnCargos = CARGO_TYPES.filter(c => c.trailer === cargo.trailer && c.id !== cargo.id);
      returnCargoObj = compatibleReturnCargos.length > 0 ? rnd(compatibleReturnCargos) : cargo;
      let leg2Rate = 1.85 + (returnCargoObj.baseValue * 0.020);
      if (options.vip) leg2Rate *= 1.05;
      if (returnCargoObj.isHazmat) leg2Rate *= 1.15;
      if (returnCargoObj.isFragile) leg2Rate *= 1.10;
      if (returnCargoObj.tempControlled) leg2Rate *= 1.12;
      leg2Pay = Math.max(180, Math.round(baseKm * leg2Rate));
      finalPay = pay + leg2Pay;
      totalKm = baseKm * 2;
    }

    const dice = Math.random();
    let kind: JobKind = tender ? 'Contract' : 'Spot';
    if (options.isAuction) kind = 'Contract';
    else if (isLongDistance) kind = 'Contract'; // Longer distances like country to another are special/contract jobs
    else if (dice > 0.8) kind = 'Contract';
    else if (dice > 0.95) kind = 'Emergency';

    const requiredSkills: string[] = [];
    if (cargo.isFragile) requiredSkills.push('Fragile Cargo');
    if (cargo.tempControlled) requiredSkills.push('Cold Chain');
    if (cargo.isHazmat) requiredSkills.push('Hazardous ADR');
    if (isLongDistance) requiredSkills.push('Long Distance');
    if (isCrossCountry) requiredSkills.push('Cross-Border Transit');
    if (routeEnv.weather === 'snow' || (routeEnv.roadGrade || 0) > 5.0) requiredSkills.push('Mountain & Alpine');

    const job = {
      id: S.nextId++,
      companyId: tender ? tender.id : company.id,
      tenderId: options.tenderId || null,
      cargoId: cargo.id,
      kind,
      weight: parseFloat(weight.toFixed(1)),
      from,
      to,
      km: totalKm,
      pay: finalPay,
      leg1Pay,
      leg2Pay,
      baseKm, // original one-way distance
      deadline: Date.now() + Math.round(((totalKm / 55) + (kind === 'Emergency' ? 2.0 : options.vip ? 3.5 : 6.0)) * SIM_HOUR_MS),
      env: routeEnv,
      requirements: {
        requiredSkills,
        requiredLicenses: cargo.isHazmat ? ['adr_hazmat'] : []
      },
      trailer: cargo.trailer,
      isShipperTanker: cargo.isHazmat && !ownedTrailers.has('hazmat'),
      vip: !!options.vip,
      isRoundTrip,
      returnCargoId: returnCargoObj?.id,
      returnCargoName: returnCargoObj?.name,
      activeSurcharges,
      turnaroundBonus: 0,
      isNetworkCorridor: corridorSynergy.isNetworkCorridor,
      weightTonnes: Math.round(weight)
    };

    if (options.isAuction) {
      const auction = BiddingEngine.createAuction(job, options.auctionDuration);
      if (!S.auctions) S.auctions = [];
      S.auctions.push(auction);

      return { ...job, isAuction: true, auctionId: auction.id };
    }

    return job;
  }

  static getTenderLimit(S: any) {
    const now = Date.now();
    if (!S.tenderListingLimit) {
      S.tenderListingLimit = { count: 0, windowStart: now, premiumActive: false, premiumExpiresAt: 0 };
    }
    const limit = S.tenderListingLimit;
    const WINDOW_MS = 5 * 60 * 60 * 1000; // 5 hours
    if (now - limit.windowStart >= WINDOW_MS) {
      limit.windowStart = now;
      limit.count = 0;
    }
    return limit;
  }

  static replenishHub(S: any, hubId: string, count = 6) {
    if (!S.hubJobs) S.hubJobs = {};
    if (!S.hubJobs[hubId]) S.hubJobs[hubId] = [];
    
    const hub = REGIONAL_HUBS.find(h => h.id === hubId);
    if (!hub) return;

    // Filter out expired jobs from this hub
    const now = Date.now();
    S.hubJobs[hubId] = S.hubJobs[hubId].filter((j: any) => !j.deadline || j.deadline > now);

    // Enforce per-hub limit (e.g., 10 regular jobs per hub to prevent "heat")
    const MAX_HUB_JOBS = 10;
    if (S.hubJobs[hubId].length >= MAX_HUB_JOBS) return;

    const needed = MAX_HUB_JOBS - S.hubJobs[hubId].length;
    const toGenerate = Math.min(count, needed);

    for (let i = 0; i < toGenerate; i++) {
      const newJob = this.generate(S, { 
        forceFrom: hub.city,
        forceRegion: hub.region 
      });
      if (newJob) {
        S.hubJobs[hubId].push(newJob);
      }
    }
  }

  static replenish(S: any, count = 6) {
    if (!S.jobs) S.jobs = [];
    if (!S.auctions) S.auctions = [];
    if (!S.hubJobs) S.hubJobs = {};

    // Replenish each owned hub
    (S.depots || []).forEach((hubId: string) => {
      this.replenishHub(S, hubId, 2); // Slow replenish for all hubs
    });

    // STRICTOR LIMIT ENFORCEMENT: Section 2.1 & 6.4 compliance
    // Ensure the board never exceeds 17 total jobs, protecting secured won bids and tenders.
    if (S.jobs.length > 17) {
      const securedJobs = S.jobs.filter((j: any) => j.isAuctionWon || j.tenderId);
      const regularJobs = S.jobs.filter((j: any) => !j.isAuctionWon && !j.tenderId);
      const maxRegular = Math.max(0, 17 - securedJobs.length);
      S.jobs = [...securedJobs, ...regularJobs.slice(0, maxRegular)];
    }

    const unlockedRegions: RegionName[] = (S?.unlockedRegions && S.unlockedRegions.length > 0)
      ? S.unlockedRegions
      : [];

    // Ensure 2 to 3 live auctions, distributed across unlocked regions
    const targetAuctions = 2 + Math.floor(Math.random() * 2); 
    while (S.auctions.length < targetAuctions && S.auctions.length < 4) {
      const customDuration = (75 + Math.floor(Math.random() * 60)) * 1000;
      const forceRegion = unlockedRegions[Math.floor(Math.random() * unlockedRegions.length)];
      this.generate(S, { 
        isAuction: true, 
        vip: Math.random() < 0.25,
        auctionDuration: customDuration,
        forceRegion
      });
    }

    // Ensure jobs board has enough contracts, guaranteeing fair multi-region representation
    const prog = S ? getCompanyProgression(S) : { tier: 0 };
    const isVipCarrier = prog.tier >= 3;
    
    // Contract (tender) loads: planned by the tender engine (paced, parallel, never over-listed).
    // Listed at the FRONT of the board so trimming and the "17 jobs" cap can never push them off.
    // Free carriers keep the 5-listings-per-5-hours allowance; premium is unlimited.
    if (S.corporateTenders && S.corporateTenders.length > 0) {
      const limit = FreightEngine.getTenderLimit(S);
      const now = Date.now();
      const isPremium = limit.premiumActive && limit.premiumExpiresAt > now;
      const MAX_FREE_LISTINGS = 5;

      for (const plan of planTenderLoads(S, now)) {
        if (!isPremium && limit.count >= MAX_FREE_LISTINGS) break;
        const newJob = this.generate(S, { tenderId: plan.tenderId });
        if (newJob) {
          // VIP and Tender jobs always go to the global board for high-level visibility
          S.jobs.unshift(newJob);
          consumeTenderListing(S, plan.tenderId, now);
          if (!isPremium) limit.count++;
        }
      }
    }

    // FLEET-AWARE OUTBOUND HAUL GUARANTEE:
    // Ensure idle trucks stationed at owned hubs have at least one outbound job on their hub board.
    const fleet = (S.fleet || []).filter((t: any) => t.status === 'idle');
    let addedFleetJobs = 0;
    for (const truck of fleet) {
      if (addedFleetJobs >= 8) break;
      if (!truck.loc) continue;
      const truckRegion = resolveTruckRegion(truck.loc);
      if (!unlockedRegions.includes(truckRegion)) continue;

      const originHubId = (S.depots || []).find((hId: string) => {
        const h = REGIONAL_HUBS.find(rh => rh.id === hId);
        return h && h.city === truck.loc;
      });
      if (!originHubId) continue;

      const hubList = S.hubJobs[originHubId] || [];
      const hasJobFromTruckLoc = hubList.some((j: any) => j.from === truck.loc);
      if (!hasJobFromTruckLoc) {
        const regionCities = Object.entries(LOCATIONS)
          .filter(([k, loc]) => loc.region === truckRegion && k !== truck.loc)
          .map(([k]) => k);
        const returnDest = regionCities.length > 0 ? rnd(regionCities) : undefined;
        
        const newJob = this.generate(S, {
          forceRegion: truckRegion,
          forceFrom: truck.loc,
          forceTo: returnDest,
          forceTrailer: truck.trailer || 'curtain'
        });

        if (newJob) {
          if (!S.hubJobs[originHubId]) S.hubJobs[originHubId] = [];
          S.hubJobs[originHubId].unshift(newJob);
          addedFleetJobs++;
        }
      }
    }

    // Ensure each unlocked region has VIP contracts on the main board
    for (const region of unlockedRegions) {
      if (S.jobs.length >= 17) break;
      const regionJobsCount = S.jobs.filter((j: any) => {
        const loc = LOCATIONS[j.from];
        return loc && loc.region === region;
      }).length;

      if (regionJobsCount < 2) {
        const vipJob = this.generate(S, { vip: true, forceRegion: region });
        if (vipJob) S.jobs.push(vipJob);
      }
    }

    while (S.jobs.length < count && S.jobs.length < 17) {
      const forceRegion = unlockedRegions[Math.floor(Math.random() * unlockedRegions.length)];
      // Only generate VIP jobs for the global board. Regular jobs are now hub-centric.
      const newJob = this.generate(S, { vip: true, forceRegion });
      if (newJob) {
        S.jobs.push(newJob);
      } else {
        break;
      }
    }
  }

  /**
   * Main simulation tick for economics and driver state
   */
  static processEconomics(S: any, now: number) {
    if (!S.lastTick) S.lastTick = now;
    const elapsedMs = now - S.lastTick;
    if (elapsedMs <= 0) return;

    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    // 1. Corporate Tender Completion
    if (S.corporateTenders && S.corporateTenders.length > 0) {
      S.corporateTenders = S.corporateTenders.filter((tender: any) => {
        if ((tender.completedLoads >= tender.totalLoads || tender.loadsRemaining <= 0) && !tender.bonusAwarded) {
          tender.bonusAwarded = true;
          // Drastically reduced bonus to 35% of original windfall
          const adjustedBonus = Math.round((Number(tender.bonusPayout) || 0) * 0.35);
          S.money = (Number.isFinite(S.money) ? S.money : 0) + adjustedBonus;
          if (S.stats) S.stats.earned += adjustedBonus;
          pushNote(S, `${tender.client} contract completed! Awarded $${adjustedBonus.toLocaleString()} SLA performance bonus!`, {
            title: 'CORPORATE TENDER COMPLETED',
            type: 'tender',
            priority: 1,
            body: `Corporate Tender ID: ${tender.id}\nClient: ${tender.client}\nPerformance Bonus: $${adjustedBonus.toLocaleString()}\nSLA Met: 100%`
          });
          toast(`Tender Completed: ${tender.client}! +$${adjustedBonus.toLocaleString()} Bonus 🪙`, 'success');
          return false;
        }
        return true;
      });
    }
    
    let dailyInflow = 0;
    let dailyOutflow = 0;

    // Use current upgrade definitions for income
    if (S.warehouseUpgrades?.cross_docking) dailyInflow += 450;
    if (S.warehouseUpgrades?.cold_vault) dailyInflow += 350;
    if (S.warehouseUpgrades?.gantry_crane) dailyInflow += 200;

    // Corrected labor costs: Elite drivers cost more
    const totalSalaries = (S.drivers || []).reduce((acc: number, d: any) => {
      const baseWage = 480; // Hardcore base wage
      const skillBonus = (Number(d.experience) || 0) * 1.5;
      return acc + (baseWage + skillBonus);
    }, 0);
    dailyOutflow += totalSalaries;

    // Per-unit insurance premiums (Hardcore scaling)
    const activeTruckCount = (S.fleet || []).length;
    if (S.insurance) {
      if (S.insurance.liability) dailyOutflow += (65 * activeTruckCount);
      if (S.insurance.collision) dailyOutflow += (140 * activeTruckCount);
      if (S.insurance.cargo) dailyOutflow += (110 * activeTruckCount);
    }

    if (S.loans) S.loans.forEach((l: any) => dailyOutflow += (Number(l.dailyRate) || 0));
    if (S.leases) S.leases.forEach((l: any) => dailyOutflow += (Number(l.dailyRate) || 0));

    const netDaily = dailyInflow - dailyOutflow;
    const netDelta = (netDaily / MS_PER_DAY) * (Number(elapsedMs) || 0);
    if (Number.isFinite(netDelta)) {
      S.money = (Number.isFinite(S.money) ? S.money : 0) + netDelta;
    }

    // 2. Loan Amortization
    if (S.loans && S.loans.length > 0) {
      S.loans.forEach((loan: any) => {
        const loanPayment = (loan.dailyRate / MS_PER_DAY) * elapsedMs;
        loan.balance = Math.max(0, loan.balance - loanPayment);
        loan.daysRemaining = Math.max(0, loan.daysRemaining - (elapsedMs / MS_PER_DAY));
      });
      const settled = S.loans.filter((l: any) => l.balance <= 0);
      if (settled.length > 0) {
        S.loans = S.loans.filter((l: any) => l.balance > 0);
        settled.forEach((l: any) => pushNote(S, `Facility Paid: ${l.name}`, { title: 'LOAN SETTLED', type: 'finance' }));
      }
    }

    // 3. Lease Amortization
    if (S.leases && S.leases.length > 0) {
      S.leases.forEach((lease: any) => {
        lease.daysRemaining = Math.max(0, lease.daysRemaining - (elapsedMs / MS_PER_DAY));
      });
      const expired = S.leases.filter((l: any) => l.daysRemaining <= 0);
      if (expired.length > 0) {
        S.leases = S.leases.filter((l: any) => l.daysRemaining > 0);
        expired.forEach((l: any) => {
          const truck = S.fleet.find((t: any) => t.id === l.truckId);
          if (truck) truck.status = 'expired';
          pushNote(S, `Lease expired for Unit #${l.truckId}`, { title: 'LEASE EXPIRED', type: 'ops' });
        });
      }
    }

    // 4. Instant Idle Recovery
    // Drivers are considered rested immediately when not on an active dispatch.
    if (S.drivers && S.drivers.length > 0) {
      S.drivers.forEach((drv: any) => {
        const isOnTrip = (S.active || []).some((a: any) => {
          const truck = (S.fleet || []).find((t: any) => t.id === a.truck);
          return truck && truck.driverId === drv.id;
        });

        if (!isOnTrip) {
          drv.fatigue = 0;
          drv.hosHours = 0;
          drv.hosRestUntil = null;
        }
      });
    }

    S.lastTick = now;
  }
}
