import { Driver, Region, DriverTraitId } from './drivers.types';
import { REGIONAL_NAMES, TRAIT_KEYS } from './drivers.names';

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

  return {
    id,
    name,
    region,
    skill,
    salary,
    morale: 85 + Math.round(Math.random() * 15),
    fatigue: Math.round(Math.random() * 15),
    trait,
    assignedTruckId: null,
    stats: {
      tripsCompleted: 0,
      kmDriven: 0,
      earned: 0
    }
  };
}

export function fillDriverPool(S: any, targetCount = 10) {
  if (!S.pool) S.pool = [];
  if (!S.drivers) S.drivers = [];

  while (S.pool.length < targetCount) {
    const newDriver = generateDriver(S.nextId++);
    S.pool.push(newDriver);
  }
}
