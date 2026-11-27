import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeCopilotTool } from './copilot.tools';
import { processCopilotMessage } from './copilot.engine';
import { createTruck } from '../trucks/trucks.physics';

describe('NexHaul Full-Game Co-Pilot Tools & Intent Engine', () => {
  it('supports unlocking regions, buying hubs, and listing/refreshing hub jobs', async () => {
    const state: any = {
      money: 500000000,
      unlockedRegions: ['Africa'],
      depots: ['hub_lagos'],
      hubFacilities: {},
      hubJobs: {},
      jobs: [],
      fleet: [],
      drivers: [],
      pool: [],
      trailers: [],
      licenses: []
    };

    const unlockRes = await processCopilotMessage(state, 'unlock region europe');
    assert.ok(unlockRes.reply.includes('Europe'));
    assert.ok(state.unlockedRegions.includes('Europe'));

    const buyHubRes = await processCopilotMessage(state, 'buy hub rotterdam');
    assert.ok(buyHubRes.reply.includes('Rotterdam'));
    assert.ok(state.depots.includes('hub_rotterdam'));
    assert.ok((state.hubJobs['hub_rotterdam'] || []).length > 0);

    const jobsRes = await processCopilotMessage(state, 'show jobs in rotterdam');
    assert.ok(jobsRes.reply.includes('Rotterdam'));
  });

  it('supports hiring/staffing idle trucks, hitching trailers, and dispatching a hub', async () => {
    const truck = createTruck(10, 'scania_s730', 'Lagos Hauler', 'LAGOS');
    truck.trailer = null;

    const state: any = {
      money: 200000,
      nextId: 200,
      unlockedRegions: ['Africa'],
      depots: ['hub_lagos'],
      hubFacilities: {},
      hubJobs: {},
      jobs: [],
      fleet: [truck],
      drivers: [],
      pool: [
        { id: 77, name: 'Adebayo', skill: 2, region: 'Africa', workPermits: ['Africa'], fatigue: 0, hosHours: 0, certifications: [] }
      ],
      trailers: ['curtain'],
      licenses: [],
      violations: [],
      active: [],
      dailyStats: { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 }
    };

    const hitchRes = executeCopilotTool(state, 'hitch_trailer', { truckId: 10, trailerType: 'curtain' });
    assert.equal(hitchRes.success, true);
    assert.equal(truck.trailer, 'curtain');
    assert.equal(state.trailers.length, 0);

    const staffRes = await processCopilotMessage(state, 'staff idle trucks in lagos');
    assert.ok(staffRes.reply.includes('Staffed 1/1'));
    assert.equal(truck.driverId, 77);

    const dispatchRes = await processCopilotMessage(state, 'dispatch hub lagos');
    assert.ok(dispatchRes.reply.includes('Dispatched 1/1'), `Unexpected reply: ${dispatchRes.reply}`);
    assert.equal(truck.status, 'busy');
  });
});
