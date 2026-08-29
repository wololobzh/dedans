export const LOCAL_SESSION_SECRET = 'school-erp-local-session-secret-v1';

export function validateSessionConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): void {
  const secret = environment.API_SESSION_SECRET?.trim();
  if (environment.NODE_ENV === 'production' && (!secret || secret === LOCAL_SESSION_SECRET)) {
    throw new Error('API_SESSION_SECRET must be explicitly configured in production');
  }
}