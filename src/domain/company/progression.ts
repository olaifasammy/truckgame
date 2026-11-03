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
  if (t === 0) return 500;   // Newbie -> Professional
  if (t === 1) return 1500;  // Professional -> Expert
  if (t === 2) return 3500;  // Expert -> VIP 1
  const vipNum = t - 2;
  // Maximum prestige requires massive XP accumulation
  return Math.min(250000, 5000 + (vipNum - 1) * 2500);
}

/**
 * Returns the Fleet Bonds reward for promoting to a specific tier
 */
export function getBondRewardForTier(tier: number): number {
  const t = Math.max(0, Math.min(132, Math.floor(tier || 0)));
  if (t <= 0) return 0;
  if (t === 1) return 5;    // Professional
  if (t === 2) return 10;   // Expert
  if (t === 3) return 15;   // VIP 1
  if (t === 4) return 20;   // VIP 2
  if (t === 5) return 25;   // VIP 3
  return Math.min(50, 15 + (t - 3) * 2);
}

/**
 * Retrieves comprehensive progression metrics for the company
 */
export function getCompanyProgression(S: any): CompanyProgression {
  if (S.companyTier === undefined) S.companyTier = 0;
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
 * Adds company XP and handles tier promotions smoothly.
 * Also handles "Back-pay" for tiers reached via loads/legacy shortcuts.
 */
export function addCompanyXp(S: any, amount: number, source: string = 'Freight Ops'): void {
  if (S.companyTier === undefined) S.companyTier = 0;
  if (!S.xp) S.xp = 0;
  if (S.lastAwardedTier === undefined) S.lastAwardedTier = 0;

  // 1. Check for "Back-pay" (Tiers reached but rewards not claimed)
  if (S.lastAwardedTier < S.companyTier) {
    let totalCatchupBonds = 0;
    const missingTiers = [];
    for (let t = S.lastAwardedTier + 1; t <= S.companyTier; t++) {
      totalCatchupBonds += getBondRewardForTier(t);
      missingTiers.push(getRankTitle(t));
    }
    
    if (totalCatchupBonds > 0) {
      S.coins = (S.coins || 0) + totalCatchupBonds;
      pushNote(S, `Treasury Audit: Disbursed +${totalCatchupBonds} Fleet Bonds for historical carrier milestones.`, {
        title: 'RETROACTIVE PROMOTION BONUS',
        type: 'finance',
        priority: 2,
        body: `Audit determined that ${missingTiers.length} rank promotions were pending payout.\nTotal Bonds Disbursed: +${totalCatchupBonds}\nReason: Strategic Alignment Bonus`
      });
      toast(`Milestone Catch-up: +${totalCatchupBonds} Bonds 🪙`, 'success');
    }
    S.lastAwardedTier = S.companyTier;
  }

  if (!amount || amount <= 0) return;

  S.xp += amount;
  
  const initialTier = S.companyTier;
  let currentTier = initialTier;
  let required = getRequiredXpForTier(currentTier);
  let leveledUp = false;
  let promoBondsEarned = 0;

  while (S.xp >= required && currentTier < 132) {
    S.xp -= required;
    currentTier++;
    S.companyTier = currentTier;
    required = getRequiredXpForTier(currentTier);
    leveledUp = true;

    const bondsReward = getBondRewardForTier(currentTier);
    promoBondsEarned += bondsReward;
    S.lastAwardedTier = currentTier;
  }

  // Cap at max level
  if (currentTier >= 132) {
    S.companyTier = 132;
    S.xp = Math.min(S.xp, getRequiredXpForTier(132));
  }

  // Keep legacy S.vip in sync for any systems referencing it
  S.vip = Math.max(1, currentTier >= 3 ? currentTier - 2 : 1);

  if (leveledUp) {
    if (promoBondsEarned > 0) {
      S.coins = (S.coins || 0) + promoBondsEarned;
    }
    const newTitle = getRankTitle(currentTier);
    pushNote(S, `Your carrier has attained the rank of ${newTitle.toUpperCase()}! Reward: +${promoBondsEarned} Fleet Bonds.`, { 
      title: 'COMPANY PROMOTION & BONDS REWARD', 
      type: 'finance', 
      priority: 2,
      body: `Carrier Rank Attained: ${newTitle}\nFleet Bonds Awarded: +${promoBondsEarned} Bonds\nNew Treasury Balance: ${S.coins || 0} Bonds`
    });
    toast(`PROMOTED: ${newTitle}! +${promoBondsEarned} Bonds 🪙`, 'success');
  }
}

/**
 * Ensures the company tier is synchronized with delivery history and awards missed bonuses.
 * This handles the jump from legacy "loads-based" levels to XP-based levels.
 */
export function syncProgressionAudit(S: any): void {
  // Ultra-Professional Load-to-Tier Sync: 1 VIP level every 25 loads (hardcore progression)
  const minTierFromLoads = !S.loads || S.loads === 0 
    ? 0 
    : S.loads < 10 ? 0 : S.loads < 25 ? 1 : S.loads < 50 ? 2 : Math.min(132, 2 + Math.floor((S.loads - 50) / 25) + 1);

  const initialTier = S.companyTier || 0;
  
  // If loads count suggests a higher tier, jump up
  if (minTierFromLoads > initialTier) {
    S.companyTier = minTierFromLoads;
  }

  // If VIP legacy field is higher, jump up
  if (S.vip && S.vip > 1 && (S.companyTier || 0) < S.vip + 2) {
    S.companyTier = S.vip + 2;
  }

  // Trigger the back-pay logic in addCompanyXp
  addCompanyXp(S, 0, 'Initial Audit');
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
