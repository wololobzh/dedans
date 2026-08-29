import type { ActorContext } from '../auth/actor-context';
import { normalizeCampusInput, type Campus, type CampusChanges, type NewCampus, type NewCampusInput, validateCampusInput } from '@school-erp/domain';

export type CampusFilter = { readonly campusIds?: readonly string[]; readonly status: 'active' | 'inactive' | 'all' };
export type CampusDeactivationDependencyCheck =
  | { readonly status: 'clear' }
  | { readonly status: 'blocked'; readonly dependencies: readonly string[] }
  | { readonly status: 'unavailable'; readonly reason?: string };
export interface CampusDeactivationDependencyChecker { check(campusId: string): Promise<CampusDeactivationDependencyCheck>; }
export type AuditEventInput = { actorId: string; action: 'campus.created' | 'campus.updated' | 'campus.deactivated'; entityId: string; authorizedCampusIds: readonly string[] | null; before: Campus | null; after: Campus; reason?: string; correlationId?: string };

export interface CampusRepository {
  list(filter: CampusFilter): Promise<Campus[]>;
  findById(id: string, filter: CampusFilter): Promise<Campus | null>;
  create(input: NewCampus): Promise<Campus>;
  update(id: string, changes: CampusChanges, filter: CampusFilter): Promise<Campus | null>;
  deactivate(id: string, actorId: string, reason: string, filter: CampusFilter): Promise<Campus | null>;
}
export interface AuditEventRepository { append(event: AuditEventInput): Promise<void>; }
export interface CampusTransactionContext { campuses: CampusRepository; auditEvents: AuditEventRepository; dependencyChecker: CampusDeactivationDependencyChecker; }
export interface CampusTransaction { run<T>(operation: (context: CampusTransactionContext) => Promise<T>): Promise<T>; }

export class UnauthorizedError extends Error { readonly code = 'UNAUTHORIZED'; }
export class ForbiddenError extends Error { readonly code = 'FORBIDDEN'; }
export class CampusNotFoundError extends Error { readonly code = 'NOT_FOUND'; }
export class DuplicateCampusError extends Error { readonly code = 'DUPLICATE'; }
export class InvalidCampusError extends Error { readonly code = 'INVALID'; }
export class AlreadyInactiveError extends Error { readonly code = 'ALREADY_INACTIVE'; }
export class BlockingDependenciesError extends Error { readonly code = 'BLOCKING_DEPENDENCIES'; }
export class DependencyCheckUnavailableError extends Error { readonly code = 'DEPENDENCY_CHECK_UNAVAILABLE'; }

function requirePermission(actor: ActorContext, permission: string): void {
  if (!actor.userId) throw new UnauthorizedError('Authentication required');
  if (!actor.permissions.includes(permission)) throw new ForbiddenError('Permission denied');
}
function accessFor(actor: ActorContext): CampusFilter {
  if (actor.unrestrictedCampusManagement === true) return { status: 'all' };
  return { campusIds: actor.campusIds?.length ? actor.campusIds : [], status: 'all' };
}
function auditScope(filter: CampusFilter): readonly string[] | null { return filter.campusIds === undefined ? null : filter.campusIds; }
function validateStatus(status: CampusFilter['status']): void { if (status !== 'active' && status !== 'inactive' && status !== 'all') throw new InvalidCampusError('Invalid campus status'); }

