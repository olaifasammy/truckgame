import { Region, FreightJob, JobKind } from '../types';
import { COMPANIES } from '../companies/registry';
import { CARGO_TYPES } from '../cargo/registry';
import { CITIES, LOCATIONS, RegionName } from '../../../data/world';
import { rnd, toast } from '../../../core/ui';
import { BiddingEngine } from '../bids/engine';
import { distKm, getRouteEnv } from '../../../systems/calc';
import { getCompanyProgression } from '../../company/progression';
import { SAMPLE_TENDERS } from '../../logistics/network';
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
  static generate(S: any, options: { forceRegion?: RegionName, vip?: boolean, isAuction?: boolean, auctionDuration?: number, tenderId?: string } = {}): FreightJob | any {
    const prog = S ? getCompanyProgression(S) : { tier: 0 };
    const vipLevel = prog.tier >= 3 ? (prog.tier - 2) : 0;

    const tender = options.tenderId ? SAMPLE_TENDERS.find(t => t.id === options.tenderId) : null;

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
      // Pick cargo suitable for the tender
      const industryMap: Record<string, string[]> = {
        'Automotive & Heavy Industry': ['steel_pipes', 'electronics', 'furniture'],
        'Energy & ADR Petrochemicals': ['gasoline', 'liquid_oxy', 'toxic_waste'],
        'Pharmaceuticals & Food Perishables': ['frozen_fish', 'vaccines', 'produce']
      };
      const possibleCargos = industryMap[tender.industry] || ['electronics'];
      const tenderPool = CARGO_TYPES.filter(c => possibleCargos.includes(c.id));
      cargo = rnd(tenderPool.length ? tenderPool : CARGO_TYPES);
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

      // 75% probability to prioritize player's owned trailers
      const ownedMatches = pool.filter(c => ownedTrailers.has(c.trailer));
      if (ownedTrailers.size > 0 && ownedMatches.length > 0 && Math.random() < 0.75) {
        cargo = rnd(ownedMatches);
      } else {
        cargo = rnd(pool);
      }
    }

    const company = rnd(COMPANIES);

    // Filter available regions strictly to those unlocked by company operating authority
    const unlockedRegions: RegionName[] = (S?.unlockedRegions && S.unlockedRegions.length > 0)
      ? S.unlockedRegions
      : ['Africa'];

    let targetRegion: RegionName;
    if (tender) {
      targetRegion = unlockedRegions.includes('Europe') ? 'Europe' : unlockedRegions[0];
    } else if (options.forceRegion && unlockedRegions.includes(options.forceRegion)) {
      targetRegion = options.forceRegion;
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

    // Freight contracts run between realistic regional cities (prioritizing owned terminal depots)
    if (ownedHubsInRegion.length > 0 && Math.random() < 0.65) {
      from = rnd(ownedHubsInRegion);
      const possibleDestinations = regionCities.filter(c => c !== from);
      to = rnd(possibleDestinations.length ? possibleDestinations : regionCities);
    } else if (regionCities.length >= 2) {
      from = rnd(regionCities);
      const possibleDestinations = regionCities.filter(c => c !== from);
      to = rnd(possibleDestinations.length ? possibleDestinations : regionCities);
    } else {
      from = 'LAGOS';
      to = 'IBADAN';
    }

    // Authentic highway distance calculation
    const baseKm = distKm(from, to);
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
      if (cargo.tempControlled) rate *= 1.35;
      if (weight > 18) rate *= 1.25;
      if (routeEnv.weather === 'snow' || routeEnv.terrain === 'icy_road') rate *= 1.40;
      if ((routeEnv.roadGrade || 0) > 5.0) rate *= 1.30;
    }

    const pay = tender ? tender.ratePerDelivery : Math.round(baseKm * rate);

    const dice = Math.random();
    let kind: JobKind = tender ? 'Contract' : 'Spot';
    if (options.isAuction) kind = 'Contract';
    else if (dice > 0.8) kind = 'Contract';
    else if (dice > 0.95) kind = 'Emergency';

    const requiredSkills: string[] = [];
    if (cargo.isFragile) requiredSkills.push('Fragile Cargo');
    if (cargo.tempControlled) requiredSkills.push('Cold Chain');
    if (cargo.isHazmat) requiredSkills.push('Hazardous ADR');
    if (baseKm > 800) requiredSkills.push('Long Distance');
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
      km: baseKm,
      pay,
      deadline: Date.now() + (baseKm * 3600000 / 60) + (12 * 3600000),
      env: routeEnv,
      requirements: {
        requiredSkills,
        requiredLicenses: cargo.isHazmat ? ['adr_hazmat'] : []
      },
      trailer: cargo.trailer,
      isShipperTanker: cargo.isHazmat && !ownedTrailers.has('hazmat'),
      vip: !!options.vip
    };

    if (options.isAuction) {
      const auction = BiddingEngine.createAuction(job, options.auctionDuration);
      if (!S.auctions) S.auctions = [];
      S.auctions.push(auction);
      return { ...job, isAuction: true, auctionId: auction.id };
    }

    return job;
  }

  static replenish(S: any, count = 8) {
    if (!S.jobs) S.jobs = [];
    if (!S.auctions) S.auctions = [];

    // Ensure 2 to 3 live auctions
    const targetAuctions = 2 + Math.floor(Math.random() * 2); 
    while (S.auctions.length < targetAuctions) {
      const customDuration = (75 + Math.floor(Math.random() * 60)) * 1000;
      this.generate(S, { 
        isAuction: true, 
        vip: Math.random() < 0.25,
        auctionDuration: customDuration 
      });
    }

    // Ensure jobs board has enough contracts
    const prog = S ? getCompanyProgression(S) : { tier: 0 };
    const isVipCarrier = prog.tier >= 3;
    
    // Inject corporate tender loads if active
    if (S.corporateTenders && S.corporateTenders.length > 0) {
      for (const tender of S.corporateTenders) {
        const activeLoadsOnBoard = S.jobs.filter((j: any) => j.tenderId === tender.id).length;
        if (activeLoadsOnBoard < 1 && (tender.loadsRemaining || 0) > 0) {
          S.jobs.push(this.generate(S, { tenderId: tender.id }));
        }
      }
    }

    while (S.jobs.length < count) {
      S.jobs.push(this.generate(S, { vip: isVipCarrier && Math.random() < 0.15 }));
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

    const subcontractCount = (S.subcontractedTrucks || []).length;
    if (subcontractCount > 0) dailyInflow += subcontractCount * 1800;

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
        settled.forEach(l => pushNote(S, `Facility Paid: ${l.name}`, { title: 'LOAN SETTLED', type: 'finance' }));
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
        expired.forEach(l => {
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
