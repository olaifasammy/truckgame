import { action, fmt, toast } from '../core/ui';
import { set } from '../core/store';
import { PART_BASE_PRICES, getWholesalePartPrice } from '../domain/trucks/maintenance';

const PART_CATALOG: { key: string; label: string; category: string; desc: string }[] = [
  { key: 'engine', label: 'Crate Diesel Engine Assembly', category: 'Powertrain', desc: 'Remanufactured heavy-duty block & turbocharger kit.' },
  { key: 'transmission', label: '12-Speed Automated Gearbox', category: 'Powertrain', desc: 'Complete synchromesh & clutch actuator assembly.' },
  { key: 'suspension', label: 'Air-Ride Axle & Suspension Kit', category: 'Chassis', desc: 'Heavy-load air bellows, shocks, and kingpin bushings.' },
  { key: 'brakes', label: 'Pneumatic Disc Brake Set', category: 'Safety', desc: 'Vented rotors, calipers, and ABS air chambers.' },
  { key: 'tires', label: 'Commercial Steer & Drive Tires', category: 'Chassis', desc: 'All-weather low-rolling-resistance radial tire set.' },
  { key: 'windshield', label: 'Laminated Cab Windshield', category: 'Body', desc: 'Impact-rated acoustic commercial cab glass.' },
  { key: 'fuelFilter', label: 'Primary Fuel Water Separator', category: 'Filters', desc: 'High-flow micron diesel filtration cartridge.' },
  { key: 'oilFilter', label: 'Synthetic Oil Filter Cartridge', category: 'Filters', desc: 'Extended-drain heavy diesel lubrication filter.' },
  { key: 'airFilter', label: 'Dual-Stage Intake Air Filter', category: 'Filters', desc: 'Dust-guard intake element for arid & gravel routes.' },
  { key: 'oil', label: '15W-40 Heavy Duty Engine Oil', category: 'Fluids', desc: 'Full-synthetic commercial crankcase drum.' },
  { key: 'coolant', label: 'Extended-Life Coolant (OAT)', category: 'Fluids', desc: 'Corrosion-inhibiting thermal radiator fluid.' },
  { key: 'adBlue', label: 'DEF / AdBlue Emissions Fluid', category: 'Fluids', desc: 'ISO-22241 SCR catalytic reduction solution.' }
];

action('store-buy-part', d => {
  const partKey = (d as any).part;
  const qty = Math.max(1, Number((d as any).qty) || 1);
  const unitPrice = getWholesalePartPrice(partKey, qty);
  const totalCost = unitPrice * qty;
  const item = PART_CATALOG.find(p => p.key === partKey);

  set(S => {
    if ((S.money || 0) < totalCost) {
      toast(`Insufficient funds. Need ${fmt(totalCost)}`, 'err');
      return;
    }
    S.money -= totalCost;
    if (!S.partsInventory) S.partsInventory = {};
    S.partsInventory[partKey] = (S.partsInventory[partKey] || 0) + qty;
    toast(`Purchased ${qty}x ${item?.label || partKey} into HQ Warehouse`, 'success');
  });
});

export default {
  id: 'parts',
  name: 'NexHaul OEM Parts & Lubricants Supply',
  desc: 'Wholesale spare parts, tires, filters & fluids stocked directly to your HQ Warehouse (45–55% off retail repair rates).',
  icon: 'wrench',
  render: (S: any) => {
    const inv = S.partsInventory || {};
    const totalStock = Object.values(inv).reduce((a: number, b: any) => a + (Number(b) || 0), 0);

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="background:linear-gradient(135deg, #111827 0%, #0b101d 100%); border:1px solid #1f293d; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-size:10px; font-weight:900; color:var(--gold); letter-spacing:0.8px; text-transform:uppercase;">WHOLESALE HQ WAREHOUSE SUPPLY</div>
            <div style="font-size:11px; color:var(--mu); margin-top:2px;">Stocking parts here cuts hub repair bills to labor-only (max $150/part).</div>
          </div>
          <div style="font-family:monospace; font-size:11px; font-weight:900; color:var(--grn); background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); padding:4px 8px; border-radius:6px;">
            ${totalStock} IN HQ STOCK
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:10px;">
          ${PART_CATALOG.map(item => {
            const stock = inv[item.key] || 0;
            const retail = PART_BASE_PRICES[item.key] || 500;
            const singlePrice = getWholesalePartPrice(item.key, 1);
            const bulkUnitPrice = getWholesalePartPrice(item.key, 4);
            const bulkTotal = bulkUnitPrice * 4;
            return `
              <div style="background:#0e1320; border:1px solid #1e2638; border-radius:8px; padding:12px; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
                    <span style="font-size:11.5px; font-weight:900; color:var(--tx);">${item.label}</span>
                    <span style="font-size:9px; font-family:monospace; font-weight:800; color:${stock > 0 ? 'var(--gold)' : 'var(--mu)'}; white-space:nowrap;">${stock} stocked</span>
                  </div>
                  <div style="font-size:9px; color:var(--gold); font-family:monospace; margin-top:2px;">${item.category.toUpperCase()} · Retail ${fmt(retail)}</div>
                  <div style="font-size:10px; color:var(--mu); margin-top:4px; line-height:1.35;">${item.desc}</div>
                </div>
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:10px; font-family:monospace; margin-bottom:6px;">
                    <span style="color:var(--grn); font-weight:800;">1x: ${fmt(singlePrice)}</span>
                    <span style="color:var(--gold); font-weight:800;">4x Bulk: ${fmt(bulkTotal)}</span>
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" class="btn alt" style="flex:1; padding:6px; font-size:9px; font-weight:800;" data-act="store-buy-part" data-part="${item.key}" data-qty="1" ${(S.money || 0) >= singlePrice ? '' : 'disabled'}>+1 UNIT</button>
                    <button type="button" class="btn gold" style="flex:1; padding:6px; font-size:9px; font-weight:900;" data-act="store-buy-part" data-part="${item.key}" data-qty="4" ${(S.money || 0) >= bulkTotal ? '' : 'disabled'}>+4 BULK</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};
