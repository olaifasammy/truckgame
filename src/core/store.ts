import { createTruck } from '../domain/trucks/trucks.physics';

const KEY = 'sam.v3';

const DEF = () => ({
  company: 'NexHaul Logistics',
  isAuthenticated: false,
  money: 165000, 
  coins: 10,
  companyTier: 0, // 0 = Newbie, 1 = Professional, 2 = Expert, 3..132 = VIP 1..130
  vip: 1,
  xp: 0,
  reputation: 100,
  loads: 0,
  tab: 'home',
  nextId: 100,
  jobs: [] as any[],
  active: [] as any[],
  notes: [{ id: '1', title: 'Welcome', msg: 'Welcome to NexHaul Logistics Management System.', at: Date.now(), read: false, type: 'system', priority: 1 }] as any[],
  pool: [] as any[],
  drivers: [{ id: 1, name: 'Sam Okafor', skill: 3 }],
  perks: {} as Record<string, number>,
  offices: [] as string[],
  garageLevel: 0,
  stats: { earned: 0, km: 0 },
  repairs: [] as any[],
  repairTruckId: null as number | null,
  licenses: ['standard'] as string[],
  trailers: ['curtain', 'flatbed', 'reefer'] as string[],
  pendingTrailers: [] as { type: string, availableAt: number }[],
  partsInventory: {
    tires: 4,
    brakes: 2,
    oilFilter: 6,
    fuelFilter: 4,
    airFilter: 4,
    oil: 12,
    coolant: 8,
    adBlue: 10,
    suspension: 1,
    windshield: 1,
    engine: 0,
    transmission: 0
  } as Record<string, number>,
  fleet: [createTruck(1, 'scania_s730', 'Flagship S730 #1', 'LAGOS')],
  loans: [] as any[],
  leases: [] as any[],
  insurance: { liability: true, collision: true, cargo: false, claimsCount: 0, totalPaidOut: 0 },
  fuelBunker: { currentLiters: 4500, maxCapacity: 12000, avgCostPerLiter: 0.95 },
  depots: ['hub_lagos'] as string[],
  warehouseUpgrades: { cross_docking: false, cold_vault: false, gantry_crane: false } as Record<string, boolean>,
  corporateTenders: [] as any[],
  subcontractedTrucks: [] as number[],
  lastTick: Date.now()
});

let S: any;
const subs = new Set<(state: any) => void>();

