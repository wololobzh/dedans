import { describe, expect, it } from 'vitest';
import {
  CampusNotFoundError,
  AlreadyInactiveError,
  BlockingDependenciesError,
  CreateCampus,
  DeactivateCampus,
  GetCampus,
  ListCampuses,
  UpdateCampus,
  ForbiddenError,
  InvalidCampusError,
  DependencyCheckUnavailableError,
  type AuditEventInput,
  type CampusRepository,
  type CampusTransaction,
  type CampusDeactivationDependencyChecker,
} from '@school-erp/application';
import type { Campus, CampusChanges, NewCampus } from '@school-erp/domain';

const actor = {
  userId: 'user-1',
  permissions: ['campus.read', 'campus.write'],
  campusIds: ['campus-1'],
};

const nationalActor = {
  userId: 'national-admin',
  permissions: ['campus.read', 'campus.write'],
  unrestrictedCampusManagement: true,
};

function campus(overrides: Partial<Campus> = {}): Campus {
  const timestamp = new Date('2026-08-28T12:00:00.000Z');
  return {
    id: 'campus-1',
    name: 'Paris Centre',
    code: 'paris-centre',
    city: 'Paris',
    type: 'physical',
    timezone: 'Europe/Paris',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    deactivatedAt: null,
    deactivatedBy: null,
    deactivationReason: null,
    ...overrides,
  };
}

class FakeCampuses implements CampusRepository {
  readonly filters: { operation: string; filter: unknown }[] = [];
  readonly created: NewCampus[] = [];
  current: Campus | null = campus();

  async list(filter: { status: 'active' | 'inactive' | 'all'; campusIds?: readonly string[] }): Promise<Campus[]> {
    this.filters.push({ operation: 'list', filter });
    return this.current ? [this.current] : [];
  }

  async findById(id: string, filter: { status: 'active' | 'inactive' | 'all'; campusIds?: readonly string[] }): Promise<Campus | null> {
    this.filters.push({ operation: 'findById', filter });
    return id === this.current?.id && (filter.status === 'all' || filter.status === this.current.status) ? this.current : null;
  }

  async create(input: NewCampus): Promise<Campus> {
    this.created.push(input);
    this.current = campus(input);
    return this.current;
  }

  async update(id: string, changes: CampusChanges): Promise<Campus | null> {
    if (id !== this.current?.id) return null;
    this.current = campus({ ...this.current, ...changes, updatedAt: new Date() });
    return this.current;
  }

  async deactivate(id: string, actorId: string, reason: string): Promise<Campus | null> {
    if (id !== this.current?.id || this.current.status !== 'active') return null;
    const timestamp = new Date('2026-08-28T13:00:00.000Z');
    this.current = campus({ ...this.current, status: 'inactive', deactivatedAt: timestamp, deactivatedBy: actorId, deactivationReason: reason, updatedAt: timestamp });
    return this.current;
  }
}

class FakeTransaction implements CampusTransaction {
  readonly events: AuditEventInput[] = [];

  constructor(readonly campuses: FakeCampuses, readonly dependencyChecker: CampusDeactivationDependencyChecker = new FakeDependencyChecker({ status: 'clear' })) {}

  async run<T>(operation: (repositories: { campuses: CampusRepository; auditEvents: { append(event: AuditEventInput): Promise<void> }; dependencyChecker: CampusDeactivationDependencyChecker }) => Promise<T>): Promise<T> {
    return operation({
      campuses: this.campuses,
      auditEvents: { append: async (event) => { this.events.push(event); } },
      dependencyChecker: this.dependencyChecker,
    });
  }
}

class FakeDependencyChecker implements CampusDeactivationDependencyChecker {
  constructor(private readonly result: { status: 'clear' } | { status: 'blocked'; dependencies: readonly string[] } | { status: 'unavailable'; reason?: string }) {}
  async check(): Promise<typeof this.result> { return this.result; }
}

