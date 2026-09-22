/**
 * Completeness weighting shared by get_center_profile and generate_first_reading, so the
 * percentage can never drift between the two (P1.5, docs/PROFILE_SLOTS.md "Completeness %").
 * A welcome-interview slot counts 3x; every other slot counts 1x.
 */

export const WELCOME_INTERVIEW_WEIGHT = 3;
export const OTHER_SLOT_WEIGHT = 1;

export interface CatalogSlot {
  slot_key: string;
  is_welcome_interview: boolean;
}

export interface Completeness {
  percent: number;
  answeredWeight: number;
  totalWeight: number;
}

/** `answered` is the set of slot_keys the center already has a row for. */
export const computeCompleteness = (catalog: readonly CatalogSlot[], answered: ReadonlySet<string>): Completeness => {
  let totalWeight = 0;
  let answeredWeight = 0;
  for (const slot of catalog) {
    const weight = slot.is_welcome_interview ? WELCOME_INTERVIEW_WEIGHT : OTHER_SLOT_WEIGHT;
    totalWeight += weight;
    if (answered.has(slot.slot_key)) answeredWeight += weight;
  }
  const percent = totalWeight > 0 ? Math.round((answeredWeight / totalWeight) * 100) : 0;
  return { percent, answeredWeight, totalWeight };
};
