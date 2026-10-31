export interface HosStatus {
  drivingHours: number; // Max 11.0 hours per shift
  maxHours: number; // 11.0 hours
  isResting: boolean;
  restUntil: number; // Timestamp
  violations: number;
}

export const HOS_MAX_DRIVING_HOURS = 11.0;
export const HOS_REST_DURATION_MS = 60 * 1000; // Fast simulation scale: 1 minute = 10 hour rest break
export const MOTEL_REST_FEE = 65; // $65 motel stay

/**
 * Checks driver's compliance with EU/US Hours of Service (HOS) rules.
 */
export function checkHosCompliance(driver: any, tripDrivingHours: number): { allowed: boolean; violationRisk: boolean; reason?: string } {
  const current = driver.hosHours || 0;
  if (driver.hosRestUntil && driver.hosRestUntil > Date.now()) {
    const remainingSec = Math.ceil((driver.hosRestUntil - Date.now()) / 1000);
    return { allowed: false, violationRisk: true, reason: `Driver is currently taking mandatory 10h HOS rest (${remainingSec}s remaining)` };
  }

  if (current + tripDrivingHours > HOS_MAX_DRIVING_HOURS) {
    return { allowed: false, violationRisk: true, reason: `Trip requires ~${tripDrivingHours.toFixed(1)}h driving, which exceeds the 11.0h daily HOS legal limit (Current: ${current.toFixed(1)}h)` };
  }

  return { allowed: true, violationRisk: false };
}

/**
 * Sends driver on a mandatory rest break at a motel or depot.
 */
export function sendDriverOnRest(driver: any, S: any, isMotel = true): { success: boolean; message: string } {
  if (isMotel) {
    if (S.money < MOTEL_REST_FEE) {
      return { success: false, message: `Insufficient funds for motel stay ($${MOTEL_REST_FEE})` };
    }
    S.money -= MOTEL_REST_FEE;
  }

  driver.hosHours = 0;
  driver.hosRestUntil = Date.now() + HOS_REST_DURATION_MS;
  driver.fatigue = 0;
  driver.morale = Math.min(100, (driver.morale || 90) + 15);
  driver.stress = Math.max(0, (driver.stress || 20) - 35);

  return { success: true, message: `${driver.name} is now resting at a roadside motel. Fatigue cleared & HOS reset.` };
}

/**
 * Award driver a performance bonus to boost morale and retention.
 */
export function awardDriverBonus(driver: any, S: any, amount = 500): { success: boolean; message: string } {
  if (S.money < amount) {
    return { success: false, message: `Insufficient funds for $${amount} performance bonus` };
  }
  S.money -= amount;
  driver.morale = Math.min(100, (driver.morale || 80) + 25);
  driver.stress = Math.max(0, (driver.stress || 20) - 25);
  driver.satisfaction = Math.min(100, (driver.satisfaction || 85) + 20);

  return { success: true, message: `Awarded $${amount} bonus to ${driver.name}! Morale boosted to ${driver.morale}%.` };
}

/**
 * Assign a Master CDL Driver (Skill 5) to mentor a Rookie (Skill 1-2).
 */
export function assignMentorship(mentor: any, rookie: any): { success: boolean; message: string } {
  if (mentor.skill < 5) {
    return { success: false, message: `${mentor.name} must be a Master CDL Driver (Skill 5★) to mentor` };
  }
  if (rookie.skill > 2) {
    return { success: false, message: `${rookie.name} has already advanced past rookie stage` };
  }

  mentor.menteeId = rookie.id;
  rookie.mentorId = mentor.id;
  rookie.morale = Math.min(100, (rookie.morale || 80) + 20);

  return { success: true, message: `Master Driver ${mentor.name} is now actively mentoring ${rookie.name} in commercial operations.` };
}
