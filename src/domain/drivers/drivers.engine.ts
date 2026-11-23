import { Driver, Region, DriverTraitId } from './drivers.types';
import { REGIONAL_NAMES, TRAIT_KEYS } from './drivers.names';
import { pushNote } from '../../systems/notify';

export const DRIVER_RELOCATION_FEE = 1500;

export const SKILL_PROMOTION_MILESTONES: Record<number, { km: number; trips: number }> = {
  1: { km: 4000, trips: 4 },
  2: { km: 12000, trips: 12 },
  3: { km: 30000, trips: 30 },
  4: { km: 65000, trips: 65 }
};

/**
 * Evaluates natural CDL skill promotion from logged kmDriven & tripsCompleted.
 * Drivers mentored by a Master Driver (mentorId) gain +100% promotion speed (50% milestone threshold) up to skill 3.
 */
export function evaluateDriverProgression(drv: any, S?: any): boolean {
  if (!drv || !drv.stats || (drv.skill || 1) >= 5) return false;
  const currentSkill = Math.max(1, Math.min(4, drv.skill || 1));
  const req = SKILL_PROMOTION_MILESTONES[currentSkill];
  if (!req) return false;

  const mentorDiscount = (drv.mentorId && currentSkill <= 2) ? 0.5 : 1.0;
  const kmNeeded = Math.round(req.km * mentorDiscount);
  const tripsNeeded = Math.round(req.trips * mentorDiscount);

  if ((drv.stats.kmDriven || 0) >= kmNeeded && (drv.stats.tripsCompleted || 0) >= tripsNeeded) {
    drv.skill = currentSkill + 1;
    drv.salary = Math.round((drv.salary || 250) * 1.10);
    drv.morale = Math.min(100, (drv.morale ?? 80) + 15);
    if (S) {
      pushNote(S, `🏆 ${drv.name} earned CDL Level ${drv.skill}★ after ${Math.round(drv.stats.kmDriven).toLocaleString()} km (${drv.stats.tripsCompleted} trips). Base wage adjusted to $${drv.salary}/day.`, {
        title: 'DRIVER VETERAN PROMOTION',
        type: 'ops'
      });
    }
    return true;
  }
  return false;
}

/**
 * Daily driver lifecycle tick: off-duty stress recovery, burnout morale erosion,
 * payroll distress impact, and idle driver resignations.
 */
export function processDriverLifecycleTick(S: any, daysElapsed: number): { resigned: string[] } {
  const resigned: string[] = [];
  if (!S || !Array.isArray(S.drivers) || daysElapsed <= 0) return { resigned };

  const fleet = Array.isArray(S.fleet) ? S.fleet : [];
  const payrollDistress = (S.money ?? 0) < -10000;
  const surviving: any[] = [];

  for (const drv of S.drivers) {
    const truck = fleet.find((t: any) => t.driverId === drv.id);
    const isBusy = Boolean(truck && truck.status === 'busy');

    if (!isBusy) {
      // Off-duty recovery
      drv.stress = Math.max(0, Math.round(((drv.stress ?? 0) - 12 * daysElapsed) * 100) / 100);
      if ((drv.stress ?? 0) < 50 && !payrollDistress) {
        drv.morale = Math.min(85, Math.round(((drv.morale ?? 80) + 6 * daysElapsed) * 100) / 100);
      }
    }

    if ((drv.stress ?? 0) >= 75 || (drv.fatigue ?? 0) >= 85) {
      drv.morale = Math.max(0, Math.round(((drv.morale ?? 80) - 10 * daysElapsed) * 100) / 100);
    }

    if (payrollDistress) {
      drv.morale = Math.max(0, Math.round(((drv.morale ?? 80) - 8 * daysElapsed) * 100) / 100);
    }

    // Idle driver quits if morale collapses to <= 15
    if (!isBusy && (drv.morale ?? 80) <= 15) {
      if (truck) truck.driverId = null;
      resigned.push(drv.name);
      pushNote(S, `🚨 ${drv.name} resigned due to burnout/low morale (${Math.round(drv.morale)}%).`, {
        title: 'DRIVER RESIGNATION',
        type: 'alert',
        priority: 1
      });
    } else {
      surviving.push(drv);
    }
  }

  if (resigned.length > 0) {
    S.drivers = surviving;
  }
  return { resigned };
}

