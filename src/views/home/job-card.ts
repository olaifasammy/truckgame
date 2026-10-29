import { ic } from '../../core/icons';
import { fuelCost, blocker } from '../../systems/jobs';
import { TRAILERS } from '../../domain/trucks/trucks.data';
import { homeState } from './state';
import { CARGO_TYPES } from '../../domain/freight/cargo/registry';
import { COMPANIES } from '../../domain/freight/companies/registry';
import { dur, fmt } from '../../core/ui';
import { LOCATIONS } from '../../data/world';
import { getRouteEnv, tripMs } from '../../systems/calc';
import { getDailyBidDispatchQuota } from '../../domain/freight/bids/quota';

export function renderJobDetails(j: any, why: string | null) {
  const cargo = CARGO_TYPES.find(c => c.id === j.cargoId);
  const company = COMPANIES.find(c => c.id === j.companyId);
  const reqs = j.requirements?.requiredSkills || [];
  const env = j.env || getRouteEnv(j.from, j.to);
  const locFrom = LOCATIONS[j.from];
  const locTo = LOCATIONS[j.to];
  const estTripMs = tripMs(j.km, 80, env);

  const weatherLabel = env.weather === 'snow' ? '❄ Alpine Snow / Ice' 
    : env.weather === 'rain' ? '🌧 Tropical Heavy Rain' 
    : env.weather === 'heatwave' ? '🔥 Extreme Heatwave (>35°C)' 
    : env.weather === 'fog' ? '🌫 Low-Visibility Fog' 
    : '☀️ Clear Highway';

  return `
    <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06); font-size:11px;">
      <!-- Route Environmental & Physics Telematics -->
      <div style="background:#070a12; border:1px solid #161e2e; border-radius:6px; padding:10px 12px; margin-bottom:10px;">
        <div style="font-size:9px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
          ROUTE ENVIRONMENTAL & TERRAIN TELEMETRY
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-family:monospace; font-size:10px;">
          <div><span style="color:var(--mu);">CONDITIONS:</span> <b style="color:var(--tx);">${weatherLabel}</b></div>
          <div><span style="color:var(--mu);">ROAD INCLINE:</span> <b style="color:${env.roadGrade > 4 ? 'var(--gold)' : 'var(--tx)'};">${env.roadGrade}% Grade</b></div>
          <div><span style="color:var(--mu);">DEST ELEVATION:</span> <b style="color:var(--tx);">${locTo?.elevation || 200}m ASL</b></div>
          <div><span style="color:var(--mu);">TEMPERATURE:</span> <b style="color:var(--tx);">${env.temp}°C</b></div>
        </div>
      </div>

      <!-- Financial & Equipment Matrix -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-bottom:10px; font-family:monospace; font-size:10px;">
        <div style="background:#111827; padding:6px 8px; border-radius:6px; border:1px solid #1f293d;">
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">DISTANCE & TIME</div>
          <div style="font-weight:800; color:var(--tx); margin-top:1px;">${j.km} km · ~${dur(estTripMs)}</div>
        </div>
        <div style="background:#111827; padding:6px 8px; border-radius:6px; border:1px solid #1f293d;">
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">CARGO WEIGHT</div>
          <div style="font-weight:800; color:var(--gold); margin-top:1px;">${j.weight} Tonnes</div>
        </div>
        <div style="background:#111827; padding:6px 8px; border-radius:6px; border:1px solid #1f293d;">
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">FREIGHT RATE</div>
          <div style="font-weight:800; color:var(--grn); margin-top:1px;">$${(j.pay / Math.max(1, j.km)).toFixed(2)}/km</div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--mu); margin-bottom:8px;">
        <div><span>Client Shipper:</span> <b style="color:var(--tx);">${company?.name || 'Private Industrial Shipper'}</b></div>
        <div><span>Coupling:</span> <b style="color:var(--gold);">${TRAILERS[(cargo?.trailer as keyof typeof TRAILERS) || 'curtain']}</b></div>
      </div>

      ${reqs.length ? `
        <div style="margin-bottom:10px;">
          <div style="font-size:8px; font-weight:800; color:var(--mu); text-transform:uppercase; margin-bottom:4px;">Required Driver Endorsements</div>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            ${reqs.map((s: string) => `
              <span style="font-size:8px; background:#1e293b; padding:2px 6px; border-radius:4px; color:var(--gold); font-weight:800; letter-spacing:0.3px; font-family:monospace;">
                ${s.toUpperCase()}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${why ? `
        <div style="padding:8px 10px; background:rgba(239,68,68,0.1); border:1px solid var(--red); color:var(--red); border-radius:6px; font-size:10px; font-weight:700; margin-top:6px;">
          ⚠ DISPATCH WARNING: ${why}
        </div>
      ` : ''}
    </div>
  `;
}

export function renderJobCard(S: any, j: any) {
  const cargo = CARGO_TYPES.find(c => c.id === j.cargoId);
  const why = blocker(S, j);
  const isOpen = homeState.openJobId === j.id;
  const env = j.env || getRouteEnv(j.from, j.to);
  const locFrom = LOCATIONS[j.from];
  const locTo = LOCATIONS[j.to];
  
  const cargoName = cargo?.name || j.cargo || 'General Commercial Freight';
  const isAuctionWon = (j as any).isAuctionWon;
  const wonAt = (j as any).wonAt;
  const FIVE_MINS = 5 * 60 * 1000;
  const expiryTime = wonAt ? wonAt + FIVE_MINS : 0;
  const timeLeft = expiryTime ? Math.max(0, expiryTime - Date.now()) : 0;

  const weatherBadge = env.weather === 'snow' ? '❄ SNOW'
    : env.weather === 'rain' ? '🌧 WET'
    : env.weather === 'heatwave' ? '🔥 38°C'
    : '☀️ CLEAR';
  
  return `
    <div class="card job ${j.vip || isAuctionWon ? 'vipj' : ''} ${isOpen ? 'open' : ''}" 
         style="margin-bottom:10px; background:#0e1320; border:1px solid ${isOpen ? 'var(--gold)' : isAuctionWon ? 'var(--grn)' : '#1e2638'}; border-radius:10px; padding:12px 14px; cursor:pointer; transition:all 0.2s;" 
         data-act="home-toggle" data-id="${j.id}">
      
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <!-- Left: Icon & Route Info -->
        <div style="display:flex; align-items:center; gap:12px; min-width:0;">
          <div style="width:38px; height:38px; background:#080c16; border:1px solid ${isAuctionWon ? 'var(--grn)' : 'rgba(193,154,91,0.3)'}; border-radius:8px; display:grid; place-items:center; color:${isAuctionWon ? 'var(--grn)' : 'var(--gold)'}; font-size:18px; flex-shrink:0;">
            ${ic(isAuctionWon ? 'check' : (cargo?.icon || (cargo?.trailer === 'reefer' ? 'snowflake' : cargo?.trailer === 'tanker' ? 'fuel' : 'box')))}
          </div>
          <div style="min-width:0;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-weight:900; font-size:13px; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${cargoName}
              </span>
              ${cargo?.isHazmat ? `
                <span title="ADR Hazardous Cargo Placard" style="display:inline-flex; align-items:center; justify-content:center; width:15px; height:15px; background:linear-gradient(135deg, #ef4444, #b91c1c); border:1px solid #fca5a5; border-radius:3px; box-shadow:0 1px 4px rgba(239,68,68,0.4); vertical-align:middle; flex-shrink:0;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                  </svg>
                </span>
              ` : ''}
            </div>

            <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:2px; display:flex; align-items:center; gap:6px;">
              <span style="color:var(--gold); font-weight:700;">${locFrom?.name || j.from}</span>
              <span>→</span>
              <span style="color:var(--tx); font-weight:700;">${locTo?.name || j.to}</span>
              <span>·</span>
              <span>${j.km} km</span>
              <span>·</span>
              <span>${j.weight}t</span>
            </div>

            ${isAuctionWon && timeLeft > 0 ? `
              <div style="font-size:9px; color:var(--grn); font-weight:800; font-family:monospace; margin-top:2px;">
                CONTRACT SECURED · Dispatches in: <span data-eta="${expiryTime}">${dur(timeLeft)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Right: Contract Value & Dispatch Button -->
        <div style="text-align:right; flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end;">
          <div style="font-size:15px; font-weight:900; color:var(--grn); font-family:monospace;">
            ${fmt(j.pay || 0)}
          </div>
          <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-bottom:4px;">
            $${(j.pay / Math.max(1, j.km)).toFixed(2)}/km
          </div>
          ${(() => {
            if (isAuctionWon) {
              const quota = getDailyBidDispatchQuota(S);
              const label = quota.isFree
                ? `DISPATCH (${quota.freeRemaining}/5 FREE)`
                : `DISPATCH (🪙 4 COINS)`;
              const canAfford = quota.canAfford;

              return `
                <button class="btn gold" 
                        style="padding:5px 12px; font-size:9px; font-weight:900; letter-spacing:0.5px; border-radius:4px; text-transform:uppercase; ${!canAfford ? 'opacity:0.6;' : ''}" 
                        data-act="home-take" data-id="${j.id}">
                  ${label}
                </button>
                <div style="font-size:8px; font-family:monospace; margin-top:2px; color:${quota.isFree ? 'var(--grn)' : canAfford ? 'var(--gold)' : 'var(--red)'};">
                  ${quota.isFree ? `${quota.freeRemaining} free daily dispatches left` : canAfford ? `4 Coins · Balance: ${quota.coinsBalance}` : `Needs 4 Coins (Have: ${quota.coinsBalance})`}
                </div>
              `;
            }

            return `
              <button class="btn ${why ? 'alt' : 'gold'}" 
                      style="padding:5px 12px; font-size:9px; font-weight:900; letter-spacing:0.5px; border-radius:4px; text-transform:uppercase;" 
                      data-act="home-take" data-id="${j.id}">
                ${why ? 'UNAVAILABLE' : 'ACCEPT LOAD'}
              </button>
            `;
          })()}
        </div>
      </div>

      ${isOpen ? renderJobDetails(j, why) : ''}
    </div>
  `;
}
