import { ic } from '../core/icons';
import { action, fmt, toast } from '../core/ui';
import { set, refresh } from '../core/store';
import { TRAILERS, getTrailerIcon } from '../domain/trucks/trucks.data';
import { getTrailerSilhouetteSvg } from '../domain/trucks/trucks.visuals';
import { FREIGHT_LICENSES, buyLicense, hasLicense } from '../domain/freight/licenses';
import { PART_BASE_PRICES } from '../systems/maintenance';
import { PART_LABELS } from '../systems/calc';

let storageTab: 'trailers' | 'parts' | 'licenses' = 'trailers';

action('storage-tab', d => {
  storageTab = (d as any).tab;
  refresh();
});

action('open-storage-subtab', d => {
  set(S => {
    S.tab = 'storage';
  });
  storageTab = (d as any).subtab || 'trailers';
  refresh();
});

action('buy-storage-part', d => {
  const partKey = (d as any).part;
  const qty = Number((d as any).qty) || 1;
  const unitPrice = PART_BASE_PRICES[partKey] || 500;
  const totalCost = unitPrice * qty;

  set(S => {
    if (S.money < totalCost) {
      toast(`Insufficient funds. Need $${totalCost.toLocaleString()}`, 'err');
      return;
    }

    S.money -= totalCost;
    if (!S.partsInventory) S.partsInventory = {};
    S.partsInventory[partKey] = (S.partsInventory[partKey] || 0) + qty;
    toast(`Purchased ${qty}x ${PART_LABELS[partKey] || partKey} for HQ Warehouse`, 'success');
  });
});

action('buy-storage-license', d => {
  buyLicense((d as any).id);
  refresh();
});

