import { createHmac, randomUUID } from 'node:crypto';

const LOCAL_SECRET = 'school-erp-local-session-secret-v1';
const TTL_SECONDS = 60 * 60;

function fail(message) {
  console.error(`Unable to create local session: ${message}`);
  process.exitCode = 1;
}

function claimsForProfile(profile, scopedCampusIds) {
  if (profile === 'national-admin') {
    return {
      sub: 'local-national-admin',
      permissions: ['campus.read', 'campus.write'],
      unrestrictedCampusManagement: true,
    };
  }

  if (profile === 'campus-director') {
    const campusIds = (scopedCampusIds ?? process.env.LOCAL_SESSION_CAMPUS_IDS ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (campusIds.length === 0) throw new Error('LOCAL_SESSION_CAMPUS_IDS is required for campus-director');
    return {
      sub: 'local-campus-director',
      permissions: ['campus.read', 'campus.write'],
      campusIds,
    };
  }

  throw new Error(`unsupported profile: ${profile}`);
}

export function createLocalSession({
  secret = process.env.LOCAL_SESSION_SECRET,
  profile = process.env.LOCAL_SESSION_PROFILE ?? 'national-admin',
  campusIds,
  now = Math.floor(Date.now() / 1000),
} = {}) {
  if (process.env.NODE_ENV === 'production' || !secret) {
    throw new Error('a non-empty development secret is required');
  }

  const claims = {
    ...claimsForProfile(profile, campusIds?.join(',')),
    exp: now + TTL_SECONDS,
    correlationId: `local-${randomUUID()}`,
  };
  const encodedClaims = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(encodedClaims).digest('base64url');
  return `${encodedClaims}.${signature}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const token = createLocalSession();
    if (!token) throw new Error('generated token is empty');
    process.stdout.write(`${token}\n`);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'unknown error');
  }
}