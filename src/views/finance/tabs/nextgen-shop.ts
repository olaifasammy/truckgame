import { fmt, action, toast } from '../../../core/ui';
import { set } from '../../../core/store';
import {
  NEXT_GEN_HARDWARE,
  NextGenHardwareUpgrade,
  getVipLevel,
  calculateMiningStats
} from '../../../domain/finance/markets/mining';

// Register purchase action for Next-Gen Mining Hardware
action('buy-nextgen-hardware', d => {
  const hwId = (d as any).hw;
  const hwDef = NEXT_GEN_HARDWARE.find(h => h.id === hwId);
  if (!hwDef) return;

  set(S => {
    if (!S.mining) {
      S.mining = { substationLevel: 0, subscriptions: [], upgrades: {}, pendingYield: {}, tuning: 'balanced', nextGenHardware: {} };
    }
    if (!S.mining.nextGenHardware) {
      S.mining.nextGenHardware = {};
    }

    if (S.mining.nextGenHardware[hwId]) {
      return toast(`${hwDef.name} is already deployed and active in your datacenter`, 'info');
    }

    const playerVip = getVipLevel(S);
    const userCoins = S.coins || 0;

    if (playerVip < hwDef.requiredVipLevel) {
      return toast(`VIP Level ${hwDef.requiredVipLevel}+ required to acquire ${hwDef.codename} (Your rank: VIP ${playerVip})`, 'err');
    }
    if (S.money < hwDef.cashCost) {
      return toast(`Insufficient capital ($${hwDef.cashCost.toLocaleString()} required)`, 'err');
    }
    if (userCoins < hwDef.bondsCost) {
      return toast(`Insufficient Fleet Bonds (${hwDef.bondsCost} FLB required)`, 'err');
    }

    // Deduct funds
    S.money -= hwDef.cashCost;
    S.coins = userCoins - hwDef.bondsCost;
    S.mining.nextGenHardware[hwId] = true;

    // Record in transaction history if ledger exists
    if (S.finances && S.finances.ledger && Array.isArray(S.finances.ledger)) {
      S.finances.ledger.unshift({
        id: `tx_${Date.now()}`,
        time: Date.now(),
        type: 'expense',
        category: 'Mining Infrastructure',
        desc: `Next-Gen Hardware: ${hwDef.codename} (${hwDef.name})`,
        amount: hwDef.cashCost
      });
    }

    toast(`Acquired ${hwDef.codename}! +${hwDef.bonusYieldPct}% Hash Yield, +${hwDef.auxiliaryPowerKw} kW Clean Power`, 'success');
  });
});

/**
 * Renders the interactive Next-Gen Mining Hardware Shop
 */
