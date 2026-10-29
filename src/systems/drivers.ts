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
  pushNote(S, 'Hired driver ' + d.name);
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
