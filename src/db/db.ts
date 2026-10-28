import Dexie from 'dexie';
import { createTruck } from '../domain/trucks/trucks.physics';

export const db = new Dexie('SamLogisticsDB');
(db as any).version(1).stores({
  state: 'id'
});

const KEY = 'sam.v3';
const DEF = () => ({
  company: 'NexHaul Logistics',
  isAuthenticated: false,
  money: 165000,
  coins: 10,
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
  fleet: [createTruck(1, 'scania_s730', 'Flagship S730 #1', 'LAGOS')]
});

export async function loadGame() {
  try {
    let saved = await (db as any).state.get('current');
    if (!saved) {
      const ls = localStorage.getItem(KEY);
      if (ls) {
        saved = JSON.parse(ls);
      }
    }
    return { ...DEF(), ...(saved || {}) };
  } catch (e) {
    return DEF();
  }
}

export async function saveGame(S: any) {
  try {
    await (db as any).state.put({ id: 'current', ...S });
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
}