describe('campus application use cases', () => {
  it('creates an active campus and records the after-state audit event', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses);

    const result = await new CreateCampus(transaction).execute(nationalActor, { name: '  Lyon  ', code: 'LYON', city: ' Lyon ', type: 'physical', timezone: 'Europe/Paris' });

    expect(result.status).toBe('active');
    expect(campuses.created).toEqual([{ name: 'Lyon', code: 'lyon', city: 'Lyon', type: 'physical', timezone: 'Europe/Paris' }]);
    expect(transaction.events).toHaveLength(1);
    expect(transaction.events[0]).toMatchObject({ actorId: 'national-admin', action: 'campus.created', before: null, after: result });
  });

  it('creates a virtual campus without a city and normalizes the missing city to null', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses);

    const result = await new CreateCampus(transaction).execute(nationalActor, { name: 'Virtual Campus', code: 'VIRTUAL', type: 'virtual', timezone: 'Europe/Paris' });

    expect(result).toMatchObject({ type: 'virtual', city: null });
    expect(campuses.created).toContainEqual({ name: 'Virtual Campus', code: 'virtual', city: null, type: 'virtual', timezone: 'Europe/Paris' });
  });

  it('rejects a physical campus without a city before persistence', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses);

    await expect(new CreateCampus(transaction).execute(nationalActor, { name: 'Missing City', code: 'MISSING-CITY', type: 'physical', timezone: 'Europe/Paris' })).rejects.toThrow('Physical campuses require a city');
    expect(campuses.created).toHaveLength(0);
    expect(transaction.events).toHaveLength(0);
  });

  it('keeps a scoped actor inside the authorized campus set', async () => {
    const campuses = new FakeCampuses();

    await new ListCampuses(campuses).execute(actor);
    await expect(new GetCampus(campuses).execute(actor, 'outside-scope')).rejects.toBeInstanceOf(CampusNotFoundError);

    expect(campuses.filters[0]).toEqual({ operation: 'list', filter: { campusIds: ['campus-1'], status: 'active' } });
    expect(campuses.filters[1]).toEqual({ operation: 'findById', filter: { campusIds: ['campus-1'], status: 'all' } });
  });

  it('gives an unrestricted national administrator global read scope', async () => {
    const campuses = new FakeCampuses();

    await new ListCampuses(campuses).execute(nationalActor);

    expect(campuses.filters[0]).toEqual({ operation: 'list', filter: { status: 'active' } });
  });

  it('does not grant access when a scoped actor has no campus scope', async () => {
    const campuses = new FakeCampuses();
    await new ListCampuses(campuses).execute({ ...actor, campusIds: [] });
    expect(campuses.filters[0]).toEqual({ operation: 'list', filter: { campusIds: [], status: 'active' } });
  });

  it('does not allow a scoped actor to escalate to unrestricted management', async () => {
    const transaction = new FakeTransaction(new FakeCampuses());
    expect(() => new CreateCampus(transaction).execute({ ...nationalActor, unrestrictedCampusManagement: false, campusIds: ['campus-1'] }, { name: 'Lyon', code: 'LYON', city: 'Lyon' })).toThrow(ForbiddenError);
  });

  it('rejects an invalid status at the application boundary', async () => {
    expect(() => new ListCampuses(new FakeCampuses()).execute(actor, 'deleted' as 'active')).toThrow(InvalidCampusError);
  });

  it('deactivates without deleting identity and retains reason in the audit event', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses);

    const result = await new DeactivateCampus(transaction).execute(actor, 'campus-1', '  Fermeture temporaire  ');

    expect(result).toMatchObject({ id: 'campus-1', status: 'inactive', deactivatedBy: 'user-1', deactivationReason: 'Fermeture temporaire' });
    expect(transaction.events[0]).toMatchObject({ action: 'campus.deactivated', reason: 'Fermeture temporaire', before: expect.objectContaining({ status: 'active' }), after: expect.objectContaining({ status: 'inactive' }) });
  });

  it('does not report a successful second lifecycle transition', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses);
    await new DeactivateCampus(transaction).execute(actor, 'campus-1', 'closed');
    await expect(new DeactivateCampus(transaction).execute(actor, 'campus-1', 'closed again')).rejects.toBeInstanceOf(AlreadyInactiveError);
    expect(transaction.events).toHaveLength(1);
  });

  it('allows only one concurrent deactivation transition', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses);
    const results = await Promise.allSettled([
      new DeactivateCampus(transaction).execute(actor, 'campus-1', 'closed'),
      new DeactivateCampus(transaction).execute(actor, 'campus-1', 'closed'),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(transaction.events).toHaveLength(1);
  });

  it('leaves campus and audit unchanged when dependencies block deactivation', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses, new FakeDependencyChecker({ status: 'blocked', dependencies: ['active_enrollments'] }));
    await expect(new DeactivateCampus(transaction).execute(actor, 'campus-1', 'closed')).rejects.toBeInstanceOf(BlockingDependenciesError);
    expect(campuses.current?.status).toBe('active');
    expect(transaction.events).toHaveLength(0);
  });

  it('fails closed when dependency checks are unavailable', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses, new FakeDependencyChecker({ status: 'unavailable' }));
    await expect(new DeactivateCampus(transaction).execute(actor, 'campus-1', 'closed')).rejects.toBeInstanceOf(DependencyCheckUnavailableError);
    expect(campuses.current?.status).toBe('active');
    expect(transaction.events).toHaveLength(0);
  });

  it('updates descriptive fields without changing identity and audits before/after values', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses);

    const result = await new UpdateCampus(transaction).execute(actor, 'campus-1', { name: 'Paris Est', city: 'Noisy-le-Grand' });

    expect(result).toMatchObject({ id: 'campus-1', code: 'paris-centre', name: 'Paris Est', city: 'Noisy-le-Grand' });
    expect(transaction.events[0]).toMatchObject({ action: 'campus.updated', before: expect.objectContaining({ name: 'Paris Centre' }), after: expect.objectContaining({ name: 'Paris Est', city: 'Noisy-le-Grand' }) });
  });

  it('rejects type and timezone changes before persistence or audit', async () => {
    const campuses = new FakeCampuses();
    const transaction = new FakeTransaction(campuses);

    await expect(new UpdateCampus(transaction).execute(actor, 'campus-1', { type: 'virtual' })).rejects.toThrow('Campus type and timezone cannot be changed in the MVP update operation');
    await expect(new UpdateCampus(transaction).execute(actor, 'campus-1', { timezone: 'UTC' })).rejects.toBeInstanceOf(InvalidCampusError);

    expect(campuses.current).toEqual(campus());
    expect(transaction.events).toHaveLength(0);
  });
});