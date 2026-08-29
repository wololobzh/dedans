export type ProgramVersion = {
  id: string;
  programId: string;
  version: string;
  startValidity: Date;
  endValidity?: Date;
  durationHours?: number;
  durationMonths?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function isProgramVersionValid(version: ProgramVersion, at: Date): boolean {
  if (!version.active) return false;
  if (version.startValidity > at) return false;
  if (version.endValidity && version.endValidity < at) return false;
  return true;
}

export function isProgramVersionActive(version: ProgramVersion): boolean {
  return version.active;
}
