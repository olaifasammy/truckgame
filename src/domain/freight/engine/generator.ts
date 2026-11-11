import { salesLeadTemplate } from '../../notifications/templates';
import { Region, FreightJob, JobKind } from '../types';
import { COMPANIES } from '../companies/registry';
import { CARGO_TYPES } from '../cargo/registry';
import { CITIES, LOCATIONS, RegionName } from '../../../data/world';
import { rnd, toast } from '../../../core/ui';
import { BiddingEngine } from '../bids/engine';
import { distKm, getRouteEnv } from '../../../systems/calc';
import { getCompanyProgression } from '../../company/progression';
import { SAMPLE_TENDERS } from '../../logistics/network';
import { getDynamicCorporateTenders } from '../../contracts/tenders';
import { getTotalSubcontractInflow } from '../../fleet/subcontracting';
import { pushNote } from '../../../systems/notify';

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
    (S?.fleet || []).forEach((t: any) => {
      if (t.trailer) ownedTrailers.add(t.trailer);
    });
    (S?.trailers || []).forEach((tr: string) => ownedTrailers.add(tr));
    
    // Consignor-supplied tankers are available if the carrier has ADR authority
    if (S?.licenses?.includes('adr_hazmat')) {
      ownedTrailers.add('hazmat');
      ownedTrailers.add('tanker');
    }

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

      // 70% probability to match player's owned trailers
      const ownedMatches = pool.filter(c => ownedTrailers.has(c.trailer));
      if (ownedTrailers.size > 0 && ownedMatches.length > 0 && Math.random() < 0.70) {
        cargo = rnd(ownedMatches);
      } else {
        cargo = rnd(pool);
      }
    } else {
      // Normal job generator: payouts shouldn't be too high, everyday freight
      const standardCargos = CARGO_TYPES.filter(c => c.baseValue < 30);
      const pool = standardCargos.length ? standardCargos : CARGO_TYPES;

      if (options.forceTrailer) {
        const trailerCargos = pool.filter(c => c.trailer === options.forceTrailer);
        if (trailerCargos.length > 0) {
          cargo = rnd(trailerCargos);
        }
      }

      if (!cargo) {
        // 75% probability to prioritize player's owned trailers
        const ownedMatches = pool.filter(c => ownedTrailers.has(c.trailer));
        if (ownedTrailers.size > 0 && ownedMatches.length > 0 && Math.random() < 0.75) {
          cargo = rnd(ownedMatches);
        } else {
          cargo = rnd(pool);
        }
      }
    }

    const company = rnd(COMPANIES);

    // Filter available regions strictly to those unlocked by company operating authority
    const unlockedRegions: RegionName[] = (S?.unlockedRegions && S.unlockedRegions.length > 0)
      ? S.unlockedRegions
      : [];

    let targetRegion: RegionName;
    if (options.forceFrom && LOCATIONS[options.forceFrom]) {
      targetRegion = LOCATIONS[options.forceFrom].region;
    } else if (tender && (tender as any).region && unlockedRegions.includes((tender as any).region as RegionName)) {
      targetRegion = (tender as any).region as RegionName;
    } else if (options.forceRegion && unlockedRegions.includes(options.forceRegion)) {
      targetRegion = options.forceRegion;
    } else if (tender) {
      // If it's a tender but no region is specified, spread it across unlocked regions
      // based on tender ID to ensure stability but variation.
      const tenderSeed = (tender.id || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      targetRegion = unlockedRegions[tenderSeed % unlockedRegions.length];
    } else {
      targetRegion = rnd(unlockedRegions);
    }

    // Filter cities strictly within the target operating region
    const regionCities = Object.entries(LOCATIONS)
      .filter(([_, loc]) => loc.region === targetRegion)
      .map(([key]) => key);

    // Carrier hubs owned in this region
    const ownedHubsInRegion = (S?.depots || []).map((depotId: string) => {
      if (depotId.includes('lagos')) return 'LAGOS';
      if (depotId.includes('abuja')) return 'ABUJA';
      if (depotId.includes('kano')) return 'KANO';
      if (depotId.includes('rotterdam')) return 'ROTTERDAM';
      if (depotId.includes('munich')) return 'MUNICH';
      if (depotId.includes('lyon')) return 'LYON';
      if (depotId.includes('chicago')) return 'CHICAGO';
      if (depotId.includes('dallas')) return 'DALLAS';
      if (depotId.includes('los_angeles')) return 'LOS_ANGELES';
      if (depotId.includes('tokyo')) return 'TOKYO';
      if (depotId.includes('shanghai')) return 'SHANGHAI';
      if (depotId.includes('almaty')) return 'ALMATY';
      return null;
    }).filter((c: string | null) => c && LOCATIONS[c]?.region === targetRegion) as string[];

    let from: string;
    let to: string;

    const allCityKeys = Object.keys(CITIES);
    const validRegionCities = regionCities.length > 0 ? regionCities : allCityKeys;

    // Direct / Backhaul routing ("To & Fro" return freight)
    if (options.forceFrom && LOCATIONS[options.forceFrom]) {
      from = options.forceFrom;
    } else if (ownedHubsInRegion.length > 0 && Math.random() < 0.65) {
      from = rnd(ownedHubsInRegion);
    } else {
      from = rnd(validRegionCities);
    }

    const otherRegionCities = validRegionCities.filter(c => c !== from);
    const fallbackCities = allCityKeys.filter(c => c !== from);
    const destinationPool = otherRegionCities.length > 0 ? otherRegionCities : fallbackCities;

    if (options.forceTo && LOCATIONS[options.forceTo] && options.forceTo !== from) {
      to = options.forceTo;
    } else {
      to = rnd(destinationPool.length > 0 ? destinationPool : fallbackCities);
    }
    if (!to || to === from) {
      to = fallbackCities.find(c => c !== from) || 'IBADAN';
    }

    // Authentic highway distance calculation with minimum floor
    const rawBaseKm = distKm(from, to);
    const baseKm = rawBaseKm > 10 ? rawBaseKm : Math.max(125, distKm(from, from === 'LAGOS' ? 'IBADAN' : 'LAGOS'));
    const routeEnv = getRouteEnv(from, to);

    // Realistic Cargo Weight (tonnes)
    let weight = 6 + Math.random() * 18;
    if (cargo.trailer === 'lowboy') weight = 22 + Math.random() * 38;
    else if (cargo.trailer === 'tipper') weight = 18 + Math.random() * 24;
    else if (cargo.trailer === 'tanker' || cargo.trailer === 'hazmat') weight = 20 + Math.random() * 26;

    let rate = 2.0;

    if (tender) {
      // Tender has a fixed pay per load
    } else if (options.isAuction) {
      // PREMIUM SPOT AUCTION RATES: High-paying contracts only
      rate = 7.50 + (cargo.baseValue * 0.22);
      const vipMultiplier = 1.05 + Math.min(2.8, (vipLevel * 0.022));
      rate *= vipMultiplier;

      if (cargo.isHazmat) rate *= 1.35;
      if (cargo.isFragile) rate *= 1.30;
      if (cargo.tempControlled) rate *= 1.25;
      if (weight > 18) rate *= (1 + (weight - 18) * 0.02);
      if (routeEnv.weather === 'snow' || routeEnv.terrain === 'icy_road') rate *= 1.25;
      if ((routeEnv.roadGrade || 0) > 5.0) rate *= 1.20;
    } else {
      // NORMAL JOB GENERATOR: More realistic logistics rates ($3.40 – $5.80/km)
      rate = 3.40 + (cargo.baseValue * 0.08);
      if (options.vip) rate *= 1.30;
      if (cargo.isHazmat) rate *= 1.45;
      if (cargo.isFragile) rate *= 1.30;
      if (cargo.tempControlled) rate *= 1.35;
      if (weight > 18) rate *= (1 + (weight - 18) * 0.02);
      if (routeEnv.weather === 'snow' || routeEnv.terrain === 'icy_road') rate *= 1.40;
      if ((routeEnv.roadGrade || 0) > 5.0) rate *= 1.30;
    }

    const calculatedPay = tender ? Math.round((tender.ratePerDelivery || 15000) * (0.94 + Math.random() * 0.12)) : Math.round(baseKm * rate);
    const pay = Math.max(450, calculatedPay);

    // Dedicated 2-Way Round-Trip Turnaround Contracts
    const isRoundTrip = !options.isAuction && !options.tenderId && Math.random() < 0.25;
    let finalPay = pay;
    let totalKm = baseKm;
    let returnCargoObj: any = null;
    let turnaroundBonus = 0;
    let leg1Pay = pay;
    let leg2Pay = 0;

    if (isRoundTrip) {
      const compatibleReturnCargos = CARGO_TYPES.filter(c => c.trailer === cargo.trailer && c.id !== cargo.id);
      returnCargoObj = compatibleReturnCargos.length > 0 ? rnd(compatibleReturnCargos) : cargo;
      let leg2Rate = 3.40 + (returnCargoObj.baseValue * 0.08);
      if (options.vip) leg2Rate *= 1.30;
      if (returnCargoObj.isHazmat) leg2Rate *= 1.45;
      if (returnCargoObj.isFragile) leg2Rate *= 1.30;
      if (returnCargoObj.tempControlled) leg2Rate *= 1.35;
      if (weight > 18) leg2Rate *= (1 + (weight - 18) * 0.02);
      if (routeEnv.weather === 'snow' || routeEnv.terrain === 'icy_road') leg2Rate *= 1.40;
      if ((routeEnv.roadGrade || 0) > 5.0) leg2Rate *= 1.30;
      leg2Pay = Math.max(450, Math.round(baseKm * leg2Rate));
      turnaroundBonus = Math.round((pay + leg2Pay) * 0.15); // +15% Turnaround efficiency bonus
      finalPay = pay + leg2Pay + turnaroundBonus;
      totalKm = baseKm * 2;
    }

    const dice = Math.random();
    let kind: JobKind = tender ? 'Contract' : 'Spot';
    if (options.isAuction) kind = 'Contract';
    else if (dice > 0.8) kind = 'Contract';
    else if (dice > 0.95) kind = 'Emergency';

    const requiredSkills: string[] = [];
    if (cargo.isFragile) requiredSkills.push('Fragile Cargo');
    if (cargo.tempControlled) requiredSkills.push('Cold Chain');
    if (cargo.isHazmat) requiredSkills.push('Hazardous ADR');
    if (totalKm > 800) requiredSkills.push('Long Distance');
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
      deadline: Date.now() + (totalKm * 3600000 / 60) + (14 * 3600000),
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
      turnaroundBonus
    };

    if (options.isAuction) {
      const auction = BiddingEngine.createAuction(job, options.auctionDuration);
      if (!S.auctions) S.auctions = [];
      S.auctions.push(auction);

      // Notification for high-value sales lead
      if (job.pay > 15000) {
        const tpl = salesLeadTemplate(company.name, job.from, job.to, job.pay);
        pushNote(S, tpl.msg, {
          title: tpl.title,
          type: tpl.type,
          priority: tpl.priority,
          body: tpl.body
        });
      }

      return { ...job, isAuction: true, auctionId: auction.id };
    }

    return job;
  }

  static replenish(S: any, count = 6) {
    if (!S.jobs) S.jobs = [];
    if (!S.auctions) S.auctions = [];

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
    
    // Inject corporate tender loads if active (Enforce 5 jobs per 5 hours limit unless premium)
    if (S.corporateTenders && S.corporateTenders.length > 0) {
      const now = Date.now();
      if (!S.tenderListingLimit) S.tenderListingLimit = { count: 0, windowStart: now };
      
      const limit = S.tenderListingLimit;
      const WINDOW_MS = 5 * 60 * 60 * 1000;
      if (now - limit.windowStart > WINDOW_MS) {
        limit.windowStart = now;
        limit.count = 0;
      }

      const isPremium = limit.premiumActive && limit.premiumExpiresAt > now;
      const MAX_FREE_LISTINGS = 5;

      for (const tender of S.corporateTenders) {
        const activeLoadsOnBoard = (S.jobs || []).filter((j: any) => j.tenderId === tender.id).length;
        if (activeLoadsOnBoard < 1 && (tender.loadsRemaining || 0) > 0) {
          // Check limit
          if (!isPremium && limit.count >= MAX_FREE_LISTINGS) {
            continue; // Skip listing if limit reached and not premium
          }

          const newJob = this.generate(S, { tenderId: tender.id });
          if (newJob) {
            S.jobs.push(newJob);
            if (!isPremium) {
              limit.count++;
            }
          }
        }
      }
    }

    // FLEET-AWARE OUTBOUND HAUL GUARANTEE:
    // Cap this to avoid overwhelming the board when the fleet is large.
    // Prioritize idle trucks that don't already have a local job.
    const fleet = (S.fleet || []).filter((t: any) => t.status === 'idle');
    let addedFleetJobs = 0;
    for (const truck of fleet) {
      if (addedFleetJobs >= 4 || S.jobs.length >= 17) break;
      if (!truck.loc || !LOCATIONS[truck.loc]) continue;
      const truckRegion = LOCATIONS[truck.loc].region;
      if (!unlockedRegions.includes(truckRegion)) continue;

      const hasJobFromTruckLoc = S.jobs.some((j: any) => j.from === truck.loc);
      if (!hasJobFromTruckLoc) {
        const regionCities = Object.entries(LOCATIONS)
          .filter(([k, loc]) => loc.region === truckRegion && k !== truck.loc)
          .map(([k]) => k);
        const returnDest = regionCities.length > 0 ? rnd(regionCities) : undefined;
        
        S.jobs.unshift(this.generate(S, {
          forceRegion: truckRegion,
          forceFrom: truck.loc,
          forceTo: returnDest,
          forceTrailer: truck.trailer || 'curtain'
        }));
        addedFleetJobs++;
      }
    }

    // Ensure each unlocked region has balanced jobs on the board simultaneously
    for (const region of unlockedRegions) {
      if (S.jobs.length >= 17) break;
      const regionJobsCount = S.jobs.filter((j: any) => {
        const loc = LOCATIONS[j.from];
        return loc && loc.region === region;
      }).length;

      if (regionJobsCount < 2) {
        S.jobs.push(this.generate(S, { vip: isVipCarrier && Math.random() < 0.15, forceRegion: region }));
      }
    }

    while (S.jobs.length < count && S.jobs.length < 17) {
      const forceRegion = unlockedRegions[Math.floor(Math.random() * unlockedRegions.length)];
      S.jobs.push(this.generate(S, { vip: isVipCarrier && Math.random() < 0.15, forceRegion }));
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
          S.money += tender.bonusPayout;
          if (S.stats) S.stats.earned += tender.bonusPayout;
          pushNote(S, `${tender.client} contract completed! Awarded $${tender.bonusPayout.toLocaleString()} SLA performance bonus!`, {
            title: 'CORPORATE TENDER COMPLETED',
            type: 'tender',
            priority: 1,
            body: `Corporate Tender ID: ${tender.id}\nClient: ${tender.client}\nPerformance Bonus: $${tender.bonusPayout.toLocaleString()}\nSLA Met: 100%`
          });
          toast(`Tender Completed: ${tender.client}! +$${tender.bonusPayout.toLocaleString()} Bonus 🪙`, 'success');
          return false;
        }
        return true;
      });
    }
    
    let dailyInflow = 0;
    let dailyOutflow = 0;

    if (S.warehouseUpgrades?.cross_docking) dailyInflow += 1200;
    if (S.warehouseUpgrades?.cold_vault) dailyInflow += 800;
    if (S.warehouseUpgrades?.gantry_crane) dailyInflow += 600;

    // Dynamic subcontracting inflow from chartered rigs and yard trailers
    dailyInflow += getTotalSubcontractInflow(S);

    const totalSalaries = (S.drivers || []).reduce((acc: number, d: any) => acc + (d.salary || 250), 0);
    dailyOutflow += totalSalaries;

    if (S.insurance) {
      if (S.insurance.liability) dailyOutflow += 85;
      if (S.insurance.collision) dailyOutflow += 220;
      if (S.insurance.cargo) dailyOutflow += 310;
    }

    if (S.loans) S.loans.forEach((l: any) => dailyOutflow += (l.dailyRate || 0));
    if (S.leases) S.leases.forEach((l: any) => dailyOutflow += (l.dailyRate || 0));

    const netDaily = dailyInflow - dailyOutflow;
    const netDelta = (netDaily / MS_PER_DAY) * elapsedMs;
    S.money += netDelta;

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
