import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { HmacSessionVerifier, SessionAuthGuard } from '../apps/api/src/auth/session.guard';

function token(secret: string): string {
  const claims = Buffer.from(JSON.stringify({ sub: 'user-1', permissions: ['campus.read'], campusIds: ['campus-1'], exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
  const signature = createHmac('sha256', secret).update(claims).digest('base64url');
  return `${claims}.${signature}`;
}

function context(headers: Record<string, string | string[] | undefined>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ headers }) }) } as unknown as ExecutionContext;
}

describe('session authentication boundary', () => {
  it('refuses requests without a bearer session', () => {
    expect(() => new SessionAuthGuard(new HmacSessionVerifier()).canActivate(context({}))).toThrow('Authentication required');
  });

  it('accepts only a valid signed session and exposes its verified actor', () => {
    const verifier = new HmacSessionVerifier();
    const actor = verifier.verify(token('test-secret'), 'test-secret');
    expect(actor).toEqual({ userId: 'user-1', permissions: ['campus.read'], campusIds: ['campus-1'], unrestrictedCampusManagement: undefined, correlationId: undefined });
    expect(verifier.verify(token('test-secret'), 'wrong-secret')).toBeNull();
  });
});