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
  notes: [{ t: 'Welcome to NexHaul Logistics', r: 0 }],
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
  fleet: [createTruck(1, 'scania_s730', 'Flagship S730 #1', 'LAGOS')]
});

let S: any;
const subs = new Set<(state: any) => void>();

function fix(state: any) {
  if (state.isAuthenticated === undefined) state.isAuthenticated = false;
  if (!state.licenses) state.licenses = ['standard'];
  if (!state.trailers) state.trailers = ['curtain', 'flatbed', 'reefer'];
  if (!state.drivers) state.drivers = [{ id: 1, name: 'Sam Okafor', region: 'Africa', skill: 3, salary: 250, morale: 95, fatigue: 5, trait: 'careful', certifications: ['Cold Chain'], stats: { tripsCompleted: 0, kmDriven: 0, earned: 0 } }];
  if (state.drivers) {
    state.drivers.forEach((d: any) => {
      if (!d.region) d.region = 'Africa';
      if (d.morale === undefined) d.morale = 90;
      if (d.fatigue === undefined) d.fatigue = 10;
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
    });
  }
  if (!state.fleet) state.fleet = [];
  state.fleet.forEach((t: any) => {
    if (t.trailer === undefined) t.trailer = 'curtain';
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
  if (!state.auctions) {
    state.auctions = [];
  } else {
    const now = Date.now();
    state.auctions = state.auctions.filter((a: any) => a && a.expiresAt && a.expiresAt > now);
  }
  if (state.jobs && state.jobs.length > 0 && !state.jobs[0].cargoId) {
    state.jobs = [];
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
