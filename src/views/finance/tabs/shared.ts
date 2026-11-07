import { fmt, action, toast } from '../../../core/ui';
import { refresh, set } from '../../../core/store';
import { getGoldMarketData } from '../../../domain/finance/banking';
import { CRYPTO_ASSETS, getCryptoMarketData, getTotalCryptoValue } from '../../../domain/finance/markets/crypto';
import { MINING_RIG_TYPES, MINING_ADDITIONS, MINING_DURATIONS, getSubscriptionCost, getSubstationUpgradeCost, getSubstationPowerKw, calculateMiningStats, getVipLevel, MiningSubscription, formatCryptoQty } from '../../../domain/finance/markets/mining';

// Initialize global state for selected crypto asset & mining configuration
if (!(window as any).selectedCryptoAsset) (window as any).selectedCryptoAsset = 'btc';
if (!(window as any).miningTargetCoin) (window as any).miningTargetCoin = 'btc';
if (!(window as any).miningSelectedDuration) (window as any).miningSelectedDuration = 7;

action('select-crypto-asset', d => {
  (window as any).selectedCryptoAsset = (d as any).id;
  refresh();
});

action('select-mining-coin', d => {
  (window as any).miningTargetCoin = (d as any).id;
  refresh();
});

action('select-mining-duration', d => {
  (window as any).miningSelectedDuration = +(d as any).days || 7;
  refresh();
});

action('crypto-buy-usd', d => {
  const assetId = (d as any).id || (window as any).selectedCryptoAsset || 'btc';
  let usdAmount = +(d as any).amount || 0;

  if (!usdAmount || usdAmount <= 0) {
    const inputEl = document.getElementById('crypto-buy-amount-input') as HTMLInputElement;
    if (inputEl && inputEl.value) {
      usdAmount = parseFloat(inputEl.value);
    }
  }

  set(S => {
    if (!usdAmount || isNaN(usdAmount) || usdAmount <= 0) {
      return toast('Enter a valid purchase amount (e.g. 1200)', 'err');
    }
    if (S.money < usdAmount) {
      return toast(`Insufficient liquidity ($${S.money.toLocaleString()} available)`, 'err');
    }

    const marketData = getCryptoMarketData(assetId);
    if (!marketData) return;

    const cryptoQty = usdAmount / marketData.buyPrice;
    S.money -= usdAmount;
    if (!S.cryptoHoldings) S.cryptoHoldings = {};
    S.cryptoHoldings[assetId] = (S.cryptoHoldings[assetId] || 0) + cryptoQty;

    const formattedQty = cryptoQty < 1 ? cryptoQty.toFixed(4) : cryptoQty.toFixed(2);
    toast(`Purchased ${formattedQty} ${marketData.symbol} for $${usdAmount.toLocaleString()}`, 'success');
  });
});

action('crypto-sell-custom', d => {
  const assetId = (d as any).id || (window as any).selectedCryptoAsset || 'btc';
  let usdAmount = +(d as any).amount || 0;

  if (!usdAmount || usdAmount <= 0) {
    const inputEl = document.getElementById('crypto-sell-amount-input') as HTMLInputElement;
    if (inputEl && inputEl.value) {
      usdAmount = parseFloat(inputEl.value);
    }
  }

  set(S => {
    if (!S.cryptoHoldings || !S.cryptoHoldings[assetId] || S.cryptoHoldings[assetId] <= 0) {
      return toast('No holdings available to sell', 'err');
    }

    const currentQty = S.cryptoHoldings[assetId];
    const marketData = getCryptoMarketData(assetId);
    if (!marketData) return;

    if (!usdAmount || isNaN(usdAmount) || usdAmount <= 0) {
      return toast('Enter a valid USD amount to sell (e.g. 356)', 'err');
    }

    const qtyToSell = usdAmount / marketData.sellPrice;
    if (qtyToSell > currentQty + 0.000001) {
      const maxUsd = Math.floor(currentQty * marketData.sellPrice);
      return toast(`Sell amount exceeds holding. Maximum available: $${maxUsd.toLocaleString()}`, 'err');
    }

    const actualQtyToSell = Math.min(qtyToSell, currentQty);
    const usdPayout = actualQtyToSell * marketData.sellPrice;

    S.cryptoHoldings[assetId] -= actualQtyToSell;
    if (S.cryptoHoldings[assetId] <= 0.000001) delete S.cryptoHoldings[assetId];
    S.money += usdPayout;

    const formattedQty = actualQtyToSell < 1 ? actualQtyToSell.toFixed(4) : actualQtyToSell.toFixed(2);
    toast(`Sold ${formattedQty} ${marketData.symbol} for $${Math.round(usdPayout).toLocaleString()}`, 'info');
  });
});

