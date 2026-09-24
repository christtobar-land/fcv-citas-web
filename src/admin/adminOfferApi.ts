import { getAccessToken } from '../auth/authApi';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export interface Specialty {
  id: number;
  code: string;
  name: string;
  appointmentDurationMinutes: number;
  general: boolean;
  requiresAdminApproval: boolean;
  active: boolean;
}

export interface Professional {
  id: number;
  userId: number;
  professionalCode: string;
  licenseNumber: string;
  active: boolean;
}

export class AdminOfferApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'AdminOfferApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const access = getAccessToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1/admin${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new AdminOfferApiError(0, 'No fue posible conectar con el servicio de administración.');
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { detail?: string } | null;
    throw new AdminOfferApiError(response.status, problem?.detail ?? 'No fue posible completar la operación.');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listSpecialties(): Promise<Specialty[]> { return request<Specialty[]>('/specialties'); }

export function createSpecialty(input: Omit<Specialty, 'id' | 'active'>): Promise<Specialty> {
  return request<Specialty>('/specialties', { method: 'POST', body: JSON.stringify(input) });
}

export function createProfessional(input: {
  firstName: string; lastName: string; documentType: string; documentNumber: string;
  email: string; phone: string; temporaryPassword: string; professionalCode: string; licenseNumber: string;
}): Promise<Professional> {
  return request<Professional>('/professionals', { method: 'POST', body: JSON.stringify(input) });
}

export function assignProfessionalSpecialties(professionalId: number, specialtyIds: number[], primarySpecialtyId: number): Promise<void> {
  return request<void>(`/professionals/${professionalId}/specialties`, {
    method: 'PUT', body: JSON.stringify({ specialtyIds, primarySpecialtyId }),
  });
}

export function assignProfessionalLocations(professionalId: number, locationIds: number[]): Promise<void> {
  return request<void>(`/professionals/${professionalId}/locations`, {
    method: 'PUT', body: JSON.stringify({ locationIds }),
  });
}

export function setProfessionalActive(professionalId: number, active: boolean): Promise<void> {
  return request<void>(`/professionals/${professionalId}/active`, {
    method: 'PATCH', body: JSON.stringify({ active }),
  });
}
