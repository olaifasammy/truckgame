/**
 * Logistics Company Progression & VIP Rank System
 * 
 * Hierarchy:
 * - Tier 0: "Newbie"
 * - Tier 1: "Professional"
 * - Tier 2: "Expert"
 * - Tier 3..132: "VIP 1" through "VIP 130"
 */

import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

export interface CompanyProgression {
  tier: number;          // 0 to 132
  title: string;         // 'Newbie', 'Professional', 'Expert', 'VIP 1'...'VIP 130'
  badge: string;         // 'NEWBIE', 'PRO', 'EXPERT', 'VIP 1'
  xpInTier: number;      // Current XP in this tier
  targetXp: number;      // XP needed to reach next tier
  progress: number;      // 0.0 to 1.0 (for circular progress bar)
  percent: number;       // 0 to 100
  nextTitle: string;     // Next rank title
  color: string;         // Accent color for current rank
  strokeGrad: [string, string]; // Gradient colors for SVG ring
}

/**
 * Returns rank title from tier index (0 = 0 - Newbie, 1 = Professional, 2 = Expert, 3 = VIP 1, ..., 132 = VIP 130)
 */
export function getRankTitle(tier: number): string {
  const t = Math.max(0, Math.min(132, Math.floor(tier || 0)));
  if (t === 0) return '0 - Newbie';
  if (t === 1) return 'Professional';
  if (t === 2) return 'Expert';
  return `VIP ${t - 2}`;
}

/**
 * Returns the XP required to advance from the current tier to the next
 */
export function getRequiredXpForTier(tier: number): number {
  const t = Math.max(0, Math.min(132, Math.floor(tier || 0)));
  if (t === 0) return 350;   // Fast early milestone from 0 - Newbie -> Professional
  if (t === 1) return 750;   // Professional -> Expert
  if (t === 2) return 1200;  // Expert -> VIP 1
  const vipNum = t - 2;
  // Scaled progressive tier requirements for VIP 1 - 130
  return Math.min(25000, 1500 + (vipNum - 1) * 220);
}

/**
 * Retrieves comprehensive progression metrics for the company
 */
export function getCompanyProgression(S: any): CompanyProgression {
  const minTierFromLoads = !S.loads || S.loads === 0 
    ? 0 
    : S.loads < 2 ? 0 : S.loads < 5 ? 1 : S.loads < 10 ? 2 : Math.min(132, 2 + Math.floor((S.loads - 10) / 3) + 1);

  if (S.companyTier === undefined) {
    if (S.vip && S.vip > 1) {
      S.companyTier = S.vip + 2;
    } else {
      S.companyTier = minTierFromLoads;
    }
  } else {
    // Keep in sync if loads or VIP progression exceeded recorded tier
    if (minTierFromLoads > S.companyTier) {
      S.companyTier = minTierFromLoads;
    }
    if (S.vip && S.vip > 1 && S.companyTier < S.vip + 2) {
      S.companyTier = S.vip + 2;
    }
  }

  const tier = Math.max(0, Math.min(132, S.companyTier || 0));
  // Keep legacy S.vip in sync
  S.vip = Math.max(1, tier >= 3 ? tier - 2 : 1);

  const title = getRankTitle(tier);
  const nextTitle = tier < 132 ? getRankTitle(tier + 1) : 'Max Prestige (VIP 130)';
  const targetXp = getRequiredXpForTier(tier);
  const xpInTier = Math.max(0, Math.min(targetXp, S.xp || 0));
  const progress = targetXp > 0 ? Math.min(1, Math.max(0, xpInTier / targetXp)) : 1;
  const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));

  let color = '#38bdf8'; // Sky blue for 0 - Newbie
  let strokeGrad: [string, string] = ['#38bdf8', '#0284c7'];
  let badge = '0 - NEWBIE';

  if (tier === 1) {
    color = '#34d399'; // Emerald for Professional
    strokeGrad = ['#34d399', '#059669'];
    badge = 'PROFESSIONAL';
  } else if (tier === 2) {
    color = '#a78bfa'; // Purple for Expert
    strokeGrad = ['#c084fc', '#7c3aed'];
    badge = 'EXPERT';
  } else {
    // VIP 1 - 130: Prestigious 24K Gold
    color = 'var(--gold)';
    strokeGrad = ['#fbbf24', '#b45309'];
    badge = `VIP ${tier - 2}`;
  }

  return {
    tier,
    title,
    badge,
    xpInTier,
    targetXp,
    progress,
    percent,
    nextTitle,
    color,
    strokeGrad
  };
}