function fix(state: any) {
  if (state.isAuthenticated === undefined) state.isAuthenticated = false;
  if (!state.licenses) state.licenses = ['standard'];
  if (!state.trailers) state.trailers = ['curtain', 'flatbed', 'reefer'];
  if (!state.loans) state.loans = [];
  if (!state.leases) state.leases = [];
  if (!state.insurance) state.insurance = { liability: true, collision: true, cargo: false, claimsCount: 0, totalPaidOut: 0 };
  if (!state.fuelBunker) state.fuelBunker = { currentLiters: 4500, maxCapacity: 12000, avgCostPerLiter: 0.95 };
  if (!state.depots) state.depots = ['hub_lagos'];
  if (!state.warehouseUpgrades) state.warehouseUpgrades = { cross_docking: false, cold_vault: false, gantry_crane: false };
  if (!state.pendingTrailers) state.pendingTrailers = [];
  if (!state.notes) state.notes = [];
  // Migrate legacy notes
  if (state.notes.length > 0 && state.notes[0].t !== undefined) {
    state.notes = state.notes.map((n: any, i: number) => ({
      id: 'legacy-' + i + '-' + Date.now(),
      title: 'Legacy Alert',
      msg: n.t,
      at: Date.now() - (i * 60000),
      read: !!n.r,
      type: 'system',
      priority: 0
    }));
  }

  if (!state.partsInventory) {
    state.partsInventory = {
      tires: 4,
      brakes: 2,
      oilFilter: 6,
      fuelFilter: 4,
      airFilter: 4,
      oil: 12,
      coolant: 8,
      adBlue: 10,
      suspension: 1,
      windshield: 1,
      engine: 0,
      transmission: 0
    };
  }
  if (!state.drivers) state.drivers = [{ id: 1, name: 'Sam Okafor', region: 'Africa', skill: 3, salary: 250, morale: 95, fatigue: 5, stress: 15, satisfaction: 90, hosHours: 2.5, hosRestUntil: null, trait: 'careful', certifications: ['Cold Chain'], stats: { tripsCompleted: 0, kmDriven: 0, earned: 0 } }];
  if (state.drivers) {
    state.drivers.forEach((d: any) => {
      if (!d.region) d.region = 'Africa';
      if (d.morale === undefined) d.morale = 90;
      if (d.fatigue === undefined) d.fatigue = 10;
      if (d.stress === undefined) d.stress = 15;
      if (d.satisfaction === undefined) d.satisfaction = 90;
      if (d.hosHours === undefined) d.hosHours = 0;
      if (d.hosRestUntil === undefined) d.hosRestUntil = null;
      if (!d.trait) d.trait = 'careful';
      if (!d.certifications) d.certifications = d.id === 1 ? ['Cold Chain'] : [];
      if (!d.salary) d.salary = d.skill * 150 + 100;
      if (!d.stats) d.stats = { tripsCompleted: 0, kmDriven: 0, earned: 0 };
    });
  }
  if (!state.pool) state.pool = [];
  if (state.pool) {
    state.pool.forEach((d: any) => {
      if (!d.region) d.region = 'Africa';
      if (!d.trait) d.trait = 'careful';
      if (!d.certifications) d.certifications = d.skill >= 3 ? ['Cold Chain'] : [];
      if (!d.salary) d.salary = d.skill * 150 + 100;
      if (d.morale === undefined) d.morale = 85;
      if (d.stress === undefined) d.stress = 20;
    });
  }
  if (!state.fleet) state.fleet = [];
  state.fleet.forEach((t: any) => {
    if (t.trailer === undefined) t.trailer = 'curtain';
    if (!t.fluids) {
      t.fluids = { fuel: 800, oil: 35, coolant: 100, adBlue: 100, transmissionOil: 100 };
    } else {
      if (t.fluids.transmissionOil === undefined) t.fluids.transmissionOil = 100;
      if (t.fluids.adBlue === undefined) t.fluids.adBlue = 100;
      if (t.fluids.coolant === undefined) t.fluids.coolant = 100;
    }
    if (!t.upgrades) {
      t.upgrades = { ecoTuning: 0, performanceChip: 0, heavyDutySuspension: false, gearbox: '12spd_highway', axleRatio: 'highway_eco', tireCompound: 'highway_eco' };
    } else {
      if (!t.upgrades.gearbox) t.upgrades.gearbox = '12spd_highway';
      if (!t.upgrades.axleRatio) t.upgrades.axleRatio = 'highway_eco';
      if (!t.upgrades.tireCompound) t.upgrades.tireCompound = 'highway_eco';
    }
  });
  if (!state.perks) state.perks = {};
  if (!state.offices) state.offices = [];
  if (state.garageLevel === undefined) state.garageLevel = 0;
  if (!state.stats) state.stats = { earned: 0, km: 0 };
  if (!state.reputation) state.reputation = 100;
  if (state.companyTier === undefined) {
    if (!state.loads || state.loads === 0) {
      state.companyTier = 0;
    } else {
      state.companyTier = Math.min(132, state.loads < 2 ? 0 : state.loads < 5 ? 1 : state.loads < 10 ? 2 : 2 + Math.floor((state.loads - 10) / 3) + 1);
    }
  }
  
  if (!state.repairs) state.repairs = [];
  if (state.repairTruckId === undefined) state.repairTruckId = null;
  if (state.lastTick === undefined) state.lastTick = Date.now();
  if (!state.auctions) {
    state.auctions = [];
  } else {
    const now = Date.now();
    state.auctions = state.auctions.filter((a: any) => a && a.expiresAt && a.expiresAt > now);
  }
  if (state.jobs && state.jobs.length > 0) {
    if (!state.jobs[0].cargoId) {
      state.jobs = [];
    } else {
      state.jobs.forEach((j: any) => {
        if (j.isAuctionWon) j.vip = false;
      });
    }
  }

  if (state.active && state.active.length > 0) {
    state.active.forEach((a: any) => {
      if (!a.cargo) {
        a.cargo = a.cargoId ? a.cargoId.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Commercial Freight';
      }
    });
  }
  
  // Migration: Fresh start for new physics if old schema found
  if (state.fleet && state.fleet.length > 0 && (state.fleet[0].model || state.fleet[0].cond !== undefined)) {
     state.fleet = [createTruck(1, 'scania_s730', 'Flagship S730 #1', 'LAGOS')];
     state.money = Math.max(state.money, 165000);
  }
}

export function load() {
  try {
    S = { ...DEF(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch (e) {
    S = DEF();
  }
  fix(S);
  return S;
}

export const get = () => S;

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
};

export function set(fn: (state: any) => void) {
  fn(S);
  save();
  subs.forEach(f => f(S));
}

export const refresh = () => subs.forEach(f => f(S));
export const subscribe = (f: (state: any) => void) => {
  subs.add(f);
  return () => { subs.delete(f); };
};
export const reset = () => {
  try { localStorage.removeItem(KEY); } catch (e) {}
};
