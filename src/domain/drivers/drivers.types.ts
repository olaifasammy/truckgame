export type Region = 'America' | 'Europe' | 'Africa' | 'Asia';

export type DriverTraitId = 'eco_driver' | 'speed_demon' | 'careful' | 'iron_man' | 'heavy_hauler' | 'night_owl';

export interface DriverTrait {
  id: DriverTraitId;
  name: string;
  desc: string;
  effect: {
    fuelMod?: number;      // e.g. -0.05 (-5% fuel consumption)
    wearMod?: number;      // e.g. -0.10 (-10% component wear)
    speedMod?: number;     // e.g. +0.05 (+5% top speed)
    payoutMod?: number;    // e.g. +0.10 (+10% job payout bonus)
    fatigueMod?: number;   // e.g. -0.20 (-20% fatigue buildup)
  };
}

export interface Driver {
  id: number;
  name: string;
  region: Region;
  skill: number; // 1 to 5
  salary: number; // daily wage in USD
  morale: number; // 0 to 100
  fatigue: number; // 0 to 100
  trait: DriverTraitId;
  assignedTruckId: number | null;
  certifications?: string[];
  stats: {
    tripsCompleted: number;
    kmDriven: number;
    earned: number;
  };
}
