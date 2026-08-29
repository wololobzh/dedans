import { describe, expect, it } from 'vitest';
import { Prisma } from '../packages/database/src/generated/prisma/client';
import { PrismaCampusDeactivationDependencyChecker, PrismaCampusTransaction } from '../packages/database/src/index';

type QueryResult = Array<{ id: string }> | Array<{ active_cohorts: boolean; active_enrollments: boolean }>;

function transactionFor(results: QueryResult[] | Error) {
  let callCount = 0;
  const tx = {
    $queryRaw: async <T>(): Promise<T> => {
      if (results instanceof Error) throw results;
      const result = results[callCount++];
      return result as T;
    },
  };
  return { tx, getCallCount: () => callCount };
}

describe('PrismaCampusDeactivationDependencyChecker', () => {
  it('locks the campus before checking active cohorts and enrollments', async () => {
    const { tx, getCallCount } = transactionFor([
      [{ id: 'campus-1' }],
      [{ active_cohorts: true, active_enrollments: true }],
    ]);

    await expect(new PrismaCampusDeactivationDependencyChecker(tx as never).check('campus-1')).resolves.toEqual({
      status: 'blocked',
      dependencies: ['active_cohorts', 'active_enrollments'],
    });
    expect(getCallCount()).toBe(2);
  });

  it('returns clear when the locked campus has no active dependencies', async () => {
    const { tx } = transactionFor([
      [{ id: 'campus-1' }],
      [{ active_cohorts: false, active_enrollments: false }],
    ]);

    await expect(new PrismaCampusDeactivationDependencyChecker(tx as never).check('campus-1')).resolves.toEqual({ status: 'clear' });
  });

  it('fails closed when the campus lock finds no row', async () => {
    const { tx } = transactionFor([
      [],
    ]);

    await expect(new PrismaCampusDeactivationDependencyChecker(tx as never).check('campus-1')).resolves.toEqual({
      status: 'unavailable',
      reason: 'Campus lock could not be acquired',
    });
  });

  it('fails closed without exposing the infrastructure error', async () => {
    const { tx } = transactionFor(new Error('database credentials leaked'));

    await expect(new PrismaCampusDeactivationDependencyChecker(tx as never).check('campus-1')).resolves.toEqual({ status: 'unavailable' });
  });
});

describe('PrismaCampusTransaction', () => {
  it('retries a serialization conflict and commits one concurrent lifecycle change and audit', async () => {
    type Mutation = { status: 'active' | 'inactive'; auditCount: number };
    let committedStatus: 'active' | 'inactive' = 'active';
    let committedAuditCount = 0;
    let transactionCalls = 0;
    const db = {
      $transaction: async <T>(operation: (transaction: object) => Promise<T>): Promise<T> => {
        transactionCalls += 1;
        const callNumber = transactionCalls;
        const result = await operation({});
        if (callNumber === 1) {
          throw new Prisma.PrismaClientKnownRequestError('serialization conflict', { code: 'P2034', clientVersion: '7.9.1' });
        }
        const mutation = result as Mutation;
        committedStatus = mutation.status;
        committedAuditCount = mutation.auditCount;
        return result;
      },
    };
    const transaction = new PrismaCampusTransaction(db as never);

    const results = await Promise.allSettled([
      transaction.run(async (): Promise<Mutation> => committedStatus === 'active' ? { status: 'inactive', auditCount: committedAuditCount + 1 } : { status: committedStatus, auditCount: committedAuditCount }),
      transaction.run(async (): Promise<Mutation> => committedStatus === 'active' ? { status: 'inactive', auditCount: committedAuditCount + 1 } : { status: committedStatus, auditCount: committedAuditCount }),
    ]);

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    expect(committedStatus).toBe('inactive');
    expect(committedAuditCount).toBe(1);
    expect(transactionCalls).toBe(3);
  });
});