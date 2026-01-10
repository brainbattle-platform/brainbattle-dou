export interface Unit {
  unitId: string;
  title: string;
  order: number;
}

export const UNITS_SEED: Unit[] = Array.from({ length: 20 }, (_, i) => ({
  unitId: `unit-${i + 1}`,
  title: `Unit ${i + 1}`,
  order: i + 1,
}));

