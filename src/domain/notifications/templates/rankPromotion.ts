export interface RankPromotionTemplateData {
  newTitle: string;
  promoBondsEarned: number;
}

export function getRankPromotionMessage(data: RankPromotionTemplateData) {
  const title = "EXECUTIVE RANK PROMOTION";
  const msg = `Your carrier has attained the rank of ${data.newTitle.toUpperCase()}! Reward: +${data.promoBondsEarned} Fleet Bonds.`;
  const body = `Corporate Governance Notice:\n\nIn recognition of your exceptional enterprise growth, freight volume, and financial standing, the Global Logistics Standards Council has officially promoted your carrier rank to ${data.newTitle.toUpperCase()}.\n\nCarrier Progression Rewards:\n- Bonus Gold Coins / Fleet Bonds: +${data.promoBondsEarned}\n- Unlocked Tiers & Permits: Access to advanced enterprise credit facilities and heavy intermodal corridors.\n\nExecutive Board of Directors`;
  return { title, msg, body };
}