/**
 * Authoritative per-km driver mileage wage rate ($/km) based on CDL skill (1..5).
 */
export function getDriverPerKmRate(skill: number): number {
  const clamped = Math.max(1, Math.min(5, skill || 1));
  return Math.round((0.18 + clamped * 0.04) * 100) / 100;
}

export function generateDriver(id: number, forcedRegion?: Region): Driver {
  const regions: Region[] = ['America', 'Europe', 'Africa', 'Asia'];
  const region = forcedRegion || regions[Math.floor(Math.random() * regions.length)];
  const namePool = REGIONAL_NAMES[region];
  
  const firstName = namePool.first[Math.floor(Math.random() * namePool.first.length)];
  const lastName = namePool.last[Math.floor(Math.random() * namePool.last.length)];
  const name = `${firstName} ${lastName}`;

  // Skill 1 to 5 (weighted towards 1-3 for recruits)
  const rand = Math.random();
  const skill = rand < 0.5 ? 1 : rand < 0.8 ? 2 : rand < 0.95 ? 3 : rand < 0.99 ? 4 : 5;
  
  // Salary based on skill ($120 to $450 daily)
  const salary = Math.round(100 + (skill * 70) + (Math.random() * 40));
  
  const trait = TRAIT_KEYS[Math.floor(Math.random() * TRAIT_KEYS.length)];
  const certifications: string[] = [];
  if (skill >= 3 && Math.random() < 0.45) {
    const pool = ['Cold Chain', 'High-Value Fragile', 'Heavy Haul', 'ADR Hazmat', 'Double Trailer LCV'];
    certifications.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return {
    id,
    name,
    region,
    skill,
    salary,
    morale: 85 + Math.round(Math.random() * 15),
    fatigue: Math.round(Math.random() * 15),
    trait,
    certifications,
    assignedTruckId: null,
    stats: {
      tripsCompleted: 0,
      kmDriven: 0,
      earned: 0
    }
  };
}

export const RECRUITMENT_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Ensures the driver recruitment pool has adequate regional candidates (at least `minPerRegion` per region)
 * and rotates pool candidates periodically when `now >= S.driverPoolNextRefreshAt`.
 */
export function fillDriverPool(S: any, minPerRegion = 2, maxTotal = 12, now: number = Date.now()): void {
  if (!S) return;
  if (!S.pool) S.pool = [];
  if (!S.drivers) S.drivers = [];
  if (!S.nextId) S.nextId = 100;

  const ALL_REGIONS: Region[] = ['America', 'Europe', 'Africa', 'Asia'];

  // 1. Initialize or process periodic recruitment market pool refresh
  if (!S.driverPoolNextRefreshAt || now >= S.driverPoolNextRefreshAt) {
    S.driverPoolNextRefreshAt = now + RECRUITMENT_REFRESH_INTERVAL_MS;
    if (S.pool.length > 0) {
      // Keep half of current candidates, rotate out the older half
      const keepCount = Math.floor(S.pool.length / 2);
      S.pool = S.pool.slice(keepCount);
    }
  }

  // 2. Guarantee regional representation: Every region gets at least `minPerRegion` candidates available
  for (const reg of ALL_REGIONS) {
    const existingInRegion = S.pool.filter((d: any) => (d.region || 'Africa') === reg).length;
    const needed = minPerRegion - existingInRegion;
    for (let i = 0; i < needed; i++) {
      S.pool.push(generateDriver(S.nextId++, reg));
    }
  }

  // 3. Top off overall pool up to maxTotal
  while (S.pool.length < maxTotal) {
    S.pool.push(generateDriver(S.nextId++));
  }
}

/**
 * Manually refreshes the driver recruitment pool (e.g. paying agency search fee).
 */
export function forceRefreshDriverPool(S: any, now: number = Date.now()): void {
  if (!S) return;
  S.pool = [];
  S.driverPoolNextRefreshAt = now + RECRUITMENT_REFRESH_INTERVAL_MS;
  fillDriverPool(S, 2, 12, now);
}
