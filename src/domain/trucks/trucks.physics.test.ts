import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePerformance } from './trucks.physics';
import { Truck } from './trucks.types';

test('Physics - Payload and Gross Combination Mass increases fuel burn rate', () => {
  const truck: Truck = {
    id: 'trk_test_1',
    modelId: 'scania_s730',
    assignedDriverId: null,
    status: 'idle',
    condition: 100,
    fuelPct: 100,
    location: 'Lagos',
    trailer: 'curtain',
    mileageKm: 12000,
    purchaseDate: Date.now(),
    resaleValue: 120000,
    components: {
      engine: { health: 100 },
      transmission: { health: 100 },
      brakes: { health: 100 },
      tires: { health: 100 },
      airFilter: { health: 100 },
      fuelFilter: { health: 100 }
    }
  };

  const emptyPerf = calculatePerformance(truck, 0); // Unloaded (0 tonnes payload)
  const heavyPerf = calculatePerformance(truck, 32); // Heavy load (32 tonnes payload)

  assert.ok(heavyPerf.fuelConsumption > emptyPerf.fuelConsumption, 'Heavy payload must increase L/100km fuel consumption rate');
  assert.ok(heavyPerf.fuelConsumption >= 30.0, 'Heavy 40t GCM curtainside truck consumes at least 30 L/100km on highway');
});

test('Physics - Aerodynamic Drag Area (CdA) affects fuel burn rate', () => {
  const bobtailTruck: Truck = {
    id: 'trk_test_bobtail',
    modelId: 'volvo_fh16',
    assignedDriverId: null,
    status: 'idle',
    condition: 100,
    fuelPct: 100,
    location: 'Munich',
    trailer: null, // Bobtail (no trailer, low CdA ~4.2m2)
    mileageKm: 5000,
    purchaseDate: Date.now(),
    resaleValue: 130000
  };

  const doubleTrailerTruck: Truck = {
    ...bobtailTruck,
    id: 'trk_test_double',
    trailer: 'double_trailer' // B-Double LCV (high CdA ~8.5m2)
  };

  const bobtailPerf = calculatePerformance(bobtailTruck, 0);
  const doublePerf = calculatePerformance(doubleTrailerTruck, 0);

  assert.ok(doublePerf.fuelConsumption > bobtailPerf.fuelConsumption, 'Double trailer high aero drag increases fuel burn vs bobtail');
});

test('Physics - Component Degradation (filters & engine wear) increases BSFC fuel burn', () => {
  const cleanTruck: Truck = {
    id: 'trk_clean',
    modelId: 'mercedes_actros',
    assignedDriverId: null,
    status: 'idle',
    condition: 100,
    fuelPct: 100,
    location: 'Rotterdam',
    trailer: 'box',
    mileageKm: 10000,
    purchaseDate: Date.now(),
    resaleValue: 110000,
    components: {
      engine: { health: 100 },
      transmission: { health: 100 },
      brakes: { health: 100 },
      tires: { health: 100 },
      airFilter: { health: 100 },
      fuelFilter: { health: 100 }
    }
  };

  const wornTruck: Truck = {
    ...cleanTruck,
    id: 'trk_worn',
    components: {
      engine: { health: 40 },      // Worn piston rings
      transmission: { health: 70 },
      brakes: { health: 80 },
      tires: { health: 60 },
      airFilter: { health: 20 },   // Dirty clogged air filter
      fuelFilter: { health: 20 }   // Dirty clogged fuel filter
    }
  };

  const cleanPerf = calculatePerformance(cleanTruck, 20);
  const wornPerf = calculatePerformance(wornTruck, 20);

  assert.ok(wornPerf.fuelConsumption > cleanPerf.fuelConsumption * 1.25, 'Worn engine & dirty air/fuel filters increase BSFC fuel burn by over +25%');
});

test('Physics - Road Incline Grade increases fuel burn', () => {
  const truck: Truck = {
    id: 'trk_incline',
    modelId: 'man_tgx',
    assignedDriverId: null,
    status: 'idle',
    condition: 100,
    fuelPct: 100,
    location: 'Munich',
    trailer: 'tipper',
    mileageKm: 15000,
    purchaseDate: Date.now(),
    resaleValue: 95000
  };

  const flatEnv = { roadGrade: 0, weather: 'clear', temp: 20, elevation: 100 };
  const steepEnv = { roadGrade: 4.5, weather: 'clear', temp: 20, elevation: 800 };

  const flatPerf = calculatePerformance(truck, 25, undefined, flatEnv);
  const steepPerf = calculatePerformance(truck, 25, undefined, steepEnv);

  assert.ok(steepPerf.fuelConsumption > flatPerf.fuelConsumption * 1.5, 'Steep 4.5% incline grade increases fuel burn by over +50%');
});