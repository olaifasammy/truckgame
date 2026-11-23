import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runAiAutoDispatch } from './ai.engine';
import { BiddingEngine } from '../freight/bids/engine';
import { COMPETITORS } from '../freight/bids/competitors';
import { createTruck } from '../trucks/trucks.physics';

describe('AI Dispatcher Compliance & Regional Competitor Simulation', () => {
  it('blocks AI auto-dispatch when FMCSA Safety Hold is active', () => {
    const truck = createTruck(1, 'scania_s730', 'Scania 1', 'LAGOS');
    truck.regNo = 'LA-101-AA';
    const state: any = {
      money: 50000,
      depots: ['hub_lagos'],
      trailers: ['curtain'],
      fleet: [truck],
      drivers: [{ id: 1, name: 'Ayo', region: 'Africa', fatigue: 0, hosHours: 0 }],
      violations: [
        { id: 1, type: 'speeding', fine: 500, reason: '1', paid: false, at: 1 },
        { id: 2, type: 'speeding', fine: 500, reason: '2', paid: false, at: 2 },
        { id: 3, type: 'speeding', fine: 500, reason: '3', paid: false, at: 3 }
      ],
      aiState: {
        subscriptionActive: true,
        expiresTimestamp: Date.now() + 999999,
        filters: { enabled: true }
      },
      jobs: []
    };

    const res = runAiAutoDispatch(state);
    assert.equal(res.dispatchedCount, 0);
    assert.ok(res.message.includes('FMCSA Safety Hold'), `Expected safety hold message, got: ${res.message}`);
  });

  it('enforces real 10h HOS rest (no 15s bypass) and respects regional driver permits', () => {
    const truck = createTruck(2, 'scania_s730', 'Scania 2', 'LAGOS');
    const euDriver: any = { id: 10, name: 'Hans', region: 'Europe', workPermits: ['Europe'], fatigue: 0, hosHours: 0 };
    const afFatiguedDriver: any = { id: 11, name: 'Musa', region: 'Africa', workPermits: ['Africa'], fatigue: 90, hosHours: 11 };

    const state: any = {
      money: 50000,
      depots: ['hub_lagos'],
      trailers: ['curtain'],
      fleet: [truck],
      drivers: [euDriver, afFatiguedDriver],
      violations: [],
      aiState: {
        subscriptionActive: true,
        expiresTimestamp: Date.now() + 999999,
        filters: { enabled: true }
      },
      jobs: []
    };

    const tBefore = Date.now();
    runAiAutoDispatch(state);

    // EU driver without Africa permit must NOT be paired to LAGOS truck
    assert.equal(truck.driverId, null);
    // Fatigued driver must receive full 10h HOS rest (~2,770,000ms), NOT 15s wipe
    assert.ok(afFatiguedDriver.hosRestUntil >= tBefore + 2_700_000, 'Expected real 10h HOS rest duration');
    assert.equal(afFatiguedDriver.fatigue, 90);
  });

  it('matches regional competitors to corridor auctions and tracks competitor stats', () => {
    const state: any = {
      competitorStats: { playerWins: 0, rivals: {} },
      notes: []
    };

    const auc: any = {
      id: 5001,
      companyId: 'dangote',
      cargoId: 'cement',
      weight: 20,
      from: 'LAGOS',
      to: 'ABUJA',
      km: 750,
      startingBid: 4000,
      currentBid: 4000,
      currentWinner: 'player',
      currentWinnerName: 'Player',
      expiresAt: Date.now() + 60000,
      bidHistory: [],
      requirements: {}
    };

    const placed = BiddingEngine.simulateCompetitorBid(state, auc);
    assert.equal(placed, true);
    const rival = COMPETITORS.find(c => c.id === auc.currentWinner);
    assert.ok(rival, 'Winning bidder should be a known competitor');
    assert.equal(rival.region, 'AF', `Expected African competitor for LAGOS->ABUJA, got ${rival.region}`);
    assert.ok(state.competitorStats.rivals[rival.id].bids >= 1);

    BiddingEngine.finalizeAuction(state, auc);
    assert.equal(state.competitorStats.rivals[rival.id].wins, 1);
  });
});