/**
 * Adds company XP and handles tier promotions smoothly
 */
export function addCompanyXp(S: any, amount: number, source: string = 'Freight Ops'): void {
  if (!amount || amount <= 0) return;
  if (S.companyTier === undefined) S.companyTier = 0;
  if (!S.xp) S.xp = 0;

  S.xp += amount;
  
  let currentTier = S.companyTier;
  let required = getRequiredXpForTier(currentTier);
  let leveledUp = false;

  while (S.xp >= required && currentTier < 132) {
    S.xp -= required;
    currentTier++;
    S.companyTier = currentTier;
    required = getRequiredXpForTier(currentTier);
    leveledUp = true;
  }

  // Cap at max level
  if (currentTier >= 132) {
    S.companyTier = 132;
    S.xp = Math.min(S.xp, getRequiredXpForTier(132));
  }

  // Keep legacy S.vip in sync for any systems referencing it
  S.vip = Math.max(1, currentTier >= 3 ? currentTier - 2 : 1);

  if (leveledUp) {
    const newTitle = getRankTitle(currentTier);
    pushNote(S, `COMPANY PROMOTION: Your carrier has attained the rank of ${newTitle.toUpperCase()}!`);
    toast(`PROMOTED: ${newTitle}!`, 'success');
  }
}

/**
 * Generates an SVG circular progress ring encircling the company logo
 */
export function renderProgressLogoRing(S: any, size: number = 44, strokeWidth: number = 3): string {
  const p = getCompanyProgression(S);
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - p.progress);
  const gradId = `corpRingGrad_${Math.round(size)}_${p.tier}`;

  const monogram = (S.company || 'NH').slice(0, 2).toUpperCase();

  return `
    <div style="position:relative; width:${size}px; height:${size}px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
      <!-- Circular Progress Ring SVG -->
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="position:absolute; top:0; left:0; transform:rotate(-90deg); filter:drop-shadow(0 0 4px ${p.color}40);">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${p.strokeGrad[0]}" />
            <stop offset="100%" stop-color="${p.strokeGrad[1]}" />
          </linearGradient>
        </defs>
        <!-- Background Track -->
        <circle 
          cx="${cx}" 
          cy="${cy}" 
          r="${radius}" 
          fill="none" 
          stroke="rgba(255,255,255,0.08)" 
          stroke-width="${strokeWidth}" 
        />
        <!-- Progress Active Arc -->
        <circle 
          cx="${cx}" 
          cy="${cy}" 
          r="${radius}" 
          fill="none" 
          stroke="url(#${gradId})" 
          stroke-width="${strokeWidth}" 
          stroke-dasharray="${circumference.toFixed(2)}" 
          stroke-dashoffset="${offset.toFixed(2)}" 
          stroke-linecap="round"
          style="transition: stroke-dashoffset 0.8s ease;"
        />
      </svg>

      <!-- Center Logo Monogram -->
      <div style="width:${size - strokeWidth * 3}px; height:${size - strokeWidth * 3}px; background:#0b1120; border-radius:50%; display:grid; place-items:center; border:1px solid rgba(255,255,255,0.1); z-index:2; box-shadow:inset 0 0 8px rgba(0,0,0,0.8);">
        <span style="font-weight:900; font-size:${Math.round(size * 0.32)}px; color:${p.color}; font-family:monospace; letter-spacing:0.5px;">
          ${monogram}
        </span>
      </div>
    </div>
  `;
}
