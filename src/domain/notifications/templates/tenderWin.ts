export interface TenderWinTemplateData {
  client: string;
  bonusPayout: number;
}

export function getTenderWinMessage(data: TenderWinTemplateData) {
  const title = "TENDER CONTRACT SECURED";
  const msg = `🎉 Tender Won: Exclusive logistics contract secured with ${data.client}!`;
  const body = `Tender Bidding Room Notice:\n\nYour competitive tender bid for ${data.client} has been accepted by the client board. You have been awarded exclusive carriage rights for this multi-load enterprise corridor.\n\nDeliver scheduled consignments within agreed SLA thresholds to unlock completion bonuses up to +$${data.bonusPayout.toLocaleString()} and cement your market dominance.\n\nCommercial Tendering Directorate`;
  return { title, msg, body };
}
