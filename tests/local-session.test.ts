import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createLocalSession } from '../scripts/create-local-session.mjs';
import { LOCAL_SESSION_SECRET, validateSessionConfiguration } from '../apps/api/src/auth/session.config';

function decodeClaims(token: string): Record<string, unknown> {
  const [encodedClaims] = token.split('.');
  return JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')) as Record<string, unknown>;
}

describe('local session bootstrap', () => {
  it('creates a signed national-admin session with a one-hour expiry', () => {
    const token = createLocalSession({ secret: 'test-secret', now: 1_000 });
    const [encodedClaims, signature] = token.split('.');
    const claims = decodeClaims(token);

    expect(claims).toMatchObject({
      sub: 'local-national-admin',
      permissions: ['campus.read', 'campus.write'],
      unrestrictedCampusManagement: true,
      exp: 4_600,
    });
    expect(typeof claims.correlationId).toBe('string');
    expect(signature).toBe(createHmac('sha256', 'test-secret').update(encodedClaims).digest('base64url'));
  });

  it('creates a scoped fixture without unrestricted management', () => {
    const token = createLocalSession({
      secret: 'test-secret',
      profile: 'campus-director',
      campusIds: ['campus-1'],
      now: 1_000,
    });

    expect(decodeClaims(token)).toMatchObject({
      sub: 'local-campus-director',
      campusIds: ['campus-1'],
    });
    expect(decodeClaims(token).unrestrictedCampusManagement).toBeUndefined();
  });

  it('rejects missing or default session material in production', () => {
    expect(() => validateSessionConfiguration({ NODE_ENV: 'production' })).toThrow();
    expect(() => validateSessionConfiguration({ NODE_ENV: 'production', API_SESSION_SECRET: LOCAL_SESSION_SECRET })).toThrow();
    expect(() => validateSessionConfiguration({ NODE_ENV: 'production', API_SESSION_SECRET: 'operator-secret' })).not.toThrow();
  });

  it('refuses local session generation in production with a custom secret', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      expect(() => createLocalSession({ secret: 'operator-secret' })).toThrow();
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });
});