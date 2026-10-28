import { CompetitorBidder, Region } from './types';

const REALISTIC_COMPETITORS: { name: string; region: Region; aggression: number }[] = [
  // Europe
  { name: 'Vanguard Trans-European Spedition', region: 'EU', aggression: 0.95 },
  { name: 'Kuehne & Nordic Freight Line', region: 'EU', aggression: 1.15 },
  { name: 'Bavarian Intermodal Logistics', region: 'EU', aggression: 0.85 },
  { name: 'Rotterdam Port Haulage BV', region: 'EU', aggression: 1.25 },
  { name: 'Alpine Express Transit AG', region: 'EU', aggression: 1.05 },
  { name: 'Gothenburg Timber & Heavy Freight', region: 'EU', aggression: 0.90 },
  { name: 'Rhone-Alpes Commercial Freight', region: 'EU', aggression: 0.80 },

  // America
  { name: 'Great Lakes Motor Freightways', region: 'NA', aggression: 1.20 },
  { name: 'Interstate 80 Heavy Haulage Corp', region: 'NA', aggression: 1.10 },
  { name: 'Lone Star Cross-Country Transit', region: 'NA', aggression: 0.90 },
  { name: 'Rocky Mountain Overland Freight', region: 'NA', aggression: 1.00 },
  { name: 'Pacific Coast Reefer Logistics', region: 'NA', aggression: 1.30 },
  { name: 'Heartland Diesel Haulers LLC', region: 'NA', aggression: 0.85 },
  { name: 'Golden State Freightline', region: 'NA', aggression: 1.15 },

  // Africa
  { name: 'Trans-Sahara Heavy Corridors', region: 'AF', aggression: 1.05 },
  { name: 'Lagos Atlantic Port Haulage', region: 'AF', aggression: 1.25 },
  { name: 'Sahel Express Cargo Consortium', region: 'AF', aggression: 0.90 },
  { name: 'Niger Basin Inter-State Freight', region: 'AF', aggression: 0.85 },
  { name: 'Continental Prime Haulers Ltd', region: 'AF', aggression: 1.10 },
  { name: 'Gulf of Guinea Tanker Lines', region: 'AF', aggression: 0.95 },

  // Asia
  { name: 'Yamato-Kobe Highway Haulers', region: 'AS', aggression: 1.10 },
  { name: 'Shanghai Trans-Corridor Spedition', region: 'AS', aggression: 1.30 },
  { name: 'Silk Road Overland Logistics', region: 'AS', aggression: 0.95 },
  { name: 'Nagano Alpine Freightways', region: 'AS', aggression: 0.85 },
  { name: 'Eurasia Central Steppe Transport', region: 'AS', aggression: 1.05 },
  { name: 'Pacific Rim Intermodal Express', region: 'AS', aggression: 1.20 }
];

export const COMPETITORS: CompetitorBidder[] = REALISTIC_COMPETITORS.map((c, idx) => ({
  id: `comp_${c.region.toLowerCase()}_${idx + 1}`,
  name: c.name,
  region: c.region,
  aggression: c.aggression,
  budgetCapMultiplier: 1.05 + Math.random() * 0.35
}));

export function getRandomCompetitor(region?: Region): CompetitorBidder {
  const filtered = region ? COMPETITORS.filter(c => c.region === region) : COMPETITORS;
  if (!filtered.length) return COMPETITORS[Math.floor(Math.random() * COMPETITORS.length)];
  return filtered[Math.floor(Math.random() * filtered.length)];
}

