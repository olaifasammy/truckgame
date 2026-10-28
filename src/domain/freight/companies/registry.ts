import { Company } from '../types';

export const COMPANIES: Company[] = [
  // Europe
  { id: 'euro_log', name: 'EuroLink Logistics', region: 'EU', industry: 'Retail', reputationReq: 0 },
  { id: 'nord_cold', name: 'Nordic Cold Chain', region: 'EU', industry: 'Food', reputationReq: 5 },
  { id: 'rhein_ind', name: 'Rhein Industrial', region: 'EU', industry: 'Industrial', reputationReq: 10 },
  { id: 'med_oil', name: 'Mediterranean Oil & Gas', region: 'EU', industry: 'Energy', reputationReq: 15 },
  
  // North America
  { id: 'us_post', name: 'Federal Haulage', region: 'NA', industry: 'Retail', reputationReq: 0 },
  { id: 'tex_oil', name: 'Texas Energy Corp', region: 'NA', industry: 'Energy', reputationReq: 12 },
  { id: 'can_timber', name: 'Ontario Lumber Co', region: 'NA', industry: 'Construction', reputationReq: 5 },
  { id: 'sv_tech', name: 'Silicon Valley Components', region: 'NA', industry: 'Tech', reputationReq: 8 },

  // Africa
  { id: 'lag_exp', name: 'Lagos Express', region: 'AF', industry: 'Retail', reputationReq: 0 },
  { id: 'saf_mine', name: 'Gauteng Mining Group', region: 'AF', industry: 'Industrial', reputationReq: 15 },
  { id: 'nile_agri', name: 'Nile Valley Agriculture', region: 'AF', industry: 'Food', reputationReq: 5 },
  { id: 'atlas_const', name: 'Atlas Infrastructure', region: 'AF', industry: 'Construction', reputationReq: 10 },

  // Asia
  { id: 'han_ship', name: 'Hanjin Global', region: 'AS', industry: 'Industrial', reputationReq: 0 },
  { id: 'tok_elect', name: 'Tokyo Electronics', region: 'AS', industry: 'Tech', reputationReq: 10 },
  { id: 'shang_trade', name: 'Shanghai Trading Co', region: 'AS', industry: 'Retail', reputationReq: 5 },
  { id: 'dubai_lux', name: 'Emirates Luxury Goods', region: 'AS', industry: 'Retail', reputationReq: 20 },
];

// This registry will eventually hold 200+ companies as we expand the data files.