action('crypto-sell-pct', d => {
  const assetId = (d as any).id || (window as any).selectedCryptoAsset || 'btc';
  const pct = +(d as any).pct || 100;

  set(S => {
    if (!S.cryptoHoldings || !S.cryptoHoldings[assetId] || S.cryptoHoldings[assetId] <= 0) {
      return toast('No holdings available to sell', 'err');
    }

    const currentQty = S.cryptoHoldings[assetId];
    const qtyToSell = currentQty * (pct / 100);
    const marketData = getCryptoMarketData(assetId);
    if (!marketData || qtyToSell <= 0) return;

    const usdPayout = qtyToSell * marketData.sellPrice;
    S.cryptoHoldings[assetId] -= qtyToSell;
    if (S.cryptoHoldings[assetId] <= 0.000001) delete S.cryptoHoldings[assetId];
    S.money += usdPayout;

    const formattedQty = qtyToSell < 1 ? qtyToSell.toFixed(4) : qtyToSell.toFixed(2);
    toast(`Sold ${formattedQty} ${marketData.symbol} for $${Math.round(usdPayout).toLocaleString()}`, 'info');
  });
});

// Mining Subscription Purchase Action
action('subscribe-mining-contract', d => {
  const typeId = (d as any).typeId;
  const targetAssetId = (d as any).coin || (window as any).miningTargetCoin || 'btc';
  const durationDays = +(d as any).duration || (window as any).miningSelectedDuration || 7;

  const rigDef = MINING_RIG_TYPES.find(t => t.id === typeId);
  if (!rigDef) return;

  set(S => {
    if (!S.mining) S.mining = { substationLevel: 0, subscriptions: [], upgrades: {}, pendingYield: {} };
    if (!S.mining.subscriptions) S.mining.subscriptions = [];

    const stats = calculateMiningStats(S);
    const playerVip = getVipLevel(S);
    const userCoins = S.coins || 0;
    const costs = getSubscriptionCost(typeId, durationDays);

    if (playerVip < rigDef.requiredVipLevel) {
      return toast(`VIP Rank ${rigDef.requiredVipLevel}+ required (Your rank: VIP ${playerVip})`, 'err');
    }
    if (S.money < costs.cashCost) {
      return toast(`Insufficient cash ($${costs.cashCost.toLocaleString()} required)`, 'err');
    }
    if (userCoins < costs.bondsCost) {
      return toast(`Insufficient Fleet Bonds (${costs.bondsCost} FLB required)`, 'err');
    }
    if (stats.usedPowerKw + rigDef.powerKw > stats.currentPowerKw) {
      return toast(`Power Substation overload! Upgrade power capacity first (${stats.usedPowerKw + rigDef.powerKw}kW needed)`, 'err');
    }

    S.money -= costs.cashCost;
    S.coins = userCoins - costs.bondsCost;

    const now = Date.now();
    const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;

    const newSub: MiningSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      typeId,
      targetAssetId,
      startedAt: now,
      expiresAt,
      durationDays,
      cashPaid: costs.cashCost,
      bondsPaid: costs.bondsCost,
      active: true
    };

    S.mining.subscriptions.push(newSub);

    toast(`Started ${durationDays}-Day Hosting for ${targetAssetId.toUpperCase()}! (-$${costs.cashCost.toLocaleString()} & -${costs.bondsCost} FLB)`, 'success');
  });
});

// System Addition Booster Purchase Action
action('buy-mining-addition', d => {
  const additionId = (d as any).id;
  const additionDef = MINING_ADDITIONS.find(a => a.id === additionId);
  if (!additionDef) return;

  set(S => {
    if (!S.mining) S.mining = { substationLevel: 0, subscriptions: [], upgrades: {}, pendingYield: {} };
    if (!S.mining.upgrades) S.mining.upgrades = {};

    if (S.mining.upgrades[additionId]) return toast('System Addition already installed', 'info');

    const playerVip = getVipLevel(S);
    const userCoins = S.coins || 0;

    if (playerVip < additionDef.requiredVipLevel) {
      return toast(`VIP Rank ${additionDef.requiredVipLevel}+ required`, 'err');
    }
    if (S.money < additionDef.cashCost) {
      return toast(`Insufficient cash ($${additionDef.cashCost.toLocaleString()} required)`, 'err');
    }
    if (userCoins < additionDef.bondsCost) {
      return toast(`Insufficient Fleet Bonds (${additionDef.bondsCost} FLB required)`, 'err');
    }

    S.money -= additionDef.cashCost;
    S.coins = userCoins - additionDef.bondsCost;
    S.mining.upgrades[additionId] = true;

    toast(`Installed ${additionDef.name}! (-$${additionDef.cashCost.toLocaleString()} & -${additionDef.bondsCost} FLB)`, 'success');
  });
});

