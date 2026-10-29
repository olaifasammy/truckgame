import { Region, FreightJob, JobKind } from '../types';
import { COMPANIES } from '../companies/registry';
import { CARGO_TYPES } from '../cargo/registry';
import { CITIES, LOCATIONS, RegionName } from '../../../data/world';
import { rnd } from '../../../core/ui';
import { BiddingEngine } from '../bids/engine';
import { distKm, getRouteEnv } from '../../../systems/calc';
import { getCompanyProgression } from '../../company/progression';

export class FreightEngine {
  /**
   * Generates a realistic freight job or auction with authentic route physics.
   * - Bidding jobs: Exclusively high-paying contracts, scaling higher with VIP rank.
   * - Normal jobs: Modest, balanced payouts.
   */
  static generate(S: any, options: { forceRegion?: RegionName, vip?: boolean, isAuction?: boolean, auctionDuration?: number } = {}): FreightJob | any {
    const prog = S ? getCompanyProgression(S) : { tier: 0 };
    const vipLevel = prog.tier >= 3 ? (prog.tier - 2) : 0;

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
    if (options.isAuction) {
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

    // Pick a region: either forced or chosen from the 4 global regions
    const regions: RegionName[] = ['Africa', 'Europe', 'America', 'Asia'];
    const targetRegion = options.forceRegion || rnd(regions);

    // Filter cities within the target region for realistic intra-regional transit
    const regionCities = Object.entries(LOCATIONS)
      .filter(([_, loc]) => loc.region === targetRegion)
      .map(([key]) => key);

    // 85% of jobs are within the same region, 15% are high-value trans-continental
    let from: string;
    let to: string;

    if (Math.random() < 0.85 && regionCities.length >= 2) {
      from = rnd(regionCities);
      to = rnd(regionCities);
      while (to === from) to = rnd(regionCities);
    } else {
      const allCities = Object.keys(LOCATIONS);
      from = rnd(allCities);
      to = rnd(allCities);
      while (to === from) to = rnd(allCities);
    }

    // Authentic highway distance calculation
    const baseKm = distKm(from, to);
    const routeEnv = getRouteEnv(from, to);

    // Realistic Cargo Weight (tonnes)
    let weight = 6 + Math.random() * 18;
    if (cargo.trailer === 'lowboy') weight = 22 + Math.random() * 38;
    else if (cargo.trailer === 'tipper') weight = 18 + Math.random() * 24;
    else if (cargo.trailer === 'tanker' || cargo.trailer === 'hazmat') weight = 20 + Math.random() * 26;

    let rate: number;

    if (options.isAuction) {
      // PREMIUM SPOT AUCTION RATES: High-paying contracts only
      // Base rate: $7.50 – $22.00+/km
      rate = 7.50 + (cargo.baseValue * 0.22);

      // Higher VIP rank = higher chances of massive bidding payouts
      const vipMultiplier = 1.05 + Math.min(2.8, (vipLevel * 0.022));
      rate *= vipMultiplier;

      if (cargo.isHazmat) rate *= 1.35;
      if (cargo.isFragile) rate *= 1.30;
      if (cargo.tempControlled) rate *= 1.25;
      if (weight > 18) rate *= (1 + (weight - 18) * 0.02);
      if (routeEnv.weather === 'snow' || routeEnv.terrain === 'icy_road') rate *= 1.25;
      if ((routeEnv.roadGrade || 0) > 5.0) rate *= 1.20;
    } else {
      // NORMAL JOB GENERATOR: Balanced, modest payouts ($1.90 – $3.20/km)
      rate = 1.90 + (cargo.baseValue * 0.04);
      if (options.vip) rate *= 1.20;
      if (cargo.isHazmat) rate *= 1.20;
      if (cargo.tempControlled) rate *= 1.15;
      if (weight > 18) rate *= 1.10;
      if (routeEnv.weather === 'snow' || routeEnv.terrain === 'icy_road') rate *= 1.15;
      if ((routeEnv.roadGrade || 0) > 5.0) rate *= 1.10;
    }

    const pay = Math.round(baseKm * rate);

    const dice = Math.random();
    let kind: JobKind = 'Spot';
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
      companyId: company.id,
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
        minLevel: options.vip ? 5 : 1,
        adrClass: cargo.adrClass,
        reefer: cargo.tempControlled
      },
      vip: options.vip,
      isAuction: options.isAuction
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
    while (S.jobs.length < count) {
      S.jobs.push(this.generate(S, { vip: Math.random() < 0.15 }));
    }
  }
}
