export type CampusStatus = 'active' | 'inactive';
export type CampusType = 'physical' | 'virtual';

export type Campus = {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly city: string | null;
  readonly type: CampusType;
  readonly timezone: string;
  readonly status: CampusStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deactivatedAt: Date | null;
  readonly deactivatedBy: string | null;
  readonly deactivationReason: string | null;
};

export type NewCampus = { name: string; code: string; city: string | null; type: CampusType; timezone: string };
export type NewCampusInput = Omit<NewCampus, 'city'> & { city?: string | null };
export type CampusChanges = Partial<NewCampus>;

export function normalizeCampusInput(input: NewCampusInput): NewCampus {
  return { name: input.name.trim(), code: input.code.trim().toLowerCase(), city: input.city === undefined || input.city === null ? null : input.city.trim(), type: input.type, timezone: input.timezone.trim() };
}

export function validateCampusInput(input: NewCampus): void {
  if (!input.name.trim() || !input.code.trim() || !input.type || !input.timezone.trim()) {
    throw new Error('Campus name, code, type and timezone are required');
  }
  if (input.type === 'physical' && !input.city?.trim()) {
    throw new Error('Physical campuses require a city');
  }
  if (!isValidIanaTimezone(input.timezone)) {
    throw new Error('Timezone must be a valid IANA timezone');
  }
}

export function isValidIanaTimezone(timezone: string): boolean {
  if (!timezone.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function deactivateCampus(campus: Campus, actorId: string, reason: string, at: Date): Campus {
  if (campus.status === 'inactive') throw new Error('Campus is already inactive');
  const normalizedReason = reason.trim();
  if (!normalizedReason) throw new Error('Deactivation reason is required');
  return { ...campus, status: 'inactive', deactivatedAt: at, deactivatedBy: actorId, deactivationReason: normalizedReason, updatedAt: at };
}