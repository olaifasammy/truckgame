import { Region, DriverTraitId, DriverTrait } from './drivers.types';

export const REGIONAL_NAMES: Record<Region, { first: string[]; last: string[] }> = {
  America: {
    first: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'],
    last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark']
  },
  Europe: {
    first: ['Hans', 'Lars', 'Matteo', 'Marco', 'Pierre', 'Jean', 'Heinrich', 'Klaus', 'Stefan', 'Dmitri', 'Elena', 'Katia', 'Astrid', 'Greta', 'Sven', 'Henrik', 'Mateusz', 'Pawel', 'Ivan', 'Olga'],
    last: ['Schmidt', 'Weber', 'Muller', 'Hansen', 'Rossi', 'Ferrari', 'Dubois', 'Martin', 'Novak', 'Kovač', 'Popov', 'Ivanov', 'Van Dijk', 'De Jong', 'Kowalski', 'Wozniak', 'Jansen', 'Berg', 'Holm', 'Larsen']
  },
  Africa: {
    first: ['Chidi', 'Amina', 'Tunde', 'Ngozi', 'Ibrahim', 'Funke', 'Emeka', 'Hauwa', 'Segun', 'Zainab', 'Kofi', 'Kwame', 'Abdi', 'Fatima', 'Yusuf', 'Aisha', 'Mandla', 'Zola', 'Thabo', 'Lerato'],
    last: ['Okafor', 'Bello', 'Adeyemi', 'Eze', 'Musa', 'Balogun', 'Nwosu', 'Yusuf', 'Ojo', 'Abubakar', 'Mensah', 'Osei', 'Diallo', 'Traore', 'Keita', 'Cisse', 'Molefe', 'Khumalo', 'Dlamini', 'Nkosi']
  },
  Asia: {
    first: ['Hiroshi', 'Kenji', 'Takuya', 'Satoshi', 'Wei', 'Jian', 'Ming', 'Li', 'Jun', 'Chen', 'Min-Ho', 'Ji-Hoon', 'Min-Soo', 'Rajesh', 'Amit', 'Vikram', 'Anil', 'Sanjay', 'Budi', 'Eko'],
    last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Patel']
  }
};

export const TRAIT_REGISTRY: Record<DriverTraitId, DriverTrait> = {
  eco_driver: {
    id: 'eco_driver',
    name: 'Eco-Driver',
    desc: 'Expert in fuel-efficient driving. Reduces fuel consumption by 5%.',
    effect: { fuelMod: -0.05 }
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    desc: 'Pushes trucks to their limits. Increases top speed by 5% but increases wear.',
    effect: { speedMod: 0.05, wearMod: 0.15 }
  },
  careful: {
    id: 'careful',
    name: 'Careful Operator',
    desc: 'Smooth gear shifts and gentle braking. Reduces component wear by 10%.',
    effect: { wearMod: -0.10 }
  },
  iron_man: {
    id: 'iron_man',
    name: 'Iron Man',
    desc: 'Remarkable stamina. Reduces fatigue buildup by 25%.',
    effect: { fatigueMod: -0.25 }
  },
  heavy_hauler: {
    id: 'heavy_hauler',
    name: 'Heavy Hauler',
    desc: 'Specialized in massive loads. Grants +10% bonus payout on heavy cargo.',
    effect: { payoutMod: 0.10 }
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    desc: 'Thrives in night operations. Maintains peak focus and morale during long hauls.',
    effect: { morale: 1.05 }
  }
};

export const TRAIT_KEYS = Object.keys(TRAIT_REGISTRY) as DriverTraitId[];
