export type ProgramCategory = 'foundation' | 'specialization' | 'other';

export type Program = {
  id: string;
  name: string;
  code: string;
  category: ProgramCategory;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function isProgramActive(program: Program): boolean {
  return program.active;
}

export function isProgramCategory(
  category: string,
  expected: ProgramCategory,
): boolean {
  return category === expected;
}