export function renderNextGenHardwareShop(S: any): string {
  const mining = S.mining || { nextGenHardware: {} };
  const ownedHw = mining.nextGenHardware || {};
  const playerVip = getVipLevel(S);
  const userCoins = S.coins || 0;
  const stats = calculateMiningStats(S);

  const totalInstalled = NEXT_GEN_HARDWARE.filter(h => ownedHw[h.id]).length;

  return `
    <div style="background:#0b0f19; border:1px solid #1e293b; border-radius:12px; overflow:hidden; margin-top:12px;">
      
      <!-- Header Banner -->
      <div style="padding:16px; background:linear-gradient(135deg, #111827 0%, #0f172a 50%, #090d16 100%); border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11px; font-weight:900; color:#38bdf8; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); padding:2px 8px; border-radius:4px; font-family:monospace; letter-spacing:0.5px;">
              ⚡ QUANTUM & PHOTONIC DIVISION
            </span>
            <span style="font-size:10px; color:var(--mu); font-family:monospace;">
              ${totalInstalled} / ${NEXT_GEN_HARDWARE.length} Hardwares Online
            </span>
          </div>
          <div style="font-size:17px; font-weight:900; color:var(--tx); margin-top:4px; letter-spacing:-0.2px;">
            Next-Gen Mining Hardware Upgrades
          </div>
          <div style="font-size:10px; color:var(--mu); margin-top:2px;">
            Permanent datacenter compute nodes featuring room-temperature superconductors, neuromorphic AI nonces, and optical waveguides.
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <div style="background:#0a0e17; border:1px solid #1e293b; border-radius:8px; padding:6px 12px; text-align:right;">
            <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">NEXT-GEN AUX POWER</div>
            <div style="font-size:13px; font-weight:900; color:#10b981; font-family:monospace;">
              +${stats.nextGenCleanKw} kW
            </div>
          </div>
          <div style="background:#0a0e17; border:1px solid #1e293b; border-radius:8px; padding:6px 12px; text-align:right;">
            <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">HASH YIELD BOOST</div>
            <div style="font-size:13px; font-weight:900; color:var(--gold); font-family:monospace;">
              +${stats.nextGenBonusYieldPct}%
            </div>
          </div>
        </div>
      </div>

      <!-- Hardware Tiers Grid -->
      <div style="padding:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(290px, 1fr)); gap:12px; background:#080c14;">
        ${NEXT_GEN_HARDWARE.map(hw => {
          const isInstalled = !!ownedHw[hw.id];
          const hasVip = playerVip >= hw.requiredVipLevel;
          const canAffordCash = S.money >= hw.cashCost;
          const canAffordBonds = userCoins >= hw.bondsCost;
          const canPurchase = !isInstalled && hasVip && canAffordCash && canAffordBonds;

          return `
            <div style="background:#0f172a; border:1px solid ${isInstalled ? hw.accentColor : '#1e293b'}; border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; position:relative; box-shadow:${isInstalled ? `0 0 16px ${hw.glowColor}` : 'none'};">
              
              <!-- Tier Badge & Top Tag -->
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:18px;">${hw.icon}</span>
                    <span style="font-size:9px; font-weight:900; color:${hw.accentColor}; font-family:monospace; background:${hw.accentColor}18; border:1px solid ${hw.accentColor}40; padding:2px 6px; border-radius:4px;">
                      TIER ${hw.tier} · ${hw.codename}
                    </span>
                  </div>
                  ${isInstalled ? `
                    <span style="font-size:8px; font-weight:900; color:var(--grn); background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.4); padding:2px 6px; border-radius:4px; font-family:monospace; display:flex; align-items:center; gap:4px;">
                      ● ACTIVE
                    </span>
                  ` : `
                    <span style="font-size:8px; font-weight:800; color:${hasVip ? 'var(--mu)' : '#ef4444'}; font-family:monospace;">
                      ${hasVip ? `VIP ${hw.requiredVipLevel}+` : `🔒 REQUIRES VIP ${hw.requiredVipLevel}`}
                    </span>
                  `}
                </div>

                <div style="font-size:13px; font-weight:900; color:var(--tx); margin-top:2px;">
                  ${hw.name}
                </div>
                <div style="font-size:9px; color:var(--mu); margin-top:4px; line-height:1.4;">
                  ${hw.aestheticDesc}
                </div>

                <!-- Technical Specs & Performance Matrix -->
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px; margin-top:10px; padding:8px; background:#080c14; border-radius:6px; border:1px solid #192233;">
                  <div>
                    <div style="font-size:7px; color:var(--mu); text-transform:uppercase;">HASH YIELD</div>
                    <div style="font-size:11px; font-weight:900; color:var(--gold); font-family:monospace;">
                      +${hw.bonusYieldPct}% Speed
                    </div>
                  </div>
                  <div>
                    <div style="font-size:7px; color:var(--mu); text-transform:uppercase;">POWER EFFICIENCY</div>
                    <div style="font-size:11px; font-weight:900; color:#10b981; font-family:monospace;">
                      -${hw.bonusPowerEfficiencyPct}% Bill
                    </div>
                  </div>
                  <div>
                    <div style="font-size:7px; color:var(--mu); text-transform:uppercase;">CLEAN AUX POWER</div>
                    <div style="font-size:11px; font-weight:900; color:#38bdf8; font-family:monospace;">
                      +${hw.auxiliaryPowerKw} kW Baseload
                    </div>
                  </div>
                  <div>
                    <div style="font-size:7px; color:var(--mu); text-transform:uppercase;">PUE DROP</div>
                    <div style="font-size:11px; font-weight:900; color:#a855f7; font-family:monospace;">
                      -${hw.pueReduction.toFixed(2)} PUE
                    </div>
                  </div>
                </div>

                <!-- Special Capability Pill -->
                <div style="margin-top:8px; background:${hw.accentColor}12; border:1px solid ${hw.accentColor}30; border-radius:4px; padding:5px 8px; font-size:8px; color:${hw.accentColor}; font-weight:800; display:flex; align-items:center; gap:5px;">
                  <span>✨</span>
                  <span>${hw.specialCapability}</span>
                </div>
              </div>

              <!-- Price & Purchase CTA -->
              <div style="margin-top:12px; padding-top:10px; border-top:1px solid #1e293b;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:8px; color:var(--mu); text-transform:uppercase;">PERMANENT HARDWARE FEE</span>
                  <div style="font-size:11px; font-weight:900; color:var(--tx); font-family:monospace;">
                    $${hw.cashCost.toLocaleString()}${hw.bondsCost > 0 ? ` + ${hw.bondsCost} FLB` : ''}
                  </div>
                </div>

                ${isInstalled ? `
                  <button class="btn alt" style="width:100%; padding:8px; font-size:9px; font-weight:900; color:var(--grn); border-color:rgba(34,197,94,0.4); background:rgba(34,197,94,0.06); cursor:default;" disabled>
                    ✓ PERMANENTLY ONLINE IN RACK
                  </button>
                ` : `
                  <button class="btn ${canPurchase ? 'gold' : 'alt'}" 
                    style="width:100%; padding:8px; font-size:9px; font-weight:900; opacity:${canPurchase ? 1 : 0.6};"
                    data-act="buy-nextgen-hardware" 
                    data-hw="${hw.id}">
                    ${!hasVip ? `LOCKED (VIP ${hw.requiredVipLevel} REQUIRED)` : !canAffordCash ? 'INSUFFICIENT FUNDS' : !canAffordBonds ? 'INSUFFICIENT FLB' : `PURCHASE & DEPLOY ${hw.codename}`}
                  </button>
                `}
              </div>

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}