export class ListCampuses {
  constructor(private readonly campuses: CampusRepository) {}
  execute(actor: ActorContext, status: CampusFilter['status'] = 'active'): Promise<Campus[]> { requirePermission(actor, 'campus.read'); validateStatus(status); return this.campuses.list({ ...accessFor(actor), status }); }
}
export class GetCampus {
  constructor(private readonly campuses: CampusRepository) {}
  async execute(actor: ActorContext, id: string): Promise<Campus> { requirePermission(actor, 'campus.read'); const campus = await this.campuses.findById(id, accessFor(actor)); if (!campus) throw new CampusNotFoundError('Campus not found'); return campus; }
}
export class CreateCampus {
  constructor(private readonly transaction: CampusTransaction) {}
  execute(actor: ActorContext, input: NewCampusInput): Promise<Campus> {
    requirePermission(actor, 'campus.write');
    if (actor.unrestrictedCampusManagement !== true) throw new ForbiddenError('Unrestricted management required');
    let normalized: NewCampus;
    try { normalized = normalizeCampusInput(input); validateCampusInput(normalized); } catch (error) { return Promise.reject(new InvalidCampusError(error instanceof Error ? error.message : 'Invalid campus')); }
    return this.transaction.run(async ({ campuses, auditEvents }) => { const campus = await campuses.create(normalized); await auditEvents.append({ actorId: actor.userId, action: 'campus.created', entityId: campus.id, authorizedCampusIds: null, before: null, after: campus, correlationId: actor.correlationId }); return campus; });
  }
}
export class UpdateCampus {
  constructor(private readonly transaction: CampusTransaction) {}
  async execute(actor: ActorContext, id: string, input: CampusChanges): Promise<Campus> {
    requirePermission(actor, 'campus.write');
    if (input.type !== undefined || input.timezone !== undefined) {
      throw new InvalidCampusError('Campus type and timezone cannot be changed in the MVP update operation');
    }
    const filter = accessFor(actor);
    return this.transaction.run(async ({ campuses, auditEvents }) => {
      const before = await campuses.findById(id, filter); if (!before) throw new CampusNotFoundError('Campus not found');
      const candidate = normalizeCampusInput({ name: input.name ?? before.name, code: input.code ?? before.code, city: input.city === undefined ? before.city : input.city, type: input.type ?? before.type, timezone: input.timezone ?? before.timezone });
      try { validateCampusInput(candidate); } catch (error) { throw new InvalidCampusError(error instanceof Error ? error.message : 'Invalid campus'); }
      const changes: CampusChanges = {}; if (input.name !== undefined) changes.name = candidate.name; if (input.code !== undefined) changes.code = candidate.code; if (input.city !== undefined) changes.city = candidate.city; if (input.type !== undefined) changes.type = candidate.type; if (input.timezone !== undefined) changes.timezone = candidate.timezone;
      const after = await campuses.update(id, changes, filter); if (!after) throw new CampusNotFoundError('Campus not found'); await auditEvents.append({ actorId: actor.userId, action: 'campus.updated', entityId: id, authorizedCampusIds: auditScope(filter), before, after, correlationId: actor.correlationId }); return after;
    });
  }
}
export class DeactivateCampus {
  constructor(private readonly transaction: CampusTransaction) {}
  async execute(actor: ActorContext, id: string, reason: string): Promise<Campus> {
    requirePermission(actor, 'campus.write'); const filter = accessFor(actor); if (!reason.trim()) throw new InvalidCampusError('Deactivation reason is required');
    const activeFilter: CampusFilter = { ...filter, status: 'active' };
    return this.transaction.run(async ({ campuses, auditEvents, dependencyChecker }) => { const before = await campuses.findById(id, filter); if (!before) throw new CampusNotFoundError('Campus not found'); if (before.status === 'inactive') throw new AlreadyInactiveError('Campus is already inactive'); const dependencyCheck = await dependencyChecker.check(id); if (dependencyCheck.status === 'blocked') throw new BlockingDependenciesError(`Campus has blocking dependencies: ${dependencyCheck.dependencies.join(', ')}`); if (dependencyCheck.status === 'unavailable') throw new DependencyCheckUnavailableError('Campus dependency checks are unavailable'); const after = await campuses.deactivate(id, actor.userId, reason.trim(), activeFilter); if (!after) throw new CampusNotFoundError('Campus not found'); await auditEvents.append({ actorId: actor.userId, action: 'campus.deactivated', entityId: id, authorizedCampusIds: auditScope(activeFilter), before, after, reason: reason.trim(), correlationId: actor.correlationId }); return after; });
  }
}