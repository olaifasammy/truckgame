import { ic } from '../core/icons';
import { COMPETITORS } from '../domain/freight/bids/competitors';

export default {
  id: 'rankings',
  icon: 'up',
  label: 'Rankings',
  hidden: true,
  render: (S: any) => {
    // Players Reputation (calculated from loads and vip)
    if (S.reputation === undefined) S.reputation = S.loads * 15 + (S.vip * 100);
    const playersRep = S.reputation;
    
    const leaderboard = COMPETITORS.map(c => ({
      ...c,
      rep: Math.floor(500 + (parseInt(c.id.split('_')[2]) * 45) + (c.aggression * 200)),
      fleet: Math.floor(2 + (parseInt(c.id.split('_')[2]) % 15))
    }));

    // Add Player
    leaderboard.push({
      id: 'player',
      name: S.company || 'NexHaul Logistics',
      region: 'NA', // Default
      aggression: 1.0,
      rep: playersRep,
      fleet: S.fleet.length,
      budgetCapMultiplier: 1.0
    } as any);

    // Sort by Reputation
    leaderboard.sort((a, b) => b.rep - a.rep);
    const playerRank = leaderboard.findIndex(x => x.id === 'player') + 1;

    return `
      <div class="profile-wrap" style="padding: 20px 16px;">
        <div style="font-size: 10px; color: var(--gold); font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">World Logistics Rankings</div>
        <div style="font-size: 24px; font-weight: 900; color: var(--tx);">Global Standing</div>
        <div style="margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; background: var(--s2); padding: 6px 16px; border-radius: 20px; border: 1px solid var(--gold);">
          <span style="color: var(--mu); font-size: 11px; font-weight: 700;">YOUR RANK:</span>
          <span style="color: var(--gold); font-size: 14px; font-weight: 900;">#${playerRank}</span>
        </div>
      </div>

      <div class="sec"><span>Top Carriers</span><span class="mu-tx">REPUTATION BASED</span></div>
      
      <div style="padding: 0 12px 20px;">
        ${leaderboard.slice(0, 50).map((c, i) => {
          const isPlayer = c.id === 'player';
          return `
            <div class="card row" style="margin: 0 0 8px 0; padding: 12px; ${isPlayer ? 'border-color: var(--gold); background: rgba(193, 154, 91, 0.1);' : 'border-color: var(--line);'}">
              <div style="width: 30px; font-weight: 900; color: ${i < 3 ? 'var(--gold)' : 'var(--mu)'}; font-size: 14px;">#${i + 1}</div>
              <div class="info">
                <div class="c" style="font-size: 13px; color: ${isPlayer ? 'var(--gold)' : 'var(--tx)'}">${c.name}</div>
                <div class="d">${c.region} Carrier · ${c.fleet} Trucks</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 12px; font-weight: 800; color: var(--accent);">${c.rep.toLocaleString()}</div>
                <div style="font-size: 8px; color: var(--mu); font-weight: 700; text-transform: uppercase;">REP</div>
              </div>
            </div>
          `;
        }).join('')}
        
        ${playerRank > 50 ? `
          <div style="text-align: center; padding: 10px; color: var(--mu); font-size: 11px;">...</div>
          <div class="card row" style="margin: 0; padding: 12px; border-color: var(--gold); background: rgba(193, 154, 91, 0.1);">
            <div style="width: 30px; font-weight: 900; color: var(--gold); font-size: 14px;">#${playerRank}</div>
            <div class="info">
              <div class="c" style="font-size: 13px; color: var(--gold)">${S.company}</div>
              <div class="d">Your Company · ${S.fleet.length} Trucks</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 800; color: var(--accent);">${playersRep.toLocaleString()}</div>
              <div style="font-size: 8px; color: var(--mu); font-weight: 700; text-transform: uppercase;">REP</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
};