export default {
  id: 'storage',
  icon: 'layers',
  label: 'Storage',
  hidden: true,
  render(S: any) {
    // Group yard trailers
    const yardTrailers: Record<string, number> = {};
    (S.trailers || []).forEach((t: string) => {
      yardTrailers[t] = (yardTrailers[t] || 0) + 1;
    });
    const totalYardTrailers = (S.trailers || []).length;

    // Total parts in inventory
    const totalPartsCount = Object.values(S.partsInventory || {}).reduce((a: number, b: any) => a + Number(b), 0);
    const ownedLicensesCount = (S.licenses || ['standard']).length;

    return `
      <div style="padding-bottom:100px;">
        <!-- Top Navigation Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 2px;">
          <button class="btn alt" style="padding:6px 12px; font-size:11px; font-weight:800; display:flex; align-items:center; gap:6px;" data-act="tab" data-id="company">
            ${ic('back')} RETURN TO HQ DEPOT
          </button>
          <div style="font-size:10px; color:var(--mu); font-family:monospace;">
            CENTRAL FACILITY · <b style="color:var(--gold);">${S.company.toUpperCase()}</b>
          </div>
        </div>

        <!-- Facility Hero Banner -->
        <div style="background:linear-gradient(135deg, #111827 0%, #0c1220 100%); border:1px solid #1f293d; border-radius:12px; padding:16px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:44px; height:44px; background:rgba(193,154,91,0.15); border:1px solid var(--gold); border-radius:10px; display:grid; place-items:center; color:var(--gold); font-size:22px; flex-shrink:0;">
                📦
              </div>
              <div>
                <div style="font-size:9px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
                  LOGISTICS ASSET MANAGEMENT
                </div>
                <h2 style="margin:2px 0 1px; font-size:18px; font-weight:900; color:var(--tx);">
                  Central Storage & Freight Depot
                </h2>
                <div style="font-size:10px; color:var(--mu);">
                  Marshalling yard for unhitched trailers, spare maintenance components, and corporate freight operating authorities.
                </div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:8px; color:var(--mu); font-family:monospace; text-transform:uppercase;">CAPITAL</div>
              <div style="font-size:16px; font-weight:900; color:var(--grn); font-family:monospace;">${fmt(S.money)}</div>
            </div>
          </div>
        </div>

        <!-- Sub-View Navigation Tabs -->
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:14px;">
          <button class="btn ${storageTab === 'trailers' ? 'gold' : 'alt'}" style="padding:10px 6px; font-size:10px; font-weight:800; text-transform:uppercase; display:flex; flex-direction:column; align-items:center; gap:3px;" data-act="storage-tab" data-tab="trailers">
            <span style="font-size:14px;">🚛</span>
            <span>TRAILERS (${totalYardTrailers})</span>
          </button>
          <button class="btn ${storageTab === 'parts' ? 'gold' : 'alt'}" style="padding:10px 6px; font-size:10px; font-weight:800; text-transform:uppercase; display:flex; flex-direction:column; align-items:center; gap:3px;" data-act="storage-tab" data-tab="parts">
            <span style="font-size:14px;">🔧</span>
            <span>SPARE PARTS (${totalPartsCount})</span>
          </button>
          <button class="btn ${storageTab === 'licenses' ? 'gold' : 'alt'}" style="padding:10px 6px; font-size:10px; font-weight:800; text-transform:uppercase; display:flex; flex-direction:column; align-items:center; gap:3px;" data-act="storage-tab" data-tab="licenses">
            <span style="font-size:14px;">📜</span>
            <span>LICENSES (${ownedLicensesCount})</span>
          </button>
        </div>

        <!-- ================= 1. TRAILERS MARSHALLING YARD SUB-VIEW ================= -->
        ${storageTab === 'trailers' ? `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:0 2px;">
              <div>
                <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">TRAILERS STAGED IN YARD</span>
                <span style="font-size:9px; color:var(--mu); font-family:monospace; margin-left:6px;">${totalYardTrailers} READY UNITS</span>
              </div>
              <button class="btn gold" style="padding:5px 12px; font-size:9px; font-weight:900;" data-act="store-open" data-id="dealership">
                + PROCURE TRAILERS (DEPOT)
              </button>
            </div>

            <!-- Consignor Tanker Guarantee Banner -->
            <div style="background:#0a0f1d; border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:10px 12px; margin-bottom:12px; display:flex; align-items:center; gap:10px;">
              <span style="font-size:20px;">☣️</span>
              <div style="font-size:10px; color:var(--tx); line-height:1.4;">
                <b style="color:var(--gold);">CONSIGNOR TANKER POLICY:</b> Specialized ADR Hazmat chemical and petrochemical tankers are provided directly by shipping terminals upon dispatch at zero cost to the carrier.
              </div>
            </div>

            ${totalYardTrailers === 0 ? `
              <div style="padding:32px 16px; text-align:center; background:#0e1320; border:1px dashed #1e2638; border-radius:10px;">
                <div style="font-size:32px; margin-bottom:8px;">🚛</div>
                <div style="font-size:14px; font-weight:800; color:var(--tx);">No Unhitched Trailers in Yard</div>
                <div style="font-size:11px; color:var(--mu); max-width:360px; margin:4px auto 14px; line-height:1.4;">
                  All fleet trailers are currently hitched to active tractors, or none have been purchased yet. Unhitch trailers in the Garage or order new equipment from the Trailer Depot.
                </div>
                <button class="btn gold" style="padding:8px 18px; font-size:10px; font-weight:900;" data-act="store-open" data-id="dealership">
                  VISIT TRAILER EQUIPMENT DEPOT
                </button>
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${Object.entries(yardTrailers).map(([type, count]) => `
                  <div class="card" style="padding:14px; background:#0e1320; border:1px solid #1e2638; border-radius:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px;">${getTrailerIcon(type as any)}</span>
                        <div>
                          <div style="font-size:13px; font-weight:900; color:var(--tx);">
                            ${TRAILERS[type as keyof typeof TRAILERS] || type}
                          </div>
                          <div style="font-size:9px; color:var(--mu); font-family:monospace;">
                            Commercial Staged Trailer · Ready to Hitch in Garage
                          </div>
                        </div>
                      </div>
                      <div style="text-align:right;">
                        <span style="background:rgba(193,154,91,0.15); border:1px solid var(--gold); border-radius:4px; padding:3px 8px; font-size:10px; font-weight:800; color:var(--gold); font-family:monospace;">
                          ${count}x IN YARD
                        </span>
                      </div>
                    </div>

                    <!-- Trailer Technical Blueprint SVG (Landing Legs Deployed) -->
                    <div style="background:#070a12; border:1px solid #161e2e; border-radius:6px; padding:6px 12px; margin-bottom:10px; display:flex; justify-content:center; align-items:center; min-height:60px;">
                      ${getTrailerSilhouetteSvg(type, 'var(--gold)')}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:9px; color:var(--mu); font-family:monospace;">Status: Standby in Storage Yard</span>
                      <button class="btn alt" style="padding:5px 12px; font-size:9px; font-weight:800;" data-act="tab" data-id="garage">
                        HITCH TO TRACTOR IN GARAGE →
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- ================= 2. SPARE PARTS & INVENTORY SUB-VIEW ================= -->
        ${storageTab === 'parts' ? `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:0 2px;">
              <div>
                <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">WAREHOUSE INVENTORY & COMPONENTS</span>
                <span style="font-size:9px; color:var(--mu); font-family:monospace; margin-left:6px;">FLEET SPARES</span>
              </div>
              <button class="btn alt" style="padding:5px 12px; font-size:9px; font-weight:800;" data-act="tab" data-id="garage">
                VISIT WORKSHOP SERVICE
              </button>
            </div>

            <div style="font-size:10px; color:var(--mu); margin-bottom:12px; padding:0 2px;">
              Stocking replacement parts at your HQ warehouse provides immediate availability during routine vehicle servicing and major breakdowns.
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              ${Object.entries(PART_BASE_PRICES).map(([partKey, price]) => {
                const stock = S.partsInventory?.[partKey] || 0;
                const label = PART_LABELS[partKey] || partKey;
                const canAfford = S.money >= price;

                return `
                  <div class="card" style="padding:12px; background:#0e1320; border:1px solid #1e2638; border-radius:8px; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                        <span style="font-size:12px; font-weight:800; color:var(--tx);">${label}</span>
                        <span style="font-size:10px; font-family:monospace; font-weight:800; color:${stock > 0 ? 'var(--gold)' : 'var(--mu)'};">
                          ${stock} in stock
                        </span>
                      </div>
                      <div style="font-size:11px; font-weight:900; color:var(--grn); font-family:monospace; margin-bottom:8px;">
                        ${fmt(price)} / unit
                      </div>
                    </div>

                    <div style="display:flex; gap:6px;">
                      <button class="btn alt" style="flex:1; padding:5px 6px; font-size:9px; font-weight:800;" data-act="buy-storage-part" data-part="${partKey}" data-qty="1" ${canAfford ? '' : 'disabled'}>
                        + BUY 1x
                      </button>
                      <button class="btn gold" style="flex:1; padding:5px 6px; font-size:9px; font-weight:900;" data-act="buy-storage-part" data-part="${partKey}" data-qty="4" ${S.money >= price * 4 ? '' : 'disabled'}>
                        + BUY 4x
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- ================= 3. COMMERCIAL FREIGHT LICENSES & AUTHORITIES ================= -->
        ${storageTab === 'licenses' ? `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:0 2px;">
              <div>
                <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">COMMERCIAL FREIGHT LICENSES & AUTHORITIES</span>
                <span style="font-size:9px; color:var(--mu); font-family:monospace; margin-left:6px;">REGULATORY COMPLIANCE</span>
              </div>
              <span style="font-size:9px; color:var(--gold); font-family:monospace; font-weight:800;">
                ${ownedLicensesCount} / ${Object.keys(FREIGHT_LICENSES).length} AUTHORITIES ACTIVE
              </span>
            </div>

            <div style="font-size:10px; color:var(--mu); margin-bottom:12px; padding:0 2px;">
              Statutory permits required for high-risk, oversized, temperature-sensitive, and bulk haulage. Operating without authority results in regulatory dispatch prohibition.
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
              ${Object.values(FREIGHT_LICENSES).map((lic: any) => {
                const owned = hasLicense(S, lic.id);
                const canAfford = S.money >= lic.price;

                return `
                  <div class="card" style="padding:14px; background:#0e1320; border:1px solid ${owned ? 'rgba(34,197,94,0.35)' : '#1e2638'}; border-radius:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                      <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:24px;">${lic.icon}</span>
                        <div>
                          <div style="font-size:13px; font-weight:900; color:var(--tx);">
                            ${lic.name} <span style="font-size:9px; color:var(--gold); font-family:monospace;">[${lic.code}]</span>
                          </div>
                          <div style="font-size:10px; color:var(--mu); margin-top:2px; line-height:1.4;">
                            ${lic.description}
                          </div>
                        </div>
                      </div>
                      <div>
                        ${owned ? `
                          <span style="display:inline-flex; align-items:center; gap:4px; background:rgba(34,197,94,0.15); border:1px solid var(--grn); color:var(--grn); padding:4px 10px; border-radius:4px; font-size:9px; font-weight:900; font-family:monospace; white-space:nowrap;">
                            ✓ ACTIVE AUTHORITY
                          </span>
                        ` : `
                          <button class="btn gold" style="padding:6px 14px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="buy-storage-license" data-id="${lic.id}" ${canAfford ? '' : 'disabled'}>
                            ACQUIRE $${lic.price.toLocaleString()}
                          </button>
                        `}
                      </div>
                    </div>

                    <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.06); font-size:9px; font-family:monospace; color:var(--mu);">
                      <span style="color:var(--gold); font-weight:700;">REQUIRED FOR:</span>
                      <span style="color:var(--tx); margin-left:4px;">${lic.requiredFor}</span>
                      <span style="margin-left:8px; color:var(--mu);">· REGULATORY BODY: ${lic.regulatoryBody}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
};
