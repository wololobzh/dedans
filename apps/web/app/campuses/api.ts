export type CampusStatus = 'active' | 'inactive';
export type CampusType = 'physical' | 'virtual';

export type Campus = {
  id: string;
  name: string;
  code: string;
  city: string | null;
  type: CampusType;
  timezone: string;
  status: CampusStatus;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
  deactivatedBy: string | null;
  deactivationReason: string | null;
};

export type CampusStatusFilter = CampusStatus | 'all';
export type CampusInput = { name: string; code: string; city: string | null; type: CampusType; timezone: string };
export type CampusUpdateInput = Pick<CampusInput, 'name' | 'code' | 'city'>;

export class CampusApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'CampusApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  } catch {
    throw new CampusApiError(0, "L'API est indisponible. Vérifiez la connexion au serveur.");
  }

  if (!response.ok) {
    let message = `La requête a échoué (${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch {
      // Keep the HTTP status when the server does not return JSON.
    }
    throw new CampusApiError(response.status, message);
  }
  return (await response.json()) as T;
}

export function listCampuses(status: CampusStatusFilter): Promise<Campus[]> {
  return request<Campus[]>(`/campuses?status=${status}`);
}

export function getCampus(id: string): Promise<Campus> {
  return request<Campus>(`/campuses/${encodeURIComponent(id)}`);
}

export function createCampus(input: CampusInput): Promise<Campus> {
  return request<Campus>('/campuses', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCampus(id: string, input: CampusUpdateInput): Promise<Campus> {
  return request<Campus>(`/campuses/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deactivateCampus(id: string, reason: string): Promise<Campus> {
  return request<Campus>(`/campuses/${encodeURIComponent(id)}/deactivate`, { method: 'POST', body: JSON.stringify({ reason }) });
}