/**
 * Renders the high-fidelity aesthetic visual indicators for the Datacenter Architecture Bay
 */
export function renderNextGenAestheticBay(S: any): string {
  const mining = S.mining || { nextGenHardware: {} };
  const ownedHw = mining.nextGenHardware || {};
  const installedHardware = NEXT_GEN_HARDWARE.filter(h => ownedHw[h.id]);
  const stats = calculateMiningStats(S);

  return `
    <div style="background:#090d16; border:1px solid #1e293b; border-radius:10px; padding:14px; margin-bottom:12px; position:relative; overflow:hidden;">
      
      <!-- Subdued grid background -->
      <div style="position:absolute; top:0; left:0; right:0; bottom:0; opacity:0.04; background-image:linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px); background-size:16px 16px; pointer-events:none;"></div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; position:relative; z-index:1;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${installedHardware.length > 0 ? '#10b981' : 'var(--mu)'}; box-shadow:${installedHardware.length > 0 ? '0 0 8px #10b981' : 'none'};"></span>
          <span style="font-size:10px; font-weight:900; color:var(--tx); text-transform:uppercase; letter-spacing:0.5px;">
            Datacenter Architecture & Quantum Bay
          </span>
        </div>
        <div style="font-size:9px; color:var(--gold); font-family:monospace; font-weight:800;">
          ${installedHardware.length} Architecture Nodes Active
        </div>
      </div>

      <!-- Live Visual Racks Diagram -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px; position:relative; z-index:1;">
        ${NEXT_GEN_HARDWARE.map(hw => {
          const isActive = !!ownedHw[hw.id];
          return `
            <div style="background:#0d1322; border:1px solid ${isActive ? hw.accentColor : '#1e293b'}; border-radius:6px; padding:8px; position:relative; overflow:hidden; transition:border-color 0.3s ease;">
              
              ${isActive ? `
                <div style="position:absolute; top:0; left:0; width:3px; height:100%; background:${hw.accentColor}; box-shadow:0 0 8px ${hw.accentColor};"></div>
              ` : ''}

              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px;">${hw.icon}</span>
                <span style="font-size:7px; font-weight:900; color:${isActive ? hw.accentColor : 'var(--mu)'}; font-family:monospace;">
                  ${isActive ? 'ONLINE' : 'STANDBY'}
                </span>
              </div>

              <div style="font-size:9px; font-weight:900; color:${isActive ? 'var(--tx)' : 'var(--mu)'}; margin-top:4px; font-family:monospace;">
                ${hw.codename}
              </div>

              <div style="font-size:7px; color:var(--mu); margin-top:2px; font-family:monospace;">
                ${isActive ? hw.aestheticName : 'Awaiting Deployment'}
              </div>

              <!-- Animated pulse meter when active -->
              <div style="height:3px; background:#161f30; border-radius:2px; overflow:hidden; margin-top:6px;">
                <div style="height:100%; width:${isActive ? '100%' : '0%'}; background:${hw.accentColor}; box-shadow:${isActive ? `0 0 6px ${hw.accentColor}` : 'none'};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Telemetry Strip -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:10px; padding-top:8px; border-top:1px solid #161f30; font-size:8px; color:var(--mu); font-family:monospace; position:relative; z-index:1;">
        <div>
          <span>Quantum Superposition: </span>
          <b style="color:${stats.dualMiningUnlocked ? '#f43f5e' : 'var(--mu)'};">${stats.dualMiningUnlocked ? 'COHERENT (DUAL-COIN READY)' : 'INACTIVE'}</b>
        </div>
        <div>
          <span>PUE Optimization: </span>
          <b style="color:#10b981;">${stats.pue} PUE</b>
        </div>
        <div>
          <span>Zero-Point Grid: </span>
          <b style="color:#eab308;">+${stats.nextGenCleanKw} kW Clean</b>
        </div>
      </div>

    </div>
  `;
}
