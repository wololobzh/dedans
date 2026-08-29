import { Prisma, PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { DuplicateCampusError, type AuditEventInput, type AuditEventRepository, type CampusDeactivationDependencyCheck, type CampusDeactivationDependencyChecker, type CampusFilter, type CampusRepository, type CampusTransaction, type CampusTransactionContext } from '@school-erp/application';
import type { Campus, CampusChanges, NewCampus } from '@school-erp/domain';

type Database = PrismaClient | Prisma.TransactionClient;
type CampusRow = { id: string; name: string; code: string; city: string | null; type: 'physical' | 'virtual'; timezone: string; status: 'active' | 'inactive'; createdAt: Date; updatedAt: Date; deactivatedAt: Date | null; deactivatedBy: string | null; deactivationReason: string | null };
function mapCampus(row: CampusRow): Campus { return { id: row.id, name: row.name, code: row.code, city: row.city, type: row.type, timezone: row.timezone, status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt, deactivatedAt: row.deactivatedAt, deactivatedBy: row.deactivatedBy, deactivationReason: row.deactivationReason }; }
function whereFor(filter: CampusFilter): Record<string, unknown> { const where: Record<string, unknown> = {}; if (filter.campusIds !== undefined) where.id = { in: filter.campusIds }; if (filter.status !== 'all') where.status = filter.status; return where; }
function excludesCampus(filter: CampusFilter, id: string): boolean { return filter.campusIds !== undefined && !filter.campusIds.includes(id); }

export class PrismaCampusRepository implements CampusRepository {
	constructor(private readonly db: Database) {}
	async list(filter: CampusFilter): Promise<Campus[]> { const rows = await this.db.campus.findMany({ where: whereFor(filter), orderBy: [{ name: 'asc' }, { id: 'asc' }] }); return rows.map((row) => mapCampus(row)); }
	async findById(id: string, filter: CampusFilter): Promise<Campus | null> { if (excludesCampus(filter, id)) return null; const row = await this.db.campus.findFirst({ where: { ...whereFor(filter), id } }); return row ? mapCampus(row) : null; }
	async create(input: NewCampus): Promise<Campus> { try { return mapCampus(await this.db.campus.create({ data: input })); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new DuplicateCampusError('Campus already exists'); throw error; } }
	 async update(id: string, changes: CampusChanges, filter: CampusFilter): Promise<Campus | null> { if (excludesCampus(filter, id)) return null; try { const result = await this.db.campus.updateMany({ where: { ...whereFor(filter), id }, data: changes }); if (result.count === 0) return null; return this.findById(id, filter); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new DuplicateCampusError('Campus already exists'); throw error; } }
	 async deactivate(id: string, actorId: string, reason: string, filter: CampusFilter): Promise<Campus | null> { if (excludesCampus(filter, id)) return null; const result = await this.db.campus.updateMany({ where: { ...whereFor(filter), id, status: 'active' }, data: { status: 'inactive', deactivatedAt: new Date(), deactivatedBy: actorId, deactivationReason: reason } }); if (result.count === 0) return null; return this.findById(id, { ...filter, status: 'inactive' }); }
}

export class PrismaAuditEventRepository implements AuditEventRepository {
	constructor(private readonly db: Database) {}
	async append(event: AuditEventInput): Promise<void> {
		const snapshot = (value: Campus | null): Prisma.InputJsonValue | typeof Prisma.JsonNull => value === null ? Prisma.JsonNull : JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
		await this.db.auditEvent.create({ data: { actorId: event.actorId, action: event.action, entityType: 'Campus', entityId: event.entityId, authorizedCampusIds: event.authorizedCampusIds === null ? Prisma.DbNull : [...event.authorizedCampusIds], before: snapshot(event.before), after: snapshot(event.after), reason: event.reason, correlationId: event.correlationId } });
	}
}

export class PrismaCampusDeactivationDependencyChecker implements CampusDeactivationDependencyChecker {
	constructor(private readonly tx: Prisma.TransactionClient) {}

	async check(campusId: string): Promise<CampusDeactivationDependencyCheck> {
		try {
			const lockedCampus = await this.tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "Campus" WHERE "id" = ${campusId} FOR UPDATE`);
					   if (lockedCampus.length === 0) return { status: 'unavailable', reason: 'Campus lock could not be acquired' };
			const now = new Date();
			const dependencies = await this.tx.$queryRaw<Array<{ active_cohorts: boolean; active_enrollments: boolean }>>(Prisma.sql`
				SELECT
					EXISTS (
						SELECT 1 FROM "Cohort"
						WHERE "campusId" = ${campusId}
						  AND "startsAt" <= ${now}
						  AND ("endsAt" IS NULL OR "endsAt" > ${now})
					) AS active_cohorts,
					EXISTS (
						SELECT 1 FROM "Enrollment" AS enrollment
						JOIN "Cohort" AS cohort ON cohort."id" = enrollment."cohortId"
						WHERE cohort."campusId" = ${campusId}
						  AND cohort."startsAt" <= ${now}
						  AND (cohort."endsAt" IS NULL OR cohort."endsAt" > ${now})
						  AND enrollment."status" = 'active'
						  AND enrollment."startsAt" <= ${now}
						  AND (enrollment."endsAt" IS NULL OR enrollment."endsAt" > ${now})
					) AS active_enrollments
			`);
			const result = dependencies[0];
			if (!result) return { status: 'unavailable' };
			const blocking: string[] = [];
			if (result.active_cohorts) blocking.push('active_cohorts');
			if (result.active_enrollments) blocking.push('active_enrollments');
			return blocking.length === 0 ? { status: 'clear' } : { status: 'blocked', dependencies: blocking };
		} catch {
			return { status: 'unavailable' };
		}
	}
}

export class PrismaCampusTransaction implements CampusTransaction {
	constructor(private readonly db: PrismaClient) {}
	async run<T>(operation: (context: CampusTransactionContext) => Promise<T>): Promise<T> {
		for (let attempt = 1; attempt <= 3; attempt += 1) {
			try {
				return await this.db.$transaction(async (tx) => operation({ campuses: new PrismaCampusRepository(tx), auditEvents: new PrismaAuditEventRepository(tx), dependencyChecker: new PrismaCampusDeactivationDependencyChecker(tx) }), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
			} catch (error) {
				if (!isRetryableTransactionConflict(error) || attempt === 3) throw error;
			}
		}
		throw new Error('Transaction retry limit exceeded');
	}
}

function isRetryableTransactionConflict(error: unknown): boolean {
	return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
}
export class DatabaseService extends PrismaClient {
	constructor() { super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) }); }
}
