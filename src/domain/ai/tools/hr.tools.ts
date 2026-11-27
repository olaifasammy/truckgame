import { CopilotTool } from '../copilot.types';
import { fillDriverPool } from '../../drivers/drivers.engine';
import { DriverManagement, MAX_SKILL_LEVEL } from '../../drivers/management';
import { DriverCertifications, DRIVER_CERTIFICATIONS } from '../../drivers/certifications';
import { FREIGHT_LICENSES } from '../../freight/licenses';
import { LOCATIONS } from '../../../data/world';
import { findHub } from './hub.tools';

export const HR_TOOLS: CopilotTool[] = [
  {
    name: 'get_driver_pool',
    description: 'Inspect available drivers in the hiring pool and your current employed drivers.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      if (!S.pool || S.pool.length === 0) fillDriverPool(S);
      const pool = (S.pool || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        skill: d.skill,
        region: d.region,
        hireCost: `$${(d.skill * 1500).toLocaleString()}`,
        certifications: d.certifications || []
      }));
      const employed = (S.drivers || []).map((d: any) => {
        const truck = (S.fleet || []).find((t: any) => t.driverId === d.id);
        return {
          id: d.id,
          name: d.name,
          skill: d.skill,
          region: d.region,
          fatigue: `${Math.round(d.fatigue || 0)}%`,
          assignedTo: truck ? truck.name : 'Unassigned'
        };
      });
      return {
        success: true,
        message: `${pool.length} candidate(s) in hiring pool; ${employed.length} employed driver(s).`,
        data: { pool, employed }
      };
    }
  },
  {
    name: 'hire_driver',
    description: 'Hire a driver from the recruitment pool by ID, name, or region.',
    parameters: {
      type: 'object',
      properties: {
        driverId: { type: 'number', description: 'Optional candidate ID' },
        region: { type: 'string', description: 'Optional region filter (Africa, Europe, America, Asia)' }
      }
    },
    execute: (S: any, { driverId, region }: { driverId?: number; region?: string }) => {
      if (!S.pool || S.pool.length === 0) fillDriverPool(S);
      let candidate = driverId
        ? (S.pool || []).find((d: any) => d.id === driverId)
        : (S.pool || []).find((d: any) => !region || d.region.toLowerCase() === region.toLowerCase());

      if (!candidate && region) {
        candidate = (S.pool || [])[0];
      }
      if (!candidate) return { success: false, message: 'No matching driver candidate available in the pool.' };

      const fee = candidate.skill * 1500;
      if ((S.money || 0) < fee) {
        return { success: false, message: `Insufficient funds to hire ${candidate.name}. Need $${fee.toLocaleString()}.` };
      }
      S.money -= fee;
      S.pool = (S.pool || []).filter((d: any) => d.id !== candidate.id);
      if (!S.drivers) S.drivers = [];
      S.drivers.push({ ...candidate, fatigue: 0, hosHours: 0, stats: candidate.stats || { jobs: 0, earned: 0 } });
      fillDriverPool(S);
      return {
        success: true,
        message: `Hired ${candidate.name} (Skill ${candidate.skill}, ${candidate.region}) for $${fee.toLocaleString()}.`,
        data: candidate
      };
    }
  },
  {
    name: 'assign_driver',
    description: 'Assign an employed driver to a truck in your fleet.',
    parameters: {
      type: 'object',
      properties: {
        driverId: { type: 'number', description: 'Employed driver ID' },
        truckId: { type: 'number', description: 'Target truck ID' }
      },
      required: ['driverId', 'truckId']
    },
    execute: (S: any, { driverId, truckId }: { driverId: number; truckId: number }) => {
      const driver = (S.drivers || []).find((d: any) => d.id === driverId);
      if (!driver) return { success: false, message: `Driver #${driverId} not found.` };
      const truck = (S.fleet || []).find((t: any) => t.id === truckId);
      if (!truck) return { success: false, message: `Truck #${truckId} not found.` };

      const prevTruck = (S.fleet || []).find((t: any) => t.driverId === driverId && t.id !== truckId);
      if (prevTruck) prevTruck.driverId = null;
      truck.driverId = driverId;
      return { success: true, message: `Assigned ${driver.name} to ${truck.name}.` };
    }
  },
  {
    name: 'staff_idle_trucks',
    description: 'Automatically assign unassigned drivers (or hire matching regional drivers) to unstaffed trucks.',
    parameters: {
      type: 'object',
      properties: {
        hub: { type: 'string', description: 'Optional hub city/name to staff' }
      }
    },
    execute: (S: any, { hub }: { hub?: string }) => {
      const targetHub = hub ? findHub(hub) : null;
      const unstaffed = (S.fleet || []).filter((t: any) => {
        if (t.driverId) return false;
        if (targetHub && t.loc !== targetHub.city) return false;
        return true;
      });
      if (unstaffed.length === 0) {
        return { success: true, message: targetHub ? `All trucks at ${targetHub.city} already have drivers.` : 'All fleet trucks already have drivers.' };
      }

      if (!S.pool || S.pool.length === 0) fillDriverPool(S);
      let assigned = 0;
      let hired = 0;
      let totalCost = 0;

      for (const t of unstaffed) {
        const truckRegion = LOCATIONS[t.loc]?.region || 'Africa';
        let drv = (S.drivers || []).find((d: any) => {
          const alreadyAssigned = (S.fleet || []).some((ft: any) => ft.driverId === d.id);
          return !alreadyAssigned && (d.region === truckRegion || (d.workPermits || []).includes(truckRegion));
        });

        if (!drv) {
          const cand = (S.pool || []).find((d: any) => d.region === truckRegion) || (S.pool || [])[0];
          if (cand) {
            const fee = cand.skill * 1500;
            if ((S.money || 0) >= fee) {
              S.money -= fee;
              totalCost += fee;
              S.pool = S.pool.filter((d: any) => d.id !== cand.id);
              drv = { ...cand, fatigue: 0, hosHours: 0, workPermits: cand.workPermits || [cand.region], stats: { jobs: 0, earned: 0 } };
              if (!S.drivers) S.drivers = [];
              S.drivers.push(drv);
              fillDriverPool(S);
              hired++;
            }
          }
        }

        if (drv) {
          t.driverId = drv.id;
          assigned++;
        }
      }

      return {
        success: assigned > 0,
        message: `Staffed ${assigned}/${unstaffed.length} truck(s) (${hired} driver(s) hired for $${totalCost.toLocaleString()}).`,
        actions: assigned > 0 ? [{ label: 'Dispatch Now', prompt: targetHub ? `dispatch hub ${targetHub.city}` : 'dispatch all idle trucks' }] : undefined
      };
    }
  },
  {
    name: 'buy_license',
    description: 'Purchase an operating freight license/permit (adr_hazmat, cold_chain, heavy_haul, lcv_double, bulk_tipper, intermodal_container).',
    parameters: {
      type: 'object',
      properties: {
        licenseId: { type: 'string', description: 'License ID or keyword (e.g. adr_hazmat, cold_chain, heavy_haul)' }
      },
      required: ['licenseId']
    },
    execute: (S: any, { licenseId }: { licenseId: string }) => {
      const q = (licenseId || '').toLowerCase().trim();
      const lic = Object.values(FREIGHT_LICENSES).find(
        l => l.id.toLowerCase() === q || l.name.toLowerCase().includes(q)
      );
      if (!lic) return { success: false, message: `License "${licenseId}" not found.` };
      if ((S.licenses || []).includes(lic.id)) {
        return { success: false, message: `You already hold ${lic.name}.` };
      }
      if ((S.money || 0) < lic.cost) {
        return { success: false, message: `Insufficient funds for ${lic.name}. Need $${lic.cost.toLocaleString()}.` };
      }
      S.money -= lic.cost;
      if (!S.licenses) S.licenses = [];
      S.licenses.push(lic.id);
      return { success: true, message: `Purchased ${lic.name} for $${lic.cost.toLocaleString()}!` };
    }
  },
  {
    name: 'train_driver',
    description: 'Train/upskill an employed driver to increase their CDL skill level (up to 5 stars), or set all=true to train all eligible drivers.',
    parameters: {
      type: 'object',
      properties: {
        driverId: { type: 'number', description: 'Employed driver ID' },
        driverName: { type: 'string', description: 'Optional employed driver name (case-insensitive)' },
        all: { type: 'boolean', description: 'If true, upgrade all employed drivers below max skill as funds permit' }
      }
    },
    execute: (S: any, { driverId, driverName, all }: { driverId?: number; driverName?: string; all?: boolean }) => {
      const drivers = S.drivers || [];
      if (drivers.length === 0) {
        return { success: false, message: 'No employed drivers found.' };
      }

      if (all) {
        let trained = 0;
        let totalCost = 0;
        for (const drv of drivers) {
          if ((drv.skill || 1) >= MAX_SKILL_LEVEL) continue;
          const cost = DriverManagement.calculateSkillUpgradeCost(drv.skill || 1);
          const err = DriverManagement.upgradeSkill(S, drv.id);
          if (!err) {
            trained++;
            totalCost += cost;
          }
        }
        return {
          success: trained > 0,
          message: trained > 0
            ? `Trained ${trained} driver(s) for $${totalCost.toLocaleString()}.`
            : 'No eligible drivers could be trained (already max skill or insufficient funds).'
        };
      }

      let target = driverId
        ? drivers.find((d: any) => d.id === driverId)
        : driverName
          ? drivers.find((d: any) => (d.name || '').toLowerCase().includes(driverName.toLowerCase().trim()))
          : undefined;

      if (!target) {
        return { success: false, message: 'Specify a valid driverId, driverName, or all=true to train drivers.' };
      }

      const prevSkill = target.skill || 1;
      const cost = DriverManagement.calculateSkillUpgradeCost(prevSkill);
      const err = DriverManagement.upgradeSkill(S, target.id);
      if (err) {
        return { success: false, message: `${target.name}: ${err}` };
      }

      return {
        success: true,
        message: `Trained ${target.name} from Skill ${prevSkill}★ to ${target.skill}★ for $${cost.toLocaleString()}.`,
        data: { id: target.id, name: target.name, skill: target.skill, salary: target.salary }
      };
    }
  },
  {
    name: 'certify_driver',
    description: 'Grant a CDL endorsement/certification to an employed driver (ADR Hazmat, Cold Chain, Heavy Haul, Double Trailer LCV, High-Value Fragile).',
    parameters: {
      type: 'object',
      properties: {
        driverId: { type: 'number', description: 'Employed driver ID' },
        driverName: { type: 'string', description: 'Optional employed driver name' },
        certification: { type: 'string', description: 'Certification ID or keyword (e.g. hazmat, cold, heavy, lcv, fragile)' }
      },
      required: ['certification']
    },
    execute: (S: any, { driverId, driverName, certification }: { driverId?: number; driverName?: string; certification: string }) => {
      const drivers = S.drivers || [];
      const target = driverId
        ? drivers.find((d: any) => d.id === driverId)
        : driverName
          ? drivers.find((d: any) => (d.name || '').toLowerCase().includes(driverName.toLowerCase().trim()))
          : undefined;
      if (!target) {
        return { success: false, message: 'Driver not found. Specify driverId or driverName.' };
      }

      const q = (certification || '').toLowerCase().trim();
      const cert = DRIVER_CERTIFICATIONS.find(
        c => c.id.toLowerCase() === q || c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      );
      if (!cert) {
        return {
          success: false,
          message: `Certification "${certification}" not recognized. Available: ${DRIVER_CERTIFICATIONS.map(c => c.id).join(', ')}.`
        };
      }

      const err = DriverCertifications.addCertification(S, target.id, cert.id);
      if (err) {
        return { success: false, message: `${target.name}: ${err}` };
      }

      return {
        success: true,
        message: `Certified ${target.name} with ${cert.id} for $${cert.cost.toLocaleString()}.`,
        data: { id: target.id, name: target.name, certifications: target.certifications }
      };
    }
  },
  {
    name: 'list_employed_drivers',
    description: 'List all currently employed drivers, their skill, fatigue, assigned truck, region, and certifications.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const drivers = S.drivers || [];
      if (drivers.length === 0) {
        return { success: true, message: 'You have no employed drivers.', data: [] };
      }
      const list = drivers.map((d: any) => ({
        id: d.id,
        name: d.name,
        skill: d.skill || 1,
        fatigue: Math.round(d.fatigue || 0),
        region: d.region,
        truckId: d.truckId || null,
        certs: d.certifications || []
      }));
      return {
        success: true,
        message: `${drivers.length} employed driver(s): ${list.map((d: any) => `#${d.id} ${d.name} (${d.skill}★, ${d.fatigue}% fatigue, ${d.truckId ? `Truck #${d.truckId}` : 'Unassigned'})`).join('; ')}`,
        data: list
      };
    }
  },
  {
    name: 'rest_driver',
    description: 'Send a fatigued employed driver (or all idle/fatigued drivers with all=true) to a motel for HOS rest & fatigue recovery ($150/driver).',
    parameters: {
      type: 'object',
      properties: {
        driverId: { type: 'number', description: 'Employed driver ID' },
        all: { type: 'boolean', description: 'If true, rest all non-dispatched drivers with fatigue > 20%' }
      }
    },
    execute: (S: any, { driverId, all }: { driverId?: number; all?: boolean }) => {
      const drivers = S.drivers || [];
      const activeIds = new Set((S.active || []).map((a: any) => a.driverId));
      const MOTEL_FEE = 150;
      const targets = all
        ? drivers.filter((d: any) => !activeIds.has(d.id) && (d.fatigue || 0) > 20)
        : drivers.filter((d: any) => d.id === driverId);
      if (targets.length === 0) {
        return { success: false, message: all ? 'No idle fatigued drivers need rest.' : 'Driver not found.' };
      }
      let rested = 0;
      let spent = 0;
      for (const drv of targets) {
        if (activeIds.has(drv.id)) continue;
        if ((S.money || 0) < MOTEL_FEE) break;
        S.money -= MOTEL_FEE;
        spent += MOTEL_FEE;
        drv.fatigue = 0;
        drv.hosHours = 0;
        drv.stress = Math.max(0, (drv.stress || 0) - 30);
        rested++;
      }
      if (rested === 0) {
        return { success: false, message: 'Could not rest driver(s) (active on job or insufficient funds).' };
      }
      return { success: true, message: `Rested ${rested} driver(s) for $${spent.toLocaleString()} (fatigue & HOS reset).` };
    }
  },
  {
    name: 'transfer_driver',
    description: 'Transfer an employed driver to another unlocked operating region ($5,000 transfer fee).',
    parameters: {
      type: 'object',
      properties: {
        driverId: { type: 'number', description: 'Employed driver ID' },
        region: { type: 'string', description: 'Target region (Africa, Europe, North America, Asia, South America, Oceania)' }
      },
      required: ['driverId', 'region']
    },
    execute: (S: any, { driverId, region }: { driverId: number; region: string }) => {
      const err = DriverManagement.transferRegion(S, driverId, region as any);
      if (err) return { success: false, message: err };
      return { success: true, message: `Transferred Driver #${driverId} to ${region}.` };
    }
  },
  {
    name: 'unassign_driver',
    description: 'Unassign an employed driver from their currently assigned truck.',
    parameters: {
      type: 'object',
      properties: { driverId: { type: 'number', description: 'Employed driver ID' } },
      required: ['driverId']
    },
    execute: (S: any, { driverId }: { driverId: number }) => {
      const drv = (S.drivers || []).find((d: any) => d.id === driverId);
      if (!drv) return { success: false, message: `Driver #${driverId} not found.` };
      if ((S.active || []).some((a: any) => a.driverId === driverId)) {
        return { success: false, message: `${drv.name} is currently on an active dispatch.` };
      }
      const truck = (S.fleet || []).find((t: any) => t.id === drv.truckId || t.driverId === driverId);
      if (truck) truck.driverId = null;
      drv.truckId = null;
      return { success: true, message: `Unassigned ${drv.name} from their truck.` };
    }
  },
  {
    name: 'fire_driver',
    description: 'Terminate and release an unassigned employed driver from payroll.',
    parameters: {
      type: 'object',
      properties: { driverId: { type: 'number', description: 'Employed driver ID' } },
      required: ['driverId']
    },
    execute: (S: any, { driverId }: { driverId: number }) => {
      const idx = (S.drivers || []).findIndex((d: any) => d.id === driverId);
      if (idx === -1) return { success: false, message: `Driver #${driverId} not found.` };
      const drv = S.drivers[idx];
      if ((S.active || []).some((a: any) => a.driverId === driverId)) {
        return { success: false, message: `Cannot fire ${drv.name} while on an active dispatch.` };
      }
      const truck = (S.fleet || []).find((t: any) => t.id === drv.truckId || t.driverId === driverId);
      if (truck) truck.driverId = null;
      S.drivers.splice(idx, 1);
      return { success: true, message: `Released ${drv.name} (#${driverId}) from company payroll.` };
    }
  }
];