action('cancel-mining-sub', d => {
  const subId = (d as any).id;
  set(S => {
    if (!S.mining || !S.mining.subscriptions) return;
    const sub = S.mining.subscriptions.find((s: any) => s.id === subId);
    if (sub) {
      sub.active = false;
      toast(`Mining Subscription ${subId.substring(0, 8)} terminated`, 'info');
    }
  });
});

action('upgrade-substation', () => {
  set(S => {
    if (!S.mining) S.mining = { substationLevel: 0, subscriptions: [], upgrades: {}, pendingYield: {} };
    const currentLvl = S.mining.substationLevel || 0;
    const cost = getSubstationUpgradeCost(currentLvl);
    const userCoins = S.coins || 0;

    if (S.money < cost.cashCost || userCoins < cost.bondsCost) {
      return toast(`Upgrade requires $${cost.cashCost.toLocaleString()} & ${cost.bondsCost} FLB`, 'err');
    }

    S.money -= cost.cashCost;
    S.coins = userCoins - cost.bondsCost;
    S.mining.substationLevel = currentLvl + 1;
    const newKw = getSubstationPowerKw(S.mining.substationLevel);

    toast(`Substation Upgraded to Lvl ${S.mining.substationLevel}! Max Power: ${newKw} kW`, 'success');
  });
});

action('withdraw-flb-to-bonds', d => {
  let rawQty = +(d as any)?.qty || 0;

  if (!rawQty || rawQty <= 0) {
    const inputEl = document.getElementById('flb-withdraw-input') as HTMLInputElement;
    if (inputEl && inputEl.value) {
      rawQty = parseFloat(inputEl.value);
    }
  }

  set(S => {
    const cryptoFlb = (S.cryptoHoldings && S.cryptoHoldings['flb']) || 0;
    if (cryptoFlb <= 0) return toast('No FLB in Crypto Wallet to withdraw', 'err');

    const amount = rawQty > 0 ? Math.min(rawQty, cryptoFlb) : cryptoFlb;
    if (amount <= 0 || isNaN(amount)) return toast('Enter a valid FLB quantity to withdraw', 'err');

    S.cryptoHoldings['flb'] -= amount;
    if (S.cryptoHoldings['flb'] <= 0.000001) delete S.cryptoHoldings['flb'];
    S.coins = (S.coins || 0) + amount;

    const fmtAmt = amount < 1 ? amount.toFixed(4) : amount.toFixed(2);
    toast(`Transferred ${fmtAmt} FLB from Crypto Wallet to Company Bond Balance!`, 'success');
  });
});

action('deposit-bonds-to-crypto', d => {
  let rawQty = +(d as any)?.qty || 0;

  if (!rawQty || rawQty <= 0) {
    const inputEl = document.getElementById('flb-deposit-input') as HTMLInputElement;
    if (inputEl && inputEl.value) {
      rawQty = parseFloat(inputEl.value);
    }
  }

  set(S => {
    const userCoins = S.coins || 0;
    if (userCoins <= 0) return toast('No liquid FLB in Company Bond Balance to deposit', 'err');

    const amount = rawQty > 0 ? Math.min(rawQty, userCoins) : userCoins;
    if (amount <= 0 || isNaN(amount)) return toast('Enter a valid FLB quantity to deposit', 'err');

    S.coins -= amount;
    if (!S.cryptoHoldings) S.cryptoHoldings = {};
    S.cryptoHoldings['flb'] = (S.cryptoHoldings['flb'] || 0) + amount;

    const fmtAmt = amount < 1 ? amount.toFixed(4) : amount.toFixed(2);
    toast(`Deposited ${fmtAmt} FLB from Company Bond Balance into Crypto Wallet!`, 'info');
  });
});

action('claim-mining-rewards', () => {
  set(S => {
    if (!S.mining || !S.mining.pendingYield) return toast('No mined rewards to claim', 'err');

    let claimedCount = 0;
    if (!S.cryptoHoldings) S.cryptoHoldings = {};

    const claimedList: string[] = [];

    for (const [assetId, qty] of Object.entries(S.mining.pendingYield)) {
      const amount = qty as number;
      if (amount > 0) {
        // Claim directly into crypto holdings in Crypto Wallet for ALL mined assets
        S.cryptoHoldings[assetId] = (S.cryptoHoldings[assetId] || 0) + amount;
        S.mining.pendingYield[assetId] = 0;

        const asset = CRYPTO_ASSETS.find(a => a.id === assetId);
        const symbol = asset ? asset.symbol : assetId.toUpperCase();
        const formatted = amount < 1 ? amount.toFixed(4) : amount.toFixed(2);
        claimedList.push(`${formatted} ${symbol}`);
        claimedCount++;
      }
    }

    if (claimedCount === 0) return toast('No pending crypto yields to claim yet', 'info');
    toast(`Claimed Mined Crypto: ${claimedList.join(', ')} added to your Crypto Wallet!`, 'success');
  });
});

