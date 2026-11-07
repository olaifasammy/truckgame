import { DriverManagement } from '../../domain/drivers/management';

export const hireFee = (d: any) => (d && d.skill ? DriverManagement.calculateHireFee(d) : 1500);
export const transferFee = DriverManagement.REGIONAL_TRANSFER_FEE;
export const skillUpgradeCost = (skill: number) => DriverManagement.calculateSkillUpgradeCost(skill || 1);

if (typeof window !== 'undefined') {
  (window as any).hireFee = hireFee;
  (window as any).transferFee = transferFee;
  (window as any).skillUpgradeCost = skillUpgradeCost;
}
