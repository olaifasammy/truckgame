export interface TollTariffTemplateData {
  km: number;
  weight: number;
  totalTollCost: number;
  discountApplied: boolean;
}

export function getTollTariffMessage(data: TollTariffTemplateData) {
  const title = "TOLL & BORDER TARIFF";
  const msg = `🛣️ Highway Tolls & Customs Tariffs (${data.km} km, ${data.weight}t): -$${data.totalTollCost.toLocaleString()} ${data.discountApplied ? '(EZ-Pass 30% Off)' : ''}`;
  const body = `Highway Toll & Inter-Region Border Clearance Statement:\n\nAutomated electronic toll collection (ETC) and sovereign border tariff deduction processed for recent transit leg.\n\n- Distance: ${data.km} km\n- Cargo Weight: ${data.weight} tonnes\n- Total Toll/Tariff Fee: -$${data.totalTollCost.toLocaleString()}\n- EZ-Pass Discount: ${data.discountApplied ? 'Applied (30% Reduction)' : 'Not Active'}\n\nLogistics Cost Accounting`;
  return { title, msg, body };
}
