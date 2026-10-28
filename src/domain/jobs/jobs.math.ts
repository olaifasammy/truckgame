import { CITIES } from '../../data/world'; // or domain world
export const distKm = (a: string, b: string): number => {
  const p = (CITIES as any)[a], q = (CITIES as any)[b];
  if (!p || !q) return 300;
  return Math.round(Math.hypot(p[0] - q[0], p[1] - q[1]) * 5.3 / 5) * 5;
};