action('stake-flb', d => {
  const qty = Math.max(1, +(d as any).qty || 1);
  set(S => {
    const userCoins = S.coins || 0;
    if (userCoins < qty) return toast(`Insufficient Fleet Bonds (${qty} FLB required to stake)`, 'err');
    S.coins = userCoins - qty;
    S.stakedBonds = (S.stakedBonds || 0) + qty;
    toast(`Staked ${qty} FLB into Corporate Treasury Pool! (18.5% APY active)`, 'success');
  });
});

action('unstake-flb', d => {
  const qty = Math.max(1, +(d as any).qty || 1);
  set(S => {
    const staked = S.stakedBonds || 0;
    if (staked < qty) return toast(`Insufficient staked bonds (${qty} FLB requested, ${staked} staked)`, 'err');
    S.stakedBonds = staked - qty;
    S.coins = (S.coins || 0) + qty;
    toast(`Unstaked ${qty} FLB back to available liquid treasury reserves`, 'info');
  });
});

action('finance-tab', d => {
  (window as any).financeTab = (d as any).tab;
  refresh();
});

action('exchange-buy-gold', d => {
  let qty = +(d as any).qty;
  if (isNaN(qty) || qty <= 0) {
    const input = document.getElementById('flb-buy-qty-input') as HTMLInputElement | null;
    qty = input ? parseFloat(input.value) : 1;
  }
  if (isNaN(qty) || qty <= 0) return toast('Enter a valid FLB quantity', 'err');

  set(S => {
    const market = getGoldMarketData(S);
    const totalCost = market.buyPrice * qty;
    if (S.money < totalCost) return toast(`Insufficient liquidity. Need $${Math.round(totalCost).toLocaleString()}`, 'err');
    S.money -= totalCost;
    S.coins = (S.coins || 0) + qty;
    toast(`Currency Exchange: Acquired ${qty} Fleet Bonds (${formatCryptoQty(qty)} FLB)`, 'success');
  });
});

action('exchange-sell-gold', d => {
  let qty = +(d as any).qty;
  if (isNaN(qty) || qty <= 0) {
    const input = document.getElementById('flb-sell-qty-input') as HTMLInputElement | null;
    qty = input ? parseFloat(input.value) : 1;
  }
  if (isNaN(qty) || qty <= 0) return toast('Enter a valid FLB quantity', 'err');

  set(S => {
    const userCoins = S.coins || 0;
    if (userCoins < qty) return toast(`Insufficient Fleet Bond reserves (${formatCryptoQty(userCoins)} FLB available)`, 'err');
    const market = getGoldMarketData(S);
    const totalCredit = market.sellPrice * qty;
    S.coins -= qty;
    S.money += totalCredit;
    toast(`Liquidation Complete: Sold ${qty} Fleet Bonds for +$${Math.round(totalCredit).toLocaleString()}`, 'info');
  });
});

action('set-mining-tuning', d => {
  const profile = (d as any).profile || 'balanced';
  set(S => {
    if (!S.mining) S.mining = { substationLevel: 0, subscriptions: [], upgrades: {}, pendingYield: {} };
    S.mining.tuning = profile;
    toast(`Mining Tuning Profile set to ${profile.toUpperCase()}`, 'info');
  });
});

action('crypto-sub-tab', d => {
  (window as any).cryptoSubTab = (d as any).tab || 'exchange';
  refresh();
});

action('open-ai-dispatch', () => {
  set(S => { S.tab = 'dispatch'; });
  refresh();
});

export function renderFinanceNav(activeTab: string) {
  const tabs = [
    { id: 'treasury', label: 'P&L' },
    { id: 'banking', label: 'Debt' },
    { id: 'fuel', label: 'Fuel' },
    { id: 'exchange', label: 'FX & Crypto' },
    { id: 'insurance', label: 'Risk' }
  ];

  return `
    <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px; margin-bottom:16px;">
      ${tabs.map(t => `
        <button class="btn ${activeTab === t.id ? 'gold' : 'alt'}" style="padding:8px 4px; font-size:10px; font-weight:800;" data-act="finance-tab" data-tab="${t.id}">
          ${t.label}
        </button>
      `).join('')}
    </div>
  `;
}
