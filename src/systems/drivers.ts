import { set } from '../core/store';
import { toast } from '../core/ui';
import { fillDriverPool, generateDriver } from '../domain/drivers/drivers.engine';
import { Region } from '../domain/drivers/drivers.types';
import { pushNote } from './notify';

export const hireFee = (d: any) => d.skill * 1500;
export const transferFee = 5000;

export function fillPool(S: any) {
  fillDriverPool(S, 8);
}

export const hire = (id: number) => set(S => {
  const d = S.pool.find((x: any) => x.id === id);
  if (!d) return;
  const fee = hireFee(d);
  if (S.money < fee) {
    toast(`Not enough cash. Need $${fee.toLocaleString()}`, 'err');
    return;
  }
  S.money -= fee;
  S.pool = S.pool.filter((x: any) => x.id !== id);
  S.drivers.push(d);
  fillDriverPool(S, 8);
  pushNote(S, `Contracted new driver ${d.name} for regional fleet operations.`, { title: 'RECRUITMENT', type: 'ops' });
  toast('Successfully hired ' + d.name, 'success');
});

export const fire = (id: number) => set(S => {
  const t = S.fleet.find((x: any) => x.driverId === id);
  if (t && t.status === 'busy') {
    toast('Cannot fire driver while on an active job', 'err');
    return;
  }
  if (t) t.driverId = null;
  const d = S.drivers.find((x: any) => x.id === id);
  S.drivers = S.drivers.filter((x: any) => x.id !== id);
  if (d) toast(`Fired ${d.name}`, 'success');
});

export const transferDriver = (driverId: number, newRegion: Region) => set(S => {
  const d = S.drivers.find((x: any) => x.id === driverId);
  if (!d) return;
  if (d.region === newRegion) {
    toast(`Driver is already based in ${newRegion}`, 'err');
    return;
  }
  if (S.money < transferFee) {
    toast(`Insufficient funds for regional transfer. Need $${transferFee.toLocaleString()}`, 'err');
    return;
  }
  const t = S.fleet.find((x: any) => x.driverId === d.id);
  if (t && t.status === 'busy') {
    toast('Cannot transfer driver while on an active job', 'err');
    return;
  }

  S.money -= transferFee;
  d.region = newRegion;
  toast(`Successfully transferred ${d.name} to ${newRegion} operations`, 'success');
});

export const DRIVER_CERTIFICATIONS = [
  { id: 'ADR Hazmat', name: 'ADR Hazmat & Chemical Endorsement', icon: '☣️', cost: 6500, desc: 'Authorizes transport of flammable, chemical, and hazardous industrial cargo.' },
  { id: 'Cold Chain', name: 'Cold Chain & Perishables Certification', icon: '❄️', cost: 3500, desc: 'Certified in reefer temperature maintenance, pharmaceuticals, and fresh produce.' },
  { id: 'Heavy Haul', name: 'Heavy Machinery & Lowboy Endorsement', icon: '🏗️', cost: 5000, desc: 'Specialized in multi-axle oversized machinery, ballast, and indvisibles > 25t.' },
  { id: 'Double Trailer LCV', name: 'Long Combination Vehicle (LCV) Double Endorsement', icon: '🚛', cost: 4500, desc: 'Mastery in multi-articulated B-train and A-double combination highway tractors.' },
  { id: 'High-Value Fragile', name: 'Secured High-Value & Fragile Handling', icon: '💎', cost: 3000, desc: 'Trained in delicate air-ride freight, high-precision electronics, and luxury goods.' }
];

export const skillUpgradeCost = (currentSkill: number) => Math.min(15000, currentSkill * 3000);

export function trainDriverSkill(driverId: number) {
  set(S => {
    const d = S.drivers.find((x: any) => x.id === driverId);
    if (!d) return;
    if (d.skill >= 5) {
      toast('Driver is already at maximum Master CDL skill (5 Stars)', 'info');
      return;
    }
    const cost = skillUpgradeCost(d.skill);
    if (S.money < cost) {
      toast(`Insufficient funds for Driver Academy. Need $${cost.toLocaleString()}`, 'err');
      return;
    }

    S.money -= cost;
    d.skill++;
    d.salary = Math.round(d.salary * 1.15); // Promotion wage raise
    d.morale = 100; // Boosted morale
    pushNote(S, `${d.name} graduated and reached Skill Level ${d.skill}★!`, { title: 'DRIVER ACADEMY', type: 'ops', priority: 1 });
    toast(`Promoted ${d.name} to Skill Level ${d.skill}★!`, 'success');
  });
}

export function certifyDriver(driverId: number, certId: string) {
  set(S => {
    const d = S.drivers.find((x: any) => x.id === driverId);
    if (!d) return;
    if (!d.certifications) d.certifications = [];
    if (d.certifications.includes(certId)) {
      toast(`${d.name} already holds ${certId} Certification`, 'info');
      return;
    }

    const cert = DRIVER_CERTIFICATIONS.find(c => c.id === certId);
    if (!cert) return;

    if (S.money < cert.cost) {
      toast(`Insufficient funds for certification course. Need $${cert.cost.toLocaleString()}`, 'err');
      return;
    }

    S.money -= cert.cost;
    pushNote(S, `Professional Certification: ${cert.name} for ${d.name} (-$${cert.cost.toLocaleString()})`, {
      title: 'Financial Transaction',
      type: 'finance',
      body: `Endorsement Training: ${cert.name}\nCandidate: ${d.name}\nFee: $${cert.cost.toLocaleString()}\nTimestamp: ${new Date().toLocaleString()}`
    });
    d.certifications.push(certId);
    d.morale = 100;
    pushNote(S, `${d.name} achieved official ${cert.name} certification!`, { title: 'CERTIFICATION AWARDED', type: 'ops' });
    toast(`${d.name} certified: ${cert.id}!`, 'success');
  });
}
