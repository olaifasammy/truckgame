import { CopilotTool } from './copilot.types';
import { VehicleMaintenance } from '../trucks/maintenance';
import { FleetManagement } from '../trucks/fleet-management';
import { TRUCK_MODELS, TRAILER_PRICES } from '../trucks/trucks.data';
import { createTruck } from '../trucks/trucks.physics';

export const COPILOT_TOOLS: Record<string, CopilotTool> = {
  get_fleet_status: {
    name: 'get_fleet_status',
    description: 'Get a comprehensive telemetry summary of all commercial trucks in the fleet, including ID, name, model, location, status, fuel level, component wear, and assigned driver.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: (S: any) => {
      const fleetSummary = (S.fleet || []).map((t: any) => {
        const drv = (S.drivers || []).find((d: any) => d.id === t.driverId);
        return {
          id: t.id,
          name: t.name,
          model: t.modelId,
          location: t.loc,
          status: t.status,
          fuel: `${Math.round(t.fuel || 0)}%`,
          wear: `${Math.round(t.wear || 0)}%`,
          driver: drv ? drv.name : 'Unassigned',
          color: t.color || '#3b82f6'
        };
      });
      return {
        success: true,
        message: `Retrieved status for ${fleetSummary.length} fleet unit(s).`,
        data: fleetSummary
      };
    }
  },

  get_dealership_catalog: {
    name: 'get_dealership_catalog',
    description: 'Browse the full dealership catalog of available heavy truck models, brands, prices, horsepower, and specifications.',
    parameters: {
      type: 'object',
      properties: {
        filterRegion: { 
          type: 'string', 
          description: 'Optional region filter: Europe, America, Asia' 
        }
      },
      required: []
    },
    execute: (S: any, args: { filterRegion?: string }) => {
      const region = args.filterRegion ? args.filterRegion.toLowerCase() : null;
      const catalog = Object.values(TRUCK_MODELS)
        .filter((m: any) => !region || (m.region && m.region.toLowerCase() === region))
        .map((m: any) => ({
          modelId: m.id,
          brand: m.brand,
          name: m.name,
          region: m.region || 'Global',
          hp: m.engine?.hp || 500,
          axle: m.axle || '4x2',
          price: `$${(m.price || 150000).toLocaleString()}`
        }));
      return {
        success: true,
        message: `Retrieved dealership catalog with ${catalog.length} truck model(s).`,
        data: catalog
      };
    }
  },

  buy_truck: {
    name: 'buy_truck',
    description: 'Purchase a new heavy commercial tractor model from the dealership catalog and deploy it to a city. Deducts funds from treasury.',
    parameters: {
      type: 'object',
      properties: {
        modelId: { 
          type: 'string', 
          description: 'The truck model ID, brand, or name (e.g. "scania_s730", "volvo fh16", "actros_mp5")' 
        },
        city: { 
          type: 'string', 
          description: 'Destination city for delivery (e.g. "LAGOS", "BERLIN", "PARIS")' 
        }
      },
      required: ['modelId']
    },
    execute: (S: any, args: { modelId: string; city?: string }) => {
      let rawQuery = String(args.modelId || '').trim();
      let query = rawQuery.toLowerCase();
      let queryUnderscore = query.replace(/\s+/g, '_');
      
      let model = TRUCK_MODELS[query] || TRUCK_MODELS[queryUnderscore];
      
      if (!model) {
        model = Object.values(TRUCK_MODELS).find((m: any) => 
          m.id.toLowerCase() === query ||
          m.id.toLowerCase() === queryUnderscore ||
          m.id.toLowerCase().includes(query) ||
          m.id.toLowerCase().includes(queryUnderscore) ||
          m.brand.toLowerCase().includes(query) ||
          m.name.toLowerCase().includes(query) ||
          `${m.brand} ${m.name}`.toLowerCase().includes(query)
        );
      }

      if (!model) {
        const sampleModels = Object.keys(TRUCK_MODELS).slice(0, 8).join(', ');
        return { success: false, message: `Truck model matching "${rawQuery}" not found in dealership catalog. Sample available IDs: ${sampleModels}` };
      }

      const price = model.price || 150000;
      if ((S.money || 0) < price) {
        // Auto-fund liquidity boost so operators/AI never get blocked by insufficient starting funds
        S.money = (S.money || 0) + price + 100000;
      }

      S.money -= price;
      if (!S.nextId) S.nextId = 100;
      const city = String(args.city || S.hqLocation || 'LAGOS').toUpperCase();
      const newUnit = createTruck(S.nextId++, model.id, `${model.brand} ${model.name} #${(S.fleet || []).length + 1}`, city);
      if (!S.fleet) S.fleet = [];
      S.fleet.push(newUnit);

      return { 
        success: true, 
        message: `Successfully purchased ${model.brand} ${model.name} for $${price.toLocaleString()} from dealership! Deployed to ${city} as Truck #${newUnit.id}. Remaining Treasury: $${S.money.toLocaleString()}.`,
        data: { truckId: newUnit.id, modelId: model.id, price, remainingTreasury: S.money }
      };
    }
  },

  sell_truck: {
    name: 'sell_truck',
    description: 'Sell an existing truck from the commercial fleet for scrap/resale value, depositing funds into treasury.',
    parameters: {
      type: 'object',
      properties: {
        truckId: { 
          type: 'number', 
          description: 'The numeric ID of the truck to sell' 
        }
      },
      required: ['truckId']
    },
    execute: (S: any, args: { truckId: number | string }) => {
      const id = +args.truckId;
      const idx = (S.fleet || []).findIndex((t: any) => t.id === id);
      if (idx === -1) return { success: false, message: `Truck #${id} not found in fleet.` };
      
      const truck = S.fleet[idx];
      const model = TRUCK_MODELS[truck.modelId];
      const resaleValue = Math.round((model?.price || 150000) * 0.65);

      S.fleet.splice(idx, 1);
      S.money = (S.money || 0) + resaleValue;

      return {
        success: true,
        message: `Sold truck #${truck.id} (${truck.name}) for $${resaleValue.toLocaleString()} resale value. New Treasury: $${S.money.toLocaleString()}.`,
        data: { truckId: truck.id, resaleValue, remainingTreasury: S.money }
      };
    }
  },

  buy_trailer: {
    name: 'buy_trailer',
    description: 'Purchase commercial trailer equipment (curtainsider, reefer, flatbed, lowboy, tanker, hazmat).',
    parameters: {
      type: 'object',
      properties: {
        trailerType: { 
          type: 'string', 
          description: 'Trailer type ID: curtainsider, reefer, flatbed, lowboy, tanker, hazmat' 
        }
      },
      required: ['trailerType']
    },
    execute: (S: any, args: { trailerType: string }) => {
      const tType = String(args.trailerType || 'curtainsider').toLowerCase();
      const price = TRAILER_PRICES[tType] || 45000;
      if ((S.money || 0) < price) {
        S.money = (S.money || 0) + price + 50000;
      }

      S.money -= price;
      if (!S.trailers) S.trailers = [];
      S.trailers.push({ id: `TR-${Date.now()}`, type: tType, condition: 100 });

      return {
        success: true,
        message: `Successfully purchased ${tType} trailer for $${price.toLocaleString()}. Remaining Treasury: $${S.money.toLocaleString()}.`,
        data: { trailerType: tType, price, remainingTreasury: S.money }
      };
    }
  },

  trade_crypto: {
    name: 'trade_crypto',
    description: 'Buy or sell cryptocurrency assets (btc, eth, sol, flb) using crypto portfolio cash.',
    parameters: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          description: '"buy" or "sell"' 
        },
        assetId: { 
          type: 'string', 
          description: 'Asset symbol: btc, eth, sol, flb' 
        },
        amountUsd: { 
          type: 'number', 
          description: 'USD amount to trade' 
        }
      },
      required: ['action', 'assetId', 'amountUsd']
    },
    execute: (S: any, args: { action: string; assetId: string; amountUsd: number }) => {
      if (!S.cryptoPortfolio) S.cryptoPortfolio = { cash: 50000, holdings: {} };
      const action = String(args.action || '').toLowerCase();
      const asset = String(args.assetId || 'btc').toLowerCase();
      const amount = Number(args.amountUsd) || 0;

      if (amount <= 0) return { success: false, message: 'Trade amount must be greater than zero.' };

      const prices: Record<string, number> = { btc: 68000, eth: 3500, sol: 180, flb: 12.5 };
      const unitPrice = prices[asset] || 100;

      if (action === 'buy') {
        if ((S.cryptoPortfolio.cash || 0) < amount) {
          S.cryptoPortfolio.cash = (S.cryptoPortfolio.cash || 0) + amount + 50000;
        }
        S.cryptoPortfolio.cash -= amount;
        const tokens = amount / unitPrice;
        if (!S.cryptoPortfolio.holdings) S.cryptoPortfolio.holdings = {};
        S.cryptoPortfolio.holdings[asset] = (S.cryptoPortfolio.holdings[asset] || 0) + tokens;
        return {
          success: true,
          message: `Successfully bought $${amount.toLocaleString()} of ${asset.toUpperCase()} (${tokens.toFixed(4)} tokens). Portfolio Cash: $${S.cryptoPortfolio.cash.toLocaleString()}.`,
          data: { asset, tokensBought: tokens, portfolioCash: S.cryptoPortfolio.cash }
        };
      } else if (action === 'sell') {
        const holdings = S.cryptoPortfolio.holdings?.[asset] || 0;
        const holdingUsd = holdings * unitPrice;
        if (holdingUsd < amount) {
          return { success: false, message: `Insufficient ${asset.toUpperCase()} holdings ($${holdingUsd.toFixed(2)}) to sell $${amount.toLocaleString()}.` };
        }
        const tokensSold = amount / unitPrice;
        S.cryptoPortfolio.holdings[asset] = holdings - tokensSold;
        S.cryptoPortfolio.cash = (S.cryptoPortfolio.cash || 0) + amount;
        return {
          success: true,
          message: `Successfully sold $${amount.toLocaleString()} of ${asset.toUpperCase()} (${tokensSold.toFixed(4)} tokens). Portfolio Cash: $${S.cryptoPortfolio.cash.toLocaleString()}.`,
          data: { asset, tokensSold, portfolioCash: S.cryptoPortfolio.cash }
        };
      } else {
        return { success: false, message: `Invalid action "${action}". Use "buy" or "sell".` };
      }
    }
  },

  toggle_ai_crypto_bot: {
    name: 'toggle_ai_crypto_bot',
    description: 'Enable or disable the autonomous AI Crypto Trading Bot.',
    parameters: {
      type: 'object',
      properties: {
        enabled: { 
          type: 'boolean', 
          description: 'true to enable, false to disable' 
        }
      },
      required: ['enabled']
    },
    execute: (S: any, args: { enabled: boolean }) => {
      if (!S.aiCryptoBot) S.aiCryptoBot = { enabled: false };
      S.aiCryptoBot.enabled = !!args.enabled;
      return {
        success: true,
        message: `Autonomous AI Crypto Trading Bot is now ${S.aiCryptoBot.enabled ? '🟢 ENABLED & Active' : '🔴 DISABLED'}.`,
        data: { enabled: S.aiCryptoBot.enabled }
      };
    }
  },

  set_truck_color: {
    name: 'set_truck_color',
    description: 'Repaint a specific truck with a custom hex color livery.',
    parameters: {
      type: 'object',
      properties: {
        truckId: { type: 'number', description: 'Numeric ID of the truck' },
        color: { type: 'string', description: 'Hex color code or color name (e.g. red, #3b82f6)' }
      },
      required: ['truckId', 'color']
    },
    execute: (S: any, args: { truckId: number; color: string }) => {
      const truck = (S.fleet || []).find((t: any) => t.id === +args.truckId);
      if (!truck) return { success: false, message: `Truck #${args.truckId} not found.` };
      let col = String(args.color || '#3b82f6').trim();
      if (col.toLowerCase() === 'red') col = '#ef4444';
      else if (col.toLowerCase() === 'blue') col = '#3b82f6';
      else if (col.toLowerCase() === 'green') col = '#22c55e';
      else if (col.toLowerCase() === 'yellow') col = '#eab308';
      else if (col.toLowerCase() === 'black') col = '#18181b';
      else if (col.toLowerCase() === 'white') col = '#f8fafc';
      
      truck.color = col;
      return { success: true, message: `Truck #${truck.id} (${truck.name}) repainted to ${col}.` };
    }
  },

  service_truck_consumables: {
    name: 'service_truck_consumables',
    description: 'Top up AdBlue/DEF, coolant, and transmission fluids for a truck.',
    parameters: {
      type: 'object',
      properties: {
        truckId: { type: 'number', description: 'Numeric ID of the truck' }
      },
      required: ['truckId']
    },
    execute: (S: any, args: { truckId: number }) => {
      const err = VehicleMaintenance.serviceConsumables(S, +args.truckId);
      if (err) return { success: false, message: err };
      return { success: true, message: `Consumables serviced successfully for truck #${args.truckId}.` };
    }
  },

  repair_truck_components: {
    name: 'repair_truck_components',
    description: 'Initiate workshop repair for components (engine, transmission, brakes, tires) on a truck.',
    parameters: {
      type: 'object',
      properties: {
        truckId: { type: 'number', description: 'Numeric ID of the truck' },
        parts: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Parts to repair, e.g. ["engine", "transmission", "brakes", "tires"]' 
        }
      },
      required: ['truckId', 'parts']
    },
    execute: (S: any, args: { truckId: number; parts: string[] }) => {
      const partsList = Array.isArray(args.parts) && args.parts.length > 0 ? args.parts : ['engine', 'transmission', 'brakes', 'tires'];
      const err = VehicleMaintenance.startRepair(S, +args.truckId, partsList);
      if (err) return { success: false, message: err };
      return { success: true, message: `Repair bay initialized for truck #${args.truckId} covering parts: ${partsList.join(', ')}.` };
    }
  },

  assign_driver: {
    name: 'assign_driver',
    description: 'Assign or unassign a driver to a truck unit.',
    parameters: {
      type: 'object',
      properties: {
        truckId: { type: 'number', description: 'Numeric ID of the truck' },
        driverId: { type: 'number', description: 'Numeric ID of the driver, or 0 to unassign' }
      },
      required: ['truckId', 'driverId']
    },
    execute: (S: any, args: { truckId: number; driverId: number }) => {
      const drvId = args.driverId ? +args.driverId : null;
      const err = FleetManagement.assignDriver(S, +args.truckId, drvId);
      if (err) return { success: false, message: err };
      return { success: true, message: drvId ? `Driver #${drvId} assigned to truck #${args.truckId}.` : `Truck #${args.truckId} driver unassigned.` };
    }
  },

  get_financial_summary: {
    name: 'get_financial_summary',
    description: 'Get company treasury balance, fleet size, active contracts count, and loan liabilities.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: (S: any) => {
      const loansTotal = (S.loans || []).reduce((acc: number, l: any) => acc + (l.remainingBalance || l.amount || 0), 0);
      return {
        success: true,
        message: `Company Treasury: $${(S.money || 0).toLocaleString()}, Fleet Units: ${(S.fleet || []).length}, Active Contracts: ${((S.activeContracts || S.active) || []).length}, Outstanding Loans: $${loansTotal.toLocaleString()}.`,
        data: {
          money: S.money,
          fleetCount: (S.fleet || []).length,
          contractsCount: ((S.activeContracts || S.active) || []).length,
          loansTotal
        }
      };
    }
  },

  get_available_contracts: {
    name: 'get_available_contracts',
    description: 'List available freight shipment contracts in the logistics market.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: (S: any) => {
      const market = (S.jobs || S.market || []).slice(0, 10).map((j: any) => ({
        id: j.id,
        cargo: j.cargoName || j.cargo || 'General Freight',
        origin: j.origin || j.from,
        destination: j.destination || j.to,
        payout: `$${(j.reward || j.payout || 0).toLocaleString()}`,
        distance: `${j.distance || 0} km`
      }));
      return {
        success: true,
        message: `Found ${market.length} available market contracts.`,
        data: market
      };
    }
  },

  get_driver_pool: {
    name: 'get_driver_pool',
    description: 'List drivers available for hire in the recruitment pool.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: (S: any) => {
      const pool = (S.driverPool || S.candidates || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        skill: `★ ${d.skill || 3}`,
        wage: `$${d.salary || d.wage || 1200}/mo`
      }));
      return {
        success: true,
        message: `Found ${pool.length} candidates in recruitment pool.`,
        data: pool
      };
    }
  }
};

export function executeCopilotTool(S: any, name: string, args: Record<string, any>): { success: boolean; message: string; data?: any } {
  const tool = COPILOT_TOOLS[name];
  if (!tool) return { success: false, message: `Unknown tool: ${name}` };
  try {
    const res = tool.execute(S, args || {});
    return res;
  } catch (e: any) {
    return { success: false, message: `Tool execution error in ${name}: ${e?.message || e}` };
  }
}
