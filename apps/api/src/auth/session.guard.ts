import { createHmac, timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ActorContext } from '@school-erp/application';

type SessionClaims = {
  readonly sub: string;
  readonly permissions: readonly string[];
  readonly campusIds?: readonly string[];
  readonly unrestrictedCampusManagement?: boolean;
  readonly correlationId?: string;
  readonly exp: number;
};

export type AuthenticatedRequest = {
  actor?: ActorContext;
  headers: Record<string, string | string[] | undefined>;
};

export class HmacSessionVerifier {
  verify(token: string, secret = process.env.API_SESSION_SECRET): ActorContext | null {
    if (!secret) return null;
    const [encodedClaims, encodedSignature] = token.split('.');
    if (!encodedClaims || !encodedSignature) return null;

    const expected = createHmac('sha256', secret).update(encodedClaims).digest();
    let received: Buffer;
    try { received = Buffer.from(encodedSignature, 'base64url'); } catch { return null; }
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

    try {
      const claims: unknown = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8'));
      if (!isSessionClaims(claims) || claims.exp <= Math.floor(Date.now() / 1000)) return null;
      return {
        userId: claims.sub,
        permissions: [...claims.permissions],
        campusIds: claims.campusIds === undefined ? undefined : [...claims.campusIds],
        unrestrictedCampusManagement: claims.unrestrictedCampusManagement,
        correlationId: claims.correlationId,
      };
    } catch { return null; }
  }
}

function isSessionClaims(value: unknown): value is SessionClaims {
  if (typeof value !== 'object' || value === null) return false;
  const claims = value as Record<string, unknown>;
  return typeof claims.sub === 'string' && claims.sub.length > 0
    && Array.isArray(claims.permissions) && claims.permissions.every((permission) => typeof permission === 'string')
    && (claims.campusIds === undefined || (Array.isArray(claims.campusIds) && claims.campusIds.every((id) => typeof id === 'string')))
    && (claims.unrestrictedCampusManagement === undefined || typeof claims.unrestrictedCampusManagement === 'boolean')
    && (claims.correlationId === undefined || typeof claims.correlationId === 'string')
    && typeof claims.exp === 'number' && Number.isFinite(claims.exp);
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly verifier: HmacSessionVerifier) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim() : '';
    const actor = token ? this.verifier.verify(token) : null;
    if (!actor) throw new UnauthorizedException('Authentication required');
    request.actor = actor;
    return true;
  }
}